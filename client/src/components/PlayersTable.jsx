// PlayersTable.jsx - פתרון סופי: אתחול ערכים והצגה בטוחה ללא NaN/undefined
export default function PlayersTable({ players, onAddAmount, onSetCashOut, onEdit, onEndGame, isLocked }) {
  return (
    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>טבלת שחקנים</h3>

      {players.length > 0 ? (
        <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
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
                    <button disabled={isLocked} onClick={() => onAddAmount(index)}>+ ₪50</button>
                    <button disabled={isLocked} onClick={() => onSetCashOut(index)}>💸 סיום</button>
                    <button disabled={isLocked} onClick={() => onEdit(index)}>✏️ ערוך</button>
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
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>לא נוספו שחקנים עדיין</p>
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