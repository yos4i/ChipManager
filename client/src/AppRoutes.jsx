import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import HistoryPage from './components/HistoryPage';
import RoomPage from './components/RoomPage';
import { createRoom } from './firebase'; // ודא שהפונקציה קיימת

export default function AppRoutes() {
    const [uid, setUid] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
            } else {
                setUid(null);

                // אל תעביר ל-login אם הוא רק נכנס לחדר כצופה
                const path = window.location.pathname;
                if (!path.startsWith('/room/')) {
                    navigate('/login');
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    if (loading) {
        return (
            <div style={{
                background: '#0e0e0e',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <img src="/Mylogo.png" alt="Loading..." style={{ height: 100 }} />
            </div>
        );
    }

    return (
        <Routes>
            {/* Login page */}
            <Route
                path="/login"
                element={
                    <LoginPage
                        onLogin={(uid) => {
                            setUid(uid);
                            navigate('/');
                        }}
                    />
                }
            />

            {/* Home page */}
            <Route
                path="/"
                element={
                    uid ? (
                        <HomePage
                            onStart={async () => {
                                const roomId = await createRoom();
                                navigate(`/room/${roomId}`);
                            }}
                            onLogout={async () => {
                                await auth.signOut();
                                setUid(null);
                                navigate('/login');
                            }}
                            onStartLobby={() => navigate('/history')}
                        />
                    ) : (
                        <LoginPage onLogin={(uid) => {
                            setUid(uid);
                            navigate('/');
                        }} />
                    )
                }
            />

            {/* Room */}
            <Route path="/room/:roomId" element={<RoomPage />} />

            {/* History */}
            <Route path="/history" element={<HistoryPage onSelectRoom={(id) => navigate(`/room/${id}`)} />} />
        </Routes>
    );
}
