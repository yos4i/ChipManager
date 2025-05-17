// Refactored TournamentPage.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database, ref, onValue, set, push, update, get } from '../../firebase';

// Inner Components
import Timer from './Timer';
import StagesList from './StagesList';
import StageForm from './StageForm';
import TournamentTemplates from './TournamentTemplates';
import PlayerForm from './PlayerForm';
import PlayersList from './PlayersList';

// Style
import './TournamentPage.css';

// Constants
const defaultStages = [];

export default function TournamentPage() {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const [debugLog, setDebugLog] = useState('');

    // Stages
    const [stages, setStages] = useState(() => {
        const savedTemplate = localStorage.getItem('tournamentTemplate');
        return savedTemplate ? JSON.parse(savedTemplate) : defaultStages;
    });

    // Countdown
    const countdownSound = useRef(new Audio('/countdown.mp3'));
    const [countdownPlayed, setCountdownPlayed] = useState(false);

    // Other States
    const [speechAllowed, setSpeechAllowed] = useState(false);
    const [tournamentStarted, setTournamentStarted] = useState(false);
    const [voices, setVoices] = useState([]);
    const stageAdvancePending = useRef(false);

    // Players
    const [players, setPlayers] = useState([]);

    // Current Stage
    const [currentStageIndex, setCurrentStageIndex] = useState(() =>
        Number(localStorage.getItem('currentStageIndex') || 0)
    );

    // State Manage
    const [secondsLeft, setSecondsLeft] = useState(() =>
        Number(localStorage.getItem('secondsLeft') || 0)
    );
    const [totalSecondsPassed, setTotalSecondsPassed] = useState(() =>
        Number(localStorage.getItem('totalSecondsPassed') || 0)
    );
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

    // Initialize Firebase listeners
    useEffect(() => {
        // Players listener
        const playersRef = ref(database, `tournaments/${tournamentId}/players`);
        const unsubscribePlayers = onValue(playersRef, (snapshot) => {
            try {
                const data = snapshot.val();
                if (data) {
                    const playerList = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                    setPlayers(playerList);
                } else {
                    setPlayers([]);
                }
            } catch (error) {
                console.error("Error processing players data:", error);
                setDebugLog(`Error loading players: ${error.message}`);
            }
        });

        // Stages listener
        const stagesRef = ref(database, `tournaments/${tournamentId}/stages`);
        const unsubscribeStages = onValue(stagesRef, (snapshot) => {
            try {
                const data = snapshot.val();
                if (data) setStages(data);
            } catch (error) {
                console.error("Error processing stages data:", error);
            }
        });

        // Current index listener
        const indexRef = ref(database, `tournaments/${tournamentId}/currentStageIndex`);
        const unsubscribeIndex = onValue(indexRef, (snapshot) => {
            try {
                const data = snapshot.val();
                if (typeof data === 'number') setCurrentStageIndex(data);
            } catch (error) {
                console.error("Error processing current stage index:", error);
            }
        });

        // Seconds left listener
        const secondsRef = ref(database, `tournaments/${tournamentId}/secondsLeft`);
        const unsubscribeSeconds = onValue(secondsRef, (snapshot) => {
            try {
                const data = snapshot.val();
                if (typeof data === 'number') setSecondsLeft(data);
            } catch (error) {
                console.error("Error processing seconds left:", error);
            }
        });

        // Total seconds passed listener
        const totalRef = ref(database, `tournaments/${tournamentId}/totalSecondsPassed`);
        const unsubscribeTotal = onValue(totalRef, (snapshot) => {
            try {
                const data = snapshot.val();
                if (typeof data === 'number') setTotalSecondsPassed(data);
            } catch (error) {
                console.error("Error processing total seconds passed:", error);
            }
        });

        // Clean up all listeners on component unmount
        return () => {
            unsubscribePlayers();
            unsubscribeStages();
            unsubscribeIndex();
            unsubscribeSeconds();
            unsubscribeTotal();
        };
    }, [tournamentId]);

    // Speech synthesis initialization
    useEffect(() => {
        const handleVoicesChanged = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        handleVoicesChanged(); // Initial call

        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            window.speechSynthesis.cancel(); // Cancel any ongoing speech on unmount
        };
    }, []);

    // Save stages to localStorage when they change
    useEffect(() => {
        localStorage.setItem('tournamentTemplate', JSON.stringify(stages));
    }, [stages]);

    // Sync current stage index to Firebase
    useEffect(() => {
        try {
            set(ref(database, `tournaments/${tournamentId}/currentStageIndex`), currentStageIndex);
        } catch (error) {
            console.error("Failed to update currentStageIndex in Firebase:", error);
        }
    }, [currentStageIndex, tournamentId]);

    // Sync seconds left to Firebase
    useEffect(() => {
        try {
            set(ref(database, `tournaments/${tournamentId}/secondsLeft`), secondsLeft);
        } catch (error) {
            console.error("Failed to update secondsLeft in Firebase:", error);
        }
    }, [secondsLeft, tournamentId]);

    // Sync total seconds passed to Firebase
    useEffect(() => {
        try {
            set(ref(database, `tournaments/${tournamentId}/totalSecondsPassed`), totalSecondsPassed);
        } catch (error) {
            console.error("Failed to update totalSecondsPassed in Firebase:", error);
        }
    }, [totalSecondsPassed, tournamentId]);

    // Timer logic
    useEffect(() => {
        if (!tournamentStarted) return;

        const interval = setInterval(() => {
            setTotalSecondsPassed(prev => prev + 1);

            if (!isPaused) {
                setSecondsLeft(prev => {
                    if (prev === 4 && !countdownPlayed) {
                        try {
                            countdownSound.current.play()
                                .catch(err => console.error("Failed to play countdown sound:", err));
                            setCountdownPlayed(true);
                        } catch (error) {
                            console.error("Error playing countdown sound:", error);
                        }
                    }

                    if (prev > 0) return prev - 1;

                    if (!stageAdvancePending.current) {
                        stageAdvancePending.current = true;

                        // Delay advancing to next stage
                        setTimeout(() => {
                            advanceStage();
                        }, 500);
                    }

                    return 0;
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [tournamentStarted, isPaused, countdownPlayed]);

    // Speech for current stage
    useEffect(() => {
        if (!tournamentStarted || !speechAllowed || !currentStage) return;

        if (currentStage.break) {
            speak('הפסקה');
        } else if (typeof currentStage.smallBlind === 'number' && typeof currentStage.bigBlind === 'number') {
            speak(`שמאל ${currentStage.smallBlind}, ביג ${currentStage.bigBlind}`);
        }
    }, [currentStageIndex, speechAllowed, currentStage, tournamentStarted]);

    // Speech synthesis function
    const speak = useCallback((text) => {
        if (!speechAllowed || !text) return;

        try {
            window.speechSynthesis.cancel(); // Stop any previous speech
            const utterance = new SpeechSynthesisUtterance();
            utterance.lang = 'he-IL';
            utterance.text = text;

            const hebrewVoice = voices.find(v => v.lang.includes('he') || v.lang.includes('iw'));

            if (hebrewVoice) {
                utterance.voice = hebrewVoice;
                window.speechSynthesis.speak(utterance);
            } else {
                console.log('No Hebrew voice found on this device');
            }
        } catch (error) {
            console.error("Speech synthesis error:", error);
        }
    }, [speechAllowed, voices]);

    // Start tournament function
    const startTournament = () => {
        setSpeechAllowed(true);
        setTournamentStarted(true);
        setIsPaused(false);
        setMessage('✅ הטורניר התחיל! בהצלחה לכולם');
    };

    // Advance to next stage
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

    // Format time function
    const formatTime = (totalSeconds) => {
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    // Get stage progress
    const getStageProgress = () => {
        if (!currentStage) return 0;
        const stageDurationInSeconds = currentStage.duration * 60;
        const progress = ((stageDurationInSeconds - secondsLeft) / stageDurationInSeconds) * 100;
        return Math.min(100, Math.max(0, progress));
    };

    // Jump to position in timer
    const jumpToPosition = (e) => {
        try {
            const bar = e.target;
            const rect = bar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newProgress = clickX / rect.width;
            const totalSeconds = currentStage.duration * 60;
            setSecondsLeft(Math.max(0, totalSeconds - Math.floor(newProgress * totalSeconds)));
        } catch (error) {
            console.error("Error in jumpToPosition:", error);
        }
    };

    // Toggle pause
    const togglePause = () => {
        setIsPaused(prev => !prev);
    };

    // Add player function
    const addPlayer = async () => {
        try {
            const name = newPlayerName.trim();
            if (!name) {
                setMessage('❌ יש להכניס שם שחקן');
                return;
            }

            // Check for duplicates
            const nameExists = players.some(p => p.name === name);
            if (nameExists) {
                setMessage('⚠️ שחקן בשם הזה כבר קיים');
                return;
            }

            const newPlayer = {
                name,
                image: newPlayerImage,
                eliminated: false
            };

            const playerRef = push(ref(database, `tournaments/${tournamentId}/players`));
            await set(playerRef, newPlayer);

            setNewPlayerName('');
            setNewPlayerImage(null);
            setMessage('✅ שחקן נוסף בהצלחה!');
        } catch (error) {
            console.error("Error adding player:", error);
            setMessage(`❌ שגיאה בהוספת שחקן: ${error.message}`);
        }
    };

    // Toggle elimination function - FIXED
    const toggleElimination = async (playerId) => {
        try {
            if (!playerId) {
                setDebugLog('❌ playerId is undefined');
                return;
            }

            // First verify the player exists in the database
            const playerRef = ref(database, `tournaments/${tournamentId}/players/${playerId}`);
            const snapshot = await get(playerRef);

            if (!snapshot.exists()) {
                setDebugLog(`❌ שחקן לא נמצא בדאטהבייס עם id ${playerId}`);
                return;
            }

            const playerData = snapshot.val();

            // Update elimination status
            await update(playerRef, {
                eliminated: !playerData.eliminated
            });

            setDebugLog(`✅ הדחה: ${playerData.name} (${playerId})`);

        } catch (error) {
            console.error("Error toggling player elimination:", error);
            setDebugLog(`❌ שגיאה בעדכון מצב שחקן: ${error.message}`);
        }
    };

    // Start editing stage
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
        setShowStageForm(true);
    };

    return (
        <div style={{ backgroundColor: '#0e0e0e', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: 'white', marginTop: '1rem', fontSize: '0.8rem' }}>
                Debug: {debugLog}
            </div>

            {!tournamentStarted && (
                <button
                    onClick={startTournament}
                    style={buttonStyle}
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
                            tournamentId={tournamentId}
                        />
                    )}
                </div>

                <div className="tournament-players">
                    <PlayersList
                        players={players}
                        toggleElimination={toggleElimination}
                    />

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
                        tournamentId={tournamentId}
                    />
                </div>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ffffff', marginTop: '1rem' }}>
                {tournamentId} : מזהה חדר
            </div>

            <button
                onClick={() => navigate('/')}
                style={buttonStyle}
            >
                חזרה לעמוד הבית
            </button>
        </div>
    );
}

// Styles
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
    display: 'inline-block',
    textAlign: 'center',
    width: 'auto',
    border: 'none'
};