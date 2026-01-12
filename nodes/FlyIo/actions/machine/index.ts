/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { flyMachinesApiRequest, waitForMachineState } from '../../transport';
import { buildMachineConfig, cleanObject } from '../../utils/helpers';

export const machineOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['machine'],
			},
		},
		options: [
			{
				name: 'Acquire Lease',
				value: 'acquireLease',
				description: 'Acquire a lease on a Machine',
				action: 'Acquire lease on a machine',
			},
			{
				name: 'Cordon',
				value: 'cordon',
				description: 'Remove a Machine from load balancer',
				action: 'Cordon a machine',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new Machine',
				action: 'Create a machine',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a Machine',
				action: 'Delete a machine',
			},
			{
				name: 'Delete Metadata',
				value: 'deleteMetadata',
				description: 'Delete Machine metadata',
				action: 'Delete machine metadata',
			},
			{
				name: 'Execute Command',
				value: 'exec',
				description: 'Execute a command on a Machine',
				action: 'Execute command on a machine',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get Machine details',
				action: 'Get a machine',
			},
			{
				name: 'Get Lease',
				value: 'getLease',
				description: 'Get the current lease on a Machine',
				action: 'Get lease on a machine',
			},
			{
				name: 'Get Metadata',
				value: 'getMetadata',
				description: 'Get Machine metadata',
				action: 'Get machine metadata',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all Machines in an app',
				action: 'List machines',
			},
			{
				name: 'List Events',
				value: 'listEvents',
				description: 'List events for a Machine',
				action: 'List machine events',
			},
			{
				name: 'List Processes',
				value: 'listProcesses',
				description: 'List processes running on a Machine',
				action: 'List machine processes',
			},
			{
				name: 'Release Lease',
				value: 'releaseLease',
				description: 'Release a lease on a Machine',
				action: 'Release lease on a machine',
			},
			{
				name: 'Restart',
				value: 'restart',
				description: 'Restart a Machine',
				action: 'Restart a machine',
			},
			{
				name: 'Signal',
				value: 'signal',
				description: 'Send a signal to a Machine',
				action: 'Signal a machine',
			},
			{
				name: 'Start',
				value: 'start',
				description: 'Start a stopped Machine',
				action: 'Start a machine',
			},
			{
				name: 'Stop',
				value: 'stop',
				description: 'Stop a running Machine',
				action: 'Stop a machine',
			},
			{
				name: 'Uncordon',
				value: 'uncordon',
				description: 'Add a Machine back to load balancer',
				action: 'Uncordon a machine',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update Machine configuration',
				action: 'Update a machine',
			},
			{
				name: 'Update Metadata',
				value: 'updateMetadata',
				description: 'Update Machine metadata',
				action: 'Update machine metadata',
			},
			{
				name: 'Wait',
				value: 'wait',
				description: 'Wait for a Machine to reach a specific state',
				action: 'Wait for machine state',
			},
		],
		default: 'list',
	},
];

