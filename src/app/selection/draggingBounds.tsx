import {useRef, useLayoutEffect} from 'react';
import { Box2d, VecLike, toDomPrecision} from '@tldraw/tldraw'

export function useTransform(
	ref: React.RefObject<HTMLElement | SVGElement>,
	x?: number,
	y?: number,
	scale?: number,
	rotate?: number,
	additionalOffset?: VecLike
) {
	useLayoutEffect(() => {
		const elm = ref.current
		if (!elm) return
		if (x === undefined) return

		let trans = `translate(${x}px, ${y}px)`
		if (scale !== undefined) {
			trans += ` scale(${scale})`
		}
		if (rotate !== undefined) {
			trans += ` rotate(${rotate}rad)`
		}
		if (additionalOffset) {
			trans += ` translate(${additionalOffset.x}px, ${additionalOffset.y}px)`
		}
		elm.style.transform = trans
	})
}

/** @public */
export type DraggingBoundsComponent = React.ComponentType<{
	bounds: Box2d
	rotation: number
}>

/** @public */
export const DraggingBounds: DraggingBoundsComponent = ({
	bounds,
	rotation,
}) => {
	const rDiv = useRef<HTMLDivElement>(null)
	useTransform(rDiv, bounds.x - 50, bounds.y - 50, 1, rotation)

	console.log("Rendering me!")
	useLayoutEffect(() => {
		const div = rDiv.current
		if (!div) return
		div.style.width = toDomPrecision(Math.max(1, bounds.width + 100)) + 'px'
		div.style.height = toDomPrecision(Math.max(1, bounds.height + 100)) + 'px'
	}, [bounds.width, bounds.height])

	return <div ref={rDiv} className="twofish-dragging__bg" draggable={false} />
}
