import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ServiceProviderList.css';
import axios from 'axios';

const ServiceProviderList = ({ setStep, user }) => {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState('specificDate');
  const [time, setTime] = useState([]);
  const [priceRange, setPriceRange] = useState([10, 82]);
  const [sortBy, setSortBy] = useState('recommended');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add this function for availability text
  const getAvailabilityText = (provider) => {
    if (!provider.availabilityStatus || provider.availabilityStatus === 'unavailable') {
      return 'Unavailable';
    } else if (provider.availabilityStatus === 'available') {
      return 'Available Today';
    } else {
      return 'Available Soon';
    }
  };

  // Fetch providers from the database
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        
        // Get the selected service from URL params or state
        const params = new URLSearchParams(window.location.search);
        const serviceId = params.get('serviceId') || 
                          (window.location.state && window.location.state.serviceId);
        
        let response;
        
        // If a specific service is selected, fetch providers for that service
        if (serviceId) {
          response = await axios.get(`http://localhost:3000/api/providers/by-service/${serviceId}`);
        } else {
          // Otherwise fetch all providers
          response = await axios.get('http://localhost:3000/api/provider-services');
        }
        
        if (response.data.success) {
          // Use the providers from the response
          const providersData = response.data.providers || response.data;
          setProviders(providersData);
        } else {
          throw new Error(response.data.message || 'Failed to fetch providers');
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        setError('Failed to load service providers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchProviders();
  }, []);

  const handleTimeChange = (e) => {
    const value = e.target.value;
    setTime((prev) => 
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  // Sort providers based on selected sorting option
  const sortedProviders = useMemo(() => {
    if (!providers.length) return [];
    
    let sorted = [...providers];
    
    switch(sortBy) {
      case 'priceHighToLow':
        return sorted.sort((a, b) => b.hourlyRate - a.hourlyRate);
      case 'priceLowToHigh':
        return sorted.sort((a, b) => a.hourlyRate - b.hourlyRate);
      case 'topRated':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'recommended':
      default:
        // For recommended, we could use a combination of factors
        return sorted.sort((a, b) => {
          const scoreA = a.rating * (1 + Math.log(a.reviews || 1));
          const scoreB = b.rating * (1 + Math.log(b.reviews || 1));
          return scoreB - scoreA;
        });
    }
  }, [sortBy, providers]);

  // Filter providers based on price range
  const filteredProviders = useMemo(() => {
    return sortedProviders.filter(provider => 
      provider.hourlyRate >= priceRange[0] && 
      provider.hourlyRate <= priceRange[1]
    );
  }, [sortedProviders, priceRange]);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <h1>Hirely</h1>
          <p>"Find Skilled Professionals Anytime, Anywhere!"</p>
        </div>
        <nav className="nav">
          <ul>
            <li onClick={() => navigate('/')}>Home</li>
            <li onClick={() => navigate('/services')}>Services</li>
            {!user ? (
              <li onClick={() => navigate('/login')}>Login/Signup</li>
            ) : (
              <div className="user-profile">
                <span className="user-name">{user.firstName || user.name}</span>
                <div className="user-avatar">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(user.firstName || user.name || "User").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-dropdown">
                  <ul>
                    <li onClick={() => navigate('/profile')}>Profile</li>
                    <li onClick={() => navigate('/bookings')}>My Bookings</li>
                    <li onClick={() => {
                      localStorage.removeItem('user');
                      localStorage.removeItem('token');
                      navigate('/');
                    }}>Logout</li>
                  </ul>
                </div>
              </div>
            )}
          </ul>
        </nav>
      </header>
      
      <div className="service-provider-list">
        <div className="provider-header">
          <h2>Service Providers</h2>
          <p>Filter and browse service providers according to your needs and timing</p>
        </div>
        
        {/* Sorting dropdown */}
        <div className="sorting-container">
          <label>Sorted By:</label>
          <select 
            className="sorting-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recommended">Recommended</option>
            <option value="priceHighToLow">Price: High to Low</option>
            <option value="priceLowToHigh">Price: Low to High</option>
            <option value="topRated">Top Rated</option>
          </select>
        </div>
        
        <div className="provider-content">
          {/* Filters section */}
          <div className="filters">
            <div className="filter-section">
              <h3>Availability</h3>
              <div className="filter-options">
                <div className="filter-row">
                  <input 
                    type="radio" 
                    id="availableNow" 
                    name="availability" 
                    value="availableNow"
                    checked={availability === 'availableNow'}
                    onChange={() => setAvailability('availableNow')}
                  />
                  <label htmlFor="availableNow">Available Now</label>
                </div>
                <div className="filter-row">
                  <input 
                    type="radio" 
                    id="specificDate" 
                    name="availability" 
                    value="specificDate"
                    checked={availability === 'specificDate'}
                    onChange={() => setAvailability('specificDate')}
                  />
                  <label htmlFor="specificDate">Specific Date</label>
                </div>
                <div className="filter-row">
                  <input 
                    type="checkbox" 
                    id="emergencyBookings" 
                    name="emergencyBookings"
                  />
                  <label htmlFor="emergencyBookings">Emergency Bookings</label>
                </div>
              </div>
            </div>

            <div className="filter-section">
              <h3>Available Time:</h3>
              <div className="filter-options">
                <div className="filter-row">
                  <input 
                    type="checkbox" 
                    id="morning" 
                    value="morning"
                    checked={time.includes('morning')}
                    onChange={handleTimeChange}
                  />
                  <label htmlFor="morning">Morning (8am - 12pm)</label>
                </div>
                <div className="filter-row">
                  <input 
                    type="checkbox" 
                    id="afternoon" 
                    value="afternoon"
                    checked={time.includes('afternoon')}
                    onChange={handleTimeChange}
                  />
                  <label htmlFor="afternoon">Afternoon (12pm - 5pm)</label>
                </div>
                <div className="filter-row">
                  <input 
                    type="checkbox" 
                    id="evening" 
                    value="evening"
                    checked={time.includes('evening')}
                    onChange={handleTimeChange}
                  />
                  <label htmlFor="evening">Evening (5pm - 9:30pm)</label>
                </div>
              </div>
            </div>

            <div className="filter-section">
              <h3>Price Range:</h3>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={priceRange[1]} 
                className="range-slider"
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              />
              <div className="price-range">
                ${priceRange[0]} - ${priceRange[1]}
              </div>
            </div>
          </div>

          <div className="provider-cards">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading service providers...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="no-results">
                <p>No service providers match your criteria. Try adjusting your filters.</p>
              </div>
            ) : (
              filteredProviders.map((provider) => (
                <div className="provider-card" key={provider.id}>
                  <div className="provider-image">
                    <img src={provider.image} alt={provider.name} />
                  </div>
                  <div className="provider-info">
                    <div className="provider-card-header">
                      <h3>{provider.name}</h3>
                      <p className="provider-rate">${provider.hourlyRate}/hr</p>
                    </div>
                    
                    <div className={`availability-badge ${provider.availabilityStatus === 'available' ? 'available' : 'soon'}`}>
                      {provider.availabilityStatus ? getAvailabilityText(provider) : (provider.availableNow ? 'Available Today' : 'Available Soon')}
                    </div>
                    
                    <div className="provider-rating">
                      <span className="rating-stars">⭐</span>
                      <span className="rating-value">{provider.rating}</span>
                      <span className="review-count">({provider.reviews} reviews)</span>
                    </div>
                    
                    {/* Display the service name */}
                    {provider.serviceName && (
                      <div className="provider-service">
                        <span className="service-label">Service: </span>
                        <span className="service-name">{provider.serviceName}</span>
                      </div>
                    )}
                    
                    {/* Display the bio */}
                    <p className="provider-bio">{provider.bio}</p>
                    
                    
                    <button 
                      className="book-button"
                      onClick={() => {
                        if (!user) {
                          // Redirect to login if user is not logged in
                          navigate('/login', { state: { from: `/book-service/${provider.providerId}/${provider.serviceId}` } });
                        } else {
                          // Navigate to booking form with provider and service IDs
                          navigate(`/book-service/${provider.providerId}/${provider.serviceId}`, {
                            state: {
                              providerName: provider.name,
                              serviceName: provider.serviceName,
                              hourlyRate: provider.hourlyRate
                            }
                          });
                        }
                      }}
                    >
                      Select and Book 
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderList;