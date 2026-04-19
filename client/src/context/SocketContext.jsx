import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to the deployed server, not localhost
        const SERVER_URL = import.meta.env.VITE_API_URL 
            ? import.meta.env.VITE_API_URL.replace('/api', '') 
            : 'http://localhost:5000';
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (socket && user) {
            socket.emit('joinRoom', user._id);
            
            socket.on('attendanceReminder', (data) => {
                // In a real app we'd trigger a toast notification here
                console.log('Push Notification:', data.message);
                alert(data.message);
            });

            socket.on('otpGenerated', (data) => {
                if (user.role === 'student' && user.facultyId === data.facultyId) {
                    // Toast or alert to let student know it's time
                    console.log('OTP is available now:', data.message);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('attendanceReminder');
                socket.off('otpGenerated');
            }
        };
    }, [socket, user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
