import React from 'react';

/**
 * VerificationBadge Component
 * Displays verification status badge and details
 * 
 * Props:
 *  - item: The item object with verification details
 *  - compact: If true, shows only badge. If false, shows full details
 */
const VerificationBadge = ({ item, compact = false }) => {
    if (!item.physically_verified) {
        return null;
    }

    if (compact) {
        return (
            <span 
                className="badge bg-success"
                title={`Verified by ${item.verifier_name || 'Police'} on ${item.verification_timestamp ? new Date(item.verification_timestamp).toLocaleDateString() : 'Unknown date'}`}
            >
                ✔ Verified by Police
            </span>
        );
    }

    return (
        <div className="alert alert-success mb-0">
            <div className="d-flex align-items-center mb-2">
                <h6 className="mb-0 me-2">
                    <span className="badge bg-success">✔ Physically Verified</span>
                </h6>
            </div>
            <div className="small">
                <div className="row">
                    <div className="col-md-6">
                        <strong>Verified by:</strong><br/>
                        {item.verifier_name || 'Police Officer'}
                    </div>
                    <div className="col-md-6">
                        <strong>Verified on:</strong><br/>
                        {item.verification_timestamp 
                            ? new Date(item.verification_timestamp).toLocaleString()
                            : 'Unknown'
                        }
                    </div>
                </div>
                {item.verification_type && (
                    <div className="mt-2">
                        <strong>Type:</strong> {item.verification_type === 'Physical' ? '🚔 Physical Verification' : '🤖 AI-Assisted'}
                    </div>
                )}
                {item.police_notes && (
                    <div className="mt-2">
                        <strong>Officer Notes:</strong><br/>
                        <em>{item.police_notes}</em>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificationBadge;
