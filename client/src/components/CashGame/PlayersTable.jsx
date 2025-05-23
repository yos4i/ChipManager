// PlayersTable.jsx
import React from 'react';

export default function PlayersTable({ players, onAddAmount, onSetCashOut, onEdit, onEndGame, isLocked }) {
    return (
        <div style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '10px', maxWidth: '600px', margin: '2rem auto 1rem' }}>
            <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: '1.5rem', borderBottom: '1px solid #d4af37', paddingBottom: '0.5rem' }}>
                טבלת שחקנים
            </h2>

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
                            justifyContent: 'space-evenly',
                            alignItems: 'center',
                            textAlign: 'center',
                            color: '#fff',
                            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                            direction:'rtl'
                        }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem' }}>{player.name || '-'}</h3>
                                <p style={{ margin: '0.25rem 0' }}>נכנס עם : {isBuyInValid ? `₪ ${buyIn}` : '-'}</p>
                                <p style={{ margin: '0.25rem 0' }}>סיים עם : {isCashOutDefined ? `₪ ${cashOut}` : ''}</p>
                                <p style={{
                                    margin: '0.25rem 0',
                                    color: profit !== null ? (profit >= 0 ? 'lightgreen' : 'red') : '#aaa',
                                    fontWeight: 'bold'
                                }}>
                                   מאזן : {profit !== null ? (profit >= 0 ? `${profit}₪ +` : `${Math.abs(profit)}₪ -`) : ''}

                                </p>
                            </div>

                            {!isLocked && (
                                <div style={{ display: 'flex', gap: '0.5rem'}}>
                                    <button onClick={() => onAddAmount(index)} style={buttonStyle('blue')}>כניסה חוזרת</button>
                                    <button onClick={() => onSetCashOut(index)} style={buttonStyle('green')}>סיים</button>
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
        color: '#ffffff',
        fontSize: '1rem',
        transition: 'background 0.3s'
    };

    switch (color) {
        case 'green': return { ...base, background: '#d4af37' };
        case 'blue': return { ...base, background: '#d4af37' };
        case 'gray': return { ...base, background: '#2b2929' };
        default: return base;
    }
}
