import React from 'react';

export default function PlayersList({ players, toggleElimination }) {
    return (
        <>
            <h3>שחקנים</h3>
            {players
                .filter(p => p.name?.trim() && p.id) // רק שחקנים עם שם ומזהה
                .map(player => (
                    <div
                        key={player.id}
                        onClick={() => {
                            console.log('🖱️ לחיצה על שחקן:', player);
                            if (!player.id) return;
                            toggleElimination(player.id);
                        }}
                        style={{
                            background: player.eliminated ? '#880e4f' : '#2a2a2a',
                            margin: '0.5rem 0',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        {player.image ? (
                            <img
                                src={player.image}
                                alt="avatar"
                                onError={(e) => { e.target.style.display = 'none'; }}
                                style={{
                                    width: '75px',
                                    height: '75px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: '#d4af37',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    color: '#0e0e0e',
                                    fontWeight: 'bold'
                                }}
                            >
                                {player.name?.[0] || '?'}
                            </div>
                        )}
                        <div style={{ fontSize: '1.2rem' }}>
                            {player.name} {player.eliminated && '🛑'}
                        </div>
                    </div>
                ))}
        </>
    );
}
