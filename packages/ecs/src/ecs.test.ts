import assert from 'assert';
import {describe, expect, test} from '@jest/globals';
import {
	addComponent,
	createComponent,
	createEntity,
	createWorld,
	getEntity,
	query,
	removeComponent,
} from './ecs';

const posSchema = {
	x: 'f64',
	y: 'f64',
} as const;

const healthSchema = {
	health: 'u32',
} as const;

describe('ecs', () => {
	test('.createWorld()', () => {
		const world = createWorld();

		expect(world).toBeDefined();
	});

	test('.createEntity()', () => {
		const world = createWorld();

		expect(createEntity(world)).toBe(0);
		expect(createEntity(world)).toBe(1);
		expect(createEntity(world)).toBe(2);
		expect(createEntity(world)).toBe(3);
	});

	test('.createComponent()', () => {
		const posComponent = createComponent(posSchema);

		expect(posComponent.schema).toBe(posSchema);
	});

	test('.addComponent()', () => {
		const world = createWorld();
		const posComponent = createComponent(posSchema);
		const entityId = createEntity(world);

		const pos1 = addComponent(world, entityId, posComponent);
		expect(pos1.x).toBe(0);
		expect(pos1.y).toBe(0);
	});

	test('.getEntity()', () => {
		const world = createWorld();
		const posComponent = createComponent(posSchema);
		const entityId = createEntity(world);
		const pos1 = addComponent(world, entityId, posComponent);
		pos1.x = 1.1;

		const entity = getEntity(world, entityId);

		const pos2 = entity.get(posComponent);
		assert(pos2 !== undefined);
		expect(pos2.x).toBe(1.1);
	});

	test('.removeComponent()', () => {
		const world = createWorld();
		const posComponent = createComponent(posSchema);
		const entityId = createEntity(world);
		addComponent(world, entityId, posComponent);

		removeComponent(world, entityId, posComponent);

		const entity = getEntity(world, entityId);
		expect(entity.has(posComponent)).toBeFalsy();
	});

	describe('.query()', () => {
		test('1 components & 1 entity', () => {
			const world = createWorld();
			const posComponent = createComponent(posSchema);
			const player = createEntity(world);
			const pos = addComponent(world, player, posComponent);
			pos.x = 2.2;

			const iter = [...query(world, [posComponent])];

			expect(iter).toHaveLength(1);
			expect(iter[0]).toHaveLength(1);
			expect(iter[0][0].x).toBe(2.2);
		});

		test('2 components & 3 entities', () => {
			const world = createWorld();
			const posComponent = createComponent(posSchema);
			const healthComponent = createComponent(healthSchema);
			const player = createEntity(world);
			const enemy = createEntity(world);
			const wall = createEntity(world);
			const pos1 = addComponent(world, player, posComponent);
			pos1.y = 3;
			const health1 = addComponent(world, player, healthComponent);
			health1.health = 100;
			const pos2 = addComponent(world, enemy, posComponent);
			pos2.y = 5;
			const health2 = addComponent(world, enemy, healthComponent);
			health2.health = 10;
			const pos3 = addComponent(world, wall, posComponent);
			pos3.x = 1200;
			{
				const iter = [...query(world, [posComponent, healthComponent])];
				expect(iter).toHaveLength(2);
				expect(iter[0]).toHaveLength(2);
				expect(iter[0][0].y).toBe(3);
				expect(iter[0][1].health).toBe(100);
				expect(iter[1]).toHaveLength(2);
				expect(iter[1][0].y).toBe(5);
				expect(iter[1][1].health).toBe(10);
			}
			{
				const iter = [...query(world, [posComponent])];
				expect(iter).toHaveLength(3);
				expect(iter[0]).toHaveLength(1);
				expect(iter[0][0].y).toBe(3);
				expect(iter[1]).toHaveLength(1);
				expect(iter[1][0].y).toBe(5);
				expect(iter[2]).toHaveLength(1);
				expect(iter[2][0].x).toBe(1200);
			}
			{
				const iter = [...query(world, [healthComponent])];
				expect(iter).toHaveLength(2);
				expect(iter[0]).toHaveLength(1);
				expect(iter[0][0].health).toBe(100);
				expect(iter[1]).toHaveLength(1);
				expect(iter[1][0].health).toBe(10);
			}
		});
	})
});
