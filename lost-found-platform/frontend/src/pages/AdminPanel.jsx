// src/pages/AdminPanel.jsx
import { useEffect, useState } from 'react';
import { getAdminStats, getAdminMatches, getAllItems, updateStatus } from '../services/api';

const AdminPanel = () => {
    const [stats, setStats]     = useState(null);
    const [matches, setMatches] = useState([]);
    const [items, setItems]     = useState([]);
    const [tab, setTab]         = useState('overview');
    const [loading, setLoading] = useState(true);
    const [msg, setMsg]         = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, matchesRes, itemsRes] = await Promise.all([
                getAdminStats(),
                getAdminMatches(),
                getAllItems()
            ]);
            setStats(statsRes.data);
            setMatches(matchesRes.data);
            setItems(itemsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleStatusChange = async (id, status) => {
        try {
            await updateStatus(id, status);
            setMsg(`✅ Item #${id} updated to "${status}"`);
            fetchData();
            setTimeout(() => setMsg(''), 3000);
        } catch {
            setMsg('❌ Failed to update status.');
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

    return (
        <div className="container py-4">
            <h3 className="fw-bold mb-1">🛡️ Admin Panel</h3>
            <p className="text-muted mb-4">Nepal Police / Institutional Authority Dashboard</p>

            {msg && <div className="alert alert-info py-2">{msg}</div>}

            {/* Stat cards */}
            {stats && (
                <div className="row g-3 mb-4">
                    {[
                        { label: 'Total Users',   value: stats.users,        color: 'primary',   icon: '👥' },
                        { label: 'Total Items',   value: stats.total,        color: 'dark',      icon: '📋' },
                        { label: 'Lost Items',    value: stats.lost,         color: 'danger',    icon: '🔍' },
                        { label: 'Found Items',   value: stats.found,        color: 'info',      icon: '📦' },
                        { label: 'Open',          value: stats.open,         color: 'success',   icon: '🟢' },
                        { label: 'Matched',       value: stats.matched,      color: 'warning',   icon: '🔗' },
                        { label: 'Resolved',      value: stats.resolved,     color: 'secondary', icon: '✔️' },
                        { label: 'AI Matches',    value: stats.totalMatches, color: 'purple',    icon: '🤖' },
                    ].map(s => (
                        <div className="col-6 col-md-3" key={s.label}>
                            <div className={`card border-${s.color === 'purple' ? 'primary' : s.color} text-center p-3`}>
                                <div style={{ fontSize: '1.6rem' }}>{s.icon}</div>
                                <h4 className={`fw-bold mb-0 text-${s.color === 'purple' ? 'primary' : s.color}`}>
                                    {s.value}
                                </h4>
                                <small className="text-muted">{s.label}</small>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                {['overview', 'matches', 'all_items'].map(t => (
                    <li className="nav-item" key={t}>
                        <button
                            className={`nav-link ${tab === t ? 'active' : ''}`}
                            onClick={() => setTab(t)}
                        >
                            {t === 'overview' ? '📊 Overview' : t === 'matches' ? '🤖 AI Matches' : '📋 All Items'}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Overview tab */}
            {tab === 'overview' && (
                <div className="alert alert-info">
                    <h6>System Overview</h6>
                    <p className="mb-0">
                        The platform currently has <strong>{stats?.total}</strong> reports.
                        AI has automatically identified <strong>{stats?.totalMatches}</strong> matches
                        between lost and found items. Use the tabs above to review matches and manage all items.
                    </p>
                </div>
            )}

            {/* AI Matches tab */}
            {tab === 'matches' && (
                <div>
                    <h5 className="fw-bold mb-3">🤖 AI-Matched Pairs ({matches.length})</h5>
                    {matches.length === 0 ? (
                        <p className="text-muted">No matches found yet.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover align-middle">
                                <thead className="table-dark">
                                    <tr>
                                        <th>#</th>
                                        <th>Lost Item</th>
                                        <th>Found Item</th>
                                        <th>AI Score</th>
                                        <th>Lost Reporter</th>
                                        <th>Found Reporter</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matches.map(m => (
                                        <tr key={m.id}>
                                            <td>{m.id}</td>
                                            <td>
                                                <strong>{m.lost_title}</strong>
                                                <br /><small className="text-muted">{m.lost_desc?.slice(0, 60)}...</small>
                                            </td>
                                            <td>
                                                <strong>{m.found_title}</strong>
                                                <br /><small className="text-muted">{m.found_desc?.slice(0, 60)}...</small>
                                            </td>
                                            <td>
                                                <span className={`badge bg-${m.similarity_score > 0.7 ? 'success' : 'warning'}`}>
                                                    {(m.similarity_score * 100).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td>{m.lost_reporter}</td>
                                            <td>{m.found_reporter}</td>
                                            <td>{new Date(m.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* All items tab */}
            {tab === 'all_items' && (
                <div>
                    <h5 className="fw-bold mb-3">📋 All Items ({items.length})</h5>
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle table-sm">
                            <thead className="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Reporter</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.title}</td>
                                        <td>
                                            <span className={`badge bg-${item.type === 'lost' ? 'danger' : 'info'}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge bg-${
                                                item.status === 'open' ? 'success'
                                                : item.status === 'matched' ? 'warning'
                                                : 'secondary'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>{item.reporter_name}</td>
                                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <select
                                                className="form-select form-select-sm"
                                                value={item.status}
                                                onChange={e => handleStatusChange(item.id, e.target.value)}
                                                style={{ width: 110 }}
                                            >
                                                <option value="open">Open</option>
                                                <option value="matched">Matched</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
