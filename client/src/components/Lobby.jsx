// Lobby.jsx - מתוקן: שמות חדרים לפי תאריך אמיתי + יצירת חדר תקינה
import { useEffect, useState } from 'react';
import { database, ref, onValue, createRoom } from '../firebase';

function Lobby({ onSelectRoom }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomList = Object.entries(data).map(([roomId, roomData]) => ({
          id: roomId,
          locked: roomData.locked || false,
          createdAt: roomData.createdAt || '',
          displayName: roomData.createdAt ? `🕒 חדר שנפתח ב־${roomData.createdAt}` : roomId
        }));
        roomList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setRooms(roomList);
      } else {
        setRooms([]);
      }
    });
  }, []);

  const createNewRoom = async () => {
    const now = new Date();
    const formatted = now.toLocaleString('he-IL', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    const newRoomId = await createRoom(formatted); // יש להבטיח ש-createRoom שומר גם createdAt
    onSelectRoom(newRoomId);
  };

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    marginBottom: '1rem',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  };

  const roomButtonStyle = (locked) => ({
    padding: '8px 16px',
    fontSize: '15px',
    background: locked ? '#f44336' : '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  });

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', direction: 'rtl' }}>
      <h2 style={{ textAlign: 'center' }}>ברוך הבא ללובי</h2>
      <button onClick={createNewRoom} style={buttonStyle}>➕ יצירת חדר חדש</button>

      <h3 style={{ marginTop: '2rem' }}>חדרים קיימים:</h3>
      <ul>
        {rooms.map((room) => (
          <li key={room.id} style={{ margin: '0.5rem 0' }}>
            <button onClick={() => onSelectRoom(room.id)} style={roomButtonStyle(room.locked)}>
              {room.displayName} {room.locked ? "(נעול - צפייה בלבד)" : ""}
            </button>
          </li>
        ))}
        {rooms.length === 0 && <li>אין חדרים פעילים כרגע</li>}
      </ul>
    </div>
  );
}

export default Lobby;

