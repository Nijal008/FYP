import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Settings.css';

const Settings = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [accountSettings, setAccountSettings] = useState({
    email: '',
    notifications: {
      email: true,
      sms: false,
      app: true
    },
    language: 'english'
  });
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Set initial account settings from user data
    setAccountSettings(prev => ({
      ...prev,
      email: user.email || ''
    }));

    // Fetch additional user settings if needed
    fetchUserSettings();
  }, [user, navigate]);

  const fetchUserSettings = async () => {
    if (!user || !user.id) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/${user.id}/settings`);
      
      // If endpoint doesn't exist yet, just use current user data
      if (!response.ok) {
        console.log('Settings endpoint not implemented yet, using current user data');
        return;
      }
      
      const data = await response.json();
      setAccountSettings(prev => ({
        ...prev,
        ...data,
        email: data.email || user.email || ''
      }));
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const handleAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setAccountSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [name]: checked
        }
      }));
    } else {
      setAccountSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      if (!user || !user.id) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Format data for the API
      const formattedData = {
        email: accountSettings.email,
        // You can add additional fields here if the backend supports them
        notifications: accountSettings.notifications,
        language: accountSettings.language
      };

      // Send the settings data to the backend
      const response = await fetch(`http://localhost:3000/api/users/${user.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        // If the endpoint doesn't exist yet, try updating just the email
        if (response.status === 404) {
          const emailUpdateResponse = await fetch(`http://localhost:3000/api/users/${user.id}/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: accountSettings.email })
          });
          
          if (!emailUpdateResponse.ok) {
            const errorData = await emailUpdateResponse.json();
            throw new Error(errorData.message || 'Failed to update email');
          }
          
          setMessage({ text: 'Email updated successfully!', type: 'success' });
          setIsLoading(false);
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update account settings');
      }

      const data = await response.json();
      setMessage({ text: 'Account settings updated successfully!', type: 'success' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating account settings:', error);
      setMessage({ text: error.message || 'Error updating account settings', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    // Validate passwords
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      setMessage({ text: 'New passwords do not match!', type: 'error' });
      setIsLoading(false);
      return;
    }
    
    if (securitySettings.newPassword.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters long!', type: 'error' });
      setIsLoading(false);
      return;
    }
    
    try {
      // Make sure we have the user's email
      const email = accountSettings.email || user?.email;
      if (!email) {
        throw new Error('User email not found. Please refresh the page and try again.');
      }

      console.log('Submitting password change for:', email);
      
      // Call the API to update password
      const response = await fetch('http://localhost:3000/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          currentPassword: securitySettings.currentPassword,
          newPassword: securitySettings.newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      setMessage({ text: data.message || 'Password updated successfully!', type: 'success' });
      
      // Clear form
      setSecuritySettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ 
        text: error.message || 'Error changing password', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <header className="header">
        <div className="logo">
          <h1 onClick={() => navigate('/')}>Hirely</h1>
        </div>
        <nav className="nav">
          <ul>
            <li onClick={() => navigate('/')}>Home</li>
            <li onClick={() => navigate('/services')}>Services</li>
            <li onClick={() => navigate('/dashboard')}>Dashboard</li>
          </ul>
        </nav>
      </header>

      <div className="settings-content">
        <div className="profile-sidebar">
          <div className="sidebar-menu">
            <div className="menu-item" onClick={() => navigate('/profile')}>
              <i className="fas fa-user"></i>
              <span>My Profile</span>
            </div>
            <div className="menu-item" onClick={() => navigate('/bookings')}>
              <i className="fas fa-calendar-check"></i>
              <span>My Bookings</span>
            </div>
            <div className="menu-item" onClick={() => navigate('/payments')}>
              <i className="fas fa-credit-card"></i>
              <span>Payment Methods</span>
            </div>
            <div className="menu-item active">
              <i className="fas fa-cog"></i>
              <span>Account Settings</span>
            </div>
            <div className="menu-item logout" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Log Out</span>
            </div>
          </div>
        </div>

        <div className="settings-main">
          <div className="settings-header">
            <h2>Account Settings</h2>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="settings-tabs">
            <div 
              className={`tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account Preferences
            </div>
            <div 
              className={`tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </div>
          </div>

          <div className="settings-forms">
            {activeTab === 'account' && (
              <form onSubmit={handleAccountSubmit} className="account-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={accountSettings.email}
                    onChange={handleAccountChange}
                    disabled
                  />
                  <small>To change your email, please contact support.</small>
                </div>

                <div className="form-group">
                  <label>Language</label>
                  <select 
                    name="language" 
                    value={accountSettings.language}
                    onChange={handleAccountChange}
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notifications</label>
                  <div className="checkbox-group">
                    <div className="checkbox-item">
                      <input 
                        type="checkbox" 
                        id="email-notifications" 
                        name="email" 
                        checked={accountSettings.notifications.email}
                        onChange={handleAccountChange}
                      />
                      <label htmlFor="email-notifications">Email Notifications</label>
                    </div>
                    <div className="checkbox-item">
                      <input 
                        type="checkbox" 
                        id="sms-notifications" 
                        name="sms" 
                        checked={accountSettings.notifications.sms}
                        onChange={handleAccountChange}
                      />
                      <label htmlFor="sms-notifications">SMS Notifications</label>
                    </div>
                    <div className="checkbox-item">
                      <input 
                        type="checkbox" 
                        id="app-notifications" 
                        name="app" 
                        checked={accountSettings.notifications.app}
                        onChange={handleAccountChange}
                      />
                      <label htmlFor="app-notifications">App Notifications</label>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleSecuritySubmit} className="security-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={securitySettings.currentPassword}
                    onChange={handleSecurityChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={securitySettings.newPassword}
                    onChange={handleSecurityChange}
                    required
                  />
                  <small>Password must be at least 8 characters long</small>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={securitySettings.confirmPassword}
                    onChange={handleSecurityChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;