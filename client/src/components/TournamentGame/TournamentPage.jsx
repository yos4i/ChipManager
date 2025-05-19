// Fully Refactored TournamentPage.js with Fixed ESLint Warnings and Speech Issue
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

    // Refs - defined at component level (not inside hooks)
    const countdownSound = useRef(new Audio('/countdown.mp3'));
    const stageAdvancePending = useRef(false);
    const stageAnnouncementRef = useRef(false);

    // Countdown
    const [countdownPlayed, setCountdownPlayed] = useState(false);

    // Other States
    const [speechAllowed, setSpeechAllowed] = useState(false);
    const [voices, setVoices] = useState([]);

    // Players
    const [players, setPlayers] = useState([]);
    const startAddStage = () => {
        setEditingMode(false);
        setEditIndex(null);
        setLastClickedIndex(null);
        setNewStage({ smallBlind: '', bigBlind: '', ante: '', duration: '' });
        setShowStageForm(true);
    };

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

    // Advance to next stage - defined before being used in useEffect
    const advanceStage = useCallback(async () => {
        try {
            const nextIndex = currentStageIndex + 1;

            if (nextIndex < stages.length) {
                await updateTournamentField('currentStageIndex', nextIndex);
                await updateTournamentField('secondsLeft', stages[nextIndex].duration * 60);
                const nextStage = stages[nextIndex];
                const speechRef = ref(database, `tournaments/${tournamentId}/speechQueue`);

                if (nextStage.break) {
                    await set(speechRef, {
                        message: "הפסקה",
                        timestamp: Date.now()
                    });
                } else {
                    await set(speechRef, {
                        message: `שמאל ${nextStage.smallBlind}, ביג ${nextStage.bigBlind}`,
                        timestamp: Date.now()
                    });
                }

                setCountdownPlayed(false);
                stageAdvancePending.current = false;
                // Reset the stage announcement flag when advancing
                stageAnnouncementRef.current = false;
            } else {
                alert('הטורניר הסתיים!');
                navigate('/');
            }
        } catch (error) {
            console.error("Error advancing stage:", error);
        }
    }, [currentStageIndex, navigate, stages, updateTournamentField]);

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

                }
            } catch (error) {
                console.error("Error initializing tournament data:", error);
            }
        };

        loadTournamentData();
        // We intentionally don't include the async function in dependencies
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
    }, [tournamentStarted, isPaused, countdownPlayed, updateTournamentField, advanceStage]);

    // Speech for current stage - FIXED to avoid infinite loop

    // Start tournament function
    const startTournament = async () => {
        try {
            await updateTournamentField('tournamentStarted', true);
            await updateTournamentField('isPaused', false);
            setSpeechAllowed(true);

            stageAnnouncementRef.current = false; // 👈 חשוב!

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
            const playerRef = ref(database, `tournaments/${tournamentId}/players/${playerId}`);
            const snapshot = await get(playerRef);

            if (!snapshot.exists()) return;

            const playerData = snapshot.val();
            const newStatus = !playerData.eliminated;

            await update(playerRef, {
                eliminated: newStatus
            });

            // רק אם הודח עכשיו – שלח "אירוע דיבור" לפיירבייס
            if (newStatus) {
                await set(ref(database, `tournaments/${tournamentId}/eliminationSpeech`), {
                    name: playerData.name,
                    timestamp: Date.now()
                });
            }

        } catch (error) {
            console.error("Error toggling player elimination:", error);
        }
    };

    useEffect(() => {
        if (!speechAllowed) return;

        const speechRef = ref(database, `tournaments/${tournamentId}/speechQueue`);
        let lastSpoken = 0;

        const unsubscribe = onValue(speechRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.timestamp > lastSpoken) {
                lastSpoken = data.timestamp;
                speak(data.message);
            }
        });

        return () => unsubscribe();
    }, [tournamentId, speechAllowed, speak]);

    useEffect(() => {
        const enableSpeech = () => {
            console.log('👂 הפעלת קריינות אוטומטית'); // לבדיקה
            setSpeechAllowed(true);
            window.removeEventListener('click', enableSpeech);
        };

        window.addEventListener('click', enableSpeech);

        return () => {
            window.removeEventListener('click', enableSpeech);
        };
    }, []);


    useEffect(() => {
        if (!speechAllowed) return;

        const refSpeech = ref(database, `tournaments/${tournamentId}/eliminationSpeech`);
        let lastTimestamp = 0;

        const unsubscribe = onValue(refSpeech, (snapshot) => {
            const data = snapshot.val();
            if (data && data.timestamp > lastTimestamp) {
                lastTimestamp = data.timestamp;
                if (data.name) {
                    speak(`${data.name} הודח`);
                }
            }
        });

        return () => unsubscribe();
    }, [tournamentId, speechAllowed, speak]);


    // useEffect(() => {
    //     if (!tournamentStarted || !speechAllowed || !currentStage) return;
    //
    //     // Only speak if we haven't announced this stage yet
    //     if (!stageAnnouncementRef.current) {
    //         if (currentStage.break) {
    //             speak('הפסקה');
    //         } else if (typeof currentStage.smallBlind === 'number' && typeof currentStage.bigBlind === 'number') {
    //             speak(`שמאל ${currentStage.smallBlind}, ביג ${currentStage.bigBlind}`);
    //         }
    //         // Mark this stage as announced
    //         stageAnnouncementRef.current = true;
    //     }
    //
    //     // This effect depends on speak
    // }, [currentStageIndex, speechAllowed, currentStage, tournamentStarted, speak]);


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
                        startAddStage={startAddStage}
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

            {!speechAllowed && (
                <button onClick={() => setSpeechAllowed(true)} style={buttonStyle}>
                    🎙️ הפעל קריינות
                </button>
            )}

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