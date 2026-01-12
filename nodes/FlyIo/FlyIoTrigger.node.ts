/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import { flyMachinesApiRequest } from './transport';
import { logLicenseNotice } from './utils/helpers';

interface IMachineState {
	[machineId: string]: {
		state: string;
		updatedAt: string;
	};
}

interface IVolumeState {
	[volumeId: string]: {
		state: string;
		sizeGb: number;
	};
}

export class FlyIoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fly.io Trigger',
		name: 'flyIoTrigger',
		icon: 'file:flyio.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Triggers when Fly.io Machine or Volume state changes',
		defaults: {
			name: 'Fly.io Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'flyIoApi',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'App Name',
				name: 'appName',
				type: 'string',
				required: true,
				default: '',
				description: 'The name of the app to monitor',
			},
			{
				displayName: 'Event Type',
				name: 'event',
				type: 'options',
				required: true,
				options: [
					{
						name: 'Machine Created',
						value: 'machineCreated',
						description: 'Triggered when a new Machine is created',
					},
					{
						name: 'Machine Destroyed',
						value: 'machineDestroyed',
						description: 'Triggered when a Machine is destroyed',
					},
					{
						name: 'Machine Started',
						value: 'machineStarted',
						description: 'Triggered when a Machine starts',
					},
					{
						name: 'Machine State Changed',
						value: 'machineStateChanged',
						description: 'Triggered when any Machine changes state',
					},
					{
						name: 'Machine Stopped',
						value: 'machineStopped',
						description: 'Triggered when a Machine stops',
					},
					{
						name: 'Volume State Changed',
						value: 'volumeStateChanged',
						description: 'Triggered when any Volume changes',
					},
				],
				default: 'machineStateChanged',
				description: 'The event type to listen for',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Include Machine Config',
						name: 'includeConfig',
						type: 'boolean',
						default: false,
						description: 'Whether to include full Machine configuration in output',
					},
					{
						displayName: 'Region Filter',
						name: 'regionFilter',
						type: 'string',
						default: '',
						description: 'Only trigger for Machines in this region',
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		// Log licensing notice once per node load
		logLicenseNotice(this.logger);

		const appName = this.getNodeParameter('appName') as string;
		const event = this.getNodeParameter('event') as string;
		const options = this.getNodeParameter('options') as IDataObject;
		const webhookData = this.getWorkflowStaticData('node');

		const events: INodeExecutionData[] = [];

		try {
			if (event.startsWith('machine') || event === 'machineStateChanged') {
				const machines = await flyMachinesApiRequest.call(
					this,
					'GET',
					`/v1/apps/${appName}/machines`,
				) as IDataObject[];

				const previousStates = (webhookData.machineStates as IMachineState) || {};
				const currentStates: IMachineState = {};

				for (const machine of machines) {
					const machineId = machine.id as string;
					const currentState = machine.state as string;
					const updatedAt = machine.updated_at as string;
					const region = machine.region as string;

					// Apply region filter if specified
					if (options.regionFilter && region !== options.regionFilter) {
						currentStates[machineId] = { state: currentState, updatedAt };
						continue;
					}

					const prevState = previousStates[machineId];

					// Check if this is a new machine or state changed
					let shouldTrigger = false;
					let eventType = '';

					if (!prevState) {
						// New machine
						if (event === 'machineCreated' || event === 'machineStateChanged') {
							shouldTrigger = true;
							eventType = 'machine.created';
						}
					} else if (prevState.state !== currentState) {
						// State changed
						if (event === 'machineStateChanged') {
							shouldTrigger = true;
							eventType = `machine.${currentState}`;
						} else if (event === 'machineStarted' && currentState === 'started') {
							shouldTrigger = true;
							eventType = 'machine.started';
						} else if (event === 'machineStopped' && currentState === 'stopped') {
							shouldTrigger = true;
							eventType = 'machine.stopped';
						} else if (event === 'machineDestroyed' && currentState === 'destroyed') {
							shouldTrigger = true;
							eventType = 'machine.destroyed';
						}
					}

					if (shouldTrigger) {
						const eventData: IDataObject = {
							event: eventType,
							machineId,
							machineName: machine.name,
							currentState,
							previousState: prevState?.state || null,
							region,
							privateIp: machine.private_ip,
							instanceId: machine.instance_id,
							updatedAt,
							timestamp: new Date().toISOString(),
						};

						if (options.includeConfig) {
							eventData.config = machine.config;
							eventData.imageRef = machine.image_ref;
						}

						events.push({ json: eventData });
					}

					currentStates[machineId] = { state: currentState, updatedAt };
				}

				// Check for destroyed machines (existed before but not in current list)
				if (event === 'machineDestroyed' || event === 'machineStateChanged') {
					for (const machineId of Object.keys(previousStates)) {
						if (!currentStates[machineId]) {
							events.push({
								json: {
									event: 'machine.destroyed',
									machineId,
									previousState: previousStates[machineId].state,
									currentState: 'destroyed',
									timestamp: new Date().toISOString(),
								},
							});
						}
					}
				}

				webhookData.machineStates = currentStates;
			}

			if (event === 'volumeStateChanged') {
				const volumes = await flyMachinesApiRequest.call(
					this,
					'GET',
					`/v1/apps/${appName}/volumes`,
				) as IDataObject[];

				const previousStates = (webhookData.volumeStates as IVolumeState) || {};
				const currentStates: IVolumeState = {};

				for (const volume of volumes) {
					const volumeId = volume.id as string;
					const currentState = volume.state as string;
					const sizeGb = volume.size_gb as number;

					const prevState = previousStates[volumeId];

					if (!prevState) {
						// New volume
						events.push({
							json: {
								event: 'volume.created',
								volumeId,
								volumeName: volume.name,
								state: currentState,
								sizeGb,
								region: volume.region,
								encrypted: volume.encrypted,
								timestamp: new Date().toISOString(),
							},
						});
					} else if (prevState.state !== currentState || prevState.sizeGb !== sizeGb) {
						// State or size changed
						events.push({
							json: {
								event: 'volume.updated',
								volumeId,
								volumeName: volume.name,
								currentState,
								previousState: prevState.state,
								currentSizeGb: sizeGb,
								previousSizeGb: prevState.sizeGb,
								region: volume.region,
								timestamp: new Date().toISOString(),
							},
						});
					}

					currentStates[volumeId] = { state: currentState, sizeGb };
				}

				// Check for deleted volumes
				for (const volumeId of Object.keys(previousStates)) {
					if (!currentStates[volumeId]) {
						events.push({
							json: {
								event: 'volume.deleted',
								volumeId,
								previousState: previousStates[volumeId].state,
								timestamp: new Date().toISOString(),
							},
						});
					}
				}

				webhookData.volumeStates = currentStates;
			}
		} catch (error) {
			// Log error but don't fail - polling will retry
			this.logger.error(`Fly.io Trigger poll error: ${(error as Error).message}`);
			return null;
		}

		if (events.length > 0) {
			return [events];
		}

		return null;
	}
}
