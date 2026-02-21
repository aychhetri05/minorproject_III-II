// src/pages/ReportItem.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem } from '../services/api';

const ReportItem = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        type: 'lost',
        title: '',
        description: '',
        latitude: '',
        longitude: '',
    });
    const [image, setImage]   = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError]   = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageChange = e => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Build FormData to send image + text fields
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
        if (image) formData.append('image', image);

        try {
            const res = await createItem(formData);
            setSuccess(`✅ Item reported! ${res.data.message}`);
            setTimeout(() => navigate('/profile'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit report.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4" style={{ maxWidth: 680 }}>
            <h3 className="fw-bold mb-1">📋 Report an Item</h3>
            <p className="text-muted mb-4">
                Fill in the details below. Our AI will automatically try to find a match.
            </p>

            {error   && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="card shadow-sm">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>

                        {/* Type toggle */}
                        <div className="mb-4">
                            <label className="form-label fw-semibold">Report Type *</label>
                            <div className="d-flex gap-3">
                                {['lost', 'found'].map(t => (
                                    <div key={t} className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="type"
                                            id={`type-${t}`}
                                            value={t}
                                            checked={form.type === t}
                                            onChange={handleChange}
                                        />
                                        <label className="form-check-label text-capitalize fw-semibold" htmlFor={`type-${t}`}>
                                            {t === 'lost' ? '🔍 Lost' : '📦 Found'}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">Item Title *</label>
                            <input
                                type="text"
                                name="title"
                                className="form-control"
                                placeholder="e.g., Blue Wallet, iPhone 13, Black Backpack"
                                value={form.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">Description *</label>
                            <textarea
                                name="description"
                                className="form-control"
                                rows="4"
                                placeholder="Describe the item in detail — color, brand, unique features, when/where lost or found..."
                                value={form.description}
                                onChange={handleChange}
                                required
                            />
                            <div className="form-text">
                                More detail = better AI matching accuracy.
                            </div>
                        </div>

                        {/* Optional location */}
                        <div className="row g-2 mb-3">
                            <div className="col">
                                <label className="form-label fw-semibold">Latitude (optional)</label>
                                <input
                                    type="number"
                                    name="latitude"
                                    className="form-control"
                                    placeholder="27.7172"
                                    value={form.latitude}
                                    onChange={handleChange}
                                    step="any"
                                />
                            </div>
                            <div className="col">
                                <label className="form-label fw-semibold">Longitude (optional)</label>
                                <input
                                    type="number"
                                    name="longitude"
                                    className="form-control"
                                    placeholder="85.3240"
                                    value={form.longitude}
                                    onChange={handleChange}
                                    step="any"
                                />
                            </div>
                        </div>

                        {/* Image upload */}
                        <div className="mb-4">
                            <label className="form-label fw-semibold">Upload Image (optional)</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            {preview && (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="mt-2 rounded"
                                    style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'cover' }}
                                />
                            )}
                        </div>

                        <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
                                ) : 'Submit Report'}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/dashboard')}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="alert alert-info mt-3">
                <strong>🤖 AI Matching:</strong> Once submitted, our system will automatically compare your
                report against existing open items using NLP similarity scoring.
                You'll see a "matched" status if a match is found.
            </div>
        </div>
    );
};

export default ReportItem;
