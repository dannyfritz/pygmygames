type Primitive =
	| 'f32'
	| 'f64'
	| 'u32'
	;

type Slice = readonly [primitive: Primitive, length: number];

type SchemaType = Primitive | Slice;

export type Schema = Readonly<{[prop: string]: Schema | SchemaType}>;

export type Layout = {[prop: string]: [type: Primitive, offset: bytes] | Layout};

const LAYOUT_DATA = Symbol('__LAYOUT_DATA');

type LayoutTarget = Layout & {[LAYOUT_DATA]: DataView};

export type Struct<S extends Schema> = {
	-readonly [P in keyof S]: S[P] extends Primitive
		? number
		: S[P] extends Slice
		? number[]
		: S[P] extends Schema
		? Struct<S[P]>
		: never;
};

type bytes = number;

function _getPrimitiveSize(primitive: Primitive): bytes {
	switch (primitive) {
		case 'f32':
			return 4;
		case 'f64':
			return 8;
		case 'u32':
			return 4;
		default:
			throw new Error(`unknown primitive: ${primitive as unknown as string}`);
	}
}

export function getSize(schema: Schema): bytes {
	return Object.values(schema).reduce((sum, type) => {
		if (typeof type === 'string') {
			return sum + _getPrimitiveSize(type);
		}

		if (Array.isArray(type) && type.length === 2) {
			const [primitive, length] = type as [Primitive, number];
			return sum + _getPrimitiveSize(primitive) * length;
		}

		return sum + getSize(type as Schema);
	}, 0);
}

function _getLayout(
	schema: Schema,
	initialOffset = 0,
): [prelayout: Layout, size: number] {
	const layout: Layout = {};
	let size = 0;
	for (const [key, type] of Object.entries(schema)) {
		if (typeof type === 'string') {
			layout[key] = [type, initialOffset + size];
			size += _getPrimitiveSize(type);
			continue;
		}

		if (Array.isArray(type) && type.length === 2) {
			const [primitive, length] = type as [Primitive, number];
			layout[key] = {};
			for (let i = 0; i < length; i++) {
				(layout[key] as Layout)[i] = [
					primitive,
					initialOffset + size + _getPrimitiveSize(primitive) * i,
				];
			}

			size += _getPrimitiveSize(primitive) * length;
			continue;
		}

		const [_layout, _size] = _getLayout(type as Schema, initialOffset + size);
		layout[key] = _layout;
		size += _size;
		continue;
	}

	return [layout, size];
}

export function getLayout(schema: Schema): Layout {
	const [layout] = _getLayout(schema, 0);

	return layout;
}

const handler: ProxyHandler<LayoutTarget> = {
	get(target: LayoutTarget, key: string) {
		const data = target[LAYOUT_DATA];
		const value = target[key];
		if (Array.isArray(value)) {
			const [primitive, offset] = value;
			switch (primitive) {
				case 'f32':
					return data.getFloat32(offset);
				case 'f64':
					return data.getFloat64(offset);
				case 'u32':
					return data.getUint32(offset);
				default:
					throw new Error(
						`unknown primitive: ${primitive as unknown as string}`,
					);
			}
		} else {
			return _newStruct(target[key] as Layout, data);
		}
	},
	set(target: LayoutTarget, key: string, newValue: number) {
		const data = target[LAYOUT_DATA];
		const value = target[key];
		if (Array.isArray(value)) {
			const [primitive, offset] = value;
			switch (primitive) {
				case 'f32': {
					data.setFloat32(offset, newValue);
					return true;
				}
				case 'f64': {
					data.setFloat64(offset, newValue);
					return true;
				}
				case 'u32': {
					data.setUint32(offset, newValue);
					return true;
				}
				default:
					throw new Error(
						`unknown primitive: ${primitive as unknown as string}`,
					);
			}
		} else {
			return true;
		}
	},
};

const newStructCache: Map<Layout, Map<DataView, Struct<any>>> = new Map();

function _newStruct<S extends Schema>(
	layout: Layout,
	data: DataView,
): Struct<S> {
	if (newStructCache.get(layout)?.has(data)) {
		return newStructCache.get(layout)?.get(data) as Struct<S>;
	}
	return new Proxy(
		{...layout, [LAYOUT_DATA]: data},
		handler,
	) as unknown as Struct<S>;
}

export function defineStruct<S extends Schema>(
	schema: S,
): (data: DataView) => Struct<S> {
	const layout = getLayout(schema);
	const requiredSize = getSize(schema);

	return function (data: DataView): Struct<S> {
		if (data.byteLength < requiredSize) {
			throw new Error(
				`DataView provided is not large enough to contain Struct\nDataView: ${data.byteLength} bytes\nSchema: ${requiredSize} bytes`,
			);
		}

		return _newStruct<S>(layout, data);
	};
}
