// src/pages/Home.jsx
import { Link } from 'react-router-dom';

const Home = () => {
    const isLoggedIn = !!localStorage.getItem('token');

    return (
        <div>
            {/* Hero */}
            <div className="bg-primary text-white py-5">
                <div className="container text-center py-3">
                    <h1 className="display-5 fw-bold">🇳🇵 Nepal Lost & Found</h1>
                    <p className="lead mb-4">
                        Centralized Lost and Recovery Platform with Nepal Police Integration.<br />
                        AI-powered matching to reunite people with their belongings.
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                        <Link to="/items" className="btn btn-light btn-lg">Browse Items</Link>
                        {isLoggedIn
                            ? <Link to="/report" className="btn btn-outline-light btn-lg">Report Item</Link>
                            : <Link to="/register" className="btn btn-outline-light btn-lg">Get Started</Link>
                        }
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="container py-5">
                <h2 className="text-center fw-bold mb-4">How It Works</h2>
                <div className="row g-4 text-center">
                    {[
                        { icon: '📋', title: 'Report',  desc: 'Submit a lost or found item report with photos and location details.' },
                        { icon: '🤖', title: 'AI Match', desc: 'Our NLP engine automatically scans and scores potential matches using text similarity.' },
                        { icon: '🔗', title: 'Connect', desc: 'Matched parties are notified and can contact each other to resolve the case.' },
                        { icon: '🛡️', title: 'Police Verified', desc: 'Nepal Police admins oversee all reports and can update statuses.' },
                    ].map(f => (
                        <div className="col-md-3" key={f.title}>
                            <div className="card h-100 border-0 shadow-sm p-4">
                                <div style={{ fontSize: '2.5rem' }}>{f.icon}</div>
                                <h5 className="fw-bold mt-2">{f.title}</h5>
                                <p className="text-muted small">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-light py-4">
                <div className="container text-center">
                    <h5 className="fw-bold">Lost something? Found something?</h5>
                    <p className="text-muted">Join thousands of Nepalis recovering their belongings.</p>
                    <Link to={isLoggedIn ? '/report' : '/register'} className="btn btn-primary">
                        {isLoggedIn ? '+ Report an Item' : 'Create Free Account'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
