import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosConfig'; // 🟢 Needed to fetch the cart
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
    cartCount: number;             
    refreshCartCount: () => void;  
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // 1. App State
    const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
    const [cartCount, setCartCount] = useState<number>(0); // 🚀 Added missing state

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
        setCartCount(0); // 🚀 Clear cart on logout
        setIsExpiredModalOpen(false); 
    };

    const login = (token: string) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode<DecodedToken>(token);
        setUser(decoded);
    };

    // 🚀 3. Cart Logic: Fetch the cart count from the backend
    const refreshCartCount = async () => {
        if (user) {
            try {
                const response = await api.get('/api/cart');
                if (response.data && response.data.items) {
                    const totalQuantity = response.data.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                    setCartCount(totalQuantity);
                }
            } catch (err) {
                console.error("Failed to load initial cart count", err);
            }
        }
    };

    // Automatically load the cart when the user logs in
    useEffect(() => {
        refreshCartCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.sub]);

    // 4. Event Listener for Axios Interceptor
    useEffect(() => {
        const handleSessionExpired = () => setIsExpiredModalOpen(true);
        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
    }, []);

    // 5. Background Timer Mechanism
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
        <AuthContext.Provider value={{ user, login, logout, cartCount, refreshCartCount }}>
            {children}

            {/* MUI Session Expired Modal */}
            <Dialog
                open={isExpiredModalOpen}
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
                        onClick={() => logout()}
                    >
                        Log In Again
                    </Button>
                </DialogActions>
            </Dialog>
        </AuthContext.Provider>
    );
};