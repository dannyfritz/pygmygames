type Primitive =
	| 'uint32'
	| 'f64'

type Slice =
	| readonly [primitive: Primitive, length: number]

type SchemaType =
	| Primitive
	| Slice

type Schema = {
	readonly [key: string]: Schema | SchemaType
};

type Layout = {[key: string]: [type: Primitive, offset: bytes] | Layout}

const LAYOUT_DATA = Symbol('__LAYOUT_DATA');

type LayoutTarget = Layout & { [LAYOUT_DATA]: DataView }

type Struct<S extends Schema> = {
	-readonly [P in keyof S]:
		S[P] extends Primitive ? number
		: S[P] extends Slice ? number[]
		: S[P] extends Schema ? Struct<S[P]>
		: never
}

type bytes = number;

function _getPrimitiveSize(primitive: Primitive): bytes {
	switch(primitive) {
		case 'f64': return 8;
		case 'uint32': return 4;
	}
}

function getSize(schema: Schema): bytes {
	return Object.values(schema).reduce((sum, type) => {
		if (typeof type === 'string') {
			return sum + _getPrimitiveSize(type);
		}
		else if (Array.isArray(type) && type.length === 2) {
			const [primitive, length] = type;
			return sum + _getPrimitiveSize(primitive) * length;
		}
		else {
			return sum + getSize(type as Schema);
		}
	}, 0);
}

function _getLayout(schema: Schema, initialOffset: number = 0): [prelayout: Layout, size: number] {
	return Object.entries(schema).reduce(([layout, size], [key, type]) => {
		if (typeof type === 'string') {
			layout[key] = [type, initialOffset + size]
			return [layout, size + _getPrimitiveSize(type)];
		}
		else if (Array.isArray(type) && type.length === 2) {
			const [primitive, length] = type;
			layout[key] = {};
			for (let i = 0; i < length; i++) {
				layout[key][i] = [primitive, initialOffset + size + _getPrimitiveSize(primitive) * i];
			}
			return [layout, size + _getPrimitiveSize(primitive) * length];
		}
		else {
			const [_layout, _size] = _getLayout(type as Schema, initialOffset + size);
			layout[key] = _layout;
			return [layout, size + _size];
		}
	}, [{}, 0] as [Layout, number]);
}

function getLayout(schema: Schema): Layout {
	const [layout, _size] = _getLayout(schema, 0);
	return layout;
}

const handler = {
	get: function (target: LayoutTarget, key: string) {
		const data = target[LAYOUT_DATA];
		const value = target[key];
		if (value instanceof Array) {
			const [primitive, offset] = value;
			switch(primitive) {
				case 'uint32': return data.getUint32(offset);
				case 'f64': return data.getFloat64(offset);
				default: throw new Error(`unknown primitive: ${primitive}`);
			}
		}
		else {
			return _newStruct(target[key] as Layout, data);
		}
	},
	set: function (target: LayoutTarget, key: string, newValue: any) {
		const data = target[LAYOUT_DATA];
		const value = target[key];
		if (value instanceof Array) {
			const [primitive, offset] = value;
			switch(primitive) {
				case 'uint32': {
					data.setUint32(offset, newValue);
					return true;
				}
				case 'f64': {
					data.setFloat64(offset, newValue);
					return true;
				}
				default: throw new Error(`unknown primitive: ${primitive}`);
			}
		}
		else {
			return _newStruct(target[key] as Layout, data);
		}
	}
} as ProxyHandler<LayoutTarget>;

function _newStruct<S extends Schema>(layout: Layout, data: DataView): Struct<S> {
	return new Proxy({ ...layout, [LAYOUT_DATA]: data }, handler) as unknown as Struct<S>;
}

export function defineStruct<S extends Schema>(schema: S): (data: DataView) => Struct<S> {
	const layout = getLayout(schema);
	const requiredSize = getSize(schema);
	return function (data: DataView): Struct<S> {
		if (data.byteLength < requiredSize) {
			throw new Error('DataView provided is not large enough to contains Struct');
		}
		return _newStruct<S>(layout, data);
	};
}

/*
	Example Usage
*/
const DrawableSchema = {
	spriteId: 'uint32',
	turd: ['uint32', 4],
	pos: {
		x: 'f64',
		y: 'f64',
	},
} as const;

console.log('getSize()', getSize(DrawableSchema));
console.log('getLayout()', getLayout(DrawableSchema));
const DrawableStruct = defineStruct(DrawableSchema);
const drawable = DrawableStruct(new DataView(new ArrayBuffer(48), 0));
console.log('drawable.spriteId', drawable.spriteId);
console.log('drawable.pos.x', drawable.pos.x);
console.log('drawable.pos.y', drawable.pos.y);
console.log('drawable.turd[0]', drawable.turd[0]);
console.log('drawable.turd[1]', drawable.turd[1]);
console.log('drawable.turd[2]', drawable.turd[2]);
console.log('drawable.turd[3]', drawable.turd[3]);

console.log('');

drawable.spriteId = 5;
drawable.turd[1] = 128;
drawable.turd[2] = 0b1000;

console.log('drawable.spriteId', drawable.spriteId);
console.log('drawable.pos.x', drawable.pos.x);
console.log('drawable.pos.y', drawable.pos.y);
console.log('drawable.turd[0]', drawable.turd[0]);
console.log('drawable.turd[1]', drawable.turd[1]);
console.log('drawable.turd[2]', drawable.turd[2]);
console.log('drawable.turd[3]', drawable.turd[3]);
