import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/RoleSelection.css';

const RoleSelection = ({ setUserRole }) => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setUserRole(role);
    // Store the selected role in localStorage to persist it
    localStorage.setItem('selectedRole', role);
    // Navigate to signup page
    navigate('/signup');
  };

  return (
    <div className="role-selection-container">
      <div className="role-selection-card">
        <div className="role-selection-header">
          <h2>Join HIreLy as a...</h2>
          <p>Choose how you want to use our platform</p>
        </div>
        
        <div className="role-options">
          <div className="role-option" onClick={() => handleRoleSelect('seeker')}>
            <div className="role-icon">
              <i className="fas fa-search"></i>
            </div>
            <h3>Service Seeker</h3>
            <p>Find skilled professionals for your needs</p>
          </div>
          
          <div className="role-option" onClick={() => handleRoleSelect('provider')}>
            <div className="role-icon">
              <i className="fas fa-tools"></i>
            </div>
            <h3>Service Provider</h3>
            <p>Offer your skills and services to clients</p>
          </div>
        </div>
        
        <div className="role-selection-footer">
          <p>Already have an account? <a href="#" onClick={() => navigate('/login')}>Log in</a></p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
