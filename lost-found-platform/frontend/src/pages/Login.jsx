// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../services/api';

const Login = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const successMsg = location.state?.message;

    const [form, setForm]     = useState({ email: '', password: '' });
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await loginUser(form);
            // Store token and user info in localStorage
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user',  JSON.stringify(res.data.user));

            // Redirect based on role
            navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            const serverMsg = err.response?.data?.message;
            const status = err.response?.status;
            setError(serverMsg || (status ? `Request failed (${status})` : err.message) || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center">
            <div className="container" style={{ maxWidth: 460 }}>
                <div className="card shadow">
                    <div className="card-body p-4">
                        <div className="text-center mb-4">
                            <h2 className="fw-bold text-primary">🔐 Login</h2>
                            <p className="text-muted">🇳🇵 Nepal Lost & Found Platform</p>
                        </div>
                        {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}
                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-semibold">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="ram@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-semibold">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-control"
                                    placeholder="Your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>
                        <div className="mt-3 p-2 bg-light border rounded small text-muted">
                            <strong>Demo Admin:</strong> admin@nepalpolice.gov.np / password
                        </div>
                        <hr />
                        <p className="text-center mb-0">
                            Don't have an account? <Link to="/register">Register here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
