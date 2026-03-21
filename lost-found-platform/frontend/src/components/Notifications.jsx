import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '../services/api';

const Notifications = ({ isDropdown = false }) => {
    const [notes, setNotes] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const load = async () => {
        try {
            const res = await getNotifications();
            const notifications = res.data || [];
            setNotes(notifications);
            setUnreadCount(notifications.filter(n => !n.is_read).length);
        } catch (err) {
            console.error('LoadNotifications', err);
        }
    };

    useEffect(() => { load(); }, []);

    const markRead = async (id) => {
        try {
            await markNotificationRead(id);
            load(); // Refresh the list
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            const unreadNotes = notes.filter(n => !n.is_read);
            await Promise.all(unreadNotes.map(n => markNotificationRead(n.id)));
            load();
        } catch (err) {
            console.error('Mark all read error:', err);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'match': return '🔍';
            case 'police_suggestion': return '🚔';
            case 'police_action': return '👮';
            case 'reminder': return '⏰';
            default: return '📢';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'match': return 'text-success';
            case 'police_suggestion': return 'text-warning';
            case 'police_action': return 'text-info';
            case 'reminder': return 'text-primary';
            default: return 'text-secondary';
        }
    };

    if (isDropdown) {
        // Dropdown version for navbar
        return (
            <div className="dropdown">
                <button
                    className="btn btn-outline-secondary position-relative dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    🔔 Notifications
                    {unreadCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            {unreadCount}
                        </span>
                    )}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: '350px', maxHeight: '400px', overflowY: 'auto' }}>
                    <li>
                        <h6 className="dropdown-header d-flex justify-content-between align-items-center">
                            Notifications
                            {unreadCount > 0 && (
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={markAllRead}
                                >
                                    Mark All Read
                                </button>
                            )}
                        </h6>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    {notes.length === 0 ? (
                        <li><span className="dropdown-item text-muted">No notifications</span></li>
                    ) : (
                        notes.slice(0, 10).map(n => (
                            <li key={n.id}>
                                <div className={`dropdown-item ${!n.is_read ? 'bg-light' : ''}`}>
                                    <div className="d-flex align-items-start">
                                        <span className="me-2">{getTypeIcon(n.type)}</span>
                                        <div className="flex-grow-1">
                                            <div className={`small ${getTypeColor(n.type)} fw-semibold`}>
                                                {n.type.replace('_', ' ').toUpperCase()}
                                            </div>
                                            <div className="small text-truncate" style={{ maxWidth: '280px' }}>
                                                {n.message}
                                            </div>
                                            <div className="small text-muted">
                                                {new Date(n.created_at).toLocaleDateString()}
                                                {!n.is_read && (
                                                    <button
                                                        className="btn btn-sm btn-link p-0 ms-2 text-decoration-none"
                                                        onClick={() => markRead(n.id)}
                                                    >
                                                        Mark read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                    {notes.length > 10 && (
                        <li><hr className="dropdown-divider" /></li>
                    )}
                    {notes.length > 10 && (
                        <li>
                            <span className="dropdown-item text-center text-muted small">
                                And {notes.length - 10} more...
                            </span>
                        </li>
                    )}
                </ul>
            </div>
        );
    }

    // Full page version
    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-8 mx-auto">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">📢 Notifications</h4>
                            {unreadCount > 0 && (
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={markAllRead}
                                >
                                    Mark All as Read ({unreadCount})
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            {notes.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <h5>No notifications yet</h5>
                                    <p>You'll receive notifications when matches are found or other important updates occur.</p>
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {notes.map(n => (
                                        <div key={n.id} className={`list-group-item ${!n.is_read ? 'bg-light' : ''}`}>
                                            <div className="d-flex align-items-start">
                                                <span className="me-3 fs-5">{getTypeIcon(n.type)}</span>
                                                <div className="flex-grow-1">
                                                    <div className={`fw-semibold ${getTypeColor(n.type)} mb-1`}>
                                                        {n.type.replace('_', ' ').toUpperCase()}
                                                    </div>
                                                    <p className="mb-2">{n.message}</p>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <small className="text-muted">
                                                            {new Date(n.created_at).toLocaleString()}
                                                        </small>
                                                        {!n.is_read && (
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => markRead(n.id)}
                                                            >
                                                                Mark as Read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
