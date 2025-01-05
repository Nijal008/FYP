import React from 'react';

const RoleSelection = ({ setStep }) => {
  return (
    <div className="role-selection-container">
      <h2>Sign Up as</h2>
      <p>Choose one:</p>
      <div className="role-options">
        <div className="role-option" onClick={() => setStep('signup')}>
          Freelancer Looking for a Job
        </div>
        <div className="role-option" onClick={() => setStep('signup')}>
          Join as Client
        </div>
      </div>
      <button onClick={() => setStep('signup')}>Continue</button>
    </div>
  );
};

export default RoleSelection;
