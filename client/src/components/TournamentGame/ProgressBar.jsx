import React from 'react';

export default function ProgressBar({ progress, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                width: '80%',
                maxWidth: '600px',
                height: '10px',
                backgroundColor: '#333',
                borderRadius: '5px',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative'
            }}
        >
            <div
                style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#d4af37',
                    transition: 'width 0.5s linear'
                }}
            ></div>
        </div>
    );
}

