import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';


const defaultStages = [
];

export default function TournamentPage() {
    const { tournamentId } = useParams();
    const navigate = useNavigate();

    const [stages, setStages] = useState(() => {
        const savedTemplate = localStorage.getItem('tournamentTemplate');
        return savedTemplate ? JSON.parse(savedTemplate) : defaultStages;
    });
    const countdownSound = new Audio('/countdown.mp3');
    const [countdownPlayed, setCountdownPlayed] = useState(false);
    const [speechAllowed, setSpeechAllowed] = useState(false);
    const [tournamentStarted, setTournamentStarted] = useState(false);
    const [voices, setVoices] = useState([]);

    const [players, setPlayers] = useState([]);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(stages[0].duration * 60);
    const [totalSecondsPassed, setTotalSecondsPassed] = useState(0);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerImage, setNewPlayerImage] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [message, setMessage] = useState('');

    const [newStage, setNewStage] = useState({ smallBlind: '', bigBlind: '', ante: '', duration: '' });
    const [editIndex, setEditIndex] = useState(null);

    const currentStage = stages[currentStageIndex];
    const speak = (text) => {
        if (!speechAllowed || !text) return;

        window.speechSynthesis.cancel(); // 🛑 עוצר כל קריאה קודמת לפני שמדברים
        const utterance = new SpeechSynthesisUtterance();
        utterance.lang = 'he-IL';
        utterance.text = text;

        const hebrewVoice = voices.find(v => v.lang.includes('he') || v.lang.includes('iw'));

        if (hebrewVoice) {
            utterance.voice = hebrewVoice;
            window.speechSynthesis.speak(utterance);
        } else {
            console.log('לא נמצא קול בעברית במכשיר');
        }
    };



    const startTournament = () => {
        if (players.length === 0) {
            setMessage('❌ יש להוסיף שחקנים לפני התחלת הטורניר');
            return;
        }
        if (stages.length === 0) {
            setMessage('❌ יש להוסיף שלבים לפני התחלת הטורניר');
            return;
        }

        setSpeechAllowed(true); // מרשה לדבר
        setTournamentStarted(true); // מתחיל את הטורניר
        setIsPaused(false); // מפעיל את הטיימר
        setMessage('✅ הטורניר התחיל! בהצלחה לכולם');
    };


    useEffect(() => {
        if (!tournamentStarted) return; // 🛑 לא להתחיל לספור אם לא התחיל טורניר

        const interval = setInterval(() => {
            setTotalSecondsPassed(prev => prev + 1);
            if (!isPaused) {
                setSecondsLeft(prev => {
                    if (prev === 4 && !countdownPlayed) {
                        countdownSound.play();
                        setCountdownPlayed(true);
                    }
                    if (prev > 0) return prev - 1;
                    else {
                        advanceStage();
                        return 0;
                    }
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [tournamentStarted, isPaused, currentStageIndex, countdownPlayed, stages]);

    useEffect(() => {
        const handleVoicesChanged = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        handleVoicesChanged(); // גם מפעיל מיידית ליתר ביטחון

        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('tournamentTemplate', JSON.stringify(stages));
    }, [stages]);

    const advanceStage = () => {
        if (currentStageIndex < stages.length - 1) {
            const nextStage = stages[currentStageIndex + 1];
            setCurrentStageIndex(prev => prev + 1);
            setSecondsLeft(nextStage.duration * 60);
            setCountdownPlayed(false);

            if (!nextStage.break) {
                // מקריא את הבליינדים
                if (!nextStage.break) {
                    speak(`שמאל בליינד ${nextStage.smallBlind}, ביג בליינד ${nextStage.bigBlind}`);
                }
            }
        } else {
            alert('הטורניר הסתיים!');
            navigate('/');
        }
    };


    const formatTime = (totalSeconds) => {
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const getStageProgress = () => {
        if (!currentStage) return 0;
        const stageDurationInSeconds = currentStage.duration * 60;
        const progress = ((stageDurationInSeconds - secondsLeft) / stageDurationInSeconds) * 100;
        return Math.min(100, Math.max(0, progress));
    };

    const jumpToPosition = (e) => {
        const bar = e.target;
        const rect = bar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newProgress = clickX / rect.width;
        const totalSeconds = currentStage.duration * 60;
        setSecondsLeft(Math.max(0, totalSeconds - Math.floor(newProgress * totalSeconds)));
    };

    const togglePause = () => {
        setIsPaused(prev => !prev);
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setNewPlayerImage(URL.createObjectURL(file));
        }
    };

    const addPlayer = () => {
        if (!newPlayerName.trim()) {
            setMessage('❌ יש להכניס שם שחקן');
            return;
        }
        const newPlayer = {
            name: newPlayerName,
            image: newPlayerImage,
            eliminated: false
        };
        setPlayers(prev => [...prev, newPlayer]);
        setNewPlayerName('');
        setNewPlayerImage(null);
        setMessage('✅ שחקן נוסף בהצלחה!');
    };

    const toggleElimination = (index) => {
        const updatedPlayers = [...players];
        updatedPlayers[index].eliminated = !updatedPlayers[index].eliminated;
        setPlayers(updatedPlayers);
        setMessage(updatedPlayers[index].eliminated ? '🛑 השחקן סומן כהודח' : '✅ השחקן חזר למשחק');
    };

    const addStage = () => {
        if (!newStage.smallBlind || !newStage.bigBlind || !newStage.duration) {
            setMessage('❌ יש למלא לפחות Small Blind, Big Blind וזמן');
            return;
        }
        const stage = {
            smallBlind: Number(newStage.smallBlind),
            bigBlind: Number(newStage.bigBlind),
            ante: Number(newStage.ante) || 0,
            duration: Number(newStage.duration)
        };

        if (editIndex !== null) {
            const updatedStages = [...stages];
            updatedStages[editIndex] = stage;
            setStages(updatedStages);
            setEditIndex(null);
            setMessage('✅ שלב עודכן בהצלחה');
        } else {
            setStages(prev => [...prev, stage]);
            setMessage('✅ שלב נוסף בהצלחה');
        }

        setNewStage({ smallBlind: '', bigBlind: '', ante: '', duration: '' });
    };

    const startEditStage = (index) => {
        const stage = stages[index];
        if (stage.break) {
            setMessage('❌ לא ניתן לערוך הפסקות');
            return;
        }
        setNewStage({
            smallBlind: stage.smallBlind,
            bigBlind: stage.bigBlind,
            ante: stage.ante,
            duration: stage.duration
        });
        setEditIndex(index);
    };

    const handleOnDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(stages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setStages(items);
    };

    return (
        <div style={{ backgroundColor: '#0e0e0e', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: '#d4af37',
                    color: '#000000',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 1000
                }}
            >
                חזרה לעמוד הבית
            </button>
            {!tournamentStarted && (
                <button
                    onClick={startTournament}
                    style={{
                        background: '#d4af37',
                        color: '#000',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginBottom: '2rem'
                    }}
                >
                    התחל טורניר
                </button>
            )}



            {/* טיימר */}
            <div style={{ fontSize: '10rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ffffff' }}>
                {formatTime(secondsLeft)}
            </div>
            {/* בליינדים של השלב הנוכחי מתחת לטיימר */}

            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#d4af37', marginBottom: '1rem' }}>
                {currentStage?.break
                    ? '☕ הפסקה'
                    : `בליינדים ${currentStage.smallBlind}/${currentStage.bigBlind}${currentStage.ante > 0 ? ` (אנטה ${currentStage.ante})` : ''}`}
            </div>


            {/* כפתור עצירה/הפעלה */}
            <button onClick={togglePause} style={{ background: '#d4af37', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '1rem' }}>
                {isPaused ? ' המשך' : ' עצור'}
            </button>

            {/* פס זמן */}
            <div onClick={jumpToPosition} style={{ width: '100%', maxWidth: '600px', height: '10px', backgroundColor: '#333', borderRadius: '5px', overflow: 'hidden', marginBottom: '2rem', cursor: 'pointer', position: 'relative' }}>
                <div style={{ width: `${getStageProgress()}%`, height: '100%', backgroundColor: '#d4af37', transition: 'width 0.5s linear' }}></div>
            </div>

            {/* זמן כולל */}
            <div style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '2rem' }}>
                זמן כולל עבר: {formatTime(totalSecondsPassed)}
            </div>

            {/* הודעות */}
            {message && (
                <div style={{ backgroundColor: '#1a1a1a', padding: '0.5rem 1rem', borderRadius: '5px', color: '#d4af37', marginBottom: '1rem' }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '2rem', width: '100%', maxWidth: '1200px' }}>
                {/* שלבים */}
                <div style={{ flex: '1', background: '#1a1a1a', borderRadius: '10px', padding: '1rem', textAlign: 'center', height: '600px', overflowY: 'auto' }}>

                    {/* Drag and Drop לשלבים */}
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <Droppable droppableId="stages">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {stages.map((stage, idx) => (
                                        <Draggable key={idx} draggableId={idx.toString()} index={idx}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                        background: '#2a2a2a',
                                                        margin: '0.5rem 0',
                                                        padding: '0.5rem',
                                                        borderRadius: '8px',
                                                        fontWeight: 'bold',
                                                        cursor: 'grab',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        direction: 'rtl'
                                                    }}
                                                >
                                                    {/* ימין: בליינדים */}
                                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                                        {stage.break ? (
                                                            <>☕ הפסקה</>
                                                        ) : (
                                                            <>בליינדים {stage.smallBlind}/{stage.bigBlind}{stage.ante > 0 ? ` (אנטה ${stage.ante})` : ''}</>
                                                        )}
                                                    </div>

                                                    {/* אמצע: משך זמן */}
                                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '0.9rem', color: '#aaa' }}>
                                                        {!stage.break && (
                                                            <>{stage.duration} דקות</>
                                                        )}
                                                    </div>

                                                    {/* שמאל: כפתור עפרון */}
                                                    <div style={{ flex: 0 }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startEditStage(idx); }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#d4af37',
                                                                fontSize: '1.2rem',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            ✏️
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {/* הוספת/עריכת שלב מתחת לשלבים */}
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <h4>{editIndex !== null ? 'עריכת שלב קיים' : 'הוספת שלב חדש'}</h4>
                        <input type="number" placeholder="Small Blind" value={newStage.smallBlind} onChange={(e) => setNewStage({ ...newStage, smallBlind: e.target.value })} style={inputStyle} />
                        <input type="number" placeholder="Big Blind" value={newStage.bigBlind} onChange={(e) => setNewStage({ ...newStage, bigBlind: e.target.value })} style={inputStyle} />
                        <input type="number" placeholder="Ante (אופציונלי)" value={newStage.ante} onChange={(e) => setNewStage({ ...newStage, ante: e.target.value })} style={inputStyle} />
                        <input type="number" placeholder="משך זמן (בדקות)" value={newStage.duration} onChange={(e) => setNewStage({ ...newStage, duration: e.target.value })} style={inputStyle} />
                        <br />
                        <button onClick={addStage} style={buttonStyle}>
                            {editIndex !== null ? 'עדכן שלב' : 'הוסף שלב'}
                        </button>
                    </div>
                </div>
                {/* שחקנים */}
                <div style={{ flex: '1', background: '#1a1a1a', borderRadius: '10px', padding: '1rem', textAlign: 'center', height: '600px', overflowY: 'auto' }}>
                    <h3>שחקנים</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <input type="text" placeholder="שם שחקן" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} style={inputStyle} />
                        <br />
                        <label style={{ background: '#d4af37', color: '#000', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem', display: 'inline-block' }}>
                            בחר תמונה
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                        <br />
                        <button onClick={addPlayer} style={buttonStyle}>הוסף שחקן</button>
                    </div>

                    {players.map((player, idx) => (
                        <div key={idx} onClick={() => toggleElimination(idx)} style={{ background: player.eliminated ? '#880e4f' : '#2a2a2a', margin: '0.5rem 0', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            {player.image ? (
                                <img src={player.image} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#0e0e0e', fontWeight: 'bold' }}>
                                    {player.name[0]}
                                </div>
                            )}
                            <div style={{ fontSize: '1.2rem' }}>{player.name} {player.eliminated && '🛑'}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ffffff' , marginTop:'1rem'}}>
                {tournamentId} : מזהה חדר
            </div>
        </div>

    );
}

const inputStyle = {
    padding: '0.5rem',
    margin: '0.3rem',
    width: '40%',
    borderRadius: '8px',
    border: '1px solid #ccc',
    textAlign: 'center'
};

const buttonStyle = {
    background: '#d4af37',
    color: '#000',
    padding: '0.5rem 1.5rem',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem',
    display: 'inline-block', // חשוב מאוד
    textAlign: 'center',
    width: 'auto' // הוספתי
};
