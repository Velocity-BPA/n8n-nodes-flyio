/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { flyGraphqlRequest } from '../../transport';

export const certificateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['certificate'],
			},
		},
		options: [
			{
				name: 'Add',
				value: 'add',
				description: 'Add a certificate for a hostname',
				action: 'Add a certificate',
			},
			{
				name: 'Check',
				value: 'check',
				description: 'Check certificate and DNS status',
				action: 'Check a certificate',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Remove a certificate',
				action: 'Delete a certificate',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get certificate details',
				action: 'Get a certificate',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List certificates for an app',
				action: 'List certificates',
			},
		],
		default: 'list',
	},
];

export const certificateFields: INodeProperties[] = [
	// App Name - required for all operations
	{
		displayName: 'App Name',
		name: 'appName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['certificate'],
			},
		},
		description: 'The name of the app',
	},
	// Hostname - required for add, get, check, delete
	{
		displayName: 'Hostname',
		name: 'hostname',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['certificate'],
				operation: ['add', 'get', 'check', 'delete'],
			},
		},
		description: 'Domain/hostname for the certificate',
		placeholder: 'example.com',
	},
];

const GRAPHQL_QUERIES = {
	listCertificates: `
		query($appName: String!) {
			app(name: $appName) {
				certificates {
					nodes {
						id
						hostname
						createdAt
						source
						clientStatus
						issued {
							nodes {
								type
								expiresAt
							}
						}
					}
				}
			}
		}
	`,
	getCertificate: `
		query($appName: String!, $hostname: String!) {
			app(name: $appName) {
				certificate(hostname: $hostname) {
					id
					hostname
					createdAt
					source
					clientStatus
					dnsValidationHostname
					dnsValidationTarget
					issued {
						nodes {
							type
							expiresAt
						}
					}
				}
			}
		}
	`,
	addCertificate: `
		mutation($appId: ID!, $hostname: String!) {
			addCertificate(appId: $appId, hostname: $hostname) {
				certificate {
					id
					hostname
					createdAt
					source
					clientStatus
					dnsValidationHostname
					dnsValidationTarget
				}
			}
		}
	`,
	checkCertificate: `
		query($appName: String!, $hostname: String!) {
			app(name: $appName) {
				certificate(hostname: $hostname) {
					id
					hostname
					check
					clientStatus
					dnsValidationHostname
					dnsValidationTarget
					issued {
						nodes {
							type
							expiresAt
						}
					}
				}
			}
		}
	`,
	deleteCertificate: `
		mutation($appId: ID!, $hostname: String!) {
			deleteCertificate(appId: $appId, hostname: $hostname) {
				app {
					name
				}
				certificate {
					id
					hostname
				}
			}
		}
	`,
};

export async function executeCertificateOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const appName = this.getNodeParameter('appName', i) as string;
	let response: IDataObject;

	switch (operation) {
		case 'list': {
			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.listCertificates, { appName });
			const app = response.app as IDataObject;
			const certs = app?.certificates as IDataObject;
			return (certs?.nodes as IDataObject[]) || [];
		}

		case 'get': {
			const hostname = this.getNodeParameter('hostname', i) as string;
			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.getCertificate, {
				appName,
				hostname,
			});
			const app = response.app as IDataObject;
			return app?.certificate as IDataObject || {};
		}

		case 'add': {
			const hostname = this.getNodeParameter('hostname', i) as string;
			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.addCertificate, {
				appId: appName,
				hostname,
			});
			const addResult = response.addCertificate as IDataObject;
			return addResult?.certificate as IDataObject || {};
		}

		case 'check': {
			const hostname = this.getNodeParameter('hostname', i) as string;
			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.checkCertificate, {
				appName,
				hostname,
			});
			const app = response.app as IDataObject;
			return app?.certificate as IDataObject || {};
		}

		case 'delete': {
			const hostname = this.getNodeParameter('hostname', i) as string;
			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.deleteCertificate, {
				appId: appName,
				hostname,
			});
			return response.deleteCertificate as IDataObject;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
