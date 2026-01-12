/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { flyMachinesApiRequest } from '../../transport';
import { cleanObject } from '../../utils/helpers';

export const volumeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['volume'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new volume',
				action: 'Create a volume',
			},
			{
				name: 'Create Snapshot',
				value: 'createSnapshot',
				description: 'Create an on-demand snapshot',
				action: 'Create a volume snapshot',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a volume',
				action: 'Delete a volume',
			},
			{
				name: 'Extend',
				value: 'extend',
				description: 'Extend volume size',
				action: 'Extend a volume',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get volume details',
				action: 'Get a volume',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all volumes in an app',
				action: 'List volumes',
			},
			{
				name: 'List Snapshots',
				value: 'listSnapshots',
				description: 'List snapshots for a volume',
				action: 'List volume snapshots',
			},
			{
				name: 'Restore From Snapshot',
				value: 'restoreFromSnapshot',
				description: 'Create volume from snapshot',
				action: 'Restore volume from snapshot',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update volume settings',
				action: 'Update a volume',
			},
		],
		default: 'list',
	},
];

export const volumeFields: INodeProperties[] = [
	// App Name - required for all operations
	{
		displayName: 'App Name',
		name: 'appName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['volume'],
			},
		},
		description: 'The name of the app',
	},
	// Volume ID - for operations that need it
	{
		displayName: 'Volume ID',
		name: 'volumeId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['volume'],
				operation: ['get', 'update', 'delete', 'extend', 'listSnapshots', 'createSnapshot'],
			},
		},
		description: 'The volume ID (e.g., "vol_6vj0ggxl7zjkm2zr")',
	},
	// Volume Name - for create
	{
		displayName: 'Volume Name',
		name: 'volumeName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['volume'],
				operation: ['create', 'restoreFromSnapshot'],
			},
		},
		description: 'Name for the volume',
	},
	// Region - for create
	{
		displayName: 'Region',
		name: 'region',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['volume'],
				operation: ['create', 'restoreFromSnapshot'],
			},
		},
		description: 'Region code for the volume (e.g., "ord", "cdg", "sin")',
		placeholder: 'ord',
	},
	// Size - for create
	{
		displayName: 'Size (GB)',
		name: 'sizeGb',
		type: 'number',
		required: true,
		default: 1,
		typeOptions: { minValue: 1 },
		displayOptions: {
			show: {
				resource: ['volume'],
				operation: ['create', 'restoreFromSnapshot'],
			},
		},
		description: 'Size in GB',
	},
	// New Size - for extend
	{
		displayName: 'New Size (GB)',
		name: 'newSizeGb',
		type: 'number',
		required: true,
		default: 1,
		typeOptions: { minValue: 1 },
		displayOptions: {
			show: {
				resource: ['volume'],
				operation: ['extend'],
			},
		},
		description: 'New size in GB (must be larger than current size)',
	},
	// Snapshot ID - for restore
	{
		displayName: 'Snapshot ID',
		name: 'snapshotId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['volume'],
				operation: ['restoreFromSnapshot'],
			},
		},
		description: 'Snapshot ID to restore from',
	},
	// Create options
	{
		displayName: 'Options',
		name: 'volumeOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['volume'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Auto Backup Enabled',
				name: 'autoBackupEnabled',
				type: 'boolean',
				default: true,
				description: 'Whether to enable automatic backups',
			},
			{
				displayName: 'Compute Image',
				name: 'computeImage',
				type: 'string',
				default: '',
				description: 'Image for compute requirements',
			},
			{
				displayName: 'Encrypted',
				name: 'encrypted',
				type: 'boolean',
				default: true,
				description: 'Whether to enable encryption',
			},
			{
				displayName: 'Snapshot Retention (Days)',
				name: 'snapshotRetention',
				type: 'number',
				default: 5,
				description: 'Days to retain snapshots',
			},
			{
				displayName: 'Source Volume ID',
				name: 'sourceVolumeId',
				type: 'string',
				default: '',
				description: 'Source volume ID for cloning',
			},
		],
	},
	// Update options
	{
		displayName: 'Update Fields',
		name: 'updateOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['volume'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Auto Backup Enabled',
				name: 'autoBackupEnabled',
				type: 'boolean',
				default: true,
				description: 'Whether to enable automatic backups',
			},
			{
				displayName: 'Snapshot Retention (Days)',
				name: 'snapshotRetention',
				type: 'number',
				default: 5,
				description: 'Days to retain snapshots',
			},
		],
	},
];

