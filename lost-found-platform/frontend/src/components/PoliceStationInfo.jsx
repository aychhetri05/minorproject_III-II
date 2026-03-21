// src/components/PoliceStationInfo.jsx
import React from 'react';

const PoliceStationInfo = ({ policeStation }) => {
    if (!policeStation) return null;

    return (
        <div className="alert alert-info border-info">
            <h6 className="alert-heading mb-2">
                🚔 Police Station Information
            </h6>
            <p className="mb-1">
                <strong>Station:</strong> {policeStation.name}
            </p>
            <p className="mb-1">
                <strong>Address:</strong> {policeStation.address}
            </p>
            {policeStation.contact && (
                <p className="mb-1">
                    <strong>Contact:</strong> {policeStation.contact}
                </p>
            )}
            {policeStation.district && (
                <p className="mb-1">
                    <strong>District:</strong> {policeStation.district}
                </p>
            )}
            <div className="mt-2">
                <small className="text-muted">
                    The found item has been submitted to this police station for physical verification.
                    You can contact them directly for more information.
                </small>
            </div>
        </div>
    );
};

export default PoliceStationInfo;