import React, { useContext, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Import all your pages and components
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Orders from './pages/Orders';
import Products from './pages/Product';
import CreateProduct from './pages/CreateProduct';
import Cart from './pages/Cart';
import SendEmail from './pages/SendEmail';
import OllamaChat from './pages/OllamaChat';
import MyProfile from './pages/MyProfile';
import UserManagement from './pages/UserManagement';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import PlantIdentifier from './pages/PlantIdentifer';
import EmailInbox from './pages/Email';
import OAuthCallback from './pages/OAuthCallback';

const GroupChat = React.lazy(() => import('./pages/GroupChat'));

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
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route path="/forgot" element={<ForgotPassword />} />

            <Route path="/*" element={
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                    <Navbar />
                    <div style={{ flex: 1, padding: '40px', backgroundColor: '#f8f9fa' }}>
                        <Routes>
                            <Route path="/products" element={<Products />} />
                            <Route path="/plant" element={<PlantIdentifier />} />
                            <Route path="/email" element={<EmailInbox />} />
                            <Route path="/products/create" element={
                                <ProtectedRoute requireAdmin={true}>
                                    <CreateProduct />
                                </ProtectedRoute>
                            } />
                            <Route path="/cart" element={
                                <ProtectedRoute>
                                    <Cart />
                                </ProtectedRoute>
                            } />
                            <Route path="/" element={
                                <ProtectedRoute>
                                    <h2>Welcome to the Dashboard</h2>
                                    <p>Select an option from the sidebar.</p>
                                </ProtectedRoute>
                            } />
                            <Route path="/orders" element={
                                <ProtectedRoute>
                                    <Orders />
                                </ProtectedRoute>
                            } />
                            <Route path="/chat" element={
                                <ProtectedRoute>
                                    <OllamaChat />
                                </ProtectedRoute>
                            } />
                            <Route path="/groups" element={
                                <ProtectedRoute>
                                    <Suspense fallback={<h2>Loading group chat...</h2>}>
                                        <GroupChat />
                                    </Suspense>
                                </ProtectedRoute>
                            } />
                            <Route path="/emails/send" element={
                                <ProtectedRoute>
                                    <SendEmail />
                                </ProtectedRoute>
                            } />
                            <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
                            <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                            <Route path="/admin" element={
                                <ProtectedRoute requireAdmin={true}>
                                    <h2>Admin Configuration</h2>
                                    <p>Admin Only Content Goes Here</p>
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </div>
                </div>
            } />
        </Routes>
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