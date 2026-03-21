import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await forgotPassword({ email });
            setSuccess(res.data.message || 'If an account with this email exists, you will receive a reset link.');
            setEmail('');

            // Optionally show reset link in development (remove in production)
            if (res.data.resetLink) {
                console.log('Dev Mode - Reset Link:', res.data.resetLink);
            }
        } catch (err) {
            const serverMsg = err.response?.data?.message;
            const status = err.response?.status;
            setError(serverMsg || (status ? `Request failed (${status})` : err.message) || 'Failed to send reset link.');
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
                            <h2 className="fw-bold text-primary">🔑 Forgot Password?</h2>
                            <p className="text-muted">We'll help you reset your password</p>
                        </div>

                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        {success && <div className="alert alert-success py-2">{success}</div>}

                        <p className="text-muted small mb-3">
                            Enter your email address and we'll send you a link to reset your password. This link will expire in 15 minutes.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label fw-semibold">Email Address</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="ram@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary w-100" 
                                disabled={loading}
                            >
                                {loading ? 'Sending Link...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <hr />

                        <div className="text-center">
                            <p className="mb-0">
                                Remember your password? <Link to="/login">Back to Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
