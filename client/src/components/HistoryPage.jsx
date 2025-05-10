import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database, ref, get } from '../firebase';
import { auth } from '../firebase';

function HistoryPage() {
    const [rooms, setRooms] = useState([]);
    const [uid, setUid] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) setUid(user.uid);
        });
        return () => unsubscribe();
    }, []);

    // פונקציה לפירוש תאריך מותאם אישית
    function parseCustomDate(str) {
        const [datePart, timePart] = str.split(', ');
        const [day, month] = datePart.split('.').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        const now = new Date();
        const year = now.getFullYear();
        return new Date(year, month - 1, day, hours, minutes);
    }

    useEffect(() => {
        if (!uid) return;

        async function fetchRoomsAndTournaments() {
            const roomsSnapshot = await get(ref(database, 'rooms'));
            const tournamentsSnapshot = await get(ref(database, 'tournaments'));

            const roomsData = roomsSnapshot.val() || {};
            const tournamentsData = tournamentsSnapshot.val() || {};

            const allRooms = [
                ...Object.entries(roomsData).map(([id, room]) => ({
                    id,
                    ...room,
                    type: 'cash'
                })),
                ...Object.entries(tournamentsData).map(([id, tournament]) => ({
                    id,
                    ...tournament,
                    type: 'tournament'
                }))
            ];

            const userRooms = allRooms
                .filter(room => room.ownerId === uid)
                .map(room => ({
                    id: room.id,
                    locked: room.locked || false,
                    createdAt: room.createdAt || '',
                    displayName: room.createdAt ? room.createdAt : room.id,
                    type: room.type || 'cash'
                }))
                .sort((a, b) => parseCustomDate(b.createdAt) - parseCustomDate(a.createdAt)); // מיון אמיתי לפי תאריך

            setRooms(userRooms);
        }

        fetchRoomsAndTournaments();
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

    const handleSelectRoom = (id, type) => {
        if (type === 'tournament') {
            navigate(`/tournament/${id}`);
        } else {
            navigate(`/room/${id}`);
        }
    };

    return (
        <div style={{
            background: '#0e0e0e',
            color: '#fff',
            minHeight: '100vh',
            fontFamily: 'sans-serif',
            padding: '2rem'
        }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>היסטוריית המשחקים שלך</h2>

            <button onClick={() => navigate('/')} style={backButtonStyle}>
                חזרה לעמוד הבית
            </button>

            <ul style={{
                listStyle: 'none',
                padding: 0,
                maxWidth: '600px',
                margin: '0 auto',
                textAlign: 'center'
            }}>
                {rooms.map((room) => (
                    <li key={room.id} style={{ margin: '0.5rem 0' }}>
                        <button
                            onClick={() => handleSelectRoom(room.id, room.type)}
                            style={roomButtonStyle(room.locked)}
                        >
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
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                                {room.type === 'tournament' ? ' טורניר' : ' קאש'}
                            </div>
                        </button>
                    </li>
                ))}
                {rooms.length === 0 && (
                    <li style={{ textAlign: 'center', marginTop: '2rem' }}>אין משחקים או טורנירים שנוצרו על ידך</li>
                )}
            </ul>
        </div>
    );
}

export default HistoryPage;
