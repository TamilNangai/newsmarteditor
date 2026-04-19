import { ActionButton, NumberControl } from './ControlsShared'

export default function EffectsPanel({
    shadow,
    reflection,
    shadow3D,
    applyShadow,
    updateShadow,
    applyReflection,
    updateReflection,
    apply3DShadow,
    update3DShadow,
}) {
    return (
        <>
            <ActionButton
                title="Toggle Shadow"
                active={shadow.enabled}
                onClick={() => applyShadow({ ...shadow, enabled: !shadow.enabled })}
            >
                Sh
            </ActionButton>

            <input
                type="color"
                value={shadow.color}
                onChange={(e) => applyShadow({ ...shadow, color: e.target.value })}
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    cursor: shadow.enabled ? 'pointer' : 'not-allowed',
                    opacity: shadow.enabled ? 1 : 0.5,
                }}
                title="Shadow Color"
                disabled={!shadow.enabled}
            />

            <NumberControl
                title="Shadow Blur"
                min={0}
                max={100}
                value={shadow.blur}
                onChange={(e) => updateShadow('blur', e.target.value, 0)}
                width="60px"
            />

            <NumberControl
                title="Shadow OffsetX"
                min={-200}
                max={200}
                value={shadow.offsetX}
                onChange={(e) => updateShadow('offsetX', e.target.value, 0)}
                width="60px"
            />

            <NumberControl
                title="Shadow OffsetY"
                min={-200}
                max={200}
                value={shadow.offsetY}
                onChange={(e) => updateShadow('offsetY', e.target.value, 0)}
                width="60px"
            />

            <ActionButton
                title="Toggle Reflection"
                active={reflection.enabled}
                onClick={() => applyReflection({ ...reflection, enabled: !reflection.enabled })}
            >
                Refl
            </ActionButton>

            <NumberControl
                title="Reflection Opacity"
                min={0}
                max={1}
                step={0.01}
                width="62px"
                value={reflection.opacity}
                onChange={(e) => updateReflection('opacity', e.target.value, 0.35)}
            />

            <NumberControl
                title="Reflection Offset Y"
                min={-500}
                max={500}
                width="68px"
                value={reflection.offsetY}
                onChange={(e) => updateReflection('offsetY', e.target.value, 24)}
            />

            <ActionButton
                title="Toggle 3D Shadow"
                active={shadow3D.enabled}
                onClick={() => apply3DShadow({ ...shadow3D, enabled: !shadow3D.enabled })}
            >
                3D
            </ActionButton>

            <NumberControl
                title="3D Shadow Angle"
                min={-180}
                max={180}
                width="64px"
                value={shadow3D.angle}
                onChange={(e) => update3DShadow('angle', e.target.value, 45)}
            />

            <NumberControl
                title="3D Shadow Depth"
                min={0}
                max={24}
                width="58px"
                value={shadow3D.depth}
                onChange={(e) => update3DShadow('depth', e.target.value, 12)}
            />

            <NumberControl
                title="3D Shadow Opacity"
                min={0}
                max={1}
                step={0.01}
                width="62px"
                value={shadow3D.opacity}
                onChange={(e) => update3DShadow('opacity', e.target.value, 0.35)}
            />
        </>
    )
}
