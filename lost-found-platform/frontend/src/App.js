// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import Navbar        from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home        from './pages/Home';
import Register    from './pages/Register';
import Login       from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard   from './pages/Dashboard';
import ReportItem  from './pages/ReportItem';
import ViewItems   from './pages/ViewItems';
import ItemDetail  from './pages/ItemDetail';
import AdminPanel  from './pages/AdminPanel';
import UserProfile from './pages/UserProfile';
import SubmitToPolice from './pages/SubmitToPolice';
import Notifications from './components/Notifications';

function App() {
    return (
        <Router>
            <Navbar />
            <main>
                <Routes>
                    {/* Public */}
                    <Route path="/"         element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login"    element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/items"    element={<ViewItems />} />
                    <Route path="/items/:id" element={<ItemDetail />} />

                    {/* Protected - any logged-in user */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />
                    <Route path="/report" element={
                        <ProtectedRoute><ReportItem /></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute><UserProfile /></ProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                        <ProtectedRoute><Notifications /></ProtectedRoute>
                    } />
                    <Route path="/submit-to-police/:id" element={
                        <ProtectedRoute><SubmitToPolice /></ProtectedRoute>
                    } />

                    {/* Admin only */}
                    <Route path="/admin" element={
                        <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </Router>
    );
}

export default App;
