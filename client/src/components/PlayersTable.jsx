// PlayersTable.jsx - גרסה מתוקנת בלי CSS חיצוני

export default function PlayersTable({ players, onAddAmount, onSetCashOut, onEdit, onEndGame, isLocked }) {
    return (
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', marginTop: '1rem', direction: 'rtl' }}>
            <h3 style={{ marginBottom: '1rem', color: '#000' }}>טבלת שחקנים</h3>

            {players.length > 0 ? (
                <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', color: '#000' }}>
                    <thead>
                    <tr>
                        <th>שם</th>
                        <th>Buy-in</th>
                        <th>פעולות</th>
                        <th>סיים עם</th>
                        <th>רווח/הפסד</th>
                    </tr>
                    </thead>
                    <tbody>
                    {players.map((player, index) => {
                        const buyIn = Number(player.buyIn);
                        const cashOut = player.cashOut;

                        const isCashOutDefined = typeof cashOut === 'number' && !isNaN(cashOut);
                        const isBuyInValid = typeof buyIn === 'number' && !isNaN(buyIn);

                        const profit = isCashOutDefined && isBuyInValid ? cashOut - buyIn : null;

                        return (
                            <tr key={index}>
                                <td>{player.name || '-'}</td>
                                <td>{isBuyInValid ? `₪${buyIn}` : '-'}</td>
                                <td>
                                    <button
                                        style={{ margin: '2px', padding: '6px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
                                        onClick={() => onAddAmount(index, 50)}
                                    >
                                        + ₪50
                                    </button>
                                    <button
                                        style={{ margin: '2px', padding: '6px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px' }}
                                        onClick={() => onSetCashOut(index)}
                                    >
                                        סיום 💎
                                    </button>
                                    <button
                                        style={{ margin: '2px', padding: '6px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px' }}
                                        onClick={() => onEdit(index)}
                                    >
                                        ערוך ✏️
                                    </button>
                                </td>
                                <td>{isCashOutDefined ? `₪${cashOut}` : '-'}</td>
                                <td>
                                    {profit !== null ? (
                                        <span style={{ color: profit >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                        {profit >= 0 ? `+₪${profit}` : `₪${profit}`}
                      </span>
                                    ) : '-'}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            ) : (
                <p style={{ textAlign: 'center', marginTop: '1rem', color: '#000' }}>לא נוספו שחקנים עדיין</p>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                    disabled={isLocked}
                    onClick={onEndGame}
                    style={{
                        background: isLocked ? '#bbb' : '#4CAF50',
                        color: '#fff',
                        padding: '10px 20px',
                        fontSize: '16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isLocked ? 'default' : 'pointer'
                    }}
                >
                    {isLocked ? "המשחק נעול לעריכה" : "סיים משחק"}
                </button>
            </div>
        </div>
    );
}
