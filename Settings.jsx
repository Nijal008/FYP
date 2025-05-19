import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Settings.css';
import Sidebar from './Sidebar';

function Settings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [adminProfile, setAdminProfile] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [siteSettings, setSiteSettings] = useState({
        siteName: 'HamroJob',
        siteDescription: 'Find your dream job in Nepal',
        contactEmail: 'contact@hamrojob.com',
        phoneNumber: '+977 1234567890',
        address: 'Kathmandu, Nepal'
    });

    useEffect(() => {
        // Check if admin is logged in
        const adminUser = localStorage.getItem('adminUser');
        if (!adminUser) {
            navigate('/admin/login');
            return;
        }

        // Load admin profile
        const admin = JSON.parse(adminUser);
        setAdminProfile(prevState => ({
            ...prevState,
            name: admin.name || '',
            email: admin.email || ''
        }));

        // In a real app, you would fetch site settings from your API
    }, [navigate]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setAdminProfile(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSiteSettingsChange = (e) => {
        const { name, value } = e.target;
        setSiteSettings(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Validate passwords
        if (adminProfile.newPassword && adminProfile.newPassword !== adminProfile.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            setLoading(false);
            return;
        }

        try {
            // In a real app, you would send this data to your API
            // For now, we'll just simulate a successful update
            setTimeout(() => {
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                setLoading(false);
                
                // Clear password fields
                setAdminProfile(prevState => ({
                    ...prevState,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            }, 1000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile' });
            setLoading(false);
        }
    };

    const updateSiteSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // In a real app, you would send this data to your API
            // For now, we'll just simulate a successful update
            setTimeout(() => {
                setMessage({ type: 'success', text: 'Site settings updated successfully' });
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error updating site settings:', error);
            setMessage({ type: 'error', text: 'Failed to update site settings' });
            setLoading(false);
        }
    };

    return (
        <div className="admin-settings">
            <Sidebar />
            
            <div className="settings-content">
                <div className="settings-header">
                    <h1>Settings</h1>
                </div>

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="settings-sections">
                    <div className="settings-section">
                        <h2>Admin Profile</h2>
                        <form onSubmit={updateProfile}>
                            <div className="form-group">
                                <label>Name</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={adminProfile.name} 
                                    onChange={handleProfileChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={adminProfile.email} 
                                    onChange={handleProfileChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input 
                                    type="password" 
                                    name="currentPassword" 
                                    value={adminProfile.currentPassword} 
                                    onChange={handleProfileChange} 
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    name="newPassword" 
                                    value={adminProfile.newPassword} 
                                    onChange={handleProfileChange} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    name="confirmPassword" 
                                    value={adminProfile.confirmPassword} 
                                    onChange={handleProfileChange} 
                                />
                            </div>
                            <button type="submit" disabled={loading}>
                                {loading ? "Updating..." : "Update Profile"}
                            </button>
                        </form>
                    </div>

                    <div className="settings-section">
                        <h2>Site Settings</h2>
                        <form onSubmit={updateSiteSettings}>
                            <div className="form-group">
                                <label>Site Name</label>
                                <input 
                                    type="text" 
                                    name="siteName" 
                                    value={siteSettings.siteName} 
                                    onChange={handleSiteSettingsChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Site Description</label>
                                <textarea 
                                    name="siteDescription" 
                                    value={siteSettings.siteDescription} 
                                    onChange={handleSiteSettingsChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Contact Email</label>
                                <input 
                                    type="email" 
                                    name="contactEmail" 
                                    value={siteSettings.contactEmail} 
                                    onChange={handleSiteSettingsChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input 
                                    type="text" 
                                    name="phoneNumber" 
                                    value={siteSettings.phoneNumber} 
                                    onChange={handleSiteSettingsChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <input 
                                    type="text" 
                                    name="address" 
                                    value={siteSettings.address} 
                                    onChange={handleSiteSettingsChange} 
                                    required 
                                />
                            </div>
                            <button type="submit" disabled={loading}>
                                {loading ? "Updating..." : "Update Settings"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;