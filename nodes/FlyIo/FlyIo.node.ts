/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { appOperations, appFields, executeAppOperation } from './actions/app';
import { machineOperations, machineFields, executeMachineOperation } from './actions/machine';
import { volumeOperations, volumeFields, executeVolumeOperation } from './actions/volume';
import { secretOperations, secretFields, executeSecretOperation } from './actions/secret';
import { certificateOperations, certificateFields, executeCertificateOperation } from './actions/certificate';
import { ipAddressOperations, ipAddressFields, executeIpAddressOperation } from './actions/ipAddress';
import { organizationOperations, organizationFields, executeOrganizationOperation } from './actions/organization';
import { regionOperations, regionFields, executeRegionOperation } from './actions/region';
import { toExecutionData, logLicenseNotice } from './utils/helpers';

export class FlyIo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fly.io',
		name: 'flyIo',
		icon: 'file:flyio.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Fly.io Machines API for app, machine, and volume management',
		defaults: {
			name: 'Fly.io',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'flyIoApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'App',
						value: 'app',
						description: 'Manage Fly Apps',
					},
					{
						name: 'Certificate',
						value: 'certificate',
						description: 'Manage SSL/TLS certificates',
					},
					{
						name: 'IP Address',
						value: 'ipAddress',
						description: 'Manage IP addresses',
					},
					{
						name: 'Machine',
						value: 'machine',
						description: 'Manage Fly Machines (VMs)',
					},
					{
						name: 'Organization',
						value: 'organization',
						description: 'View organizations',
					},
					{
						name: 'Region',
						value: 'region',
						description: 'View available regions',
					},
					{
						name: 'Secret',
						value: 'secret',
						description: 'Manage app secrets',
					},
					{
						name: 'Volume',
						value: 'volume',
						description: 'Manage Fly Volumes (persistent storage)',
					},
				],
				default: 'machine',
			},
			// App operations and fields
			...appOperations,
			...appFields,
			// Machine operations and fields
			...machineOperations,
			...machineFields,
			// Volume operations and fields
			...volumeOperations,
			...volumeFields,
			// Secret operations and fields
			...secretOperations,
			...secretFields,
			// Certificate operations and fields
			...certificateOperations,
			...certificateFields,
			// IP Address operations and fields
			...ipAddressOperations,
			...ipAddressFields,
			// Organization operations and fields
			...organizationOperations,
			...organizationFields,
			// Region operations and fields
			...regionOperations,
			...regionFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Log licensing notice once per node load
		logLicenseNotice(this.logger);

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: IDataObject | IDataObject[];

				switch (resource) {
					case 'app':
						result = await executeAppOperation.call(this, operation, i);
						break;
					case 'machine':
						result = await executeMachineOperation.call(this, operation, i);
						break;
					case 'volume':
						result = await executeVolumeOperation.call(this, operation, i);
						break;
					case 'secret':
						result = await executeSecretOperation.call(this, operation, i);
						break;
					case 'certificate':
						result = await executeCertificateOperation.call(this, operation, i);
						break;
					case 'ipAddress':
						result = await executeIpAddressOperation.call(this, operation, i);
						break;
					case 'organization':
						result = await executeOrganizationOperation.call(this, operation, i);
						break;
					case 'region':
						result = await executeRegionOperation.call(this, operation, i);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
				}

				returnData.push(...toExecutionData(result));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
