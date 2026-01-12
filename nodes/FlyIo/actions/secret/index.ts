/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { flyGraphqlRequest } from '../../transport';
import { parseJsonParameter } from '../../utils/helpers';

export const secretOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['secret'],
			},
		},
		options: [
			{
				name: 'Deploy',
				value: 'deploy',
				description: 'Deploy staged secrets',
				action: 'Deploy secrets',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List secrets for an app (names only)',
				action: 'List secrets',
			},
			{
				name: 'Set',
				value: 'set',
				description: 'Set one or more secrets',
				action: 'Set secrets',
			},
			{
				name: 'Unset',
				value: 'unset',
				description: 'Remove one or more secrets',
				action: 'Unset secrets',
			},
		],
		default: 'list',
	},
];

export const secretFields: INodeProperties[] = [
	// App Name - required for all operations
	{
		displayName: 'App Name',
		name: 'appName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['secret'],
			},
		},
		description: 'The name of the app',
	},
	// Secrets to set
	{
		displayName: 'Secrets (JSON)',
		name: 'secrets',
		type: 'json',
		required: true,
		default: '{}',
		displayOptions: {
			show: {
				resource: ['secret'],
				operation: ['set'],
			},
		},
		description: 'Key-value pairs of secrets to set as JSON object',
		placeholder: '{"API_KEY": "secret123", "DB_PASSWORD": "pass456"}',
	},
	// Keys to unset
	{
		displayName: 'Secret Keys',
		name: 'secretKeys',
		type: 'string',
		typeOptions: { password: true },
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['secret'],
				operation: ['unset'],
			},
		},
		description: 'Comma-separated list of secret keys to remove',
		placeholder: 'API_KEY, DB_PASSWORD',
	},
	// Stage option for set
	{
		displayName: 'Stage Only',
		name: 'stageOnly',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['secret'],
				operation: ['set'],
			},
		},
		description: 'Whether to stage secrets without deploying immediately',
	},
];

const GRAPHQL_QUERIES = {
	listSecrets: `
		query($appName: String!) {
			app(name: $appName) {
				secrets {
					name
					digest
					createdAt
				}
			}
		}
	`,
	setSecrets: `
		mutation($input: SetSecretsInput!) {
			setSecrets(input: $input) {
				app {
					name
				}
				release {
					id
					version
					status
				}
			}
		}
	`,
	unsetSecrets: `
		mutation($input: UnsetSecretsInput!) {
			unsetSecrets(input: $input) {
				app {
					name
				}
				release {
					id
					version
					status
				}
			}
		}
	`,
	deploySecrets: `
		mutation($input: DeployImageInput!) {
			deployImage(input: $input) {
				release {
					id
					version
					status
				}
			}
		}
	`,
};

export async function executeSecretOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const appName = this.getNodeParameter('appName', i) as string;
	let response: IDataObject;

	switch (operation) {
		case 'list': {
			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.listSecrets, { appName });
			return (response.app as IDataObject)?.secrets as IDataObject[] || [];
		}

		case 'set': {
			const secretsJson = this.getNodeParameter('secrets', i) as string | IDataObject;
			const stageOnly = this.getNodeParameter('stageOnly', i) as boolean;
			const secrets = parseJsonParameter(secretsJson);

			// Convert to array format expected by API
			const secretsArray = Object.entries(secrets).map(([key, value]) => ({
				key,
				value: String(value),
			}));

			const input: IDataObject = {
				appId: appName,
				secrets: secretsArray,
			};

			if (stageOnly) {
				input.replaceAll = false;
			}

			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.setSecrets, { input });
			return response.setSecrets as IDataObject;
		}

		case 'unset': {
			const keysString = this.getNodeParameter('secretKeys', i) as string;
			const keys = keysString.split(',').map((k) => k.trim()).filter((k) => k);

			const input: IDataObject = {
				appId: appName,
				keys,
			};

			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.unsetSecrets, { input });
			return response.unsetSecrets as IDataObject;
		}

		case 'deploy': {
			const input: IDataObject = {
				appId: appName,
			};

			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.deploySecrets, { input });
			return response.deployImage as IDataObject;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
