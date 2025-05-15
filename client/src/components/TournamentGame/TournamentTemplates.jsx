import React from 'react';

export default function TournamentTemplates({
                                                customTemplateName,
                                                setCustomTemplateName,
                                                stages,
                                                setStages,
                                                setCurrentStageIndex,
                                                setSecondsLeft,
                                                setMessage,
                                                tournamentStarted,
                                                buttonStyle,
                                                inputStyle
                                            }) {
    const templateOptions = {
        '4 שעות טורניר': [
            { smallBlind: 100, bigBlind: 200, ante: 0, duration: 20 },
            { smallBlind: 150, bigBlind: 300, ante: 0, duration: 20 },
            { break: true, duration: 10 },
            { smallBlind: 200, bigBlind: 400, ante: 0, duration: 20 },
            { smallBlind: 300, bigBlind: 600, ante: 0, duration: 20 },
        ]
    };

    const saveCustomTemplate = (name) => {
        const existing = JSON.parse(localStorage.getItem('customTemplates') || '{}');
        existing[name] = stages;
        localStorage.setItem('customTemplates', JSON.stringify(existing));
        setMessage(`✅ נשמרה תבנית בשם "${name}"`);
    };

    const getAllTemplates = () => {
        const custom = JSON.parse(localStorage.getItem('customTemplates') || '{}');
        return { ...templateOptions, ...custom };
    };

    const handleTemplateSelect = (e) => {
        const selected = e.target.value;
        const allTemplates = getAllTemplates();
        if (allTemplates[selected]) {
            setStages(allTemplates[selected]);
            setCurrentStageIndex(0);
            setSecondsLeft(allTemplates[selected][0]?.duration * 60 || 0);
            setMessage(`✅ נטענה תבנית: ${selected}`);
        }
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <input
                type="text"
                placeholder="שם תבנית מותאמת"
                value={customTemplateName}
                onChange={(e) => setCustomTemplateName(e.target.value)}
                style={inputStyle}
            />
            <button
                onClick={() => saveCustomTemplate(customTemplateName)}
                style={buttonStyle}
            >
                שמור תבנית
            </button>

            {!tournamentStarted && (
                <div style={{ marginBottom: '1rem' }}>
                    <select onChange={handleTemplateSelect} style={inputStyle}>
                        <option value="">בחר תבנית טורניר</option>
                        {Object.keys(getAllTemplates()).map((key, idx) => (
                            <option key={idx} value={key}>{key}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
