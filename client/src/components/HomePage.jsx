import React from 'react';

export default function HomePage({ onStart, onLogout, onStartLobby }) {
    const btnStyle = {
        background: '#d4af37', color: '#000', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'
    };
    const sectionStyle = { maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' };

    return (
        <div style={{ background: '#0e0e0e', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                <nav style={{ display: 'flex', gap: '1.5rem' }}>
                    <a href="#" onClick={onStartLobby} style={{ color: '#fff', textDecoration: 'none' }}>History</a>
                </nav>
                <button onClick={onLogout} style={{ background: '#f44336', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>התנתק</button>
            </header>

            {/* Hero Section */}
            <section style={{ ...sectionStyle, textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <img src="/ChipManagerLogo.png" alt="ChipManager Logo" style={{ height: 100 }} />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Manage Your Poker Nights Like a Pro</h1>
                <p style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Take control of your home games — track buy-ins, balances, and player stats, all in one place.
                </p>
                <button style={btnStyle} onClick={onStart}>Start a Game</button>
            </section>

            {/* Recent Games */}
            <section style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Recent Games</h2>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', overflow: 'hidden' }}>
                    {['Friday Night Game', 'Birthday Special', 'Weekly Home Game', 'Chips & Beer Night'].map((name, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #333' }}>
                            <span>{name}</span>
                            <span style={{ color: '#aaa' }}>{idx === 0 ? 'Completed' : idx === 1 ? 'In Progress' : 'View Summary'}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Choose Us */}
            <section style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Why Choose Us</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                    {[
                        ['Easy Player Management', '🧑‍🤝‍🧑'],
                        ['Game History Tracking', '🗂️'],
                        ['Fair Settlements', '🎯'],
                        ['Cross-Device Access', '📱💻']
                    ].map(([title, icon], i) => (
                        <div key={i} style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '10px', width: '200px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
                            <strong>{title}</strong>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it Works */}
            <section style={sectionStyle}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>How It Works</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '2rem' }}>🖥️</div>
                        <p>Create a Room</p>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem' }}>🃏</div>
                        <p>Invite Players</p>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem' }}>📊</div>
                        <p>Track Buy-in & Results</p>
                    </div>
                </div>
            </section>

            <footer style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                &copy; 2025 ChipManager. All rights reserved.
            </footer>
        </div>
    );
}