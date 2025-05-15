//Packages
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database, ref, onValue, set, push, update } from '../../firebase';

//Inner Components
import Timer from './Timer';
import StagesList from './StagesList';
import StageForm from './StageForm';
import TournamentTemplates from './TournamentTemplates';
import PlayerForm from './PlayerForm';
import PlayersList from './PlayersList';

//Style
import './TournamentPage.css';

//Constants
const defaultStages = [];

export default function TournamentPage() {
    const { tournamentId } = useParams();
    const navigate = useNavigate();

    //Stages
    const [stages, setStages] = useState(() => {
        const savedTemplate = localStorage.getItem('tournamentTemplate');
        return savedTemplate ? JSON.parse(savedTemplate) : defaultStages;
    });

    //Countdown
    const countdownSound = new Audio('/countdown.mp3');
    const [countdownPlayed, setCountdownPlayed] = useState(false);

    //Other States
    const [speechAllowed, setSpeechAllowed] = useState(false);
    const [tournamentStarted, setTournamentStarted] = useState(false);
    const [voices, setVoices] = useState([]);
    const stageAdvancePending = useRef(false);

    //Players
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        const playersRef = ref(database, `tournaments/${tournamentId}/players`);
        const unsubscribe = onValue(playersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const playerList = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                setPlayers(playerList);
            } else {
                setPlayers([]);
            }
        });

        return () => unsubscribe();
    }, [tournamentId]);



    //Current Stage
    const [currentStageIndex, setCurrentStageIndex] = useState(() => Number(localStorage.getItem('currentStageIndex') || 0));

    //State Manage
    const [secondsLeft, setSecondsLeft] = useState(() => Number(localStorage.getItem('secondsLeft') || 0));
    const [totalSecondsPassed, setTotalSecondsPassed] = useState(() => Number(localStorage.getItem('totalSecondsPassed') || 0));
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerImage, setNewPlayerImage] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [message, setMessage] = useState('');
    const [newStage, setNewStage] = useState({ smallBlind: '', bigBlind: '', ante: '', duration: '' });
    const [editIndex, setEditIndex] = useState(null);
    const [lastClickedIndex, setLastClickedIndex] = useState(null);
    const [editingMode, setEditingMode] = useState(false);
    const [showStageForm, setShowStageForm] = useState(false);
    const [customTemplateName, setCustomTemplateName] = useState('');
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

    //UseEffects
    useEffect(() => {
        localStorage.setItem('currentStageIndex', currentStageIndex);
    }, [currentStageIndex]);
    useEffect(() => {
        localStorage.setItem('secondsLeft', secondsLeft);
    }, [secondsLeft]);
    useEffect(() => {
        localStorage.setItem('totalSecondsPassed', totalSecondsPassed);
    }, [totalSecondsPassed]);

    const startTournament = () => {
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

                    if (!stageAdvancePending.current) {
                        stageAdvancePending.current = true;

                        // דחיית הקריאה למחזור הבא
                        setTimeout(() => {
                            advanceStage();
                        }, 500);
                    }

                    return 0;
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
        setCurrentStageIndex(prev => {
            const nextIndex = prev + 1;
            if (nextIndex < stages.length) {
                setSecondsLeft(stages[nextIndex].duration * 60);
                setCountdownPlayed(false);
                stageAdvancePending.current = false;
                return nextIndex;
            } else {
                alert('הטורניר הסתיים!');
                navigate('/');
                return prev;
            }
        });
    };
    useEffect(() => {
        if (!tournamentStarted || !speechAllowed || !currentStage) return;

        if (currentStage.break) {
            speak('הפסקה');
        } else if (typeof currentStage.smallBlind === 'number' && typeof currentStage.bigBlind === 'number') {
            speak(`שמאלcd  ${currentStage.smallBlind}, ביג ${currentStage.bigBlind}`);
        }
    }, [currentStageIndex, speechAllowed]);

//Logic Functions
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

        const playerRef = push(ref(database, `tournaments/${tournamentId}/players`));
        set(playerRef, newPlayer);

        setNewPlayerName('');
        setNewPlayerImage(null);
        setMessage('✅ שחקן נוסף בהצלחה!');
    };

    const toggleElimination = (player) => {
        const playerRef = ref(database, `tournaments/${tournamentId}/players/${player.id}`);

        update(playerRef, { eliminated: !player.eliminated });
        setMessage(!player.eliminated ? '🛑 השחקן סומן כהודח' : '✅ השחקן חזר למשחק');
    };
    const startEditStage = (index) => {
        const stage = stages[index];
        setEditIndex(index);
        setEditingMode(true);
        setNewStage({
            smallBlind: stage.smallBlind || '',
            bigBlind: stage.bigBlind || '',
            ante: stage.ante || '',
            duration: stage.duration || ''
        });
    };
    return (
        <div style={{ backgroundColor: '#0e0e0e', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

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
            <div className="tournament-layout">
                <div className="tournament-timer">
                    <Timer
                        secondsLeft={secondsLeft}
                        totalSecondsPassed={totalSecondsPassed}
                        currentStage={currentStage}
                        isPaused={isPaused}
                        togglePause={togglePause}
                        jumpToPosition={jumpToPosition}
                        getStageProgress={getStageProgress}
                        formatTime={formatTime}
                        message={message}
                    />
                </div>

                <div className="tournament-stages">
                    <StagesList
                        stages={stages}
                        currentStageIndex={currentStageIndex}
                        lastClickedIndex={lastClickedIndex}
                        setLastClickedIndex={setLastClickedIndex}
                        startEditStage={startEditStage}
                        buttonStyle={buttonStyle}
                    />
                    {showStageForm && (
                        <StageForm
                            newStage={newStage}
                            setNewStage={setNewStage}
                            editingMode={editingMode}
                            editIndex={editIndex}
                            lastClickedIndex={lastClickedIndex}
                            setEditIndex={setEditIndex}
                            setLastClickedIndex={setLastClickedIndex}
                            setEditingMode={setEditingMode}
                            setShowStageForm={setShowStageForm}
                            setStages={setStages}
                            stages={stages}
                            setMessage={setMessage}
                            buttonStyle={buttonStyle}
                        />
                    )}

                </div>

                <div className="tournament-players">
                    <PlayersList players={players} toggleElimination={toggleElimination} />
                    <PlayerForm
                        newPlayerName={newPlayerName}
                        setNewPlayerName={setNewPlayerName}
                        newPlayerImage={newPlayerImage}
                        setNewPlayerImage={setNewPlayerImage}
                        addPlayer={addPlayer}
                        inputStyle={inputStyle}
                        buttonStyle={buttonStyle}
                    />
                    <TournamentTemplates
                        customTemplateName={customTemplateName}
                        setCustomTemplateName={setCustomTemplateName}
                        stages={stages}
                        setStages={setStages}
                        setCurrentStageIndex={setCurrentStageIndex}
                        setSecondsLeft={setSecondsLeft}
                        setMessage={setMessage}
                        tournamentStarted={tournamentStarted}
                        buttonStyle={buttonStyle}
                        inputStyle={inputStyle}
                    />
                </div>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ffffff' , marginTop:'1rem'}}>
                {tournamentId} : מזהה חדר

            </div>
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
