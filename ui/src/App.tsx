import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Import all your pages and components
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Orders from './pages/Orders';
import Products from './pages/Product'; // <-- Make sure this import is here!

// 1. Define Props for the Protected Route
interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

// 2. The Protected Route Wrapper
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin }) => {
    const auth = useContext(AuthContext);
    
    if (!auth || !auth.user) {
        return <Navigate to="/login" />;
    }
    
    if (requireAdmin && (!auth.user.roles || !auth.user.roles.includes('ROLE_ADMIN'))) {
        return <h2>403 Forbidden - Admins Only</h2>;
    }

    return <>{children}</>;
};

// 3. The Layout and Routing
function AppRoutes() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            
            {/* Left Sidebar */}
            <Navbar />
            
            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '40px', backgroundColor: '#f8f9fa' }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/products" element={<Products />} />
                    
                    <Route path="/" element={
                        <ProtectedRoute>
                            <h2>Welcome to the Dashboard</h2>
                            <p>Select an option from the sidebar.</p>
                        </ProtectedRoute>
                    } />

                    {/* THIS IS THE MISSING ROUTE */}
                    <Route path="/orders" element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/admin" element={
                        <ProtectedRoute requireAdmin={true}>
                            <h2>Admin Configuration</h2>
                            <p>Admin Only Content Goes Here</p>
                        </ProtectedRoute>
                    } />
                </Routes>
            </div>
        </div>
    );
}

// 4. The Main App Component
export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}