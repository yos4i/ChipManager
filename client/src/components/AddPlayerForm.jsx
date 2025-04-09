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
      <h3>הוספת שחקן</h3>
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
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 0 5px #ccc',
  flex: 1,
  minWidth: '300px'
};

const inputStyle = {
  fontSize: '16px',
  padding: '10px',
  marginTop: '10px',
  width: '100%',
  boxSizing: 'border-box'
};

const buttonStyle = {
  fontSize: '16px',
  padding: '10px',
  marginTop: '10px',
  width: '100%',
  background: '#4285f4',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};

export default AddPlayerForm;

