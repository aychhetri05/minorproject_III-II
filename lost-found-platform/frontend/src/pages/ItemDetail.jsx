// src/pages/ItemDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getItemById } from '../services/api';
import SubmitToPoliceButton from '../components/SubmitToPoliceButton';
import VerificationBadge from '../components/VerificationBadge';
import PoliceStationInfo from '../components/PoliceStationInfo';

const STATUS_COLORS = { open: 'success', reported: 'info', matched: 'warning', verified: 'primary', pending_physical: 'warning', physically_verified: 'success', resolved: 'secondary' };
const STATUS_ICONS = { open: '🔄', reported: '📝', matched: '🔗', verified: '✅', pending_physical: '⏳', physically_verified: '🚔', resolved: '🎉' };
const TYPE_COLORS   = { lost: 'danger', found: 'info' };

const ItemDetail = () => {
    const { id } = useParams();
    const [item, setItem]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        getItemById(id)
            .then(res => setItem(res.data))
            .catch(() => setError('Item not found.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
    if (error)   return <div className="container py-4"><div className="alert alert-danger">{error}</div></div>;
    if (!item)   return null;

    const imageUrl = item.image_path ? `http://localhost:5000${item.image_path}` : null;
    const isFoundUser = user.id === item.user_id && item.type === 'found';
    const canSubmitPhysical = isFoundUser && ['reported', 'pending_physical'].includes(item.status);
    const statusLabel = item.status.replace(/_/g, ' ');

    return (
        <div className="container py-4" style={{ maxWidth: 760 }}>
            <Link to="/items" className="btn btn-sm btn-outline-secondary mb-3">← Back to Items</Link>

            <div className="card shadow">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        className="card-img-top"
                        alt={item.title}
                        style={{ maxHeight: 320, objectFit: 'cover' }}
                    />
                )}
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <h4 className="fw-bold mb-0">{item.title}</h4>
                        <div className="d-flex gap-2 flex-wrap">
                            <span className={`badge bg-${TYPE_COLORS[item.type]} fs-6`}>{item.type.toUpperCase()}</span>
                            <span className={`badge bg-${STATUS_COLORS[item.status] || 'secondary'} fs-6`}>
                                {STATUS_ICONS[item.status]} {statusLabel}
                            </span>
                            {item.physically_verified && (
                                <span className="badge bg-success fs-6">✔ Police Verified</span>
                            )}
                        </div>
                    </div>

                    <p className="text-muted">{item.description}</p>

                    <hr />

                    <div className="row g-3 small text-muted">
                        <div className="col-sm-6">
                            <strong>Reported by:</strong> {item.reporter_name}
                        </div>
                        <div className="col-sm-6">
                            <strong>Contact:</strong> {item.reporter_email}
                        </div>
                        <div className="col-sm-6">
                            <strong>Date:</strong> {new Date(item.created_at).toLocaleString()}
                        </div>
                        {item.latitude && item.longitude && (
                            <div className="col-sm-6">
                                <strong>Location:</strong> {item.latitude}, {item.longitude}
                                {' '}
                                <a
                                    href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-outline-primary py-0 ms-1"
                                >
                                    View Map
                                </a>
                            </div>
                        )}
                        {item.submission_timestamp && (
                            <div className="col-sm-6">
                                <strong>Submitted to Police:</strong> {new Date(item.submission_timestamp).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {/* AI Match section */}
                    {item.match && (
                        <div className="alert alert-warning mt-4">
                            <h6 className="fw-bold">🤖 AI Match Found!</h6>
                            <p className="mb-1 small">
                                This item was automatically matched with a similarity score of{' '}
                                <strong>{(item.match.similarity_score * 100).toFixed(1)}%</strong>.
                            </p>
                            <div className="row mt-2">
                                <div className="col-6">
                                    <strong className="text-danger">Lost:</strong>
                                    <p className="small mb-0">{item.match.lost_title}</p>
                                </div>
                                <div className="col-6">
                                    <strong className="text-info">Found:</strong>
                                    <p className="small mb-0">{item.match.found_title}</p>
                                </div>
                            </div>
                            <p className="small mt-2 mb-0 text-muted">
                                Please contact the reporter to verify and resolve this case.
                            </p>
                        </div>
                    )}

                    {/* Police Station Information */}
                    {item.police_station && (
                        <PoliceStationInfo policeStation={item.police_station} />
                    )}

                    {/* Physical submission / verification UI */}
                    <div className="mt-4">
                        {/* Show submission section for found item owner */}
                        {item.type === 'found' && isFoundUser && (
                            <div className="alert alert-info mb-3">
                                <h6 className="fw-bold mb-2">🚔 Physical Verification System</h6>
                                <p className="small mb-2">
                                    To reduce fraud and increase trust, please physically submit this item to a local 
                                    Police Station or Admin Office. This enables official verification.
                                </p>
                                {canSubmitPhysical && (
                                    <div className="mt-3">
                                        <SubmitToPoliceButton 
                                            itemId={item.id} 
                                            itemStatus={item.status}
                                            onSubmitted={() => window.location.reload()} 
                                        />
                                    </div>
                                )}
                                {item.status === 'pending_physical' && (
                                    <div className="alert alert-warning mt-3 mb-0">
                                        <small>
                                            ⏳ <strong>Pending Verification:</strong> Your submission is waiting for police verification. 
                                            Please ensure you have submitted the physical item to the specified location.
                                        </small>
                                    </div>
                                )}
                                {item.status === 'physically_verified' && (
                                    <div className="alert alert-success mt-3 mb-0">
                                        <small>
                                            ✔ <strong>Verified:</strong> Your item has been physically verified by police, 
                                            increasing trust and reducing fraud risk.
                                        </small>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show verification details if verified */}
                        {item.physically_verified && (
                            <VerificationBadge item={item} compact={false} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
