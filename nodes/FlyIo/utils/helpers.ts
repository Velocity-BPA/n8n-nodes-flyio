/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

/**
 * Convert API response to n8n execution data format
 */
export function toExecutionData(data: IDataObject | IDataObject[]): INodeExecutionData[] {
	if (Array.isArray(data)) {
		return data.map((item) => ({ json: item }));
	}
	return [{ json: data }];
}

/**
 * Parse JSON string or return object as-is
 */
export function parseJsonParameter(value: string | IDataObject): IDataObject {
	if (typeof value === 'string') {
		try {
			return JSON.parse(value) as IDataObject;
		} catch {
			throw new Error('Invalid JSON format');
		}
	}
	return value;
}

/**
 * Build machine config object from parameters
 */
export function buildMachineConfig(params: IDataObject): IDataObject {
	const config: IDataObject = {};

	if (params.image) {
		config.image = params.image;
	}

	if (params.cpuKind || params.cpus || params.memoryMb) {
		config.guest = {};
		if (params.cpuKind) (config.guest as IDataObject).cpu_kind = params.cpuKind;
		if (params.cpus) (config.guest as IDataObject).cpus = params.cpus;
		if (params.memoryMb) (config.guest as IDataObject).memory_mb = params.memoryMb;
	}

	if (params.env) {
		config.env = parseJsonParameter(params.env as string | IDataObject);
	}

	if (params.services) {
		config.services = parseJsonParameter(params.services as string | IDataObject);
	}

	if (params.mounts) {
		config.mounts = parseJsonParameter(params.mounts as string | IDataObject);
	}

	if (params.autoDestroy !== undefined) {
		config.auto_destroy = params.autoDestroy;
	}

	if (params.restartPolicy) {
		config.restart = { policy: params.restartPolicy };
		if (params.restartMaxRetries) {
			(config.restart as IDataObject).max_retries = params.restartMaxRetries;
		}
	}

	if (params.init) {
		config.init = parseJsonParameter(params.init as string | IDataObject);
	}

	if (params.processes) {
		config.processes = parseJsonParameter(params.processes as string | IDataObject);
	}

	return config;
}

/**
 * Clean empty values from object
 */
export function cleanObject(obj: IDataObject): IDataObject {
	const cleaned: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined && value !== null && value !== '') {
			cleaned[key] = value;
		}
	}
	return cleaned;
}

/**
 * Format region display name
 */
export function formatRegionName(code: string, name: string): string {
	return `${name} (${code})`;
}

/**
 * Validate app name format
 */
export function validateAppName(name: string): boolean {
	// App names must be lowercase alphanumeric with hyphens
	const pattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
	return pattern.test(name) && name.length <= 63;
}

/**
 * Log licensing notice (once per session)
 */
let licenseNoticeLogged = false;
export function logLicenseNotice(logger: { warn: (msg: string) => void }): void {
	if (!licenseNoticeLogged) {
		logger.warn(
			'[Velocity BPA Licensing Notice] This n8n node is licensed under the Business Source License 1.1 (BSL 1.1). ' +
			'Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA. ' +
			'For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.',
		);
		licenseNoticeLogged = true;
	}
}
