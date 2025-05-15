import { useState } from 'react';

function AddPlayerForm({ onAdd }) {
  const [name, setName] = useState('');
  const [buyIn, setBuyIn] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !buyIn.trim()) return;
    onAdd(name, buyIn);
    setName('');
    setBuyIn('');
  };

  return (
      <div style={sectionBoxStyle}>
        <h2 style={sectionTitleStyle}>הוספת שחקן</h2>
        <input
            type="text"
            placeholder="שם שחקן"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
        />
        <input
            type="number"
            placeholder="כמה כסף הכניס"
            value={buyIn}
            onChange={e => setBuyIn(e.target.value)}
            style={inputStyle}
        />
        <button onClick={handleSubmit} style={buttonStyle}>הוסף שחקן</button>
      </div>
  );
}

const sectionBoxStyle = {
  background: '#1a1a1a',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
  color: '#ffffff',
  margin: '2rem auto 1rem',
  minWidth: '300px',
  maxWidth: '600px'

};

const sectionTitleStyle = {
  textAlign: 'center',
  color: '#fff',
  fontSize: '1.5rem',
  marginBottom: '1rem',
  borderBottom: '1px solid #d4af37',
  paddingBottom: '0.5rem'
};

const inputStyle = {
  fontSize: '16px',
  padding: '10px',
  marginTop: '10px',
  width: '100%',
  borderRadius: '5px',
  border: '1px solid #555',
  background: '#0e0e0e',
  color: '#fff',
  boxSizing: 'border-box',
  textAlign: 'center'
};

const buttonStyle = {
  fontSize: '16px',
  padding: '12px',
  marginTop: '15px',
  width: '100%',
  background: '#d4af37',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default AddPlayerForm;
