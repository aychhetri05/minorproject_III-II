import React, { useState } from 'react';
import { submitPhysical } from '../services/api';

const SubmitToPoliceButton = ({ itemId, onSubmitted, itemStatus }) => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        police_station: '',
        location_details: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.police_station.trim()) {
            alert('Please enter a police station/location.');
            return;
        }
        setLoading(true);
        try {
            await submitPhysical(itemId, formData);
            alert('✅ Submission created! Your item is now pending police verification.');
            setShowModal(false);
            setFormData({ police_station: '', location_details: '' });
            if (onSubmitted) onSubmitted();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Submission failed.');
        } finally { setLoading(false); }
    };

    const isDisabled = loading || (itemStatus && !['reported', 'pending_physical'].includes(itemStatus));

    return (
        <>
            <button 
                className="btn btn-warning" 
                onClick={() => setShowModal(true)} 
                disabled={isDisabled}
                title={isDisabled ? 'Item is not available for submission' : ''}
            >
                🚔 {loading ? 'Submitting...' : 'Submit to Police'}
            </button>

            {/* Modal for submission */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Physical Submission to Police</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowModal(false)}
                                    disabled={loading}
                                />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="police_station" className="form-label fw-bold">
                                            Police Station / Location *
                                        </label>
                                        <input 
                                            type="text"
                                            className="form-control"
                                            id="police_station"
                                            name="police_station"
                                            value={formData.police_station}
                                            onChange={handleChange}
                                            placeholder="e.g., Central Police Station, Room 204"
                                            required
                                            disabled={loading}
                                        />
                                        <small className="text-muted">
                                            Where you will physically submit this item
                                        </small>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="location_details" className="form-label">
                                            Location Details (Optional)
                                        </label>
                                        <textarea 
                                            className="form-control"
                                            id="location_details"
                                            name="location_details"
                                            value={formData.location_details}
                                            onChange={handleChange}
                                            placeholder="e.g., Desk number, contact person, receipt reference..."
                                            rows="3"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="alert alert-info mb-0">
                                        <div className="mb-2">
                                            <strong>📋 English:</strong>
                                            <p className="mb-2">
                                                To reduce fraud and ensure transparency, please submit the found item to your nearest police station.
                                            </p>
                                        </div>
                                        <div className="mb-2">
                                            <strong>🇳🇵 नेपाली:</strong>
                                            <p className="mb-2">
                                                ठगी न्यूनीकरण र पारदर्शिताका लागि, कृपया भेटिएको सामान नजिकको प्रहरी कार्यालयमा बुझाउनुहोस्।
                                            </p>
                                        </div>
                                        <small className="text-muted">
                                            After submitting, police/admin will verify the physical item and mark it as "Physically Verified". 
                                            You'll receive a notification when verification is complete.
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => setShowModal(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-warning"
                                        disabled={loading}
                                    >
                                        {loading ? '⏳ Submitting...' : '✔ Submit to Police'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SubmitToPoliceButton;
