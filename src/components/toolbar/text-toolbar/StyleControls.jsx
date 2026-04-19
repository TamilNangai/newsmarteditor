import { ActionButton } from './ControlsShared'

export default function StyleControls({
    selectedText,
    isBold,
    isItalic,
    isUnderline,
    isStrike,
    redaction,
    applyTextStyle,
    toggleRedaction,
    cycleRedactionMode,
}) {
    return (
        <>
            <ActionButton
                title="Bold"
                active={isBold}
                style={{ fontWeight: 700 }}
                onClick={() => applyTextStyle({ fontWeight: isBold ? 'normal' : 'bold' })}
            >
                B
            </ActionButton>

            <ActionButton
                title="Italic"
                active={isItalic}
                style={{ fontStyle: 'italic' }}
                onClick={() => applyTextStyle({ fontStyle: isItalic ? 'normal' : 'italic' })}
            >
                I
            </ActionButton>

            <ActionButton
                title="Underline"
                active={isUnderline}
                style={{ textDecoration: 'underline' }}
                onClick={() => applyTextStyle({ underline: !isUnderline })}
            >
                U
            </ActionButton>

            <ActionButton
                title="Strikethrough"
                active={isStrike}
                style={{ textDecoration: 'line-through' }}
                onClick={() => applyTextStyle({ linethrough: !isStrike })}
            >
                S
            </ActionButton>

            <ActionButton
                title="Flip X"
                active={!!selectedText.flipX}
                onClick={() => applyTextStyle({ flipX: !selectedText.flipX })}
            >
                FX
            </ActionButton>

            <ActionButton
                title="Flip Y"
                active={!!selectedText.flipY}
                onClick={() => applyTextStyle({ flipY: !selectedText.flipY })}
            >
                FY
            </ActionButton>

            <ActionButton
                title="Toggle Redaction"
                active={redaction.enabled}
                onClick={() => toggleRedaction(!redaction.enabled, redaction.mode)}
            >
                Redact
            </ActionButton>

            <ActionButton
                title="Switch Redaction Mode"
                active={false}
                onClick={cycleRedactionMode}
            >
                {redaction.mode === 'black' ? 'Black' : 'Blur'}
            </ActionButton>
        </>
    )
}
