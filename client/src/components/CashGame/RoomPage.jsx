import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, database, ref, get, onValue, update } from '../../firebase.js';

import PlayersTable from './PlayersTable.jsx';
import AddPlayerForm from './AddPlayerForm.jsx';
import HistoryList from './HistoryList.jsx';

export default function RoomPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [players, setPlayers] = useState([]);
    const [history, setHistory] = useState([]);
    const [summaryLines, setSummaryLines] = useState([]);
    const [isOwner, setIsOwner] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [loading, setLoading] = useState(true);

    const currentUid = auth.currentUser?.uid;

    useEffect(() => {
        const roomRef = ref(database, `rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setPlayers(data.players || []);
                setHistory(data.history || []);
                setSummaryLines(data.summaryLines || []);
                setIsLocked(data.locked || false);
                setIsOwner(data.ownerId === currentUid);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [roomId, currentUid]);

    const logAction = (text) => {
        const now = new Date();
        const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        const updatedHistory = [`${time} - ${text}`, ...history];
        setHistory(updatedHistory);
        update(ref(database, `rooms/${roomId}`), { history: updatedHistory });
    };

    const handleAddPlayer = (name, buyIn) => {
        if (!isOwner || isLocked) return;
        const newPlayers = [...players, { name, buyIn: parseInt(buyIn), cashOut: null }];
        setPlayers(newPlayers);
        update(ref(database, `rooms/${roomId}`), { players: newPlayers });
        logAction(`${name} נכנס עם ₪${buyIn}`);
    };

    const handleAddAmount = (index) => {
        if (!isOwner || isLocked) return;
        const updated = [...players];
        updated[index].buyIn += 50;
        setPlayers(updated);
        update(ref(database, `rooms/${roomId}`), { players: updated });
        logAction(`${updated[index].name} הוסיף ₪50`);
    };

    const handleSetCashOut = (index) => {
        if (!isOwner || isLocked) return;
        const value = prompt('כמה כסף סיים איתו?');
        const amount = parseInt(value);
        if (isNaN(amount)) return;
        const updated = [...players];
        updated[index].cashOut = amount;
        setPlayers(updated);
        update(ref(database, `rooms/${roomId}`), { players: updated });
        logAction(`${updated[index].name} סיים עם ₪${amount}`);
    };

    const handleEditPlayer = (index) => {
        if (!isOwner || isLocked) return;
        const prevName = players[index].name;
        const buyIn = prompt('סכום כניסה חדש:', players[index].buyIn);
        const updated = [...players];
        updated[index].buyIn = parseInt(buyIn);
        setPlayers(updated);
        update(ref(database, `rooms/${roomId}`), { players: updated });
        logAction(`${prevName} עודכן  ${name} לסכום ₪${buyIn}`);
    };

    const handleEndGame = () => {
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
        update(ref(database, `rooms/${roomId}`), {
            summaryLines: lines,
            locked: true
        });

        logAction('המשחק הסתיים');
    };

    if (loading) {
        return (
            <div style={{ background: '#0e0e0e', height: '100vh', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p>טוען חדר...</p>
            </div>
        );
    }

    return (
        <div style={{ background: '#0e0e0e', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
            {/* כפתור חזרה לעמוד הבית */}
            <div style={{ marginBottom: '1rem' }}>

            </div>

            <h2 style={{ textAlign: 'center', marginBottom: '1rem' , fontSize: 15}}> {roomId} : מזהה חדר</h2>

            {isLocked && (
                <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>
                    המשחק נעול - צפייה בלבד
                </div>
            )}

            {isOwner && !isLocked && <AddPlayerForm onAdd={handleAddPlayer} />}

            <PlayersTable
                players={players}
                onAddAmount={handleAddAmount}
                onSetCashOut={handleSetCashOut}
                onEdit={handleEditPlayer}
                onEndGame={handleEndGame}
                isLocked={!isOwner || isLocked}
            />

            <HistoryList history={history} />

            {summaryLines.length > 0 && (
                <>
                    <div style={{
                        background: '#1a1a1a',
                        padding: '1rem',
                        borderRadius: '8px',
                        color: '#fff',
                        boxShadow: '0 0 10px rgba(0,0,0,0.4)',
                        maxWidth: '600px',
                        margin: '2rem auto 1rem'
                    }}>
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #d4af37', paddingBottom: '0.5rem', textAlign: 'center' }}>
                            סיכום המשחק
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {summaryLines.map((line, i) => (
                                <li key={i} style={{
                                    background: '#111',
                                    border: '1px solid #d4af37',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '0.5rem',
                                    textAlign: 'center',
                                }}>
                                    {line}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* כפתור מחוץ לתיבה ומרוכז */}
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: '#d4af37',
                                color: '#000',
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            חזרה לעמוד הבית
                        </button>
                    </div>
                </>
            )}

        </div>
    );
}