export const machineFields: INodeProperties[] = [
	// App Name - required for all operations
	{
		displayName: 'App Name',
		name: 'appName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['machine'],
			},
		},
		description: 'The name of the app the Machine belongs to',
	},
	// Machine ID - for operations that need it
	{
		displayName: 'Machine ID',
		name: 'machineId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: [
					'get', 'update', 'delete', 'start', 'stop', 'restart', 'signal', 'wait',
					'getLease', 'acquireLease', 'releaseLease', 'listEvents', 'listProcesses',
					'cordon', 'uncordon', 'exec', 'getMetadata', 'updateMetadata', 'deleteMetadata',
				],
			},
		},
		description: 'The Machine ID (e.g., "1857156b526dd8")',
	},
	// Region - for create
	{
		displayName: 'Region',
		name: 'region',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['create'],
			},
		},
		description: 'Region code for the Machine (e.g., "ord", "cdg", "sin")',
		placeholder: 'ord',
	},
	// Docker Image - for create
	{
		displayName: 'Docker Image',
		name: 'image',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['create'],
			},
		},
		description: 'Docker image to run on the Machine',
		placeholder: 'registry.fly.io/my-app:latest',
	},
	// Machine Name - optional for create
	{
		displayName: 'Machine Name',
		name: 'machineName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['create'],
			},
		},
		description: 'Optional name for the Machine',
	},
	// Machine Configuration for Create
	{
		displayName: 'Configuration',
		name: 'machineConfig',
		type: 'collection',
		placeholder: 'Add Configuration',
		default: {},
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Auto Destroy',
				name: 'autoDestroy',
				type: 'boolean',
				default: false,
				description: 'Whether to destroy the Machine when it stops',
			},
			{
				displayName: 'CPU Kind',
				name: 'cpuKind',
				type: 'options',
				options: [
					{ name: 'Shared', value: 'shared' },
					{ name: 'Performance', value: 'performance' },
				],
				default: 'shared',
				description: 'CPU type for the Machine',
			},
			{
				displayName: 'CPUs',
				name: 'cpus',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 16 },
				default: 1,
				description: 'Number of CPUs',
			},
			{
				displayName: 'Environment Variables (JSON)',
				name: 'env',
				type: 'json',
				default: '{}',
				description: 'Environment variables as JSON object',
			},
			{
				displayName: 'Init (JSON)',
				name: 'init',
				type: 'json',
				default: '',
				description: 'Initialization commands as JSON',
			},
			{
				displayName: 'Memory (MB)',
				name: 'memoryMb',
				type: 'number',
				typeOptions: { minValue: 256 },
				default: 256,
				description: 'Memory in MB',
			},
			{
				displayName: 'Mounts (JSON)',
				name: 'mounts',
				type: 'json',
				default: '',
				description: 'Volume mounts as JSON array',
			},
			{
				displayName: 'Processes (JSON)',
				name: 'processes',
				type: 'json',
				default: '',
				description: 'Process definitions as JSON',
			},
			{
				displayName: 'Restart Max Retries',
				name: 'restartMaxRetries',
				type: 'number',
				default: 0,
				description: 'Maximum restart retries',
			},
			{
				displayName: 'Restart Policy',
				name: 'restartPolicy',
				type: 'options',
				options: [
					{ name: 'No', value: 'no' },
					{ name: 'Always', value: 'always' },
					{ name: 'On Failure', value: 'on-failure' },
				],
				default: 'always',
				description: 'Restart policy for the Machine',
			},
			{
				displayName: 'Services (JSON)',
				name: 'services',
				type: 'json',
				default: '',
				description: 'Network services configuration as JSON array',
			},
		],
	},
	// Update Configuration
	{
		displayName: 'Update Fields',
		name: 'updateConfig',
		type: 'collection',
		placeholder: 'Add Update Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Auto Destroy',
				name: 'autoDestroy',
				type: 'boolean',
				default: false,
				description: 'Whether to destroy the Machine when it stops',
			},
			{
				displayName: 'CPU Kind',
				name: 'cpuKind',
				type: 'options',
				options: [
					{ name: 'Shared', value: 'shared' },
					{ name: 'Performance', value: 'performance' },
				],
				default: 'shared',
				description: 'CPU type for the Machine',
			},
			{
				displayName: 'CPUs',
				name: 'cpus',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 16 },
				default: 1,
				description: 'Number of CPUs',
			},
			{
				displayName: 'Environment Variables (JSON)',
				name: 'env',
				type: 'json',
				default: '{}',
				description: 'Environment variables as JSON object',
			},
			{
				displayName: 'Image',
				name: 'image',
				type: 'string',
				default: '',
				description: 'Docker image to run',
			},
			{
				displayName: 'Memory (MB)',
				name: 'memoryMb',
				type: 'number',
				typeOptions: { minValue: 256 },
				default: 256,
				description: 'Memory in MB',
			},
			{
				displayName: 'Mounts (JSON)',
				name: 'mounts',
				type: 'json',
				default: '',
				description: 'Volume mounts as JSON array',
			},
			{
				displayName: 'Services (JSON)',
				name: 'services',
				type: 'json',
				default: '',
				description: 'Network services configuration as JSON array',
			},
		],
	},
	// Signal selection
	{
		displayName: 'Signal',
		name: 'signal',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['signal'],
			},
		},
		options: [
			{ name: 'SIGHUP', value: 'SIGHUP' },
			{ name: 'SIGINT', value: 'SIGINT' },
			{ name: 'SIGKILL', value: 'SIGKILL' },
			{ name: 'SIGTERM', value: 'SIGTERM' },
			{ name: 'SIGUSR1', value: 'SIGUSR1' },
			{ name: 'SIGUSR2', value: 'SIGUSR2' },
		],
		default: 'SIGTERM',
		description: 'Signal to send to the Machine',
	},
	// Wait state
	{
		displayName: 'Target State',
		name: 'targetState',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['wait'],
			},
		},
		options: [
			{ name: 'Started', value: 'started' },
			{ name: 'Stopped', value: 'stopped' },
			{ name: 'Destroyed', value: 'destroyed' },
		],
		default: 'started',
		description: 'State to wait for',
	},
	// Wait timeout
	{
		displayName: 'Timeout (Seconds)',
		name: 'timeout',
		type: 'number',
		default: 60,
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['wait'],
			},
		},
		description: 'Maximum time to wait in seconds',
	},
	// Lease TTL
	{
		displayName: 'TTL (Seconds)',
		name: 'ttl',
		type: 'number',
		default: 30,
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['acquireLease'],
			},
		},
		description: 'Lease time-to-live in seconds',
	},
	// Lease Nonce
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['releaseLease'],
			},
		},
		description: 'Lease nonce to release',
	},
	// Exec Command
	{
		displayName: 'Command',
		name: 'command',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['exec'],
			},
		},
		description: 'Command to execute on the Machine',
	},
	// Metadata Key
	{
		displayName: 'Key',
		name: 'metadataKey',
		type: 'string',
		typeOptions: { password: true },
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['getMetadata', 'updateMetadata', 'deleteMetadata'],
			},
		},
		description: 'Metadata key',
	},
	// Metadata Value
	{
		displayName: 'Value',
		name: 'metadataValue',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['updateMetadata'],
			},
		},
		description: 'Metadata value',
	},
	// List options
	{
		displayName: 'List Options',
		name: 'listOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['list'],
			},
		},
		options: [
			{
				displayName: 'Include Deleted',
				name: 'includeDeleted',
				type: 'boolean',
				default: false,
				description: 'Whether to include deleted Machines',
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				default: '',
				description: 'Filter by region',
			},
		],
	},
	// Stop options
	{
		displayName: 'Stop Options',
		name: 'stopOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['stop'],
			},
		},
		options: [
			{
				displayName: 'Signal',
				name: 'signal',
				type: 'options',
				options: [
					{ name: 'SIGINT', value: 'SIGINT' },
					{ name: 'SIGTERM', value: 'SIGTERM' },
					{ name: 'SIGKILL', value: 'SIGKILL' },
				],
				default: 'SIGTERM',
				description: 'Signal to send before stopping',
			},
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				default: 30,
				description: 'Timeout before force stop',
			},
		],
	},
	// Force delete option
	{
		displayName: 'Force',
		name: 'force',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['machine'],
				operation: ['delete'],
			},
		},
		description: 'Whether to force delete the Machine',
	},
];

