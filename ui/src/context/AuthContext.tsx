import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogContentText, 
    DialogActions, 
    Button 
} from '@mui/material';

export interface DecodedToken {
    sub: string;
    roles: string[];
    email?: string;
    userId?: number;
    exp: number;
    iat: number;
}

interface AuthContextType {
    user: DecodedToken | null;
    login: (token: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // 1. App State
    const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
    const [user, setUser] = useState<DecodedToken | null>(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                return jwtDecode<DecodedToken>(token);
            } catch (error) {
                localStorage.removeItem('token');
                return null;
            }
        }
        return null;
    });

    // 2. Auth Actions
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsExpiredModalOpen(false); // Close modal when they actually log out
    };

    const login = (token: string) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode<DecodedToken>(token);
        setUser(decoded);
    };

    // 3. Event Listener for Axios Interceptor
    useEffect(() => {
        const handleSessionExpired = () => {
            setIsExpiredModalOpen(true);
        };

        window.addEventListener('auth:session-expired', handleSessionExpired);
        
        return () => {
            window.removeEventListener('auth:session-expired', handleSessionExpired);
        };
    }, []);

    // 4. Background Timer Mechanism
    useEffect(() => {
        if (user && user.exp) {
            const currentTime = Date.now();
            const expireTime = user.exp * 1000;
            const timeRemaining = expireTime - currentTime;

            if (timeRemaining <= 0) {
                setIsExpiredModalOpen(true);
            } else {
                const timeoutId = setTimeout(() => {
                    setIsExpiredModalOpen(true);
                }, timeRemaining);

                return () => clearTimeout(timeoutId);
            }
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}

            {/* MUI Session Expired Modal */}
            <Dialog
                open={isExpiredModalOpen}
                // Prevent closing by clicking outside or pressing Escape
                disableEscapeKeyDown
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                        setIsExpiredModalOpen(false);
                    }
                }}
            >
                <DialogTitle sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    Session Expired
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Your session has timed out due to inactivity or expiration. Please log in again to continue working.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => {
                            logout(); // This sets user to null, triggering the ProtectedRoute redirect
                        }}
                    >
                        Log In Again
                    </Button>
                </DialogActions>
            </Dialog>
        </AuthContext.Provider>
    );
};