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
      <div style={boxStyle}>
        <h3 style={headerStyle}>הוספת שחקן</h3>
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
        <button onClick={handleSubmit} style={buttonStyle}>➕ הוסף שחקן</button>
      </div>
  );
}

const boxStyle = {
  background: '#1a1a1a',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 0 10px #000',
  flex: 1,
  minWidth: '300px',
  color: '#fff',
  marginBottom: '1.5rem'
};

const headerStyle = {
  textAlign: 'center',
  color: '#d4af37',
  marginBottom: '1rem'
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
  boxSizing: 'border-box'
};

const buttonStyle = {
  fontSize: '16px',
  padding: '12px',
  marginTop: '15px',
  width: '100%',
  background: '#4285f4',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default AddPlayerForm;
