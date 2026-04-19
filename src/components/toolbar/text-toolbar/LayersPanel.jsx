import { ActionButton } from './ControlsShared'

export default function LayersPanel({ applyLayer }) {
    return (
        <>
            <ActionButton
                title="Bring To Front"
                onClick={() => applyLayer('front')}
            >
                Top
            </ActionButton>

            <ActionButton
                title="Send To Back"
                onClick={() => applyLayer('back')}
            >
                Bot
            </ActionButton>

            <ActionButton
                title="Move Forward"
                onClick={() => applyLayer('forward')}
            >
                +1
            </ActionButton>

            <ActionButton
                title="Move Backward"
                onClick={() => applyLayer('backward')}
            >
                -1
            </ActionButton>
        </>
    )
}
