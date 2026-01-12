/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { flyGraphqlRequest } from '../../transport';

export const ipAddressOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['ipAddress'],
			},
		},
		options: [
			{
				name: 'Allocate',
				value: 'allocate',
				description: 'Allocate a new IP address',
				action: 'Allocate an IP address',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List IP addresses allocated to an app',
				action: 'List IP addresses',
			},
			{
				name: 'Release',
				value: 'release',
				description: 'Release an IP address',
				action: 'Release an IP address',
			},
		],
		default: 'list',
	},
];

export const ipAddressFields: INodeProperties[] = [
	// App Name - required for all operations
	{
		displayName: 'App Name',
		name: 'appName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['ipAddress'],
			},
		},
		description: 'The name of the app',
	},
	// IP Address ID - for release
	{
		displayName: 'IP Address ID',
		name: 'addressId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['ipAddress'],
				operation: ['release'],
			},
		},
		description: 'The IP address ID to release',
	},
	// IP Type - for allocate
	{
		displayName: 'IP Type',
		name: 'ipType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['ipAddress'],
				operation: ['allocate'],
			},
		},
		options: [
			{
				name: 'Shared IPv4',
				value: 'v4',
				description: 'Shared IPv4 address',
			},
			{
				name: 'Dedicated IPv6',
				value: 'v6',
				description: 'Dedicated IPv6 address',
			},
			{
				name: 'Private IPv6',
				value: 'private_v6',
				description: 'Private IPv6 address',
			},
		],
		default: 'v6',
		description: 'Type of IP address to allocate',
	},
	// Region - optional for allocate
	{
		displayName: 'Region',
		name: 'region',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ipAddress'],
				operation: ['allocate'],
			},
		},
		description: 'Region for regional IPs (optional)',
	},
	// Network - optional for allocate
	{
		displayName: 'Network',
		name: 'network',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['ipAddress'],
				operation: ['allocate'],
			},
		},
		description: 'Network name (optional)',
	},
];

const GRAPHQL_QUERIES = {
	listIpAddresses: `
		query($appName: String!) {
			app(name: $appName) {
				ipAddresses {
					nodes {
						id
						address
						type
						region
						createdAt
					}
				}
			}
		}
	`,
	allocateIpAddress: `
		mutation($input: AllocateIPAddressInput!) {
			allocateIpAddress(input: $input) {
				ipAddress {
					id
					address
					type
					region
					createdAt
				}
			}
		}
	`,
	releaseIpAddress: `
		mutation($input: ReleaseIPAddressInput!) {
			releaseIpAddress(input: $input) {
				app {
					name
				}
			}
		}
	`,
};

export async function executeIpAddressOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const appName = this.getNodeParameter('appName', i) as string;
	let response: IDataObject;

	switch (operation) {
		case 'list': {
			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.listIpAddresses, { appName });
			const app = response.app as IDataObject;
			const ipAddresses = app?.ipAddresses as IDataObject;
			return (ipAddresses?.nodes as IDataObject[]) || [];
		}

		case 'allocate': {
			const ipType = this.getNodeParameter('ipType', i) as string;
			const region = this.getNodeParameter('region', i) as string;
			const network = this.getNodeParameter('network', i) as string;

			const input: IDataObject = {
				appId: appName,
				type: ipType,
			};

			if (region) {
				input.region = region;
			}
			if (network) {
				input.network = network;
			}

			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.allocateIpAddress, { input });
			const allocResult = response.allocateIpAddress as IDataObject;
			return allocResult?.ipAddress as IDataObject || {};
		}

		case 'release': {
			const addressId = this.getNodeParameter('addressId', i) as string;

			const input: IDataObject = {
				appId: appName,
				ipAddressId: addressId,
			};

			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.releaseIpAddress, { input });
			return {
				success: true,
				addressId,
				released: true,
				...(response.releaseIpAddress as IDataObject),
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
