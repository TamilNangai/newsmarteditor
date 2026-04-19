import { NumberControl } from './ControlsShared'

export default function TransformControls({ transform, updateTransform }) {
    return (
        <>
            <NumberControl
                title="X (left)"
                value={transform.x}
                onChange={(e) => updateTransform('x', 'left', e.target.value, 0)}
            />

            <NumberControl
                title="Y (top)"
                value={transform.y}
                onChange={(e) => updateTransform('y', 'top', e.target.value, 0)}
            />

            <NumberControl
                title="Rotation"
                min={-360}
                max={360}
                value={transform.angle}
                onChange={(e) => updateTransform('angle', 'angle', e.target.value, 0)}
            />

            <NumberControl
                title="SkewX"
                min={-89}
                max={89}
                value={transform.skewX}
                onChange={(e) => updateTransform('skewX', 'skewX', e.target.value, 0)}
            />
        </>
    )
}
