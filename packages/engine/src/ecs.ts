// import assert from 'assert';

export type EntityId = number

export type State = {
	readonly components: readonly Component<unknown>[],
	data: Map<Component<unknown>, Map<EntityId, any>>,
}

export const create =
	<C extends readonly Component<unknown>[]>
	(components: C)
	: State => {
		return {
			components,
			data: new Map<Component<unknown>, Map<EntityId, any>>(),
		};
	};

export type Component<T> = T & { __brand: "Component" }

export type Entity = Component<number>;
export const Entity = Symbol() as unknown as Entity;

export function* query
	<T extends readonly Component<unknown>[]>
	(state: State, components: [...T])
	: Iterable<{ [P in keyof T]: T[P] extends Component<infer U> ? U : never}> {
		yield [] as any;
	}
