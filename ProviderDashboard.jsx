import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/Dashboard.css';
import { useNavigate } from 'react-router-dom';


const ProviderDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    activeBookings: 0,
    totalEarnings: 0,
    completedJobs: 0
  });

  // Add these state variables at the top with other state declarations
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    hourlyRate: '',
    professionalBio: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Add state for services
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [newService, setNewService] = useState({
    service_id: '',
    hourly_rate: '',
    professional_bio: ''
  });
  const [availableServices, setAvailableServices] = useState([]);

  // Add logout handler function
  const handleLogout = () => {
    // Clear any stored tokens or user data
    localStorage.removeItem('token');
    localStorage.removeItem('selectedRole');
    localStorage.removeItem('userData');
    
    // Redirect to login page
    navigate('/login');
  };


  useEffect(() => {
    if (!user || !user.id) return;
    
    const fetchProviderData = async () => {
      setLoading(true);
      setProfileLoading(true);
      setServicesLoading(true);
      
      try {
        // Fetch bookings from the backend
        const bookingsResponse = await axios.get(`http://localhost:3000/api/provider/${user.id}/bookings`);
        const fetchedBookings = bookingsResponse.data;
        setBookings(fetchedBookings);
        
        // Fetch provider profile data 
        try {
          // First try the provider-specific endpoint
          console.log('Fetching provider profile from:', `http://localhost:3000/api/provider/${user.id}/profile`);
          const profileResponse = await axios.get(`http://localhost:3000/api/provider/${user.id}/profile`);
          const fetchedProfile = profileResponse.data;
          console.log('Fetched profile data:', fetchedProfile);
          
          // Set profile data from database
          setProfileData({
            fullName: fetchedProfile.name || user?.name || '',
            email: fetchedProfile.email || user?.email || '',
            phone: fetchedProfile.phone || '',
            location: fetchedProfile.address || 'Kathmandu, Nepal',
            hourlyRate: fetchedProfile.hourly_rate || '1500',
            professionalBio: fetchedProfile.professional_bio || fetchedProfile.bio || 'I am a skilled software developer with over 5 years of experience in web and mobile application development.'
          });
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          // Try a different endpoint if the first one fails
          try {
            console.log('Fetching user profile from:', `http://localhost:3000/api/users/${user.id}`);
            const userProfileResponse = await axios.get(`http://localhost:3000/api/users/${user.id}`);
            const userProfile = userProfileResponse.data;
            console.log('Fetched user profile data:', userProfile);
            
            setProfileData({
              fullName: userProfile.name || user?.name || '',
              email: userProfile.email || user?.email || '',
              phone: userProfile.phone || '',
              location: userProfile.address || 'Kathmandu, Nepal',
              hourlyRate: userProfile.hourly_rate || '1500',
              professionalBio: userProfile.professional_bio || userProfile.bio || 'I am a skilled software developer with over 5 years of experience in web and mobile application development.'
            });
          } catch (userProfileError) {
            console.error('Error fetching user profile:', userProfileError);
            // Set default profile data if both APIs fail
            console.log('Setting default profile data with user:', user);
            setProfileData({
              fullName: user?.name || 'Provider Name',
              email: user?.email || 'provider@example.com',
              phone: '+977 9812345678',
              location: 'Kathmandu, Nepal',
              hourlyRate: '1500',
              professionalBio: 'I am a skilled software developer with over 5 years of experience in web and mobile application development.'
            });
          }
        }
        // Fetch provider services
        try {
          const servicesResponse = await axios.get(`http://localhost:3000/api/provider/${user.id}/services`);
          setServices(servicesResponse.data);
        } catch (servicesError) {
          console.error('Error fetching provider services:', servicesError);
          setServices([]);
        }
        
        // Fetch all available services for the add service dropdown
        try {
          const allServicesResponse = await axios.get('http://localhost:3000/api/services');
          setAvailableServices(allServicesResponse.data);
        } catch (allServicesError) {
          console.error('Error fetching available services:', allServicesError);
          setAvailableServices([]);
        }
        
        // Calculate stats
        const activeBookingsCount = fetchedBookings.filter(booking => 
          booking.status === 'pending' || booking.status === 'confirmed').length;
        
        const completedBookingsCount = fetchedBookings.filter(booking => 
          booking.status === 'completed').length;
        
        // Calculate total earnings from completed bookings
        const totalEarnings = fetchedBookings
          .filter(booking => booking.status === 'completed')
          .reduce((sum, booking) => sum + (parseFloat(booking.total_cost) || 0), 0);
        
        setStats({
          activeBookings: activeBookingsCount,
          totalEarnings: totalEarnings,
          completedJobs: completedBookingsCount
        });
      } catch (error) {
        console.error('Error fetching provider data:', error);
        // If API fails, set empty data
        setBookings([]);
      } finally {
        setLoading(false);
        setProfileLoading(false);
        setServicesLoading(false);
      }
    };
    
    fetchProviderData();
  }, [user]);

  // Add service handlers
  const handleAddServiceClick = () => {
    setShowAddServiceForm(true);
  };

  const handleNewServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService({
      ...newService,
      [name]: value
    });
  };

  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`http://localhost:3000/api/provider/${user.id}/services`, {
        service_id: newService.service_id,
        hourly_rate: newService.hourly_rate,
        professional_bio: newService.professional_bio
      });
      
      // Refresh services list
      const servicesResponse = await axios.get(`http://localhost:3000/api/provider/${user.id}/services`);
      setServices(servicesResponse.data);
      
      // Reset form and hide it
      setNewService({
        service_id: '',
        hourly_rate: '',
        professional_bio: ''
      });
      setShowAddServiceForm(false);
      
      alert('Service added successfully!');
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Failed to add service. Please try again.');
    }
  };

  const handleCancelAddService = () => {
    setShowAddServiceForm(false);
    setNewService({
      service_id: '',
      hourly_rate: '',
      professional_bio: ''
    });
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`http://localhost:3000/api/provider/${user.id}/services/${serviceId}`);
        
        // Refresh services list
        const servicesResponse = await axios.get(`http://localhost:3000/api/provider/${user.id}/services`);
        setServices(servicesResponse.data);
        
        alert('Service deleted successfully!');
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service. Please try again.');
      }
    }
  };

  // Update the renderMyServices function to use real data
  const renderMyServices = () => {
    return (
      <div className="dashboard-content">
        <h1>My Services</h1>
        <p>Manage your service offerings.</p>
        
        {servicesLoading ? (
          <p>Loading services...</p>
        ) : (
          <div className="services-container">
            {services.map(service => (
              <div className="service-card" key={service.id}>
                <h3>{service.name || service.service_name}</h3>
                <p className="service-price">NPR {service.hourly_rate}</p>
                <p className="service-description">{service.professional_bio || service.description}</p>
                <div className="service-actions">
                  <button className="edit-btn">Edit</button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {showAddServiceForm ? (
              <div className="service-card add-service-form">
                <h3>Add New Service</h3>
                <form onSubmit={handleAddServiceSubmit}>
                  <div className="form-group">
                    <label htmlFor="service_id">Service Type</label>
                    <select 
                      id="service_id" 
                      name="service_id" 
                      value={newService.service_id}
                      onChange={handleNewServiceChange}
                      required
                    >
                      <option value="">Select a service</option>
                      {availableServices.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="hourly_rate">Hourly Rate (NPR)</label>
                    <input 
                      type="number" 
                      id="hourly_rate" 
                      name="hourly_rate" 
                      value={newService.hourly_rate}
                      onChange={handleNewServiceChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="professional_bio">Service Description</label>
                    <textarea 
                      id="professional_bio" 
                      name="professional_bio" 
                      value={newService.professional_bio}
                      onChange={handleNewServiceChange}
                      rows="4"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="save-btn">Add Service</button>
                    <button type="button" className="cancel-btn" onClick={handleCancelAddService}>Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="add-service-card" onClick={handleAddServiceClick}>
                <div className="add-service-content">
                  <span className="plus-icon">+</span>
                  <p>Add New Service</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleBookingAction = async (bookingId, newStatus) => {
    try {
      await axios.put(`http://localhost:3000/api/bookings/${bookingId}/status`, { 
        status: newStatus 
      });
      
      // Refresh bookings after status update
      const bookingsResponse = await axios.get(`http://localhost:3000/api/provider/${user.id}/bookings`);
      setBookings(bookingsResponse.data);
      
      // Update stats
      const activeBookingsCount = bookingsResponse.data.filter(booking => 
        booking.status === 'pending' || booking.status === 'confirmed').length;
      
      const completedBookingsCount = bookingsResponse.data.filter(booking => 
        booking.status === 'completed').length;
      
      const totalEarnings = bookingsResponse.data
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => sum + (parseFloat(booking.total_cost) || 0), 0);
      
      setStats({
        activeBookings: activeBookingsCount,
        totalEarnings: totalEarnings,
        completedJobs: completedBookingsCount
      });
      
      alert(`Booking ${newStatus} successfully`);
    } catch (error) {
      console.error(`Error updating booking status:`, error);
      alert(`Failed to update booking status. Please try again.`);
    }
  };

  // Update these handler functions for profile editing
  const handleEditProfileClick = () => {
    setIsEditMode(true);
  };
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Show loading state
      setProfileLoading(true);
      
      // Prepare the data in the format expected by your API
      const profileUpdateData = {
        name: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.location,
        hourly_rate: profileData.hourlyRate,
        professional_bio: profileData.professionalBio
      };
      
      console.log('Updating profile with data:', profileUpdateData);
      
      // First try provider-specific endpoint
      const response = await axios.put(`http://localhost:3000/api/provider/${user.id}/profile`, profileUpdateData);
      
      console.log('Profile update response:', response.data);
      
      // Update the user data in localStorage to reflect changes
      const updatedUserData = {
        ...user,
        name: profileData.fullName,
        email: profileData.email
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      setIsEditMode(false);
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Try the users endpoint as fallback if the provider endpoint fails
      try {
        const fallbackResponse = await axios.put(`http://localhost:3000/api/users/${user.id}`, {
          name: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.location,
          hourly_rate: profileData.hourlyRate,
          professional_bio: profileData.professionalBio
        });
        
        console.log('Profile update fallback response:', fallbackResponse.data);
        
        // Update the user data in localStorage
        const updatedUserData = {
          ...user,
          name: profileData.fullName,
          email: profileData.email
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        setIsEditMode(false);
        alert('Profile updated successfully!');
      } catch (fallbackError) {
        console.error('Error updating profile with fallback:', fallbackError);
        alert('Failed to update profile. Please try again.');
      }
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    // Ask for confirmation if changes were made
    const hasChanges = JSON.stringify(profileData) !== JSON.stringify({
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.address || '',
      hourlyRate: user?.hourly_rate || '',
      professionalBio: user?.professional_bio || user?.bio || ''
    });
    
    if (hasChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) {
        return;
      }
    }
    
    // Reset profile data to original values from database
    setIsEditMode(false);
    setProfileLoading(true);
    
    // Fetch the latest profile data from the server
    const fetchProviderProfile = async () => {
      try {
        const profileResponse = await axios.get(`http://localhost:3000/api/provider/${user.id}/profile`);
        const fetchedProfile = profileResponse.data;
        
        setProfileData({
          fullName: fetchedProfile.name || user?.name || '',
          email: fetchedProfile.email || user?.email || '',
          phone: fetchedProfile.phone || '',
          location: fetchedProfile.address || '',
          hourlyRate: fetchedProfile.hourly_rate || '',
          professionalBio: fetchedProfile.professional_bio || fetchedProfile.bio || ''
        });
      } catch (error) {
        console.error('Error fetching profile for cancel:', error);
        // Fallback to user data if profile fetch fails
        setProfileData({
          fullName: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          location: user?.address || '',
          hourlyRate: user?.hourly_rate || '',
          professionalBio: user?.professional_bio || user?.bio || ''
        });
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProviderProfile();
  };

  const renderDashboard = () => {
    return (
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name || 'Provider'}!</p>
        
        <div className="stats">
          <div className="card">
            <h3>Active Bookings</h3>
            <p>{stats.activeBookings}</p>
          </div>
          
          <div className="card">
            <h3>Total Earnings</h3>
            <p>NPR {stats.totalEarnings}</p>
          </div>
          
          <div className="card">
            <h3>Completed Jobs</h3>
            <p>{stats.completedJobs}</p>
          </div>
        </div>
        
        <h2>Recent Bookings</h2>
        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>SERVICE</th>
                  <th>DATE</th>
                  <th>TIME</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.seeker_name || 'Unknown Client'}</td>
                    <td>{booking.service_name || booking.service?.name || 'Unknown Service'}</td>
                    <td>{new Date(booking.date).toLocaleDateString()}</td>
                    <td>{`${booking.start_time || '00:00'} - ${booking.end_time || '00:00'}`}</td>
                    <td>
                      <span className={`status-badge status-${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderBookings = () => {
    return (
      <div className="dashboard-content">
        <h1>Bookings</h1>
        <p>View and manage all your bookings.</p>
        
        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>SERVICE</th>
                  <th>DATE</th>
                  <th>TIME</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.seeker_name || 'Unknown Client'}</td>
                    <td>{booking.service_name || booking.service?.name || 'Unknown Service'}</td>
                    <td>{new Date(booking.date).toLocaleDateString()}</td>
                    <td>{`${booking.start_time || '00:00'} - ${booking.end_time || '00:00'}`}</td>
                    <td>
                      <span className={`status-badge status-${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="booking-actions">
                        <button className="view-btn">View</button>
                        
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              className="accept-btn"
                              onClick={() => handleBookingAction(booking.id, 'confirmed')}
                            >
                              Accept
                            </button>
                            <button 
                              className="decline-btn"
                              onClick={() => handleBookingAction(booking.id, 'canceled')}
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // After renderBookings function, add these new render functions
  
 

  

  const renderReviews = () => {
    return (
      <div className="dashboard-content">
        <h1>Reviews</h1>
        <p>See what clients are saying about your services.</p>
        
        <div className="reviews-summary">
          <div className="overall-rating">
            <h3>Overall Rating</h3>
            <div className="rating-display">
              <span className="rating-number">4.8</span>
              <div className="stars">
                <span className="star filled">★</span>
                <span className="star filled">★</span>
                <span className="star filled">★</span>
                <span className="star filled">★</span>
                <span className="star half-filled">★</span>
              </div>
              <span className="rating-count">Based on 24 reviews</span>
            </div>
          </div>
          
          <div className="rating-breakdown">
            <div className="rating-bar">
              <span>5 Stars</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: '75%' }}></div>
              </div>
              <span>18</span>
            </div>
            <div className="rating-bar">
              <span>4 Stars</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: '20%' }}></div>
              </div>
              <span>5</span>
            </div>
            <div className="rating-bar">
              <span>3 Stars</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: '4%' }}></div>
              </div>
              <span>1</span>
            </div>
            <div className="rating-bar">
              <span>2 Stars</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: '0%' }}></div>
              </div>
              <span>0</span>
            </div>
            <div className="rating-bar">
              <span>1 Star</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: '0%' }}></div>
              </div>
              <span>0</span>
            </div>
          </div>
        </div>
        
        <div className="reviews-list">
          <div className="review-card">
            <div className="review-header">
              <div className="reviewer-info">
                <h4>Ramesh Sharma</h4>
                <div className="stars">
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                </div>
              </div>
              <div className="review-date">2 weeks ago</div>
            </div>
            <p className="review-text">Excellent service! The website was delivered on time and exceeded my expectations. Very professional and responsive.</p>
          </div>
          
          <div className="review-card">
            <div className="review-header">
              <div className="reviewer-info">
                <h4>Anita Gurung</h4>
                <div className="stars">
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                  <span className="star">★</span>
                </div>
              </div>
              <div className="review-date">1 month ago</div>
            </div>
            <p className="review-text">Great work on my e-commerce site. The design is beautiful and user-friendly. Would recommend!</p>
          </div>
          
          <div className="review-card">
            <div className="review-header">
              <div className="reviewer-info">
                <h4>Bijay Thapa</h4>
                <div className="stars">
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                  <span className="star filled">★</span>
                </div>
              </div>
              <div className="review-date">2 months ago</div>
            </div>
            <p className="review-text">I'm very satisfied with the mobile app development service. The app works flawlessly and the design is modern and intuitive.</p>
          </div>
        </div>
      </div>
    );
  };



  const renderProfile = () => {
    return (
      <div className="dashboard-content">
        <h1>Profile</h1>
        <p>Manage your personal and professional information.</p>
        
        {profileLoading ? (
          <div className="loading-indicator">Loading profile data...</div>
        ) : (
          <div className="profile-container">
            <div className="profile-header">
              <div className="profile-avatar">
                {profileData.fullName?.charAt(0) || user?.name?.charAt(0) || 'P'}
              </div>
              <div className="profile-info">
                <h2>{profileData.fullName || user?.name || 'Provider Name'}</h2>
                <p>{profileData.email || user?.email || 'provider@example.com'}</p>
                {!isEditMode && (
                  <button className="edit-profile-btn" onClick={handleEditProfileClick}>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
            
            <div className="profile-sections">
              {isEditMode ? (
                // Edit mode - show form
                <form onSubmit={handleProfileSubmit} className="edit-profile-form">
                  <div className="profile-section">
                    <h3>Personal Information</h3>
                    <div className="profile-field">
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div className="profile-field">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div className="profile-field">
                      <label htmlFor="phone">Phone</label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="profile-field">
                      <label htmlFor="location">Location</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={profileData.location}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="profile-field">
                      <label htmlFor="hourlyRate">Hourly Rate (NPR)</label>
                      <input
                        type="number"
                        id="hourlyRate"
                        name="hourlyRate"
                        value={profileData.hourlyRate}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>
                  
                  <div className="profile-section">
                    <h3>Professional Bio</h3>
                    <div className="profile-field">
                      <label htmlFor="professionalBio">Bio</label>
                      <textarea
                        id="professionalBio"
                        name="professionalBio"
                        value={profileData.professionalBio}
                        onChange={handleProfileChange}
                        rows="6"
                      ></textarea>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="save-btn" disabled={profileLoading}>
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" className="cancel-btn" onClick={handleCancelEdit} disabled={profileLoading}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                // View mode - show profile data
                <>
                  <div className="profile-section">
                    <h3>Personal Information</h3>
                    <div className="profile-field">
                      <label>Full Name</label>
                      <p>{profileData.fullName}</p>
                    </div>
                    <div className="profile-field">
                      <label>Email</label>
                      <p>{profileData.email}</p>
                    </div>
                    <div className="profile-field">
                      <label>Phone</label>
                      <p>{profileData.phone || 'Not provided'}</p>
                    </div>
                    <div className="profile-field">
                      <label>Location</label>
                      <p>{profileData.location || 'Not provided'}</p>
                    </div>
                    <div className="profile-field">
                      <label>Hourly Rate</label>
                      <p>NPR {profileData.hourlyRate || '0'}</p>
                    </div>
                  </div>
                  
                  <div className="profile-section">
                    <h3>Professional Bio</h3>
                    <div className="profile-field">
                      <p>{profileData.professionalBio || 'No bio provided'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Update the renderContent function to include the new tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'services':
        return renderMyServices();
      case 'bookings':
        return renderBookings();
      
      case 'reviews':
        return renderReviews();
      
      case 'profile':
        return renderProfile();
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>Provider Portal</h2>
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'services' ? 'active' : ''} 
          onClick={() => setActiveTab('services')}
        >
          My Services
        </button>
        <button 
          className={activeTab === 'bookings' ? 'active' : ''} 
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
       
        <button 
          className={activeTab === 'reviews' ? 'active' : ''} 
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
        
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <li className="logout-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </li>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default ProviderDashboard;