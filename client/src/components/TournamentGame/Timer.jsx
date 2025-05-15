import React from 'react';
import ProgressBar from './ProgressBar';

export default function Timer({
                                  secondsLeft,
                                  totalSecondsPassed,
                                  currentStage,
                                  isPaused,
                                  togglePause,
                                  jumpToPosition,
                                  getStageProgress,
                                  formatTime,
                                  message
                              }) {
    return (
        <div style={{
            flex: '3',
            minWidth: '0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center'
        }}>
            {/* השעון הגדול */}
            <div
                style={{
                    fontSize: 'clamp(6rem, 12vw, 16rem)',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    textAlign: 'center',
                    maxWidth: '100%',
                    overflowWrap: 'break-word',
                }}
            >
                {formatTime(secondsLeft)}
            </div>


            {/* בליינדים */}
            <div style={{ fontSize: '6.5rem', fontWeight: 'bold', color: '#d4af37', WebkitTextStroke: '0.5px white'}}>
                {currentStage && !currentStage.break && typeof currentStage.smallBlind === 'number'
                    ? `Small ${currentStage.smallBlind}`
                    : ' הפסקה'}
            </div>
            <div style={{ fontSize: '6.5rem', fontWeight: 'bold', color: '#d4af37', WebkitTextStroke: '0.5px white' }}>
                {currentStage && !currentStage.break ? `Big ${currentStage.bigBlind}` : ''}
            </div>

            {/* עצור / הפעלה */}
            <button onClick={togglePause} style={{
                background: '#d4af37', color: '#000', border: 'none', padding: '0.5rem 1rem',
                borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
            }}>
                {isPaused ? ' המשך' : ' עצור'}
            </button>

            {/* פס זמן */}
            <ProgressBar progress={getStageProgress()} onClick={jumpToPosition} />


            {/* זמן כולל */}
            <div style={{ fontSize: '1.2rem', color: '#aaa' }}>
                זמן כולל עבר: {formatTime(totalSecondsPassed)}
            </div>

            {/* הודעה */}
            {message && (
                <div style={{ backgroundColor: '#1a1a1a', padding: '0.5rem 1rem', borderRadius: '5px', color: '#d4af37' }}>
                    {message}
                </div>
            )}
        </div>
    );
}