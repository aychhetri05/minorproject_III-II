import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '../services/api';

const Notifications = () => {
    const [notes, setNotes] = useState([]);

    const load = async () => {
        try {
            const res = await getNotifications();
            setNotes(res.data || []);
        } catch (err) { console.error('LoadNotifications', err); }
    };

    useEffect(() => { load(); }, []);

    const markRead = async (id) => {
        try {
            await markNotificationRead(id);
            load();
        } catch (err) { console.error(err); }
    };

    return (
        <div>
            <h4>Notifications</h4>
            <ul>
                {notes.map(n => (
                    <li key={n.id} style={{ marginBottom: 6 }}>
                        <div>{n.message}</div>
                        <small>{new Date(n.created_at).toLocaleString()} {n.is_read ? '(read)' : ''}</small>
                        {!n.is_read && <button onClick={() => markRead(n.id)} style={{ marginLeft: 8 }}>Mark read</button>}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notifications;
