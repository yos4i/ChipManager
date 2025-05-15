import React from 'react';

export default function PlayerForm({
                                       newPlayerName,
                                       setNewPlayerName,
                                       setNewPlayerImage,
                                       addPlayer,
                                       inputStyle,
                                       buttonStyle
                                   }) {
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPlayerImage(reader.result); // base64
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <input
                type="text"
                placeholder="שם שחקן"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                style={inputStyle}
            />
            <br />
            <label
                style={{
                    background: '#d4af37',
                    color: '#000',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    display: 'inline-block'
                }}
            >
                בחר תמונה
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <br />
            <button onClick={addPlayer} style={buttonStyle}>
                הוסף שחקן
            </button>
        </div>
    );
}
