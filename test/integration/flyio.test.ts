/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Integration tests for Fly.io node
 *
 * These tests verify the node structure and configuration.
 * Actual API calls require valid credentials and are skipped in CI.
 *
 * To run with actual API:
 * 1. Set FLY_API_TOKEN environment variable
 * 2. Run: npm test -- --testPathPattern=integration
 */

import { FlyIo } from '../../nodes/FlyIo/FlyIo.node';
import { FlyIoTrigger } from '../../nodes/FlyIo/FlyIoTrigger.node';

describe('FlyIo Node', () => {
	let node: FlyIo;

	beforeEach(() => {
		node = new FlyIo();
	});

	describe('Node Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('Fly.io');
		});

		it('should have correct name', () => {
			expect(node.description.name).toBe('flyIo');
		});

		it('should have credentials configured', () => {
			expect(node.description.credentials).toBeDefined();
			expect(node.description.credentials).toHaveLength(1);
			expect(node.description.credentials?.[0].name).toBe('flyIoApi');
		});

		it('should have all expected resources', () => {
			const resourceProperty = node.description.properties.find((p) => p.name === 'resource');
			expect(resourceProperty).toBeDefined();
			expect(resourceProperty?.type).toBe('options');

			const options = (resourceProperty as any)?.options || [];
			const resourceNames = options.map((o: any) => o.value);

			expect(resourceNames).toContain('app');
			expect(resourceNames).toContain('machine');
			expect(resourceNames).toContain('volume');
			expect(resourceNames).toContain('secret');
			expect(resourceNames).toContain('certificate');
			expect(resourceNames).toContain('ipAddress');
			expect(resourceNames).toContain('organization');
			expect(resourceNames).toContain('region');
		});

		it('should have icon file', () => {
			expect(node.description.icon).toBe('file:flyio.svg');
		});
	});

	describe('Machine Operations', () => {
		it('should have all machine operations', () => {
			const operationProperty = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('machine')
			);
			expect(operationProperty).toBeDefined();

			const options = (operationProperty as any)?.options || [];
			const operationNames = options.map((o: any) => o.value);

			// Core operations
			expect(operationNames).toContain('list');
			expect(operationNames).toContain('create');
			expect(operationNames).toContain('get');
			expect(operationNames).toContain('update');
			expect(operationNames).toContain('delete');

			// Lifecycle operations
			expect(operationNames).toContain('start');
			expect(operationNames).toContain('stop');
			expect(operationNames).toContain('restart');
			expect(operationNames).toContain('signal');
			expect(operationNames).toContain('wait');

			// Lease operations
			expect(operationNames).toContain('getLease');
			expect(operationNames).toContain('acquireLease');
			expect(operationNames).toContain('releaseLease');

			// Other operations
			expect(operationNames).toContain('listEvents');
			expect(operationNames).toContain('listProcesses');
			expect(operationNames).toContain('cordon');
			expect(operationNames).toContain('uncordon');
			expect(operationNames).toContain('exec');
			expect(operationNames).toContain('getMetadata');
			expect(operationNames).toContain('updateMetadata');
			expect(operationNames).toContain('deleteMetadata');
		});
	});

	describe('Volume Operations', () => {
		it('should have all volume operations', () => {
			const operationProperty = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('volume')
			);
			expect(operationProperty).toBeDefined();

			const options = (operationProperty as any)?.options || [];
			const operationNames = options.map((o: any) => o.value);

			expect(operationNames).toContain('list');
			expect(operationNames).toContain('create');
			expect(operationNames).toContain('get');
			expect(operationNames).toContain('update');
			expect(operationNames).toContain('delete');
			expect(operationNames).toContain('extend');
			expect(operationNames).toContain('listSnapshots');
			expect(operationNames).toContain('createSnapshot');
			expect(operationNames).toContain('restoreFromSnapshot');
		});
	});
});

describe('FlyIo Trigger Node', () => {
	let trigger: FlyIoTrigger;

	beforeEach(() => {
		trigger = new FlyIoTrigger();
	});

	describe('Trigger Description', () => {
		it('should have correct display name', () => {
			expect(trigger.description.displayName).toBe('Fly.io Trigger');
		});

		it('should have correct name', () => {
			expect(trigger.description.name).toBe('flyIoTrigger');
		});

		it('should be a polling trigger', () => {
			expect(trigger.description.polling).toBe(true);
		});

		it('should have app name parameter', () => {
			const appNameProp = trigger.description.properties.find(
				(p) => p.name === 'appName'
			);
			expect(appNameProp).toBeDefined();
			expect(appNameProp?.required).toBe(true);
		});

		it('should have event type options', () => {
			const eventProp = trigger.description.properties.find((p) => p.name === 'event');
			expect(eventProp).toBeDefined();

			const options = (eventProp as any)?.options || [];
			const eventNames = options.map((o: any) => o.value);

			expect(eventNames).toContain('machineStateChanged');
			expect(eventNames).toContain('machineCreated');
			expect(eventNames).toContain('machineStarted');
			expect(eventNames).toContain('machineStopped');
			expect(eventNames).toContain('machineDestroyed');
			expect(eventNames).toContain('volumeStateChanged');
		});
	});
});

describe('Node Exports', () => {
	it('should export FlyIo node', () => {
		expect(FlyIo).toBeDefined();
		expect(new FlyIo()).toBeInstanceOf(FlyIo);
	});

	it('should export FlyIoTrigger node', () => {
		expect(FlyIoTrigger).toBeDefined();
		expect(new FlyIoTrigger()).toBeInstanceOf(FlyIoTrigger);
	});
});
