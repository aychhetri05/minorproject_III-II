import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllItems, getProfile, updateProfile } from '../services/api';
import ItemCard from '../components/ItemCard';

const UserProfile = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState(''); // '', 'lost', 'found'
    const [filterStatus, setFilterStatus] = useState(''); // '', 'reported', 'pending_physical', 'physically_verified', 'matched', 'resolved'
    const [profile, setProfile] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '' });
    const [editImage, setEditImage] = useState(null);
    const [editDocument, setEditDocument] = useState(null);
    const [editPreview, setEditPreview] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getAllItems()
            .then(res => {
                // Show only current user's items
                const myItems = res.data.filter(i => i.user_id === user.id);
                setAllItems(myItems);
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        // Fetch profile data
        getProfile()
            .then(res => setProfile(res.data))
            .catch(console.error);
    }, [user.id]);

    const handleEditProfile = () => {
        setEditForm({ name: profile?.name || '', phone: profile?.phone || '' });
        setEditImage(null);
        setEditDocument(null);
        setEditPreview(profile?.profile_picture_path ? `http://localhost:5000${profile.profile_picture_path}` : null);
        setShowEditModal(true);
    };

    const handleImageChange = e => {
        const file = e.target.files[0];
        if (file) {
            setEditImage(file);
            setEditPreview(URL.createObjectURL(file));
        }
    };

    const handleDocumentChange = e => {
        const file = e.target.files[0];
        if (file) {
            setEditDocument(file);
        }
    };

    const handleSaveProfile = async e => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('name', editForm.name);
        if (editForm.phone) formData.append('phone', editForm.phone);
        if (editImage) formData.append('profilePicture', editImage);
        if (editDocument) formData.append('verifiedDocument', editDocument);

        try {
            const res = await updateProfile(formData);
            setProfile(res.data.user);
            localStorage.setItem('user', JSON.stringify({ ...user, name: res.data.user.name }));
            setShowEditModal(false);
            alert('Profile updated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

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
                <div className="d-flex align-items-center">
                    {profile?.profile_picture_path && (
                        <img
                            src={`http://localhost:5000${profile.profile_picture_path}`}
                            alt="Profile"
                            className="rounded-circle me-3"
                            style={{ width: 60, height: 60, objectFit: 'cover' }}
                        />
                    )}
                    <div>
                        <h3 className="fw-bold mb-0">👤 My Profile</h3>
                        <p className="text-muted mb-1">{profile?.name || user.name} ({user.email})</p>
                        {profile?.phone && <p className="text-muted mb-1">📞 {profile.phone}</p>}
                        {profile?.verified_document_path ? (
                            <p className="text-muted mb-1">
                                ✅ Verified document uploaded: <a href={`http://localhost:5000${profile.verified_document_path}`} target="_blank" rel="noreferrer">View document</a>
                            </p>
                        ) : (
                            <p className="text-muted mb-1">⚠️ No verified document uploaded yet. Upload one to improve trust.</p>
                        )}
                        <small className="text-muted">Role: {user.role}</small>
                    </div>
                </div>
                <div>
                    <button className="btn btn-outline-primary me-2" onClick={handleEditProfile}>
                        ✏️ Edit Profile
                    </button>
                    <Link to="/report" className="btn btn-primary">
                        + Report Item
                    </Link>
                </div>
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

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Profile</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <form onSubmit={handleSaveProfile}>
                                <div className="modal-body">
                                    <div className="mb-3 text-center">
                                        {editPreview && (
                                            <img
                                                src={editPreview}
                                                alt="Preview"
                                                className="rounded-circle mb-3"
                                                style={{ width: 100, height: 100, objectFit: 'cover' }}
                                            />
                                        )}
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                        <small className="text-muted">Optional profile picture (max 5MB)</small>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Verified Document (ID / Certificate)</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*,application/pdf"
                                            onChange={handleDocumentChange}
                                        />
                                        <small className="text-muted">Optional trusted document (PDF/JPG/PNG, max 10MB)</small>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            value={editForm.phone}
                                            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                            placeholder="+977 98XXXXXXXX"
                                        />
                                        <small className="text-muted">Visible to admin/police for verification</small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
