import assert from 'assert';
import {defineStruct, getSize, Schema, Struct} from '@pygmygames/struct';

type Component<S extends Schema> = Readonly<{
	create: (data: DataView) => Struct<S>;
	schema: S;
}>;

type ComponentStorage<S extends Schema> = {
	component: Component<S>
	dataView: DataView,
	slots: Array<EntityId>,
}

function createComponentStorage<S extends Schema>(component: Component<S>, dataView: DataView): ComponentStorage<S> {
	return {
		component,
		dataView,
		slots: [],
	}
}

function addEntityToComponentStorage(componentStorage: ComponentStorage<Schema>, entityId: EntityId) {
	if (componentStorage.slots.indexOf(entityId) !== -1) {
		return;
	}
	const emptySlot = componentStorage.slots.indexOf(-1);
	if (emptySlot !== -1) {
		componentStorage.slots[emptySlot] = entityId;
	} else {
		componentStorage.slots.push(entityId);
	}
}

function getEntityStructFromComponentStorage<S extends Schema>(componentStorage: ComponentStorage<S>, entityId: EntityId): Struct<S> | undefined {
	const i = componentStorage.slots.indexOf(entityId);
	if (i === -1) {
		return;
	}
	const structLength = getSize(componentStorage.component.schema);
	return componentStorage.component.create(new DataView(componentStorage.dataView.buffer, i * structLength));
}

function removeEntityFromComponentStorage(componentStorage: ComponentStorage<Schema>, entityId: EntityId) {
	const i = componentStorage.slots.indexOf(entityId);
	if (i === -1) {
		return;
	}
	componentStorage.slots[entityId] = -1;
}

export function createComponent<S extends Schema>(schema: S): Component<S> {
	return {
		schema,
		create: defineStruct(schema),
	} as const;
}

type worldComponentStorage =  {
	has(key: Component<Schema>): boolean;
    get<S extends Schema>(key: Component<S>): ComponentStorage<S> | undefined;
    set<S extends Schema>(key: Component<S>, value: ComponentStorage<S>): void;
} & Map<Component<Schema>, ComponentStorage<Schema>>

export type World = {
	nextEntityId: number,
	storage: worldComponentStorage,
};

export function createWorld(): World {
	return {
		nextEntityId: 0,
		storage: new Map() as worldComponentStorage,
	};
}

function getStructForEntity<S extends Schema>(world: World, entityId: EntityId, component: Component<S>): Struct<S> | undefined {
	const componentStorage = world.storage.get(component);
	if (!componentStorage) {
		return;
	}
	if (!componentStorage.slots.includes(entityId)) {
		return;
	}
	return getEntityStructFromComponentStorage(componentStorage, entityId)
}

type EntityId = number;

type EntityMap =  {
	has(key: Component<Schema>): boolean;
    get<S extends Schema>(key: Component<S>): Struct<S> | undefined;
    set<S extends Schema>(key: Component<S>, value: Struct<S>): void;
} & Map<Component<Schema>, Struct<Schema>>

export function createEntity(world: World): EntityId {
	const nextEntityId = world.nextEntityId;
	world.nextEntityId += 1;
	return nextEntityId;
}

export function getEntity(world: World, entityId: EntityId): EntityMap {
	const entityMap = new Map() as EntityMap;
	for (const [component, componentStorage] of world.storage.entries()) {
		const struct = getEntityStructFromComponentStorage(componentStorage, entityId);
		if (struct) {
			entityMap.set(component, struct);
		}
	}
	return entityMap;
}

export function addComponent<S extends Schema>(world: World, entityId: EntityId, component: Component<S>): Struct<S> {
	if (!world.storage.has(component)) {
		const arrayBuffer = new ArrayBuffer(10000);
		const componentStorage = createComponentStorage(component, new DataView(arrayBuffer, 0));
		world.storage.set(component, componentStorage);
	}
	const componentStorage = world.storage.get(component);
	assert(componentStorage !== undefined);
	addEntityToComponentStorage(componentStorage, entityId);
	return getEntityStructFromComponentStorage(componentStorage, entityId)!;
}

export function removeComponent(world: World, entityId: EntityId, component: Component<any>): void {
	if (!world.storage.has(component)) {
		return;
	}
	const componentStorage = world.storage.get(component);
	assert(componentStorage !== undefined);
	removeEntityFromComponentStorage(componentStorage, entityId);
}

export function* query<WithCs extends readonly Component<any>[]>(
	world: World,
	withComponents: [...WithCs],
): Iterable<{[P in keyof WithCs]: WithCs[P] extends Component<infer S> ? S : never}> {
	const entityIds: Set<EntityId> = new Set();
	for (const [, componentStorage] of world.storage) {
		for (const entityId of componentStorage.slots) {
			if (entityId === -1) {
				continue;
			}
			entityIds.add(entityId);
		}
	}
	entityLoop: for (const entityId of entityIds) {
		const structs = [];
		for (const component of  withComponents) {
			const struct = getStructForEntity(world, entityId, component);
			if (!struct) {
				continue entityLoop;
			}
			structs.push(struct);
		}
		yield structs as any;
	}
}
