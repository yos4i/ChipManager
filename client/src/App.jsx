// App.jsx - גרסה מתוקנת: שמירה עם update במקום set למניעת דריסה של locked
import React, { useState, useEffect } from 'react';
import {
  database,
  ref,
  set,
  onValue,
  update,
  createRoom,
  isRoomOwner
} from './firebase';
import AddPlayerForm from "./components/AddPlayerForm";
import PlayersTable from "./components/PlayersTable";
import HistoryList from "./components/HistoryList";
import Lobby from "./components/Lobby";
import Home from "./components/Home";

function App() {
  const [players, setPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [summaryLines, setSummaryLines] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [roomId, setRoomId] = useState(localStorage.getItem('roomId') || '');
  const [isLocked, setIsLocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const handleRoomSelect = async (selectedRoomId) => {
    localStorage.setItem('roomId', selectedRoomId);
    setRoomId(selectedRoomId);
  };

  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(database, `rooms/${roomId}`);

    onValue(roomRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        const newRoomId = await createRoom();
        setRoomId(newRoomId);
        return;
      }
      setPlayers(data.players || []);
      setHistory(data.history || []);
      setSummaryLines(data.summaryLines || []);
      setIsLocked(data.locked || false);

      const ownerStatus = await isRoomOwner(roomId);
      setIsOwner(ownerStatus);

      setInitialLoadDone(true);
    });
  }, [roomId]);

  useEffect(() => {
    if (initialLoadDone && roomId && isOwner && !isLocked) {
      update(ref(database, `rooms/${roomId}`), {
        players,
        history,
        summaryLines
      });
    }
  }, [players, history, initialLoadDone, roomId, isLocked, summaryLines, isOwner]);

  const logAction = (text) => {
    const now = new Date();
    const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    setHistory(prev => [`${time} - ${text}`, ...prev]);
  };

  const handleAddPlayer = (name, buyIn) => {
    if (!isOwner || isLocked) return;
    setPlayers([...players, { name, buyIn: parseInt(buyIn), cashOut: null }]);
    logAction(`${name} נכנס עם ₪${buyIn}`);
  };

  const addAmount = (index) => {
    if (!isOwner || isLocked) return;
    const updated = [...players];
    updated[index].buyIn += 50;
    logAction(`${updated[index].name} הוסיף ₪50`);
    setPlayers(updated);
  };

  const setCashOut = (index) => {
    if (!isOwner || isLocked) return;
    const value = prompt('כמה כסף סיים איתו?');
    const amount = parseInt(value);
    if (isNaN(amount)) return;
    const updated = [...players];
    updated[index].cashOut = amount;
    logAction(`${updated[index].name} סיים עם ₪${amount}`);
    setPlayers(updated);
  };

  const editPlayer = (index) => {
    if (!isOwner || isLocked) return;
    const name = prompt('שם חדש:', players[index].name);
    const buyIn = prompt('סכום כניסה חדש:', players[index].buyIn);
    if (!name || isNaN(parseInt(buyIn))) return;
    const updated = [...players];
    updated[index].name = name;
    updated[index].buyIn = parseInt(buyIn);
    logAction(`${players[index].name} עודכן לשם ${name} וסכום ₪${buyIn}`);
    setPlayers(updated);
  };

  const endGame = () => {
    if (!isOwner || isLocked) return;
    const balances = players.map(p => ({
      name: p.name,
      diff: (p.cashOut || 0) - p.buyIn
    }));

    const debtors = balances.filter(p => p.diff < 0).sort((a, b) => a.diff - b.diff);
    const creditors = balances.filter(p => p.diff > 0).sort((a, b) => b.diff - a.diff);

    const lines = [];
    while (debtors.length && creditors.length) {
      const d = debtors[0];
      const c = creditors[0];
      const amount = Math.min(-d.diff, c.diff);

      lines.push(`${d.name} ישלם ₪${amount} ל-${c.name}`);

      d.diff += amount;
      c.diff -= amount;

      if (d.diff === 0) debtors.shift();
      if (c.diff === 0) creditors.shift();
    }

    setSummaryLines(lines);
    logAction('המשחק הסתיים');

    update(ref(database, `rooms/${roomId}`), {
      locked: true,
      summaryLines: lines
    });

    setTimeout(() => {
      localStorage.removeItem('roomId');
      setRoomId('');
    }, 3000);
  };

  if (!roomId) return <Lobby onSelectRoom={handleRoomSelect} />;
  if (!isOwner && !isGuest) return <Home onGuestLogin={() => setIsGuest(true)} />;

  return (
    <div style={{ fontFamily: 'sans-serif', direction: 'rtl', padding: '2rem', background: '#f8f8f8' }}>
      <h1 style={{ textAlign: 'center' }}>אפליקציית פוקר - חדר {roomId}</h1>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button
          onClick={() => {
            localStorage.removeItem('roomId');
            setRoomId('');
          }}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            background: '#ddd',
            border: '1px solid #aaa',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔙 חזרה ללובי
        </button>
      </div>

      {isLocked && (
        <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>
          המשחק הסתיים – צפייה בלבד
        </div>
      )}

      {isOwner && !isLocked && <AddPlayerForm onAdd={handleAddPlayer} />}
      <PlayersTable
        players={players}
        onAddAmount={addAmount}
        onSetCashOut={setCashOut}
        onEdit={editPlayer}
        onEndGame={endGame}
        isLocked={!isOwner || isLocked}
      />
      <HistoryList history={history} />

      {summaryLines.length > 0 && (
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <h3>סיכום המשחק:</h3>
          <ul>{summaryLines.map((line, i) => <li key={i}>{line}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

export default App;