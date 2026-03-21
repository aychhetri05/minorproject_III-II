import React, { useEffect, useState } from 'react';
import { getPoliceItems, getPoliceMatches, verifyMatch, rejectMatch, getPoliceSubmissions, acceptSubmission, rejectSubmission, getPendingPhysical } from '../services/api';
import PhysicalVerifyButton from '../components/PhysicalVerifyButton';

const PoliceDashboard = () => {
    const [filters, setFilters] = useState({ type: '', status: '', location: '' });
    const [items, setItems] = useState([]);
    const [matches, setMatches] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [pendingPhysical, setPendingPhysical] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('submissions'); // submissions, matches, items, pending_physical

    const loadItems = async () => {
        setLoading(true);
        try {
            const res = await getPoliceItems(filters);
            setItems(res.data || []);
        } catch (err) {
            console.error('LoadPoliceItems', err);
        } finally { setLoading(false); }
    };

    const loadMatches = async () => {
        try {
            const res = await getPoliceMatches();
            setMatches(res.data || []);
        } catch (err) { console.error('LoadMatches', err); }
    };

    const loadSubmissions = async () => {
        try {
            const res = await getPoliceSubmissions();
            setSubmissions(res.data || []);
        } catch (err) { console.error('LoadSubmissions', err); }
    };

    const loadPendingPhysical = async () => {
        try {
            const res = await getPendingPhysical();
            setPendingPhysical(res.data || []);
        } catch (err) { console.error('LoadPendingPhysical', err); }
    };

    useEffect(() => { 
        loadItems(); 
        loadMatches(); 
        loadSubmissions();
        loadPendingPhysical();
    }, []);

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
    const applyFilters = () => loadItems();

    const handleVerify = async (matchId) => {
        const notes = prompt('Optional verification notes:') || '';
        try {
            await verifyMatch(matchId, { notes });
            alert('✔ Match verified.');
            loadItems(); 
            loadMatches();
        } catch (err) { alert('Error verifying match'); }
    };

    const handleReject = async (matchId) => {
        const notes = prompt('Reason for rejection:') || '';
        try {
            await rejectMatch(matchId, { notes });
            alert('✔ Match rejected.');
            loadItems(); 
            loadMatches();
        } catch (err) { alert('Error rejecting match'); }
    };

    const handleAcceptSubmission = async (subId, location_details) => {
        const notes = prompt('Officer verification notes (optional):') || '';
        try {
            await acceptSubmission(subId, { notes });
            alert('✔ Submission accepted. Item marked as Physically Verified.');
            loadSubmissions();
            loadItems();
        } catch (err) { 
            console.error(err);
            alert(err.response?.data?.message || 'Error accepting submission'); 
        }
    };

    const handleRejectSubmission = async (subId) => {
        const notes = prompt('Reason for rejection:') || '';
        if (!notes) return;
        try {
            await rejectSubmission(subId, { notes });
            alert('✔ Submission rejected.');
            loadSubmissions();
        } catch (err) { alert('Error rejecting submission'); }
    };

    const pendingCount = submissions.filter(s => s.status === 'pending').length;
    const pendingPhysicalCount = pendingPhysical.length;

    return (
        <div className="container-fluid py-4">
            <div className="mb-4">
                <h2 className="fw-bold mb-1">🚔 Police Verification Dashboard</h2>
                <p className="text-muted mb-0">Review physical submissions, AI matches, and manage items</p>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-lg-3">
                    <div className={`card border-warning bg-light`}>
                        <div className="card-body text-center">
                            <h5 className="card-title text-warning">⏳ Pending Submissions</h5>
                            <h3 className="fw-bold text-warning">{pendingCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className={`card border-info bg-light`}>
                        <div className="card-body text-center">
                            <h5 className="card-title text-info">🔗 Total Matches</h5>
                            <h3 className="fw-bold text-info">{matches.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className={`card border-primary bg-light`}>
                        <div className="card-body text-center">
                            <h5 className="card-title text-primary">📦 All Items</h5>
                            <h3 className="fw-bold text-primary">{items.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className={`card border-success bg-light`}>
                        <div className="card-body text-center">
                            <h5 className="card-title text-success">✔ Verified</h5>
                            <h3 className="fw-bold text-success">{items.filter(i => i.physically_verified).length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'submissions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('submissions')}
                    >
                        📋 Pending Physical Submissions ({pendingCount})
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'pending_physical' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending_physical')}
                    >
                        ⏳ Items Awaiting Verification ({pendingPhysicalCount})
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'matches' ? 'active' : ''}`}
                        onClick={() => setActiveTab('matches')}
                    >
                        🔗 AI Matches ({matches.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'items' ? 'active' : ''}`}
                        onClick={() => setActiveTab('items')}
                    >
                        📦 All Items
                    </button>
                </li>
            </ul>

            {/* SUBMISSIONS TAB */}
            {activeTab === 'submissions' && (
                <div>
                    <h4 className="fw-bold mb-3">📋 Pending Physical Submissions</h4>
                    {submissions.length === 0 ? (
                        <div className="alert alert-info">
                            <strong>✔ All caught up!</strong> No pending physical submissions.
                        </div>
                    ) : (
                        <div className="row g-3">
                            {submissions
                                .filter(s => s.status === 'pending')
                                .map(s => (
                                    <div className="col-lg-6" key={s.id}>
                                        <div className="card border-warning shadow-sm">
                                            <div className="card-header bg-warning text-dark">
                                                <h6 className="mb-0">
                                                    <strong>Submission #{s.id}</strong> - {s.item_title}
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="row g-2 mb-3">
                                                    <div className="col-6">
                                                        <strong>Submitted by:</strong><br/>
                                                        <small>{s.found_user_name}</small>
                                                    </div>
                                                    <div className="col-6">
                                                        <strong>Contact:</strong><br/>
                                                        <small>{s.found_user_email}</small><br/>
                                                        {s.found_user_phone && <small>📞 {s.found_user_phone}</small>}
                                                    </div>
                                                    <div className="col-6">
                                                        <strong>Police Station:</strong><br/>
                                                        <small>{s.police_station || '-'}</small>
                                                    </div>
                                                    <div className="col-6">
                                                        <strong>Submitted on:</strong><br/>
                                                        <small>{new Date(s.submission_timestamp).toLocaleString()}</small>
                                                    </div>
                                                    {s.location_details && (
                                                        <div className="col-12">
                                                            <strong>Details:</strong><br/>
                                                            <small className="text-muted">{s.location_details}</small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="card-footer d-flex gap-2">
                                                <button 
                                                    className="btn btn-success btn-sm flex-grow-1"
                                                    onClick={() => handleAcceptSubmission(s.id, s.location_details)}
                                                >
                                                    ✔ Accept & Verify
                                                </button>
                                                <button 
                                                    className="btn btn-danger btn-sm flex-grow-1"
                                                    onClick={() => handleRejectSubmission(s.id)}
                                                >
                                                    ✗ Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* PHYSICAL PENDING ITEMS TAB */}
            {activeTab === 'pending_physical' && (
                <div>
                    <h4 className="fw-bold mb-3">⏳ Items Awaiting Physical Verification</h4>
                    <p className="text-muted mb-3">
                        These found items have been submitted to your station and are awaiting physical inspection and verification.
                    </p>
                    {pendingPhysical.length === 0 ? (
                        <div className="alert alert-success">
                            <strong>✔ All caught up!</strong> No pending items awaiting verification.
                        </div>
                    ) : (
                        <div className="row g-3">
                            {pendingPhysical.map(item => (
                                <div className="col-lg-6" key={item.id}>
                                    <div className="card border-info shadow-sm">
                                        <div className="card-header bg-info text-white">
                                            <h6 className="mb-0">
                                                <strong>Item #{item.id}</strong> - {item.title}
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row g-2 mb-3">
                                                <div className="col-6">
                                                    <strong>Found by:</strong><br/>
                                                    <small>{item.reporter_name}</small>
                                                </div>
                                                <div className="col-6">
                                                    <strong>Contact:</strong><br/>
                                                    <small>{item.reporter_email}</small>
                                                </div>
                                                <div className="col-6">
                                                    <strong>Type:</strong><br/>
                                                    <span className="badge bg-secondary">{item.type}</span>
                                                </div>
                                                <div className="col-6">
                                                    <strong>Status:</strong><br/>
                                                    <span className="badge bg-warning">Pending Physical</span>
                                                </div>
                                                <div className="col-12">
                                                    <strong>Description:</strong><br/>
                                                    <small className="text-muted">{item.description}</small>
                                                </div>
                                                {item.submission_timestamp && (
                                                    <div className="col-12">
                                                        <strong>Submitted on:</strong><br/>
                                                        <small className="text-muted">{new Date(item.submission_timestamp).toLocaleString()}</small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="card-footer d-flex gap-2">
                                            <PhysicalVerifyButton 
                                                itemId={item.id}
                                                itemTitle={item.title}
                                                onVerified={() => {
                                                    loadPendingPhysical();
                                                    loadItems();
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MATCHES TAB */}
            {activeTab === 'matches' && (
                <div>
                    <h4 className="fw-bold mb-3">🔗 AI Matched Items</h4>
                    {matches.length === 0 ? (
                        <div className="alert alert-info">
                            <strong>No matches</strong> available yet.
                        </div>
                    ) : (
                        <div className="row g-3">
                            {matches.map(m => (
                                <div className="col-lg-6" key={m.id}>
                                    <div className={`card border-${m.verification_status === 'pending' ? 'warning' : m.verification_status === 'verified' ? 'success' : 'danger'}`}>
                                        <div className={`card-header bg-${m.verification_status === 'pending' ? 'warning' : m.verification_status === 'verified' ? 'success' : 'danger'} text-${m.verification_status === 'pending' ? 'dark' : 'white'}`}>
                                            <h6 className="mb-0">
                                                <strong>Match #{m.id}</strong> - Score: {(m.similarity_score * 100).toFixed(1)}%
                                                {' '}
                                                <span className={`badge bg-${m.verification_status === 'pending' ? 'secondary' : m.verification_status === 'verified' ? 'success' : 'danger'}`}>
                                                    {m.verification_status}
                                                </span>
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <strong className="text-danger">❌ Lost Item:</strong><br/>
                                                    <small>{m.lost_title}</small><br/>
                                                    <small className="text-muted">Reporter: {m.lost_reporter}</small>
                                                </div>
                                                <div className="col-6">
                                                    <strong className="text-info">📦 Found Item:</strong><br/>
                                                    <small>{m.found_title}</small><br/>
                                                    <small className="text-muted">Reporter: {m.found_reporter}</small>
                                                </div>
                                            </div>
                                        </div>
                                        {m.verification_status === 'pending' && (
                                            <div className="card-footer d-flex gap-2">
                                                <button 
                                                    className="btn btn-success btn-sm flex-grow-1"
                                                    onClick={() => handleVerify(m.id)}
                                                >
                                                    ✔ Verify
                                                </button>
                                                <button 
                                                    className="btn btn-danger btn-sm flex-grow-1"
                                                    onClick={() => handleReject(m.id)}
                                                >
                                                    ✗ Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ITEMS TAB */}
            {activeTab === 'items' && (
                <div>
                    <h4 className="fw-bold mb-3">📦 All Items</h4>
                    
                    <div className="card mb-3">
                        <div className="card-header">
                            <h6 className="mb-0">🔍 Filters</h6>
                        </div>
                        <div className="card-body">
                            <div className="row g-2 mb-2">
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Type</label>
                                    <select name="type" value={filters.type} onChange={handleFilterChange} className="form-select form-select-sm">
                                        <option value="">All</option>
                                        <option value="lost">Lost</option>
                                        <option value="found">Found</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Status</label>
                                    <select name="status" value={filters.status} onChange={handleFilterChange} className="form-select form-select-sm">
                                        <option value="">All</option>
                                        <option value="reported">Reported</option>
                                        <option value="pending_physical">Pending Physical</option>
                                        <option value="physically_verified">Physically Verified</option>
                                        <option value="matched">Matched</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">Location/Keywords</label>
                                    <input name="location" value={filters.location} onChange={handleFilterChange} className="form-control form-control-sm" placeholder="city or text" />
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button onClick={applyFilters} className="btn btn-primary btn-sm w-100">Filter</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="alert alert-info">No items found matching your filters.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Reporter</th>
                                        <th>Verified</th>
                                        <th>Storage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(i => (
                                        <tr key={i.id} className={i.physically_verified ? 'table-success' : ''}>
                                            <td><strong>#{i.id}</strong></td>
                                            <td>{i.title}</td>
                                            <td>
                                                <span className={`badge bg-${i.type === 'lost' ? 'danger' : 'info'}`}>
                                                    {i.type}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary">{i.status.replace(/_/g, ' ')}</span>
                                            </td>
                                            <td><small>{i.reporter_name}</small></td>
                                            <td>
                                                {i.physically_verified ? (
                                                    <span className="badge bg-success">✔ Verified</span>
                                                ) : (
                                                    <span className="badge bg-secondary">-</span>
                                                )}
                                            </td>
                                            <td>{i.storage_status || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PoliceDashboard;
