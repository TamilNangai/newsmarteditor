export function ActionButton({ title, active, style, onClick, children }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                minWidth: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: active ? '#7c3aed' : 'transparent',
                color: '#e2e8f0',
                cursor: 'pointer',
                ...style,
            }}
        >
            {children}
        </button>
    )
}

export function NumberControl({ title, value, min, max, step = 1, onChange, width = '64px' }) {
    return (
        <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            style={{
                width,
                height: '32px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: '#e2e8f0',
                padding: '0 8px',
                fontSize: '12px',
                outline: 'none',
            }}
            title={title}
        />
    )
}
