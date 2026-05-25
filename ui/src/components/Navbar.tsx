import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function Navbar() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation(); // Extracted to track page changes
    const [cartCount, setCartCount] = useState<number>(0);

    // Consolidated Core Data Retrieval Method
    const syncCartItemQuantity = async () => {
        if (!auth || !auth.user) return;
        try {
            const response = await api.get('/api/cart');
            const totalItemsCount = response.data?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
            setCartCount(totalItemsCount);
        } catch (error) {
            console.error("Failed to sync navigation badge count indicator numbers:", error);
        }
    };

    // React Lifecycle Registry Block
    useEffect(() => {
        // 1. Fire on initial load or route transition updates
        syncCartItemQuantity();

        // 2. Setup the custom event listener fallback system
        window.addEventListener('cart-updated', syncCartItemQuantity);

        // 3. Fail-safe: Short interval poll (Every 3 seconds) to force background sync
        const backgroundIntervalId = setInterval(syncCartItemQuantity, 3000);

        // Cleanup cycle on component unmount
        return () => {
            window.removeEventListener('cart-updated', syncCartItemQuantity);
            clearInterval(backgroundIntervalId);
        };
    }, [location.pathname, auth?.user]); // Watches pathname string alterations directly

    if (!auth || !auth.user) return null;

    const { user, logout } = auth;
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = user.roles && user.roles.includes('ROLE_ADMIN');

    return (
        <nav style={{
            width: '250px', height: '100vh', backgroundColor: '#2c3e50', color: 'white',
            display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box',
            position: 'sticky', top: 0
        }}>
            <h2 style={{ color: '#ecf0f1', marginBottom: '30px', textAlign: 'center', fontWeight: 'bold' }}>
                Warehouse System
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Link to="/" style={getLinkStyle(location.pathname === '/')}>Dashboard</Link>
                <Link to="/orders" style={getLinkStyle(location.pathname === '/orders')}>Orders</Link>
                <Link to="/products" style={getLinkStyle(location.pathname.startsWith('/products'))}>Products</Link>

                {/* Shopping Basket Selection Interface Entry Point */}
                <Link to="/cart" style={{
                    ...getLinkStyle(location.pathname === '/cart'),
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <span>Shopping Cart</span>
                    <Badge badgeContent={cartCount} color="error" max={99} sx={{ '& .MuiBadge-badge': { fontWeight: 'bold' } }}>
                        <ShoppingCartIcon size="small" style={{ color: '#ecf0f1' }} />
                    </Badge>
                </Link>

                <Link to="/chat" style={getLinkStyle(location.pathname === '/chat', '#3498db')}>AI Chat</Link>

                <Link to="/emails/send" style={getLinkStyle(location.pathname === '/emails/send', '#3498db')}>Send Email</Link>

                <Link to="/profile" style={getLinkStyle(location.pathname === '/profile', '#3498db')}>My Profile</Link>

                {/* Only show the Users table tab if the logged-in user is an Admin */}
                {user?.roles?.includes('ROLE_ADMIN') && (
                    <Link to="/users" style={getLinkStyle(location.pathname === '/users', '#3498db')}>User Management</Link>
                )}

                {isAdmin && (
                    <Link to="/products/create" style={getLinkStyle(location.pathname === '/products/create', '#3498db')}>
                        + Add Product
                    </Link>
                )}

                {isAdmin && (
                    <Link to="/admin" style={getLinkStyle(location.pathname === '/admin', '#e74c3c')}>
                        Admin Panel
                    </Link>
                )}
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid #34495e', paddingTop: '15px' }}>
                <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#bdc3c7', wordBreak: 'break-all' }}>
                    User: {user.sub}
                </p>
                <button onClick={handleLogout} style={logoutButtonStyle}>
                    Logout
                </button>
            </div>
        </nav>
    );
}

// Inline Style Generator Helpers
const getLinkStyle = (isActive: boolean, customColor?: string): React.CSSProperties => ({
    color: '#ecf0f1',
    textDecoration: 'none',
    fontSize: '1.05rem',
    padding: '10px 12px',
    borderRadius: '6px',
    backgroundColor: isActive ? '#34495e' : 'transparent',
    borderLeft: isActive ? `4px solid ${customColor || '#2ecc71'}` : '4px solid transparent',
    transition: 'all 0.2s ease-in-out',
    fontWeight: isActive ? 'bold' : 'normal'
});

const logoutButtonStyle: React.CSSProperties = {
    width: '100%', padding: '10px', backgroundColor: '#c0392b', color: 'white',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
};