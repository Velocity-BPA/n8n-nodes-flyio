/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	toExecutionData,
	parseJsonParameter,
	buildMachineConfig,
	cleanObject,
	validateAppName,
} from '../../nodes/FlyIo/utils/helpers';

describe('Helper Functions', () => {
	describe('toExecutionData', () => {
		it('should convert single object to execution data', () => {
			const input = { id: '123', name: 'test' };
			const result = toExecutionData(input);
			expect(result).toEqual([{ json: input }]);
		});

		it('should convert array to execution data', () => {
			const input = [{ id: '1' }, { id: '2' }];
			const result = toExecutionData(input);
			expect(result).toEqual([{ json: { id: '1' } }, { json: { id: '2' } }]);
		});

		it('should handle empty array', () => {
			const result = toExecutionData([]);
			expect(result).toEqual([]);
		});
	});

	describe('parseJsonParameter', () => {
		it('should parse valid JSON string', () => {
			const input = '{"key": "value"}';
			const result = parseJsonParameter(input);
			expect(result).toEqual({ key: 'value' });
		});

		it('should return object as-is', () => {
			const input = { key: 'value' };
			const result = parseJsonParameter(input);
			expect(result).toBe(input);
		});

		it('should throw on invalid JSON', () => {
			expect(() => parseJsonParameter('invalid json')).toThrow('Invalid JSON format');
		});
	});

	describe('buildMachineConfig', () => {
		it('should build config with image', () => {
			const result = buildMachineConfig({ image: 'nginx:latest' });
			expect(result).toEqual({ image: 'nginx:latest' });
		});

		it('should build config with guest resources', () => {
			const result = buildMachineConfig({
				cpuKind: 'shared',
				cpus: 2,
				memoryMb: 512,
			});
			expect(result).toEqual({
				guest: {
					cpu_kind: 'shared',
					cpus: 2,
					memory_mb: 512,
				},
			});
		});

		it('should build config with environment variables', () => {
			const result = buildMachineConfig({
				env: '{"NODE_ENV": "production"}',
			});
			expect(result).toEqual({
				env: { NODE_ENV: 'production' },
			});
		});

		it('should build config with restart policy', () => {
			const result = buildMachineConfig({
				restartPolicy: 'always',
				restartMaxRetries: 3,
			});
			expect(result).toEqual({
				restart: {
					policy: 'always',
					max_retries: 3,
				},
			});
		});

		it('should build config with auto_destroy', () => {
			const result = buildMachineConfig({ autoDestroy: true });
			expect(result).toEqual({ auto_destroy: true });
		});
	});

	describe('cleanObject', () => {
		it('should remove undefined values', () => {
			const result = cleanObject({ a: 'value', b: undefined, c: 'test' });
			expect(result).toEqual({ a: 'value', c: 'test' });
		});

		it('should remove null values', () => {
			const result = cleanObject({ a: 'value', b: null });
			expect(result).toEqual({ a: 'value' });
		});

		it('should remove empty strings', () => {
			const result = cleanObject({ a: 'value', b: '' });
			expect(result).toEqual({ a: 'value' });
		});

		it('should keep zero and false', () => {
			const result = cleanObject({ a: 0, b: false, c: 'value' });
			expect(result).toEqual({ a: 0, b: false, c: 'value' });
		});
	});

	describe('validateAppName', () => {
		it('should accept valid app names', () => {
			expect(validateAppName('my-app')).toBe(true);
			expect(validateAppName('app123')).toBe(true);
			expect(validateAppName('my-app-123')).toBe(true);
			expect(validateAppName('a')).toBe(true);
		});

		it('should reject invalid app names', () => {
			expect(validateAppName('My-App')).toBe(false);
			expect(validateAppName('-app')).toBe(false);
			expect(validateAppName('app-')).toBe(false);
			expect(validateAppName('app_name')).toBe(false);
			expect(validateAppName('app name')).toBe(false);
		});

		it('should reject names longer than 63 characters', () => {
			const longName = 'a'.repeat(64);
			expect(validateAppName(longName)).toBe(false);
		});
	});
});
