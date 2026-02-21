// src/pages/ViewItems.jsx
import { useEffect, useState } from 'react';
import { getAllItems } from '../services/api';
import ItemCard from '../components/ItemCard';

const ViewItems = () => {
    const [items, setItems]     = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: 'all', status: 'all', search: '' });

    useEffect(() => {
        getAllItems()
            .then(res => { setItems(res.data); setFiltered(res.data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let result = [...items];
        if (filters.type !== 'all')   result = result.filter(i => i.type === filters.type);
        if (filters.status !== 'all') result = result.filter(i => i.status === filters.status);
        if (filters.search.trim()) {
            const q = filters.search.toLowerCase();
            result = result.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.description.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [filters, items]);

    const handleFilter = e => setFilters({ ...filters, [e.target.name]: e.target.value });

    return (
        <div className="container py-4">
            <h3 className="fw-bold mb-1">📋 All Reported Items</h3>
            <p className="text-muted mb-4">Browse lost and found items reported across Nepal.</p>

            {/* Filters */}
            <div className="card mb-4 shadow-sm">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <input
                                type="text"
                                name="search"
                                className="form-control"
                                placeholder="🔍 Search by title or description..."
                                value={filters.search}
                                onChange={handleFilter}
                            />
                        </div>
                        <div className="col-md-4">
                            <select name="type" className="form-select" value={filters.type} onChange={handleFilter}>
                                <option value="all">All Types</option>
                                <option value="lost">Lost</option>
                                <option value="found">Found</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <select name="status" className="form-select" value={filters.status} onChange={handleFilter}>
                                <option value="all">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="matched">Matched</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-muted mb-3">Showing <strong>{filtered.length}</strong> items</p>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-5">
                    <p className="text-muted fs-5">No items found matching your filters.</p>
                </div>
            ) : (
                <div className="row g-3">
                    {filtered.map(item => (
                        <div className="col-sm-6 col-lg-4" key={item.id}>
                            <ItemCard item={item} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewItems;
