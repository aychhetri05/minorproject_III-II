import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitPhysical, getItemById } from '../services/api';

const POLICE_STATIONS = [
    'Central Police Station',
    'Kathmandu Metropolitan Police',
    'Thamel Police Post',
    'Lalitpur Police Station',
    'Bhaktapur Police Station',
    'Other (Specify)'
];

const SubmitToPolice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ police_station: '', location_details: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        getItemById(id)
            .then(res => setItem(res.data))
            .catch(() => setError('Item not found.'));
    }, [id]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.police_station) return setError('Please select a police station.');
        setLoading(true);
        try {
            await submitPhysical(id, form);
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4" style={{ maxWidth: 720 }}>
            <h4 className="mb-3">🚔 Submit Found Item to Police</h4>
            {error && <div className="alert alert-danger">{error}</div>}
            {!item && !error && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}

            {item && (
                <div className="card shadow-sm">
                    <div className="card-body">
                        <h5 className="fw-bold">{item.title}</h5>
                        <p className="text-muted small">{item.description}</p>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Police Station *</label>
                                <select
                                    name="police_station"
                                    className="form-select"
                                    value={form.police_station}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select police station --</option>
                                    {POLICE_STATIONS.map(ps => (
                                        <option key={ps} value={ps}>{ps}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Location Details (optional)</label>
                                <textarea
                                    name="location_details"
                                    className="form-control"
                                    rows={3}
                                    value={form.location_details}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="alert alert-info mb-3">
                                <div className="mb-2"><strong>📋 English:</strong>
                                    <p className="mb-0">To reduce fraud and ensure transparency, please submit the found item to your nearest police station.</p>
                                </div>
                                <div className="mt-2"><strong>🇳🇵 नेपाली:</strong>
                                    <p className="mb-0">ठगी न्यूनीकरण र पारदर्शिताका लागि, कृपया भेटिएको सामान नजिकको प्रहरी कार्यालयमा बुझाउनुहोस्।</p>
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <button className="btn btn-warning" disabled={loading}>{loading ? 'Submitting...' : 'Submit to Police'}</button>
                                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmitToPolice;
