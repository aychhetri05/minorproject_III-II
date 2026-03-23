import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate passwords match
        if (form.newPassword !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Validate password length
        if (form.newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            const res = await resetPassword(token, {
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword
            });

            setSuccess(res.data.message);
            setForm({ newPassword: '', confirmPassword: '' });

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login', { 
                    state: { message: 'Password reset successfully! Please login with your new password.' }
                });
            }, 2000);
        } catch (err) {
            const serverMsg = err.response?.data?.message;
            const status = err.response?.status;
            setError(serverMsg || (status ? `Request failed (${status})` : err.message) || 'Failed to reset password.');
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
                            <h2 className="fw-bold text-primary"> Reset Password</h2>
                            <p className="text-muted">Create a new password for your account</p>
                        </div>

                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        {success && <div className="alert alert-success py-2">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-semibold">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    className="form-control"
                                    placeholder="Enter new password"
                                    value={form.newPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                                <small className="text-muted">Minimum 6 characters</small>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-semibold">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-control"
                                    placeholder="Confirm new password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary w-100" 
                                disabled={loading}
                            >
                                {loading ? 'Resetting Password...' : 'Reset Password'}
                            </button>
                        </form>

                        {success && (
                            <div className="mt-3 p-2 bg-light border rounded small text-muted">
                                ✓ Redirecting to login...
                            </div>
                        )}

                        <hr />

                        <div className="text-center">
                            <p className="mb-0">
                                <Link to="/login">Back to Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
