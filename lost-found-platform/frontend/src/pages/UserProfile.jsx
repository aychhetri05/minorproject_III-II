import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllItems } from '../services/api';
import ItemCard from '../components/ItemCard';

const UserProfile = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState(''); // '', 'lost', 'found'
    const [filterStatus, setFilterStatus] = useState(''); // '', 'reported', 'pending_physical', 'physically_verified', 'matched', 'resolved'

    useEffect(() => {
        getAllItems()
            .then(res => {
                // Show only current user's items
                const myItems = res.data.filter(i => i.user_id === user.id);
                setAllItems(myItems);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user.id]);

    // Apply filters
    const filteredItems = allItems.filter(item => {
        if (filterType && item.type !== filterType) return false;
        if (filterStatus && item.status !== filterStatus) return false;
        return true;
    });

    const stats = {
        total: allItems.length,
        lost: allItems.filter(i => i.type === 'lost').length,
        found: allItems.filter(i => i.type === 'found').length,
        reported: allItems.filter(i => i.status === 'reported').length,
        pending: allItems.filter(i => i.status === 'pending_physical').length,
        verified: allItems.filter(i => i.status === 'physically_verified').length,
        matched: allItems.filter(i => i.status === 'matched').length,
        resolved: allItems.filter(i => i.status === 'resolved').length,
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-0">👤 My Profile</h3>
                    <p className="text-muted mb-2">{user.name} ({user.email})</p>
                    <small className="text-muted">Role: {user.role}</small>
                </div>
                <Link to="/report" className="btn btn-primary">
                    + Report Item
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Total Reports', value: stats.total, color: 'primary', icon: '📋' },
                    { label: 'Lost Items', value: stats.lost, color: 'danger', icon: '🔍' },
                    { label: 'Found Items', value: stats.found, color: 'info', icon: '📦' },
                    { label: 'Reported', value: stats.reported, color: 'secondary', icon: '📝' },
                    { label: 'Pending Verify', value: stats.pending, color: 'warning', icon: '⏳' },
                    { label: 'Verified', value: stats.verified, color: 'success', icon: '✔' },
                    { label: 'Matched', value: stats.matched, color: 'info', icon: '🔗' },
                    { label: 'Resolved', value: stats.resolved, color: 'secondary', icon: '🎉' },
                ].map(s => (
                    <div className="col-6 col-md-4 col-lg-3" key={s.label}>
                        <div className={`card border-${s.color} text-center p-3`}>
                            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                            <h5 className={`fw-bold text-${s.color} mb-1`}>{s.value}</h5>
                            <small className="text-muted">{s.label}</small>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Controls */}
            <div className="card p-3 mb-4">
                <div className="row g-3 align-items-end">
                    <div className="col-sm-6 col-md-3">
                        <label className="form-label fw-semibold">Type</label>
                        <select
                            className="form-select"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="lost">Lost</option>
                            <option value="found">Found</option>
                        </select>
                    </div>
                    <div className="col-sm-6 col-md-4">
                        <label className="form-label fw-semibold">Status</label>
                        <select
                            className="form-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="reported">Reported</option>
                            <option value="pending_physical">Pending Physical Verification</option>
                            <option value="physically_verified">Physically Verified</option>
                            <option value="matched">Matched</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                    <div className="col-sm-6 col-md-2">
                        <button
                            className="btn btn-secondary w-100"
                            onClick={() => { setFilterType(''); setFilterStatus(''); }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Items Display */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-5">
                    <p className="text-muted fs-5">
                        {allItems.length === 0
                            ? "You haven't reported any items yet."
                            : 'No items match your filters.'}
                    </p>
                    <Link to="/report" className="btn btn-primary">Report Your First Item</Link>
                </div>
            ) : (
                <div>
                    <p className="text-muted mb-3">Showing {filteredItems.length} of {allItems.length} items</p>
                    <div className="row g-3">
                        {filteredItems.map(item => (
                            <div className="col-sm-6 col-lg-4" key={item.id}>
                                <ItemCard item={item} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