export async function executeMachineOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const appName = this.getNodeParameter('appName', i) as string;
	let response: IDataObject | IDataObject[];

	switch (operation) {
		case 'list': {
			const listOptions = this.getNodeParameter('listOptions', i) as IDataObject;
			const query: IDataObject = {};
			if (listOptions.includeDeleted) query.include_deleted = 'true';
			if (listOptions.region) query.region = listOptions.region;

			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}/machines`,
				{},
				query,
			);
			break;
		}

		case 'create': {
			const region = this.getNodeParameter('region', i) as string;
			const image = this.getNodeParameter('image', i) as string;
			const machineName = this.getNodeParameter('machineName', i) as string;
			const machineConfig = this.getNodeParameter('machineConfig', i) as IDataObject;

			const config = buildMachineConfig({ ...machineConfig, image });

			const body: IDataObject = {
				region,
				config,
			};

			if (machineName) {
				body.name = machineName;
			}

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines`,
				body,
			);
			break;
		}

		case 'get': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}/machines/${machineId}`,
			);
			break;
		}

		case 'update': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const updateConfig = this.getNodeParameter('updateConfig', i) as IDataObject;

			const config = buildMachineConfig(updateConfig);

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}`,
				{ config },
			);
			break;
		}

		case 'delete': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const force = this.getNodeParameter('force', i) as boolean;

			const query: IDataObject = {};
			if (force) query.force = 'true';

			await flyMachinesApiRequest.call(
				this,
				'DELETE',
				`/v1/apps/${appName}/machines/${machineId}`,
				{},
				query,
			);
			response = { success: true, machineId, deleted: true };
			break;
		}

		case 'start': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}/start`,
			);
			break;
		}

		case 'stop': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const stopOptions = this.getNodeParameter('stopOptions', i) as IDataObject;

			const body: IDataObject = {};
			if (stopOptions.signal) body.signal = stopOptions.signal;
			if (stopOptions.timeout) body.timeout = stopOptions.timeout;

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}/stop`,
				cleanObject(body),
			);
			break;
		}

		case 'restart': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}/restart`,
			);
			break;
		}

		case 'signal': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const signal = this.getNodeParameter('signal', i) as string;

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}/signal`,
				{ signal },
			);
			break;
		}

		case 'wait': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const targetState = this.getNodeParameter('targetState', i) as string;
			const timeout = this.getNodeParameter('timeout', i) as number;

			response = await waitForMachineState.call(this, appName, machineId, targetState, timeout);
			break;
		}

		case 'getLease': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}/machines/${machineId}/lease`,
			);
			break;
		}

		case 'acquireLease': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const ttl = this.getNodeParameter('ttl', i) as number;

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}/lease`,
				{ ttl },
			);
			break;
		}

		case 'releaseLease': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const nonce = this.getNodeParameter('nonce', i) as string;

			await flyMachinesApiRequest.call(
				this,
				'DELETE',
				`/v1/apps/${appName}/machines/${machineId}/lease`,
				{},
				{ nonce },
			);
			response = { success: true, machineId, leaseReleased: true };
			break;
		}

		case 'listEvents': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}/machines/${machineId}/events`,
			);
			break;
		}

		case 'listProcesses': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}/machines/${machineId}/ps`,
			);
			break;
		}

		case 'cordon': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}/cordon`,
			);
			break;
		}

		case 'uncordon': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}/uncordon`,
			);
			break;
		}

		case 'exec': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const command = this.getNodeParameter('command', i) as string;

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}/exec`,
				{ cmd: command.split(' ') },
			);
			break;
		}

		case 'getMetadata': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const key = this.getNodeParameter('metadataKey', i) as string;

			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}/machines/${machineId}/metadata/${key}`,
			);
			break;
		}

		case 'updateMetadata': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const key = this.getNodeParameter('metadataKey', i) as string;
			const value = this.getNodeParameter('metadataValue', i) as string;

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/machines/${machineId}/metadata/${key}`,
				{ value },
			);
			break;
		}

		case 'deleteMetadata': {
			const machineId = this.getNodeParameter('machineId', i) as string;
			const key = this.getNodeParameter('metadataKey', i) as string;

			await flyMachinesApiRequest.call(
				this,
				'DELETE',
				`/v1/apps/${appName}/machines/${machineId}/metadata/${key}`,
			);
			response = { success: true, machineId, key, deleted: true };
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return response;
}
