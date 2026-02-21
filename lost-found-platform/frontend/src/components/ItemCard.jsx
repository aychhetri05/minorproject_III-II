// src/components/ItemCard.jsx
import { Link } from 'react-router-dom';
import VerificationBadge from './VerificationBadge';

const STATUS_COLORS = {
    open:     'success',
    reported: 'info',
    matched:  'warning',
    verified: 'primary',
    pending_physical: 'warning',
    physically_verified: 'success',
    resolved: 'secondary'
};

const STATUS_ICONS = {
    open: '🔄',
    reported: '📝',
    matched: '🔗',
    verified: '✅',
    pending_physical: '⏳',
    physically_verified: '🚔',
    resolved: '🎉'
};

const TYPE_COLORS = {
    lost:  'danger',
    found: 'info'
};

const ItemCard = ({ item }) => {
    const imageUrl = item.image_path
        ? `http://localhost:5000${item.image_path}`
        : null;

    const statusLabel = item.status.replace(/_/g, ' ');

    return (
        <div className="card h-100 shadow-sm">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    className="card-img-top"
                    alt={item.title}
                    style={{ height: '180px', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                />
            ) : (
                <div className="bg-light d-flex align-items-center justify-content-center"
                     style={{ height: '180px', fontSize: '3rem' }}>
                    {item.type === 'lost' ? '🔍' : '📦'}
                </div>
            )}
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge bg-${TYPE_COLORS[item.type]} text-uppercase`}>
                        {item.type}
                    </span>
                    <div className="d-flex flex-column gap-1">
                        <span className={`badge bg-${STATUS_COLORS[item.status] || 'secondary'} d-inline-flex align-items-center gap-1`}>
                            {STATUS_ICONS[item.status]} {statusLabel}
                        </span>
                        {item.physically_verified && (
                            <VerificationBadge item={item} compact={true} />
                        )}
                    </div>
                </div>
                <h6 className="card-title fw-bold">{item.title}</h6>
                <p className="card-text text-muted small">
                    {item.description.length > 80
                        ? item.description.slice(0, 80) + '...'
                        : item.description}
                </p>
                {item.physically_verified && (
                    <div className="alert alert-success py-1 px-2 mb-2">
                        <small className="text-success fw-bold">✔ Police Verified</small>
                    </div>
                )}
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
                <small className="text-muted">
                    By {item.reporter_name || 'Unknown'}<br />
                    {new Date(item.created_at).toLocaleDateString()}
                </small>
                <Link to={`/items/${item.id}`} className="btn btn-sm btn-outline-primary">
                    View
                </Link>
            </div>
        </div>
    );
};

export default ItemCard;
