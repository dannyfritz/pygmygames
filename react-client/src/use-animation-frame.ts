import {useCallback, useEffect, useRef} from 'react';

export const useAnimationFrame = (callback: (dt: number) => void) => {
	const refRAF = useRef<number>();
	const refPreviousTime = useRef<number>();

	const animate = useCallback(
		(currentTime: number) => {
			if (refPreviousTime.current !== undefined) {
				const dt = currentTime - refPreviousTime.current;
				callback(dt);
			}

			refPreviousTime.current = currentTime;
			refRAF.current = requestAnimationFrame(animate);
		}, [callback]
	);

	useEffect(
		() => {
			refRAF.current = requestAnimationFrame(animate);
			return () => {
				if (refRAF.current) {
					cancelAnimationFrame(refRAF.current);
				}
			};
		}, [animate]
	);
};
