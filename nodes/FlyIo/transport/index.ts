/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
	IDataObject,
	IHttpRequestMethods,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Make a request to the Fly.io Machines REST API
 */
export async function flyMachinesApiRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions | IPollFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
): Promise<IDataObject | IDataObject[]> {
	const credentials = await this.getCredentials('flyIoApi');
	const baseUrl = (credentials.baseUrl as string) || 'https://api.machines.dev';

	const options: IRequestOptions = {
		method,
		uri: `${baseUrl}${endpoint}`,
		headers: {
			Authorization: `Bearer ${credentials.apiToken}`,
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (query && Object.keys(query).length > 0) {
		options.qs = query;
	}

	try {
		const response = await this.helpers.request(options);
		return response as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Fly.io API request failed: ${(error as Error).message}`,
		});
	}
}

/**
 * Make a request to the Fly.io GraphQL API
 */
export async function flyGraphqlRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions | IPollFunctions,
	query: string,
	variables?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('flyIoApi');

	const options: IRequestOptions = {
		method: 'POST',
		uri: 'https://api.fly.io/graphql',
		headers: {
			Authorization: `Bearer ${credentials.apiToken}`,
			'Content-Type': 'application/json',
		},
		body: {
			query,
			variables: variables || {},
		},
		json: true,
	};

	try {
		const response = await this.helpers.request(options);

		if (response.errors && response.errors.length > 0) {
			const errorMessages = response.errors.map((e: IDataObject) => e.message).join(', ');
			throw new Error(errorMessages);
		}

		return response.data as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Fly.io GraphQL request failed: ${(error as Error).message}`,
		});
	}
}

/**
 * Wait for a Machine to reach a specific state
 */
export async function waitForMachineState(
	this: IExecuteFunctions,
	appName: string,
	machineId: string,
	targetState: string,
	timeout: number = 60,
): Promise<IDataObject> {
	const startTime = Date.now();
	const timeoutMs = timeout * 1000;

	while (Date.now() - startTime < timeoutMs) {
		const machine = await flyMachinesApiRequest.call(
			this,
			'GET',
			`/v1/apps/${appName}/machines/${machineId}`,
		);

		if ((machine as IDataObject).state === targetState) {
			return machine as IDataObject;
		}

		// Wait 1 second before next check
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	throw new Error(`Machine did not reach state '${targetState}' within ${timeout} seconds`);
}

/**
 * Handle pagination for list operations
 */
export async function flyMachinesApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
): Promise<IDataObject[]> {
	const response = await flyMachinesApiRequest.call(this, method, endpoint, body, query);

	// Fly.io API returns arrays directly for list operations
	if (Array.isArray(response)) {
		return response;
	}

	// Some endpoints return objects with an array property
	if (response && typeof response === 'object') {
		// Handle apps list response
		if ('apps' in response && Array.isArray(response.apps)) {
			return response.apps as IDataObject[];
		}
		// Handle volumes list response
		if ('volumes' in response && Array.isArray(response.volumes)) {
			return response.volumes as IDataObject[];
		}
		// Handle snapshots list response
		if ('snapshots' in response && Array.isArray(response.snapshots)) {
			return response.snapshots as IDataObject[];
		}
	}

	return [response as IDataObject];
}
