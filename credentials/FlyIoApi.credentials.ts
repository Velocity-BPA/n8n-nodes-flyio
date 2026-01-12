/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FlyIoApi implements ICredentialType {
	name = 'flyIoApi';
	displayName = 'Fly.io API';
	documentationUrl = 'httpsFlyIoDocsMachinesApi';
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'API token from flyctl CLI or Fly.io Dashboard. Create using "fly tokens create org" or via Dashboard > Account > Settings > Access Tokens.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.machines.dev',
			description: 'API base URL. Use http://_api.internal:4280 for internal access within WireGuard mesh.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/apps',
			method: 'GET',
		},
	};
}
