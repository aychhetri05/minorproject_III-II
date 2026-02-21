import React, { useState } from 'react';
import { verifyPhysical } from '../services/api';

/**
 * PhysicalVerifyButton Component
 * Allows police/admin to mark found items as physically verified
 */
const PhysicalVerifyButton = ({ itemId, itemTitle, onVerified }) => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [notes, setNotes] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await verifyPhysical(itemId, { notes: notes || null });
            alert('✅ Item marked as physically verified!');
            setShowModal(false);
            setNotes('');
            if (onVerified) onVerified();
        } catch (err) {
            console.error('Verify error:', err);
            alert(err.response?.data?.message || 'Error marking item as verified.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button 
                className="btn btn-success btn-sm"
                onClick={() => setShowModal(true)}
                disabled={loading}
                title="Mark item as physically verified after receiving it"
            >
                {loading ? '⏳ Processing...' : '✔ Mark as Physically Received'}
            </button>

            {/* Modal for verification */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Physical Verification</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                    disabled={loading}
                                />
                            </div>
                            <form onSubmit={handleVerify}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <p className="text-muted">
                                            <strong>Item:</strong> {itemTitle}
                                        </p>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label htmlFor="verify_notes" className="form-label fw-bold">
                                            Verification Notes (Optional)
                                        </label>
                                        <textarea 
                                            className="form-control"
                                            id="verify_notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="e.g., Item inspected, condition good, no damage found..."
                                            rows="4"
                                            disabled={loading}
                                        />
                                        <small className="text-muted">
                                            Add any relevant details about the physical item you received
                                        </small>
                                    </div>

                                    <div className="alert alert-warning">
                                        <strong>⚠️ Confirmation:</strong>
                                        <p className="mb-0 mt-2 small">
                                            You are confirming that you have physically received and verified this item. 
                                            The found user will be notified and this item will be marked as "Physically Verified".
                                        </p>
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
                                        className="btn btn-success"
                                        disabled={loading}
                                    >
                                        {loading ? '⏳ Verifying...' : '✔ Confirm Verification'}
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

export default PhysicalVerifyButton;
