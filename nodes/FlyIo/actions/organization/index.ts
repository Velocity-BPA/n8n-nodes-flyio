/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { flyGraphqlRequest } from '../../transport';

export const organizationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['organization'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get organization details',
				action: 'Get an organization',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List organizations the token has access to',
				action: 'List organizations',
			},
		],
		default: 'list',
	},
];

export const organizationFields: INodeProperties[] = [
	// Organization Slug - for get
	{
		displayName: 'Organization Slug',
		name: 'orgSlug',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['get'],
			},
		},
		placeholder: 'personal',
	},
];

const GRAPHQL_QUERIES = {
	listOrganizations: `
		query {
			organizations {
				nodes {
					id
					slug
					name
					type
					paidPlan
					billable
					creditBalance
					creditBalanceFormatted
				}
			}
		}
	`,
	getOrganization: `
		query($slug: String!) {
			organization(slug: $slug) {
				id
				slug
				name
				type
				paidPlan
				billable
				creditBalance
				creditBalanceFormatted
				members {
					edges {
						node {
							id
							email
							name
						}
						role
					}
				}
			}
		}
	`,
};

export async function executeOrganizationOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let response: IDataObject;

	switch (operation) {
		case 'list': {
			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.listOrganizations, {});
			const orgs = response.organizations as IDataObject;
			return (orgs?.nodes as IDataObject[]) || [];
		}

		case 'get': {
			const orgSlug = this.getNodeParameter('orgSlug', i) as string;
			response = await flyGraphqlRequest.call(this, GRAPHQL_QUERIES.getOrganization, {
				slug: orgSlug,
			});
			return response.organization as IDataObject || {};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
