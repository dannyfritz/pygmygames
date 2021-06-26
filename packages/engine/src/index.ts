import * as Ecs from '../../ecs/src/ecs';

console.log('ENGINE???');

export interface State {
	ecs: Ecs.State;
}

export const createState = (): State => {
	return {
		ecs: Ecs.create()
	};
};

export const tick = (state: State, _dt: number): State => {
	return state;
};

export const render = (state: State): void => {
	for (const [entity, drawable] of Ecs.query(state.ecs, [Ecs.Entity])) {
	// 	console.log(drawable);
	// 	renderer.pixiRenderer.render();
	}
};
