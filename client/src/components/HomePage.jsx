import React, { useEffect, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { auth, database, ref, get, doesRoomExist } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function HomePage({ onStart, onLogout, onStartLobby }) {
    const { lang, toggleLanguage } = useLanguage();
    const isHebrew = lang === 'he';

    const [recentRooms, setRecentRooms] = useState([]);
    const [roomCode, setRoomCode] = useState('');
    const [guestError, setGuestError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const roomsRef = ref(database, 'rooms');
        get(roomsRef).then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const userRooms = Object.entries(data)
                    .filter(([_, room]) => room.ownerId === uid)
                    .map(([roomId, roomData]) => ({
                        id: roomId,
                        displayName: roomData.createdAt || roomId,
                        locked: roomData.locked || false,
                    }))
                    .sort((a, b) => b.displayName.localeCompare(a.displayName))
                    .slice(0, 4);
                setRecentRooms(userRooms);
            }
        });
    }, []);

    const btnStyle = {
        background: '#d4af37',
        color: '#000',
        padding: '0.75rem 1.5rem',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: 'pointer'
    };

    const sectionStyle = {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem 1rem'
    };

    const handleGuestJoin = async () => {
        const code = roomCode.trim().toLowerCase();
        setGuestError('');
        if (code.length !== 4) {
            setGuestError('המזהה חייב להיות באורך 4 תווים');
            return;
        }

        const exists = await doesRoomExist(code);
        if (!exists) {
            setGuestError('החדר לא קיים');
            return;
        }

        navigate(`/room/${code}`);
    };

    return (
        <div style={{ background: '#0e0e0e', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', textAlign: 'center' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                <nav style={{ display: 'flex', gap: '1.5rem' }}>
                    <button onClick={onLogout} style={{ background: '#f44336', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                        {isHebrew ? 'התנתק' : 'Logout'}
                    </button>
                    <button
                        onClick={toggleLanguage}
                        style={{ padding: '0.5rem 1rem', background: '#333', color: '#fff', border: '1px solid #888', borderRadius: '6px', cursor: 'pointer' }}>
                        {lang === 'he' ? 'English' : 'עברית'}
                    </button>
                </nav>
            </header>

            {/* Hero Section */}
            <section style={{ ...sectionStyle, textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <img src="/Mylogo.png" alt="ChipManager Logo" style={{ height: 100 }} />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{isHebrew ? 'נהל את ערבי הפוקר שלך כמו מקצוען' : 'Manage Your Poker Nights Like a Pro'}</h1>
                <p style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    {isHebrew ? 'שלוט במשחקים הביתיים שלך — נהל כניסות, יתרות וסטטיסטיקות שחקנים במקום אחד' : 'Take control of your home games — track buy-ins, balances, and player stats, all in one place.'}
                </p>
                <button style={btnStyle} onClick={onStart}>{isHebrew ? 'התחל משחק' : 'Start a Game'}</button>
            </section>

            {/* Recent Games */}
            <section style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>{isHebrew ? 'המשחקים האחרונים שלך' : 'Your Recent Games'}</h2>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', overflow: 'hidden' }}>
                    {recentRooms.length > 0 ? recentRooms.map((room, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(`/room/${room.id}`)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                borderBottom: '1px solid #333',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#1a1a1a')}
                        >
                            <span>{room.displayName}</span>
                            <span style={{ color: '#aaa' }}>{room.locked ? (isHebrew ? 'נעול' : 'Locked') : (isHebrew ? 'פתוח' : 'Open')}</span>
                        </div>
                    )) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>{isHebrew ? 'אין משחקים אחרונים' : 'No recent games found'}</div>
                    )}
                </div>
            </section>

            {/* Guest Join */}
            <section style={{ ...sectionStyle, marginTop: '1rem', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{isHebrew ? 'הצטרף לצפייה בחדר קיים' : 'Join an Existing Room as Guest'}</h3>
                <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    maxLength={4}
                    placeholder={isHebrew ? 'קוד חדר (4 תווים)' : 'Room code (4 chars)'}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        width: '200px',
                        textAlign: 'center',
                        fontSize: '1rem',
                        border: '1px solid #888'
                    }}
                />
                <br />
                <button
                    onClick={handleGuestJoin}
                    style={{
                        marginTop: '0.5rem',
                        background: '#d4af37',
                        color: '#000',
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {isHebrew ? 'הצטרף לחדר' : 'Join Room'}
                </button>
                {guestError && <p style={{ color: 'red' }}>{guestError}</p>}
            </section>

            {/* Why Choose Us */}
            <section style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>{isHebrew ? 'למה לבחור בנו' : 'Why Choose Us'}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                    {[
                        [isHebrew ? 'היסטוריית משחקים מלאה' : 'Full Game History', '🗂️', onStartLobby],
                        [isHebrew ? 'ניהול שחקנים קל' : 'Easy Player Management', '🧑‍🤝‍🧑'],
                        [isHebrew ? 'גישה מכל מכשיר' : 'Cross-Device Access', '📱💻']
                    ].map(([title, icon, onClick], i) => (
                        <div
                            key={i}
                            onClick={onClick || undefined}
                            style={{
                                background: '#1a1a1a',
                                padding: '1rem',
                                borderRadius: '10px',
                                width: '200px',
                                textAlign: 'center',
                                cursor: onClick ? 'pointer' : 'default'
                            }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
                            <strong>{title}</strong>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
