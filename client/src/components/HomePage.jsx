import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { auth, database, ref, get } from '../firebase';

export default function HomePage({ onStart, onLogout, onStartLobby }) {
    const { lang, toggleLanguage } = useLanguage();
    const isHebrew = lang === 'he';

    const [recentRooms, setRecentRooms] = useState([]);

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

    return (
        <div style={{ background: '#0e0e0e', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', direction: isHebrew ? 'rtl' : 'ltr', textAlign: isHebrew ? 'right' : 'left' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                <nav style={{ display: 'flex', gap: '1.5rem' }}>
                    <button onClick={onLogout} style={{ background: '#f44336', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>{isHebrew ? 'התנתק' : 'Logout'}</button>
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
                    <img src="/ChipManagerLogo.png" alt="ChipManager Logo" style={{ height: 100 }} />
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
                    {recentRooms.slice(0, 4).map((room, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #333' }}>
                            <span>{room.displayName}</span>
                            <span style={{ color: '#aaa' }}>{room.locked ? (isHebrew ? 'נעול' : 'Locked') : (isHebrew ? 'פתוח' : 'Open')}</span>
                        </div>
                    ))}
                    {recentRooms.length === 0 && (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>{isHebrew ? 'אין משחקים אחרונים' : 'No recent games found'}</div>
                    )}
                </div>
            </section>

            {/* Why Choose Us */}
            <section style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>{isHebrew ? 'למה לבחור בנו' : 'Why Choose Us'}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                    {[
                        [isHebrew ? 'ניהול שחקנים קל' : 'Easy Player Management', '🧑‍🤝‍🧑'],
                        [isHebrew ? 'היסטוריית משחקים' : 'Game History', '🗂️', onStartLobby],
                        // [isHebrew ? 'חישוב תשלומים הוגן' : 'Fair Settlements', '🎯'],
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