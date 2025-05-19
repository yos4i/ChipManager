import React from 'react';
import {
    database,
    ref,
    get
    // set
} from '../../firebase';

export default function TournamentTemplates({
                                                setStages,
                                                setCurrentStageIndex,
                                                setSecondsLeft,
                                                setMessage,
                                                tournamentStarted,
                                                buttonStyle
                                            }) {
    // טען תבנית "טורניר קלאסי" מ־Firebase
    const loadClassicTemplate = async () => {
        try {
            const snapshot = await get(ref(database, 'tournamentTemplates/classic'));
            if (snapshot.exists()) {
                const data = snapshot.val();
                setStages(data.stages || []);
                setCurrentStageIndex(0);
                setSecondsLeft((data.stages?.[0]?.duration || 0) * 60);
                setMessage('✅ נטענה תבנית טורניר קלאסי');
            } else {
                setMessage('❌ לא נמצאה תבנית טורניר קלאסי');
            }
        } catch (error) {
            console.error('שגיאה בטעינת תבנית:', error);
            setMessage('❌ שגיאה בטעינה: ' + error.message);
        }
    };


    // const saveClassicTemplate = async () => {
    //     try {
    //         await set(ref(database, 'tournamentTemplates/classic'), {
    //             stages: [
    //                 { smallBlind: 10, bigBlind: 20, ante: 0, duration: 15 },
    //                 { smallBlind: 20, bigBlind: 40, ante: 0, duration: 15 },
    //                 { smallBlind: 30, bigBlind: 60, ante: 0, duration: 15 },
    //                 { smallBlind: 40, bigBlind: 80, ante: 0, duration: 15 },
    //                 { smallBlind: 50, bigBlind: 100, ante: 0, duration: 15 },
    //                 { smallBlind: 75, bigBlind: 150, ante: 0, duration: 15 },
    //                 { smallBlind: 100, bigBlind: 200, ante: 0, duration: 15 },
    //                 { smallBlind: 150, bigBlind: 300, ante: 0, duration: 15 },
    //                 { break: true, duration: 10 },
    //                 { smallBlind: 200, bigBlind: 400, ante: 0, duration: 15 },
    //                 { smallBlind: 250, bigBlind: 500, ante: 0, duration: 15 },
    //                 { smallBlind: 300, bigBlind: 600, ante: 0, duration: 15 },
    //                 { smallBlind: 400, bigBlind: 800, ante: 0, duration: 15 },
    //                 { smallBlind: 500, bigBlind: 1000, ante: 0, duration: 15 },
    //                 { smallBlind: 600, bigBlind: 1200, ante: 0, duration: 15 },
    //                 { smallBlind: 800, bigBlind: 1600, ante: 0, duration: 15 },
    //                 { smallBlind: 1000, bigBlind: 2000, ante: 0, duration: 15 },
    //             ]
    //         });
    //         setMessage('✅ נשמרה תבנית "טורניר קלאסי" לפיירבייס');
    //     } catch (error) {
    //         console.error('שגיאה בשמירת תבנית:', error);
    //         setMessage('❌ שגיאה בשמירה: ' + error.message);
    //     }
    // };

    return (
        <div style={{ marginTop: '1rem' }}>
            {!tournamentStarted && (
                <>
                    <button onClick={loadClassicTemplate} style={buttonStyle}>
                        טען טורניר
                    </button>

                    {/* שמירה זמנית – אפשר למחוק לאחר הרצה חד־פעמית */}
                    {/*{<button onClick={saveClassicTemplate} style={buttonStyle}>*/}
                    {/*    שמור טורניר קלאסי*/}
                    {/*</button>}*/}
                </>
            )}
        </div>
    );
}
