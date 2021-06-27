import type {Schema, Struct} from '@pygmygames/struct';
import {defineStruct} from '@pygmygames/struct';

type EntityId = number;

type Component<S extends Schema> = Readonly<{
	create: (data: DataView) => Struct<S>;
	name: string;
	schema: S;
}>;

type Storage<C extends Array<Component<any>>> = {
	components: C;
	entityPool: Map<EntityId, {active: boolean}>;
	buffer: ArrayBuffer;
	getIterator: Iterator<C>;
};

export type State = {
	components: Map<string, boolean>;
	archetypes: Array<[Set<Component<any>>, Storage<any>]>;
};

export function registerComponent<S extends Schema>(
	state: State,
	name: string,
	schema: S,
): Component<S> {
	if (state.components.has(name)) {
		console.warn(
			`Cannot register component which has already been registered: "${name}"`,
		);
	} else {
		state.components.set(name, true);
	}

	return {
		schema,
		name,
		create: defineStruct(schema),
	} as const;
}

export function create(): State {
	return {
		archetypes: new Map(),
	};
}

export function* query<T extends Array<Component<any>>>(
	_state: State,
	_components: [...T],
): Iterable<{[P in keyof T]: T[P] extends Component<infer U> ? U : never}> {
	yield [] as any;
}
