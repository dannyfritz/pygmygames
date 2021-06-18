import React, {useRef} from 'react';
import * as engine from '@pygmygames/engine';
import './app.css';
import {useAnimationFrame} from './use-animation-frame';

const App = () => {
	const canvas = useRef<HTMLCanvasElement>(null);
	const state = useRef<engine.State>(engine.createState());
	useAnimationFrame((dt: number) => {
		state.current = engine.tick(state.current, dt);
		if (canvas.current) {
			engine.render(state.current, canvas.current);
		}
	});
	return (
		<div className="App">
			<canvas ref={canvas}/>
		</div>
	);
};

export default App;
