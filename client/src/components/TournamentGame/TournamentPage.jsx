// Fully Refactored TournamentPage.js with Isolated Firebase Data
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

export default function TournamentPage() {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const [debugLog, setDebugLog] = useState('');

    // Tournament State
    const [tournamentData, setTournamentData] = useState({
        stages: [],
        currentStageIndex: 0,
        secondsLeft: 0,
        totalSecondsPassed: 0,
        tournamentStarted: false,
        isPaused: true
    });

    // Extract values from tournamentData for easier access
    const {
        stages,
        currentStageIndex,
        secondsLeft,
        totalSecondsPassed,
        tournamentStarted,
        isPaused
    } = tournamentData;

    // Current stage reference
    const currentStage = stages[currentStageIndex];

    // Countdown
    const countdownSound = useRef(new Audio('/countdown.mp3'));
    const [countdownPlayed, setCountdownPlayed] = useState(false);

    // Other States
    const [speechAllowed, setSpeechAllowed] = useState(false);
    const [voices, setVoices] = useState([]);
    const stageAdvancePending = useRef(false);

    // Players
    const [players, setPlayers] = useState([]);

    // Form States
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerImage, setNewPlayerImage] = useState(null);
    const [message, setMessage] = useState('');
    const [newStage, setNewStage] = useState({ smallBlind: '', bigBlind: '', ante: '', duration: '' });
    const [editIndex, setEditIndex] = useState(null);
    const [lastClickedIndex, setLastClickedIndex] = useState(null);
    const [editingMode, setEditingMode] = useState(false);
    const [showStageForm, setShowStageForm] = useState(false);
    const [customTemplateName, setCustomTemplateName] = useState('');

    // Initialize or load tournament data
    useEffect(() => {
        const loadTournamentData = async () => {
            try {
                // Check if tournament exists
                const tournamentRef = ref(database, `tournaments/${tournamentId}`);
                const snapshot = await get(tournamentRef);

                if (!snapshot.exists()) {
                    // Initialize tournament with default values if it doesn't exist
                    await set(tournamentRef, {
                        stages: [],
                        currentStageIndex: 0,
                        secondsLeft: 0,
                        totalSecondsPassed: 0,
                        tournamentStarted: false,
                        isPaused: true,
                        createdAt: Date.now()
                    });

                    setDebugLog("Created new tournament room");
                }
            } catch (error) {
                console.error("Error initializing tournament data:", error);
                setDebugLog(`Error: ${error.message}`);
            }
        };

        loadTournamentData();
    }, [tournamentId]);

    // Set up Firebase listeners for tournament data
    useEffect(() => {
        const tournamentRef = ref(database, `tournaments/${tournamentId}`);

        const unsubscribe = onValue(tournamentRef, (snapshot) => {
            try {
                const data = snapshot.val();
                if (!data) return;

                // Update tournament data states
                setTournamentData(prevData => ({
                    stages: data.stages || prevData.stages,
                    currentStageIndex: typeof data.currentStageIndex === 'number' ? data.currentStageIndex : prevData.currentStageIndex,
                    secondsLeft: typeof data.secondsLeft === 'number' ? data.secondsLeft : prevData.secondsLeft,
                    totalSecondsPassed: typeof data.totalSecondsPassed === 'number' ? data.totalSecondsPassed : prevData.totalSecondsPassed,
                    tournamentStarted: Boolean(data.tournamentStarted),
                    isPaused: typeof data.isPaused === 'boolean' ? data.isPaused : prevData.isPaused
                }));
            } catch (error) {
                console.error("Error processing tournament data:", error);
                setDebugLog(`Error loading tournament data: ${error.message}`);
            }
        });

        return () => unsubscribe();
    }, [tournamentId]);

    // Players listener
    useEffect(() => {
        const playersRef = ref(database, `tournaments/${tournamentId}/players`);

        const unsubscribe = onValue(playersRef, (snapshot) => {
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

        return () => unsubscribe();
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

    // Timer logic
    useEffect(() => {
        if (!tournamentStarted) return;

        const interval = setInterval(() => {
            try {
                // Update totalSecondsPassed
                updateTournamentField('totalSecondsPassed', prev => prev + 1);

                if (!isPaused) {
                    updateTournamentField('secondsLeft', prev => {
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
            } catch (error) {
                console.error("Error in timer interval:", error);
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

    // Update a single tournament field in Firebase
    const updateTournamentField = useCallback(async (field, valueOrUpdater) => {
        try {
            const fieldRef = ref(database, `tournaments/${tournamentId}/${field}`);

            // Handle function updater or direct value
            let newValue;
            if (typeof valueOrUpdater === 'function') {
                const snapshot = await get(fieldRef);
                const currentValue = snapshot.exists() ? snapshot.val() : 0;
                newValue = valueOrUpdater(currentValue);
            } else {
                newValue = valueOrUpdater;
            }

            await set(fieldRef, newValue);

            // Also update local state
            setTournamentData(prev => ({
                ...prev,
                [field]: newValue
            }));

            return newValue;
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            setDebugLog(`Failed to update ${field}: ${error.message}`);
            return null;
        }
    }, [tournamentId]);

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
    const startTournament = async () => {
        try {
            await updateTournamentField('tournamentStarted', true);
            await updateTournamentField('isPaused', false);
            setSpeechAllowed(true);

            // If there are stages and secondsLeft is 0, initialize it
            if (stages.length > 0 && secondsLeft === 0) {
                await updateTournamentField('secondsLeft', stages[0].duration * 60);
            }

            setMessage('✅ הטורניר התחיל! בהצלחה לכולם');
        } catch (error) {
            console.error("Error starting tournament:", error);
            setMessage(`❌ שגיאה בהתחלת הטורניר: ${error.message}`);
        }
    };

    // Advance to next stage
    const advanceStage = async () => {
        try {
            const nextIndex = currentStageIndex + 1;

            if (nextIndex < stages.length) {
                await updateTournamentField('currentStageIndex', nextIndex);
                await updateTournamentField('secondsLeft', stages[nextIndex].duration * 60);
                setCountdownPlayed(false);
                stageAdvancePending.current = false;
            } else {
                alert('הטורניר הסתיים!');
                navigate('/');
            }
        } catch (error) {
            console.error("Error advancing stage:", error);
            setDebugLog(`Error advancing stage: ${error.message}`);
        }
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
    const jumpToPosition = async (e) => {
        try {
            if (!currentStage) return;

            const bar = e.target;
            const rect = bar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newProgress = clickX / rect.width;
            const totalSeconds = currentStage.duration * 60;
            const newSecondsLeft = Math.max(0, totalSeconds - Math.floor(newProgress * totalSeconds));

            await updateTournamentField('secondsLeft', newSecondsLeft);
        } catch (error) {
            console.error("Error in jumpToPosition:", error);
        }
    };

    // Toggle pause
    const togglePause = async () => {
        try {
            await updateTournamentField('isPaused', !isPaused);
        } catch (error) {
            console.error("Error toggling pause:", error);
        }
    };

    // Set stages
    const updateStages = async (newStages) => {
        try {
            await set(ref(database, `tournaments/${tournamentId}/stages`), newStages);
        } catch (error) {
            console.error("Error updating stages:", error);
            setDebugLog(`Failed to update stages: ${error.message}`);
        }
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

    // Toggle elimination function
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
        if (!stages[index]) return;

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
                            setStages={updateStages}  // Use Firebase updater
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
                        setStages={updateStages}  // Use Firebase updater
                        setCurrentStageIndex={(index) => updateTournamentField('currentStageIndex', index)}
                        setSecondsLeft={(seconds) => updateTournamentField('secondsLeft', seconds)}
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