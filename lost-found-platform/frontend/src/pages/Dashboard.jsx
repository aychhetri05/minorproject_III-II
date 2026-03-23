// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllItems, deleteItem } from '../services/api';
import ItemCard from '../components/ItemCard';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [items, setItems]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');

    const handleDelete = async (id) => {
        try {
            await deleteItem(id);
            setItems(prev => prev.filter(item => item.id !== id));
            setMsg('✅ Item deleted successfully.');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            if (err.response?.status === 403) {
                setMsg('❌ You are not authorized to delete this item.');
            } else if (err.response?.status === 404) {
                setMsg('❌ Item not found.');
            } else {
                setMsg('❌ Delete failed.');
            }
            setTimeout(() => setMsg(''), 3000);
        }
    };

    useEffect(() => {
        getAllItems()
            .then(res => {
                // Show only the current user's items on dashboard
                const myItems = res.data.filter(i => i.user_id === user.id);
                setItems(myItems);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user.id]);

    const stats = {
        total:    items.length,
        lost:     items.filter(i => i.type === 'lost').length,
        found:    items.filter(i => i.type === 'found').length,
        matched:  items.filter(i => i.status === 'matched').length,
        resolved: items.filter(i => i.status === 'resolved').length,
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-0">👋 Welcome, {user.name}!</h3>
                    <p className="text-muted mb-0">Your lost & found reports</p>
                </div>
                <Link to="/report" className="btn btn-primary">
                    + Report Item
                </Link>
            </div>

            {/* Stats row */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Total Reports', value: stats.total,    color: 'primary',   icon: '📋' },
                    { label: 'Lost Items',    value: stats.lost,     color: 'danger',    icon: '🔍' },
                    { label: 'Found Items',   value: stats.found,    color: 'info',      icon: '📦' },
                    { label: 'Matched',       value: stats.matched,  color: 'warning',   icon: '✅' },
                    { label: 'Resolved',      value: stats.resolved, color: 'secondary', icon: '🎉' },
                ].map(s => (
                    <div className="col-6 col-md-4 col-lg" key={s.label}>
                        <div className={`card border-${s.color} text-center p-3`}>
                            <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
                            <h4 className={`fw-bold text-${s.color} mb-0`}>{s.value}</h4>
                            <small className="text-muted">{s.label}</small>
                        </div>
                    </div>
                ))}
            </div>

            {msg && <div className="alert alert-info py-2">{msg}</div>}

            {/* Items list */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-5">
                    <p className="text-muted fs-5">You haven't reported any items yet.</p>
                    <Link to="/report" className="btn btn-primary">Report Your First Item</Link>
                </div>
            ) : (
                <div className="row g-3">
                    {items.map(item => (
                        <div className="col-sm-6 col-lg-4" key={item.id}>
                            <ItemCard item={item} onDelete={handleDelete} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
