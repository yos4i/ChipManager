import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database, ref, onValue } from '../firebase';
import { auth } from '../firebase';

function HistoryPage({ onSelectRoom }) {
    const [rooms, setRooms] = useState([]);
    const [uid, setUid] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) setUid(user.uid);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const roomsRef = ref(database, 'rooms');
        onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const userRooms = Object.entries(data)
                    .filter(([_, roomData]) => roomData.ownerId === uid)
                    .map(([roomId, roomData]) => ({
                        id: roomId,
                        locked: roomData.locked || false,
                        createdAt: roomData.createdAt || '',
                        displayName: roomData.createdAt ? ` ${roomData.createdAt}` : roomId
                    }))
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                setRooms(userRooms);
            } else {
                setRooms([]);
            }
        });
    }, [uid]);

    const roomButtonStyle = (locked) => ({
        padding: '16px',
        fontSize: '15px',
        background: locked ? '#555050' : '#d4af37',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        display: 'inline-block',
        textAlign: 'center',
        direction: 'rtl'
    });

    const backButtonStyle = {
        backgroundColor: '#d4af37',
        color: '#000',
        padding: '0.75rem 1.25rem',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
        maxWidth: '300px',
        margin: '0 auto 2rem',
        display: 'block',
        textAlign: 'center',
        cursor: 'pointer'
    };

    return (
        <div
            style={{
                background: '#0e0e0e',
                color: '#fff',
                minHeight: '100vh',
                fontFamily: 'sans-serif',
                padding: '2rem'
            }}
        >
            <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>היסטוריית המשחקים שלך</h2>

            <button onClick={() => navigate('/')} style={backButtonStyle}>
                חזרה לעמוד הבית
            </button>

            <ul
                style={{
                    listStyle: 'none',
                    padding: 0,
                    maxWidth: '600px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}
            >
                {rooms.map((room) => (
                    <li key={room.id} style={{ margin: '0.5rem 0' }}>
                        <button onClick={() => onSelectRoom(room.id)} style={roomButtonStyle(room.locked)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', direction: 'rtl', textAlign: 'right' }}>
                                <span style={{ flex: 1, color: '#fff', fontSize: '1rem' }}>
                                    מזהה חדר: {room.id}
                                </span>
                                <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: '1rem' }}>
                                    {room.displayName}
                                </span>
                                <span style={{ flex: 1, textAlign: 'left', color: '#fff', fontSize: '1rem' }}>
                                    {room.locked ? 'נעול' : 'פתוח'}
                                </span>
                            </div>
                        </button>
                    </li>
                ))}
                {rooms.length === 0 && (
                    <li style={{ textAlign: 'center', marginTop: '2rem' }}>אין משחקים שנוצרו על ידך</li>
                )}
            </ul>
        </div>
    );
}

export default HistoryPage;
