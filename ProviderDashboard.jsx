import React, { useState } from 'react';
import './styles/Dashboard.css';

const ProviderDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Provider Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>
      
      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <ul>
            <li 
              className={activeTab === 'dashboard' ? 'active' : ''} 
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </li>
            <li 
              className={activeTab === 'services' ? 'active' : ''} 
              onClick={() => setActiveTab('services')}
            >
              My Services
            </li>
            <li 
              className={activeTab === 'bookings' ? 'active' : ''} 
              onClick={() => setActiveTab('bookings')}
            >
              Bookings
            </li>
            <li 
              className={activeTab === 'messages' ? 'active' : ''} 
              onClick={() => setActiveTab('messages')}
            >
              Messages
            </li>
            <li 
              className={activeTab === 'reviews' ? 'active' : ''} 
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </li>
            <li 
              className={activeTab === 'earnings' ? 'active' : ''} 
              onClick={() => setActiveTab('earnings')}
            >
              Earnings
            </li>
            <li 
              className={activeTab === 'profile' ? 'active' : ''} 
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </li>
          </ul>
        </div>
        
        <div className="dashboard-main">
          {activeTab === 'dashboard' && (
            <>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Active Bookings</h3>
                  <p className="stat-number">5</p>
                </div>
                <div className="stat-card">
                  <h3>Completed Jobs</h3>
                  <p className="stat-number">27</p>
                </div>
                <div className="stat-card">
                  <h3>Total Earnings</h3>
                  <p className="stat-number">$1,240</p>
                </div>
                <div className="stat-card">
                  <h3>Average Rating</h3>
                  <p className="stat-number">4.8</p>
                </div>
              </div>
              
              <div className="upcoming-bookings">
                <h2>Upcoming Bookings</h2>
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Doe</td>
                      <td>Web Development</td>
                      <td>15 Jan 2025</td>
                      <td>10:00 - 12:00</td>
                      <td><span className="status-confirmed">Confirmed</span></td>
                      <td>
                        <button className="btn-small">View</button>
                        <button className="btn-small btn-danger">Cancel</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Sarah Smith</td>
                      <td>UI/UX Design</td>
                      <td>18 Jan 2025</td>
                      <td>14:00 - 16:00</td>
                      <td><span className="status-pending">Pending</span></td>
                      <td>
                        <button className="btn-small">View</button>
                        <button className="btn-small btn-success">Accept</button>
                        <button className="btn-small btn-danger">Decline</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          {activeTab === 'services' && (
            <div className="services-section">
              <div className="section-header">
                <h2>My Services</h2>
                <button className="btn-primary">Add New Service</button>
              </div>
              
              <div className="services-list">
                <div className="service-card">
                  <div className="service-header">
                    <h3>Web Development</h3>
                    <span className="service-rate">$45/hr</span>
                  </div>
                  <p className="service-description">
                    Full-stack web development services including frontend, backend, and database integration.
                  </p>
                  <div className="service-actions">
                    <button className="btn-small">Edit</button>
                    <button className="btn-small btn-danger">Delete</button>
                  </div>
                </div>
                
                <div className="service-card">
                  <div className="service-header">
                    <h3>UI/UX Design</h3>
                    <span className="service-rate">$40/hr</span>
                  </div>
                  <p className="service-description">
                    User interface and experience design for web and mobile applications.
                  </p>
                  <div className="service-actions">
                    <button className="btn-small">Edit</button>
                    <button className="btn-small btn-danger">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'profile' && (
            <div className="profile-section">
              <h2>My Profile</h2>
              <div className="profile-content">
                <div className="profile-image">
                  <img src={user.profilePic || "/images/default-avatar.png"} alt="Profile" />
                  <button className="btn-small">Change Photo</button>
                </div>
                
                <div className="profile-details">
                  <form className="profile-form">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" defaultValue={user.name} />
                    </div>
                    
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" defaultValue={user.email} readOnly />
                    </div>
                    
                    <div className="form-group">
                      <label>Phone</label>
                      <input type="tel" defaultValue={user.phone || ''} />
                    </div>
                    
                    <div className="form-group">
                      <label>Bio</label>
                      <textarea defaultValue={user.bio || ''}></textarea>
                    </div>
                    
                    <div className="form-group">
                      <label>Address</label>
                      <input type="text" defaultValue={user.address || ''} />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input type="text" defaultValue={user.city || ''} />
                      </div>
                      
                      <div className="form-group">
                        <label>State</label>
                        <input type="text" defaultValue={user.state || ''} />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Country</label>
                        <input type="text" defaultValue={user.country || ''} />
                      </div>
                      
                      <div className="form-group">
                        <label>Postal Code</label>
                        <input type="text" defaultValue={user.postalCode || ''} />
                      </div>
                    </div>
                    
                    <button type="submit" className="btn-primary">Save Changes</button>
                  </form>
                </div>
              </div>
            </div>
          )}
          
          {/* Placeholder for other tabs */}
          {(activeTab === 'bookings' || activeTab === 'messages' || 
            activeTab === 'reviews' || activeTab === 'earnings') && (
            <div className="placeholder-content">
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              <p>This section is under development. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;