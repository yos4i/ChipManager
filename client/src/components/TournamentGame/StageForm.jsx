import React from 'react';

export default function StageForm({
                                      newStage,
                                      setNewStage,
                                      editingMode,
                                      editIndex,
                                      lastClickedIndex,
                                      setEditIndex,
                                      setLastClickedIndex,
                                      setEditingMode,
                                      setShowStageForm,
                                      setStages,
                                      stages,
                                      setMessage,
                                      buttonStyle
                                  }) {
    const addStage = async () => {
        if (!newStage.duration) {
            setMessage('❌ יש להזין זמן שלב או הפסקה');
            setEditingMode(false);
            setShowStageForm(false);
            return;
        }

        const isBreak = !newStage.smallBlind && !newStage.bigBlind;
        const stage = isBreak
            ? { break: true, duration: Number(newStage.duration) }
            : {
                smallBlind: Number(newStage.smallBlind),
                bigBlind: Number(newStage.bigBlind),
                ante: Number(newStage.ante) || 0,
                duration: Number(newStage.duration),
            };

        let updatedStages = [...stages];

        if (editingMode && editIndex !== null) {
            updatedStages[editIndex] = stage;
            setMessage('✅ שלב עודכן בהצלחה');
        } else if (lastClickedIndex !== null) {
            updatedStages.splice(lastClickedIndex + 1, 0, stage);
            setMessage(isBreak ? '☕ הפסקה נוספה לאחר שלב נבחר' : '✅ שלב נוסף לאחר שלב נבחר');
        } else {
            updatedStages.push(stage);
            setMessage(isBreak ? '☕ הפסקה נוספה' : '✅ שלב נוסף בהצלחה');
        }

        // שמירה בפועל ל־Firebase
        await setStages(updatedStages);

        // איפוס מצבים
        setNewStage({ smallBlind: '', bigBlind: '', ante: '', duration: '' });
        setEditIndex(null);
        setLastClickedIndex(null);
        setEditingMode(false);
        setShowStageForm(false);
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <h4>{editingMode ? 'עריכת שלב' : 'הוספת שלב'}</h4>
            <input
                type="number"
                placeholder="Small Blind"
                value={newStage.smallBlind}
                onChange={(e) => setNewStage({ ...newStage, smallBlind: e.target.value })}
                style={inputStyle}
            />
            <input
                type="number"
                placeholder="Big Blind"
                value={newStage.bigBlind}
                onChange={(e) => setNewStage({ ...newStage, bigBlind: e.target.value })}
                style={inputStyle}
            />
            <input
                type="number"
                placeholder="Ante (אופציונלי)"
                value={newStage.ante}
                onChange={(e) => setNewStage({ ...newStage, ante: e.target.value })}
                style={inputStyle}
            />
            <input
                type="number"
                placeholder="משך זמן (בדקות)"
                value={newStage.duration}
                onChange={(e) => setNewStage({ ...newStage, duration: e.target.value })}
                style={inputStyle}
            />
            <br />
            <button onClick={addStage} style={buttonStyle}>אישור</button>
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
