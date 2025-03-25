import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

const Profile = ({ user, onLogout, onProfileUpdate }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    profileImage: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Split name into first and last name if needed
    if (user.name && !profileData.firstName) {
      const nameParts = user.name.split(' ');
      setProfileData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        profileImage: user.profile_pic || ''
      }));
    }
    
    // Fetch user profile data
    fetchUserProfile();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    if (!user || !user.id) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/${user.id}/profile`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      
      // Split name into first and last name
      const nameParts = data.name ? data.name.split(' ') : ['', ''];
      
      setProfileData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        bio: data.bio || '',
        profileImage: data.profile_pic || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ text: 'Error loading profile data', type: 'error' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profileImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      if (!user || !user.id) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Format data for the API
      const formattedData = {
        name: `${profileData.firstName} ${profileData.lastName}`,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        bio: profileData.bio,
        profile_pic: profileData.profileImage
      };

      // Send the profile data to the backend
      const response = await fetch(`http://localhost:3000/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update the user data in parent component if needed
      if (typeof onProfileUpdate === 'function') {
        onProfileUpdate(data);
      }
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: error.message || 'Error updating profile', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <header className="header">
        <div className="logo">
          <h1 onClick={() => navigate('/')}>Hirely</h1>
        </div>
        <nav className="nav">
          <ul>
            <li onClick={() => navigate('/')}>Home</li>
            <li onClick={() => navigate('/services')}>Services</li>
            
          </ul>
        </nav>
      </header>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="sidebar-menu">
            <div className="menu-item active">
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
            <div className="menu-item" onClick={() => navigate('/settings')}>
              <i className="fas fa-cog"></i>
              <span>Account Settings</span>
            </div>
            <div className="menu-item logout" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Log Out</span>
            </div>
          </div>
        </div>

        <div className="profile-main">
          <div className="profile-header">
            <h2>My Profile</h2>
            <button 
              className={`edit-button ${isEditing ? 'save-button' : ''}`}
              onClick={() => isEditing ? handleSubmit() : setIsEditing(true)}
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="profile-form">
            <div className="profile-image-section">
              <div className="profile-image">
                {profileData.profileImage ? (
                  <img src={profileData.profileImage} alt="Profile" />
                ) : (
                  <div className="profile-initial">
                    {profileData.firstName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="image-upload">
                  <label htmlFor="profile-image-upload">Change Photo</label>
                  <input 
                    type="file" 
                    id="profile-image-upload" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={profileData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={profileData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={profileData.email}
                  onChange={handleChange}
                  disabled={true} // Email should not be editable
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={profileData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={profileData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea 
                  name="bio" 
                  value={profileData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows="4"
                ></textarea>
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button type="button" onClick={() => setIsEditing(false)} className="cancel-button">
                    Cancel
                  </button>
                  <button type="submit" className="save-button" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;