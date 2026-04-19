import { FONTS } from '../../../utils/constants'
import { ActionButton, NumberControl } from './ControlsShared'

export default function FontControls({
    selectedText,
    typography,
    outline,
    applyTextStyle,
    updateTypography,
    applyOutline,
    updateOutline,
}) {
    return (
        <>
            <select
                value={selectedText.fontFamily ?? 'Arial'}
                onChange={(e) => applyTextStyle({ fontFamily: e.target.value })}
                style={{
                    height: '32px',
                    minWidth: '130px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e2e8f0',
                    padding: '0 8px',
                    fontSize: '12px',
                    outline: 'none',
                }}
                title="Font Family"
            >
                {FONTS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                ))}
            </select>

            <NumberControl
                title="Font Size"
                min={8}
                max={200}
                value={selectedText.fontSize ?? 32}
                onChange={(e) => applyTextStyle({ fontSize: Number(e.target.value) || 32 })}
            />

            <NumberControl
                title="Opacity"
                min={0}
                max={1}
                step={0.01}
                width="62px"
                value={typography.opacity}
                onChange={(e) => updateTypography('opacity', 'opacity', e.target.value, 1)}
            />

            <NumberControl
                title="Letter Spacing"
                min={-1000}
                max={1000}
                width="72px"
                value={typography.charSpacing}
                onChange={(e) => updateTypography('charSpacing', 'charSpacing', e.target.value, 0)}
            />

            <select
                value={typography.fontWeight}
                onChange={(e) => updateTypography('fontWeight', 'fontWeight', e.target.value, 400)}
                style={{
                    height: '32px',
                    minWidth: '76px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e2e8f0',
                    padding: '0 8px',
                    fontSize: '12px',
                    outline: 'none',
                }}
                title="Font Weight"
            >
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(weight => (
                    <option key={weight} value={weight}>{weight}</option>
                ))}
            </select>

            <input
                type="color"
                value={selectedText.fill ?? '#ffffff'}
                onChange={(e) => applyTextStyle({ fill: e.target.value })}
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    cursor: 'pointer',
                }}
                title="Text Color"
            />

            <input
                type="color"
                value={outline.stroke}
                onChange={(e) => applyOutline({ ...outline, stroke: e.target.value })}
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    cursor: 'pointer',
                }}
                title="Outline Color"
            />

            <NumberControl
                title="Outline Width"
                min={0}
                max={20}
                value={outline.strokeWidth}
                onChange={(e) => updateOutline('strokeWidth', e.target.value, 0)}
                width="62px"
            />

            <ActionButton
                title="Dashed Outline"
                active={outline.dashed}
                onClick={() => applyOutline({ ...outline, dashed: !outline.dashed })}
            >
                Dash
            </ActionButton>
        </>
    )
}