export async function executeVolumeOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const appName = this.getNodeParameter('appName', i) as string;
	let response: IDataObject | IDataObject[];

	switch (operation) {
		case 'list': {
			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}/volumes`,
			);
			break;
		}

		case 'create': {
			const volumeName = this.getNodeParameter('volumeName', i) as string;
			const region = this.getNodeParameter('region', i) as string;
			const sizeGb = this.getNodeParameter('sizeGb', i) as number;
			const volumeOptions = this.getNodeParameter('volumeOptions', i) as IDataObject;

			const body: IDataObject = {
				name: volumeName,
				region,
				size_gb: sizeGb,
			};

			if (volumeOptions.encrypted !== undefined) {
				body.encrypted = volumeOptions.encrypted;
			}
			if (volumeOptions.snapshotRetention) {
				body.snapshot_retention = volumeOptions.snapshotRetention;
			}
			if (volumeOptions.autoBackupEnabled !== undefined) {
				body.auto_backup_enabled = volumeOptions.autoBackupEnabled;
			}
			if (volumeOptions.sourceVolumeId) {
				body.source_volume_id = volumeOptions.sourceVolumeId;
			}
			if (volumeOptions.computeImage) {
				body.compute_image = volumeOptions.computeImage;
			}

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/volumes`,
				cleanObject(body),
			);
			break;
		}

		case 'get': {
			const volumeId = this.getNodeParameter('volumeId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}/volumes/${volumeId}`,
			);
			break;
		}

		case 'update': {
			const volumeId = this.getNodeParameter('volumeId', i) as string;
			const updateOptions = this.getNodeParameter('updateOptions', i) as IDataObject;

			const body: IDataObject = {};
			if (updateOptions.snapshotRetention) {
				body.snapshot_retention = updateOptions.snapshotRetention;
			}
			if (updateOptions.autoBackupEnabled !== undefined) {
				body.auto_backup_enabled = updateOptions.autoBackupEnabled;
			}

			response = await flyMachinesApiRequest.call(
				this,
				'PUT',
				`/v1/apps/${appName}/volumes/${volumeId}`,
				cleanObject(body),
			);
			break;
		}

		case 'delete': {
			const volumeId = this.getNodeParameter('volumeId', i) as string;
			await flyMachinesApiRequest.call(
				this,
				'DELETE',
				`/v1/apps/${appName}/volumes/${volumeId}`,
			);
			response = { success: true, volumeId, deleted: true };
			break;
		}

		case 'extend': {
			const volumeId = this.getNodeParameter('volumeId', i) as string;
			const newSizeGb = this.getNodeParameter('newSizeGb', i) as number;

			response = await flyMachinesApiRequest.call(
				this,
				'PUT',
				`/v1/apps/${appName}/volumes/${volumeId}/extend`,
				{ size_gb: newSizeGb },
			);
			break;
		}

		case 'listSnapshots': {
			const volumeId = this.getNodeParameter('volumeId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'GET',
				`/v1/apps/${appName}/volumes/${volumeId}/snapshots`,
			);
			break;
		}

		case 'createSnapshot': {
			const volumeId = this.getNodeParameter('volumeId', i) as string;
			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/volumes/${volumeId}/snapshots`,
			);
			break;
		}

		case 'restoreFromSnapshot': {
			const volumeName = this.getNodeParameter('volumeName', i) as string;
			const region = this.getNodeParameter('region', i) as string;
			const sizeGb = this.getNodeParameter('sizeGb', i) as number;
			const snapshotId = this.getNodeParameter('snapshotId', i) as string;

			response = await flyMachinesApiRequest.call(
				this,
				'POST',
				`/v1/apps/${appName}/volumes`,
				{
					name: volumeName,
					region,
					size_gb: sizeGb,
					snapshot_id: snapshotId,
				},
			);
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return response;
}
