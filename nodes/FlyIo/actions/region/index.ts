/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { flyGraphqlRequest } from '../../transport';

export const regionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['region'],
			},
		},
		options: [
			{
				name: 'Get Backup Regions',
				value: 'getBackup',
				description: 'Get backup regions for a primary region',
				action: 'Get backup regions',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all available regions',
				action: 'List regions',
			},
		],
		default: 'list',
	},
];

export const regionFields: INodeProperties[] = [
	// Primary Region - for getBackup
	{
		displayName: 'Primary Region',
		name: 'primaryRegion',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['region'],
				operation: ['getBackup'],
			},
		},
		description: 'Primary region code to get backup regions for',
		placeholder: 'ord',
	},
];

const GRAPHQL_QUERIES = {
	listRegions: `
		query {
			platform {
				regions {
					name
					code
					latitude
					longitude
					gatewayAvailable
					requiresPaidPlan
				}
			}
		}
	`,
	getBackupRegions: `
		query($region: String!) {
			nearestRegion(from: $region) {
				name
				code
				latitude
				longitude
				gatewayAvailable
			}
		}
	`,
};

// Static region data as fallback
const STATIC_REGIONS: IDataObject[] = [
	{ code: 'ams', name: 'Amsterdam, Netherlands', gatewayAvailable: true },
	{ code: 'arn', name: 'Stockholm, Sweden', gatewayAvailable: true },
	{ code: 'atl', name: 'Atlanta, Georgia (US)', gatewayAvailable: true },
	{ code: 'bog', name: 'Bogotá, Colombia', gatewayAvailable: true },
	{ code: 'bom', name: 'Mumbai, India', gatewayAvailable: true },
	{ code: 'bos', name: 'Boston, Massachusetts (US)', gatewayAvailable: true },
	{ code: 'cdg', name: 'Paris, France', gatewayAvailable: true },
	{ code: 'den', name: 'Denver, Colorado (US)', gatewayAvailable: true },
	{ code: 'dfw', name: 'Dallas, Texas (US)', gatewayAvailable: true },
	{ code: 'ewr', name: 'Secaucus, NJ (US)', gatewayAvailable: true },
	{ code: 'eze', name: 'Ezeiza, Argentina', gatewayAvailable: true },
	{ code: 'fra', name: 'Frankfurt, Germany', gatewayAvailable: true },
	{ code: 'gdl', name: 'Guadalajara, Mexico', gatewayAvailable: true },
	{ code: 'gig', name: 'Rio de Janeiro, Brazil', gatewayAvailable: true },
	{ code: 'gru', name: 'São Paulo, Brazil', gatewayAvailable: true },
	{ code: 'hkg', name: 'Hong Kong, Hong Kong', gatewayAvailable: true },
	{ code: 'iad', name: 'Ashburn, Virginia (US)', gatewayAvailable: true },
	{ code: 'jnb', name: 'Johannesburg, South Africa', gatewayAvailable: true },
	{ code: 'lax', name: 'Los Angeles, California (US)', gatewayAvailable: true },
	{ code: 'lhr', name: 'London, United Kingdom', gatewayAvailable: true },
	{ code: 'mad', name: 'Madrid, Spain', gatewayAvailable: true },
	{ code: 'mia', name: 'Miami, Florida (US)', gatewayAvailable: true },
	{ code: 'nrt', name: 'Tokyo, Japan', gatewayAvailable: true },
	{ code: 'ord', name: 'Chicago, Illinois (US)', gatewayAvailable: true },
	{ code: 'otp', name: 'Bucharest, Romania', gatewayAvailable: true },
	{ code: 'phx', name: 'Phoenix, Arizona (US)', gatewayAvailable: true },
	{ code: 'qro', name: 'Querétaro, Mexico', gatewayAvailable: true },
	{ code: 'scl', name: 'Santiago, Chile', gatewayAvailable: true },
	{ code: 'sea', name: 'Seattle, Washington (US)', gatewayAvailable: true },
	{ code: 'sin', name: 'Singapore, Singapore', gatewayAvailable: true },
	{ code: 'sjc', name: 'San Jose, California (US)', gatewayAvailable: true },
	{ code: 'syd', name: 'Sydney, Australia', gatewayAvailable: true },
	{ code: 'waw', name: 'Warsaw, Poland', gatewayAvailable: true },
	{ code: 'yul', name: 'Montreal, Canada', gatewayAvailable: true },
	{ code: 'yyz', name: 'Toronto, Canada', gatewayAvailable: true },
];

export async function executeRegionOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let response: IDataObject;

	switch (operation) {
		case 'list': {
			try {
				response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.listRegions, {});
				const platform = response.platform as IDataObject;
				return (platform?.regions as IDataObject[]) || STATIC_REGIONS;
			} catch {
				// Fallback to static regions if GraphQL fails
				return STATIC_REGIONS;
			}
		}

		case 'getBackup': {
			const primaryRegion = this.getNodeParameter('primaryRegion', i) as string;
			try {
				response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.getBackupRegions, {
					region: primaryRegion,
				});
				const nearest = response.nearestRegion;
				return nearest ? [nearest as IDataObject] : [];
			} catch {
				// Return empty if region lookup fails
				return [];
			}
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
