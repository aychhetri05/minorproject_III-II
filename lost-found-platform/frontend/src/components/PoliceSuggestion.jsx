// src/components/PoliceSuggestion.jsx
import React from 'react';

const PoliceSuggestion = ({ item }) => {
    if (!item) return null;

    return (
        <div className="alert alert-warning border-warning">
            <h6 className="alert-heading mb-2">
                🚔 Police Reporting Suggestion
            </h6>
            <p className="mb-2">
                <strong>English:</strong> No match has been found for your item "{item.title}" within 24 hours.
                You can report this to Nepal Police online.
            </p>
            <p className="mb-3">
                <strong>नेपाली:</strong> २४ घण्टाभित्र तपाईंको सामान "{item.title}" को कुनै मिल्दो फेला परेन।
                तपाईं नेपाल प्रहरीमा अनलाइन रिपोर्ट गर्न सक्नुहुन्छ।
            </p>
            <div className="d-flex gap-2">
                <a
                    href="https://nepalpolice.gov.np/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                >
                    🖥️ Report Online
                </a>
                <small className="text-muted align-self-center">
                    Official Nepal Police website
                </small>
            </div>
        </div>
    );
};

export default PoliceSuggestion;