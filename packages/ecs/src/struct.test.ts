import {describe, expect, test} from '@jest/globals';

import {defineStruct} from './struct';

describe('struct', () => {
	describe('{ x: "f64" }', () => {
		const schema = {x: 'f64'} as const;

		test('ArrayBuffer of size 7 bytes is not large enough', () => {
			const createStruct = defineStruct(schema);
			const data = new DataView(new ArrayBuffer(3));

			expect(() => createStruct(data)).toThrow();
		});

		test('can set and get "x"', () => {
			const createStruct = defineStruct(schema);
			const data = new DataView(new ArrayBuffer(8));
			const struct = createStruct(data);

			expect(struct.x).toBe(0);
			expect(data.getFloat64(0)).toBe(0);
			struct.x = 10.2;
			expect(struct.x).toBe(10.2);
			expect(data.getFloat64(0)).toBe(10.2);
		});

		test('2 structs in 1 ArrayBuffer', () => {
			const createStruct = defineStruct(schema);
			const buffer = new ArrayBuffer(16);
			const data1 = new DataView(buffer, 0);
			const data2 = new DataView(buffer, 8);
			const struct1 = createStruct(data1);
			const struct2 = createStruct(data2);

			expect(struct1.x).toBe(0);
			expect(data1.getFloat64(0)).toBe(0);
			expect(struct2.x).toBe(0);
			expect(data2.getFloat64(0)).toBe(0);

			struct1.x = 10.2;
			expect(struct1.x).toBe(10.2);
			expect(data1.getFloat64(0)).toBe(10.2);
			expect(struct2.x).toBe(0);
			expect(data2.getFloat64(0)).toBe(0);

			struct2.x = 12;
			expect(struct1.x).toBe(10.2);
			expect(data1.getFloat64(0)).toBe(10.2);
			expect(struct2.x).toBe(12);
			expect(data2.getFloat64(0)).toBe(12);
		});

		test('can have overlapping structs in 1 ArrayBuffer', () => {
			const createStruct = defineStruct(schema);
			const buffer = new ArrayBuffer(10);
			const data1 = new DataView(buffer, 0);
			const data2 = new DataView(buffer, 2);
			const struct1 = createStruct(data1);
			const struct2 = createStruct(data2);

			expect(struct1.x).toBe(0);
			expect(data1.getFloat64(0)).toBe(0);
			expect(struct2.x).toBe(0);
			expect(data2.getFloat64(0)).toBe(0);

			struct1.x = 10.2;
			expect(struct1.x).toBe(10.2);
			expect(data1.getFloat64(0)).toBe(10.2);
			// NOTE: interference will scramble struct2's x
			expect(struct2.x).not.toBe(0);
			expect(data2.getFloat64(0)).not.toBe(0);

			struct2.x = 12;
			// NOTE: interference will scramble struct1's x
			expect(struct1.x).not.toBe(10.2);
			expect(data1.getFloat64(0)).not.toBe(10.2);
			expect(struct2.x).toBe(12);
			expect(data2.getFloat64(0)).toBe(12);
		});
	});

	describe('{ hp: "u32", pos: { x: "f64", y: "f64" } }', () => {
		const schema = {hp: 'u32', pos: {x: 'f64', y: 'f64'}} as const;

		test('ArrayBuffer of size 19 bytes is not large enough', () => {
			const createStruct = defineStruct(schema);
			const data = new DataView(new ArrayBuffer(19));

			expect(() => createStruct(data)).toThrow();
		});

		test('can set and get "hp", "pos.x", and "pos.y"', () => {
			const createStruct = defineStruct(schema);
			const data = new DataView(new ArrayBuffer(20));
			const struct = createStruct(data);

			expect(struct.hp).toBe(0);
			expect(struct.pos.x).toBe(0);
			expect(struct.pos.y).toBe(0);
			expect(data.getUint32(0)).toBe(0);
			expect(data.getFloat64(4)).toBe(0);
			expect(data.getFloat64(12)).toBe(0);
			struct.hp = 1;
			struct.pos.x = 2.3;
			struct.pos.y = 3.4;
			expect(struct.hp).toBe(1);
			expect(struct.pos.x).toBe(2.3);
			expect(struct.pos.y).toBe(3.4);
			expect(data.getUint32(0)).toBe(1);
			expect(data.getFloat64(4)).toBe(2.3);
			expect(data.getFloat64(12)).toBe(3.4);
		});

		test('can have 2 structs in 1 ArrayBuffer', () => {
			const createStruct = defineStruct(schema);
			const buffer = new ArrayBuffer(40);
			const data1 = new DataView(buffer, 0);
			const data2 = new DataView(buffer, 20);
			const struct1 = createStruct(data1);
			const struct2 = createStruct(data2);

			expect(struct1.pos.x).toBe(0);
			expect(data1.getFloat64(4)).toBe(0);
			expect(struct2.pos.x).toBe(0);
			expect(data2.getFloat64(4)).toBe(0);
			struct1.pos.x = 10.2;
			struct2.pos.x = 12.2;
			expect(struct1.pos.x).toBe(10.2);
			expect(data1.getFloat64(4)).toBe(10.2);
			expect(struct2.pos.x).toBe(12.2);
			expect(data2.getFloat64(4)).toBe(12.2);
		});
	});

	describe('{ ids: ["u32", 3] }', () => {
		const schema = {ids: ['u32', 3]} as const;

		test('ArrayBuffer of size 19 bytes is not large enough', () => {
			const createStruct = defineStruct(schema);
			const data = new DataView(new ArrayBuffer(11));

			expect(() => createStruct(data)).toThrow();
		});

		test('can set and get "ids[0]", ids[1], and "ids[2]"', () => {
			const createStruct = defineStruct(schema);
			const data = new DataView(new ArrayBuffer(12));
			const struct = createStruct(data);

			expect(struct.ids[0]).toBe(0);
			expect(struct.ids[1]).toBe(0);
			expect(struct.ids[2]).toBe(0);
			expect(data.getUint32(0)).toBe(0);
			expect(data.getUint32(4)).toBe(0);
			expect(data.getUint32(8)).toBe(0);
			struct.ids[0] = 1;
			struct.ids[1] = 2.1;
			struct.ids[2] = 3.123;
			expect(struct.ids[0]).toBe(1);
			expect(struct.ids[1]).toBe(2);
			expect(struct.ids[2]).toBe(3);
			expect(data.getUint32(0)).toBe(1);
			expect(data.getUint32(4)).toBe(2);
			expect(data.getUint32(8)).toBe(3);
		});
	});
});
