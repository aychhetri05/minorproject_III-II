// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm]     = useState({ name: '', email: '', password: '' });
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await registerUser(form);
            navigate('/login', { state: { message: 'Registered successfully! Please log in.' } });
        } catch (err) {
            const serverMsg = err.response?.data?.message;
            const status = err.response?.status;
            setError(serverMsg || (status ? `Request failed (${status})` : err.message) || 'Registration failed. Please try again.');
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
                            <h2 className="fw-bold text-primary">🇳🇵 Create Account</h2>
                            <p className="text-muted">🇳🇵 Nepal Lost & Found Platform</p>
                        </div>
                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-semibold">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    placeholder="Ram Shrestha"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
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
                                    placeholder="Min 6 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Register'}
                            </button>
                        </form>
                        <hr />
                        <p className="text-center mb-0">
                            Already have an account? <Link to="/login">Log in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
