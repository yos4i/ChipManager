import React from 'react';

export default function PlayersTable({ players, onAddAmount, onSetCashOut, onEdit, onEndGame, isLocked }) {
    return (
        <div style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '10px', marginTop: '2rem' }}>
            <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: '1.5rem' }}>טבלת שחקנים</h2>

            {players.length > 0 ? (
                players.map((player, index) => {
                    const buyIn = Number(player.buyIn);
                    const cashOut = player.cashOut;

                    const isCashOutDefined = typeof cashOut === 'number' && !isNaN(cashOut);
                    const isBuyInValid = typeof buyIn === 'number' && !isNaN(buyIn);

                    const profit = isCashOutDefined && isBuyInValid ? cashOut - buyIn : null;

                    return (
                        <div key={index} style={{
                            background: '#111',
                            border: '1px solid #d4af37',
                            borderRadius: '10px',
                            padding: '1rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: '#fff'
                        }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem' }}>{player.name || '-'}</h3>
                                <p style={{ margin: '0.25rem 0' }}>Buy-in: {isBuyInValid ? `₪${buyIn}` : '-'}</p>
                                <p style={{ margin: '0.25rem 0' }}>Cash-out: {isCashOutDefined ? `₪${cashOut}` : '-'}</p>
                                <p style={{
                                    margin: '0.25rem 0',
                                    color: profit !== null ? (profit >= 0 ? 'lightgreen' : 'red') : '#aaa',
                                    fontWeight: 'bold'
                                }}>
                                    {profit !== null ? (profit >= 0 ? `+₪${profit}` : `₪${profit}`) : '-'}
                                </p>
                            </div>

                            {!isLocked && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => onAddAmount(index)} style={buttonStyle('blue')}>💵</button>
                                    <button onClick={() => onSetCashOut(index)} style={buttonStyle('green')}>🏁</button>
                                    <button onClick={() => onEdit(index)} style={buttonStyle('gray')}>✏️</button>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <p style={{ color: '#ccc', textAlign: 'center' }}>לא נוספו שחקנים עדיין</p>
            )}

            {!isLocked && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        onClick={onEndGame}
                        style={{
                            background: '#4CAF50',
                            color: '#fff',
                            padding: '10px 20px',
                            fontSize: '16px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        סיים משחק
                    </button>
                </div>
            )}
        </div>
    );
}

function buttonStyle(color) {
    const base = {
        padding: '0.5rem 0.75rem',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        color: '#fff',
        fontSize: '1rem'
    };

    switch (color) {
        case 'green': return { ...base, background: '#4CAF50' };
        case 'blue': return { ...base, background: '#2196F3' };
        case 'gray': return { ...base, background: '#555' };
        default: return base;
    }
}