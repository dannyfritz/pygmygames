import {
	addComponent,
	createComponent,
	createEntity,
	createWorld,
	query,
} from '@pygmygames/ecs';

const transformSchema = {
	row0: ["f32", 4],
	row1: ["f32", 4],
	row2: ["f32", 4],
	row3: ["f32", 4],
}

const positionSchema = {
	data: ["f32", 3]	
};

const rotationSchema = {
	data: ["f32", 3]	
};

const velocitySchema = {
	data: ["f32", 3]	
};


function simpleInsert() {
	console.time('simpleInsert');
	const world = createWorld();
	const transform = createComponent(transformSchema);
	const position = createComponent(positionSchema); 
	const rotation = createComponent(rotationSchema);
	const velocity = createComponent(velocitySchema);
	for (let i = 0; i < 10_000; i++) {
		const entity = createEntity(world);
		const t = addComponent(world, entity, transform);
		t.row0[0] = 1;
		t.row0[1] = 0;
		t.row0[2] = 0;
		t.row0[3] = 0;
		t.row1[0] = 0;
		t.row1[1] = 1;
		t.row1[2] = 0;
		t.row1[3] = 0;
		t.row2[0] = 0;
		t.row2[1] = 0;
		t.row2[2] = 1;
		t.row2[3] = 0;
		t.row3[0] = 0;
		t.row3[1] = 0;
		t.row3[2] = 0;
		t.row3[3] = 1;
		const p = addComponent(world, entity, position);
		p.data[0] = 1;
		p.data[1] = 0;
		p.data[2] = 0;
		const r = addComponent(world, entity, rotation);
		r.data[0] = 1;
		r.data[1] = 0;
		r.data[2] = 0;
		const v = addComponent(world, entity, velocity);
		v.data[0] = 1;
		v.data[1] = 0;
		v.data[2] = 0;
	}
	console.timeEnd('simpleInsert');
}

function simpleIter() {
	const world = createWorld();
	const transform = createComponent(transformSchema);
	const position = createComponent(positionSchema); 
	const rotation = createComponent(rotationSchema);
	const velocity = createComponent(velocitySchema);
	for (let i = 0; i < 10_000; i++) {
		const entity = createEntity(world);
		const t = addComponent(world, entity, transform);
		t.row0[0] = 1;
		t.row0[1] = 0;
		t.row0[2] = 0;
		t.row0[3] = 0;
		t.row1[0] = 0;
		t.row1[1] = 1;
		t.row1[2] = 0;
		t.row1[3] = 0;
		t.row2[0] = 0;
		t.row2[1] = 0;
		t.row2[2] = 1;
		t.row2[3] = 0;
		t.row3[0] = 0;
		t.row3[1] = 0;
		t.row3[2] = 0;
		t.row3[3] = 1;
		const p = addComponent(world, entity, position);
		p.data[0] = 1;
		p.data[1] = 0;
		p.data[2] = 0;
		const r = addComponent(world, entity, rotation);
		r.data[0] = 1;
		r.data[1] = 0;
		r.data[2] = 0;
		const v = addComponent(world, entity, velocity);
		v.data[0] = 1;
		v.data[1] = 0;
		v.data[2] = 0;
	}
	console.time('simpleIter');
	for (const [v, p] of query(world, [velocity, position])) {
		p.data[0] += v.data[0];
	}
	console.timeEnd('simpleIter');
}

// simpleInsert();
simpleIter();
