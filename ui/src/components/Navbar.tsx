import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    // If not logged in, hide the sidebar entirely
    if (!auth || !auth.user) return null; 

    const { user, logout } = auth;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = user.roles && user.roles.includes('ROLE_ADMIN');

    return (
        <nav style={{ 
            width: '250px', 
            height: '100vh', 
            backgroundColor: '#2c3e50', 
            color: 'white',
            display: 'flex', 
            flexDirection: 'column', 
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <h2 style={{ color: '#ecf0f1', marginBottom: '30px', textAlign: 'center' }}>
                My App
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Link to="/" style={linkStyle}>Dashboard</Link>
                <Link to="/orders" style={linkStyle}>Orders</Link>
                <Link to="/products" style={linkStyle}>Products</Link>
                
                {isAdmin && (
                    <Link to="/admin" style={{ ...linkStyle, color: '#e74c3c', fontWeight: 'bold' }}>
                        Admin Panel
                    </Link>
                )}
            </div>

            {/* This pushes the logout section to the bottom of the sidebar */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid #34495e', paddingTop: '15px' }}>
                <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#bdc3c7' }}>
                    User: {user.sub}
                </p>
                <button 
                    onClick={handleLogout} 
                    style={{ 
                        width: '100%', 
                        padding: '10px', 
                        backgroundColor: '#c0392b', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}

// A simple styling object for the links so we don't repeat CSS
const linkStyle: React.CSSProperties = {
    color: '#ecf0f1',
    textDecoration: 'none',
    fontSize: '1.1rem',
    padding: '8px 10px',
    borderRadius: '4px',
    transition: 'background 0.2s',
};