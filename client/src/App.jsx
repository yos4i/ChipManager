import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Login from './components/Login';
import HomePage from './components/HomePage';
import Lobby from './components/Lobby';
import AddPlayerForm from "./components/AddPlayerForm";
import PlayersTable from "./components/PlayersTable";
import HistoryList from "./components/HistoryList";

import {
  database,
  ref,
  onValue,
  update,
  createRoom,
  isRoomOwner
} from './firebase';

import { useLanguage } from './LanguageContext';

function App() {
  const { lang } = useLanguage();
  const isHebrew = lang === 'he';

  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(localStorage.getItem('roomId') || '');
  const [players, setPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [summaryLines, setSummaryLines] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
      else setUid(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRoomSelect = async (selectedRoomId) => {
    localStorage.setItem('roomId', selectedRoomId);
    setRoomId(selectedRoomId);
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('roomId');
    setUid(null);
    setRoomId('');
  };

  useEffect(() => {
    if (!roomId || roomId === 'LOBBY') return;
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
    const prevName = players[index].name;
    const name = prompt('שם חדש:', prevName);
    const buyIn = prompt('סכום כניסה חדש:', players[index].buyIn);
    if (!name || isNaN(parseInt(buyIn))) return;
    const updated = [...players];
    updated[index].name = name;
    updated[index].buyIn = parseInt(buyIn);
    logAction(`${prevName} עודכן לשם ${name} וסכום ₪${buyIn}`);
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

  if (loading) {
    return (
        <div style={{ background: '#0e0ecd0e', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/ChipManagerLogo.png" alt="Loading..." style={{ height: 100 }} />
        </div>
    );
  }

  if (!uid) return <Login onLogin={(id) => setUid(id)} />;
  if (!roomId) return (
      <HomePage
          onStart={async () => {
            const newRoomId = await createRoom();
            localStorage.setItem("roomId", newRoomId);
            setRoomId(newRoomId);
          }}
          onLogout={handleLogout}
          onStartLobby={() => setRoomId("LOBBY")}
          showLanguageSwitcher={true}
      />
  );
  if (roomId === "LOBBY") return <Lobby onSelectRoom={handleRoomSelect} />;

  return (
      <div style={{ background: '#0e0e0e', color: '#fff', fontFamily: 'sans-serif', minHeight: '100vh', padding: '2rem', direction: isHebrew ? 'rtl' : 'ltr', textAlign: isHebrew ? 'right' : 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <img src="/ChipManagerLogo.png" alt="Logo" style={{ height: 50 }} />
          <button
              onClick={() => {
                localStorage.removeItem('roomId');
                setRoomId('');
              }}
              style={{ background: '#d4af37', color: '#000', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            {isHebrew ? 'חזרה לעמוד הבית' : 'Back to Home'}
          </button>
        </div>

        {/*<h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{isHebrew ? 'חדר' : 'Room'} {roomId}</h1>*/}

        {isLocked && (
            <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>
              {isHebrew ? 'המשחק הסתיים – צפייה בלבד' : 'Game over – View only'}
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
            <div style={{
              background: '#1a1a1a',
              padding: '1rem',
              borderRadius: '8px',
              marginTop: '1rem',
              color: '#fff',
              boxShadow: '0 0 10px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            }}>

              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>{isHebrew ? 'סיכום המשחק:' : 'Game Summary:'}</h3>
              <ul style={{
                listStyleType: 'none',
                margin: 0,
                padding: 0
              }}>
                {summaryLines.map((line, i) => (
                    <li key={i} style={{
                      background: '#111',
                      border: '1px solid #d4af37',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.5rem',
                      color: '#fff',
                      boxShadow: '0 0 6px rgba(0,0,0,0.3)'
                    }}>
                      {line}
                    </li>
                ))}
              </ul>

            </div>
        )}
      </div>
  );
}

export default App;