/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { flyMachinesApiRequest } from '../../transport';
import { cleanObject } from '../../utils/helpers';

export const appOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['app'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new Fly App',
				action: 'Create an app',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an app',
				action: 'Delete an app',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get details about an app',
				action: 'Get an app',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all apps in an organization',
				action: 'List apps',
			},
		],
		default: 'list',
	},
];

export const appFields: INodeProperties[] = [
	// App Name - for get, delete
	{
		displayName: 'App Name',
		name: 'appName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['app'],
				operation: ['get', 'delete'],
			},
		},
		description: 'The name of the app',
	},
	// Organization Slug - for list, create
	{
		displayName: 'Organization Slug',
		name: 'orgSlug',
		type: 'string',
		required: true,
		default: 'personal',
		displayOptions: {
			show: {
				resource: ['app'],
				operation: ['list', 'create'],
			},
		},
		description: 'The organization slug (e.g., "personal")',
	},
	// App Name - for create
	{
		displayName: 'App Name',
		name: 'appNameCreate',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['app'],
				operation: ['create'],
			},
		},
		description: 'Unique name for the new app (lowercase alphanumeric with hyphens)',
	},
	// Additional Options for Create
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['app'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Enable Subdomains',
				name: 'enableSubdomains',
				type: 'boolean',
				default: false,
				description: 'Whether to enable subdomains for the app',
			},
			{
				displayName: 'Network',
				name: 'network',
				type: 'string',
				default: '',
				description: 'Network name for the app',
			},
		],
	},
	// Force delete option
	{
		displayName: 'Force Delete',
		name: 'force',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['app'],
				operation: ['delete'],
			},
		},
		description: 'Whether to force delete (stops all Machines immediately)',
	},
];

export async function executeAppOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let response: IDataObject | IDataObject[];

	switch (operation) {
		case 'list': {
			const orgSlug = this.getNodeParameter('orgSlug', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				'/v1/apps',
				{},
				{ org_slug: orgSlug },
			);
			break;
		}

		case 'create': {
			const orgSlug = this.getNodeParameter('orgSlug', i) as string;
			const appName = this.getNodeParameter('appNameCreate', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i) as IDataObject;

			const body: IDataObject = {
				app_name: appName,
				org_slug: orgSlug,
			};

			if (additionalOptions.enableSubdomains) {
				body.enable_subdomains = additionalOptions.enableSubdomains;
			}
			if (additionalOptions.network) {
				body.network = additionalOptions.network;
			}

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				'/v1/apps',
				cleanObject(body),
			);
			break;
		}

		case 'get': {
			const appName = this.getNodeParameter('appName', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}`,
			);
			break;
		}

		case 'delete': {
			const appName = this.getNodeParameter('appName', i) as string;
			const force = this.getNodeParameter('force', i) as boolean;

			const query: IDataObject = {};
			if (force) {
				query.force = 'true';
			}

			response = await flyMachinesApiRequest.call(
				this,
				'DELETE',
				`/v1/apps/${appName}`,
				{},
				query,
			);
			// DELETE returns empty, return confirmation
			response = { success: true, appName, deleted: true };
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return response;
}
