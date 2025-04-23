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
                        displayName: roomData.createdAt ? `🕒 ${roomData.createdAt}` : roomId
                    }))
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                setRooms(userRooms);
            } else {
                setRooms([]);
            }
        });
    }, [uid]);

    const roomButtonStyle = (locked) => ({
        padding: '16px 16px',
        fontSize: '15px',
        background: locked ? '#555050' : '#d4af37',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        display: 'flex',

    });

    return (
        <div style={{ background: '#0e0e0e', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, textAlign: 'center', width: '100%' }}>היסטוריית המשחקים שלך</h2>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        left: '2rem',
                        background: '#d4af37',
                        color: '#000',
                        padding: '0.5rem 0.3rem',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                        maxWidth: '85px'
                    }}
                >
                    חזרה לעמוד הבית
                </button>
            </header>

            <ul style={{ listStyle: 'none', padding: 0, maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                {rooms.map((room) => (
                    <li key={room.id} style={{ margin: '0.5rem 0', textAlign: 'center' }}>
                        <button
                            onClick={() => onSelectRoom(room.id)}
                            style={{
                                ...roomButtonStyle(room.locked),
                                textAlign: 'center',
                                direction: 'rtl', // כדי שהטקסט בעברית יהיה תקין
                                display: 'inline-block' // חשוב כדי שיתמרכז בתוך ה-li עם textAlign: center
                            }}
                        >
                            {room.displayName} {room.locked ? '(נעול - צפייה בלבד)' : ''}
                        </button>
                    </li>
                ))}
                {rooms.length === 0 && <li style={{ textAlign: 'center', marginTop: '2rem' }}>אין משחקים שנוצרו על ידך</li>}
            </ul>
        </div>
    );
}

export default HistoryPage;
