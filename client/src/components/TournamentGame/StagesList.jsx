import React from 'react';

export default function StagesList({
                                       stages,
                                       currentStageIndex,
                                       lastClickedIndex,
                                       setLastClickedIndex,
                                       startEditStage,
                                       buttonStyle
                                   }) {
    return (
        <div
            style={{
                flex: '1.5',
                minWidth: '0',
                background: '#1a1a1a',
                borderRadius: '10px',
                padding: '1rem',
                textAlign: 'center',
                height: '600px',
                overflowY: 'auto'
            }}
        >
            {stages.map((stage, idx) => (
                <div
                    key={idx}
                    onClick={() => {
                        setLastClickedIndex(idx);
                        startEditStage(idx);
                    }}
                    style={{
                        background:
                            currentStageIndex === idx
                                ? '#d4af37'
                                : lastClickedIndex === idx
                                    ? '#444'
                                    : '#2a2a2a',
                        color: currentStageIndex === idx ? '#000' : '#fff',
                        margin: '0.5rem 0',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        direction: 'rtl',
                        cursor: 'pointer',
                        maxWidth: '100%',
                        minHeight: '75px'
                    }}
                >
                    <div>
                        {stage.break
                            ? '☕ הפסקה'
                            : `בליינדים ${stage.smallBlind}/${stage.bigBlind}${
                                stage.ante > 0 ? ` (אנטה ${stage.ante})` : ''
                            }`}
                    </div>
                    <div>{!stage.break && `${stage.duration} דקות`}</div>
                </div>
            ))}

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => startEditStage(null)}
                        style={buttonStyle}
                    >
                        הוסף שלב
                    </button>

                    <button
                        onClick={() => {
                            if (lastClickedIndex !== null) {
                                startEditStage(lastClickedIndex);
                            }
                        }}
                        style={buttonStyle}
                    >
                        ערוך שלב
                    </button>
                </div>
            </div>
        </div>
    );
}
