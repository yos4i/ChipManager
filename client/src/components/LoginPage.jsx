import React, { useState } from 'react';
import { register, login, doesRoomExist } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [guestError, setGuestError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            let user;
            if (isRegistering) {
                user = await register(email, password, name);
            } else {
                user = await login(email, password);
            }
            localStorage.setItem('uid', user.uid);
            onLogin(user.uid);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGuestJoin = async () => {
        const code = roomCode.trim().toLowerCase();
        setGuestError('');
        if (code.length !== 4) {
            setGuestError('המזהה חייב להיות באורך 4 תווים');
            return;
        }
        const exists = await doesRoomExist(code);
        if (!exists) {
            setGuestError('החדר לא קיים');
            return;
        }
        navigate(`/room/${code}`);
    };

    return (
        <div style={{
            background: '#0e0e0e',
            color: '#fff',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'sans-serif',
            flexDirection: 'column',
            paddingTop: '2rem'
        }}>
            <form onSubmit={handleSubmit} style={{
                background: '#1a1a1a',
                padding: '2rem',
                borderRadius: '8px',
                width: '300px'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>{isRegistering ? 'Register' : 'Login'}</h2>

                {isRegistering && (
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={inputStyle}
                    />
                )}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                />

                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                <button type="submit" style={{ ...buttonStyle, width: '100%', marginTop: '1rem' }}>
                    {isRegistering ? 'Register' : 'Login'}
                </button>

                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                    {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <span
                        style={{ color: '#d4af37', cursor: 'pointer' }}
                        onClick={() => setIsRegistering(!isRegistering)}
                    >
            {isRegistering ? 'Login' : 'Register'}
          </span>
                </p>
            </form>

            {/* הצטרפות כצופה */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <h4>או הצטרף כצופה</h4>
                <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="קוד חדר (4 תווים)"
                    maxLength={4}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        width: '200px',
                        textAlign: 'center',
                        fontSize: '1rem',
                        border: '1px solid #888'
                    }}
                />
                <br />
                <button
                    onClick={handleGuestJoin}
                    style={{
                        marginTop: '0.5rem',
                        background: '#d4af37',
                        color: '#000',
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    הצטרף לחדר
                </button>
                {guestError && <p style={{ color: 'red' }}>{guestError}</p>}
            </div>
        </div>
    );
}

const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '10px',
    margin: '0.5rem 0',
    borderRadius: '6px',
    border: '1px solid #ccc'
};

const buttonStyle = {
    background: '#d4af37',
    color: '#000',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer'
};
