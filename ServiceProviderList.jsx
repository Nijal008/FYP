import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ServiceProviderList.css';

const providersData = [
  {
    id: 1,
    name: 'Maria S.',
    hourlyRate: 25,
    rating: 4.3,
    reviews: 178,
    bio: 'Hello! I am a cleaner with 5 years of experience...',
    image: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    id: 2,
    name: 'Diana P.',
    hourlyRate: 15,
    rating: 4.8,
    reviews: 239,
    bio: 'Hi! I am a cleaner with 3 years of experience...',
    image: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  // Add a few more providers for better demonstration of sorting
  {
    id: 3,
    name: 'John M.',
    hourlyRate: 30,
    rating: 4.9,
    reviews: 156,
    bio: 'Professional cleaner with attention to detail...',
    image: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 4,
    name: 'Sarah K.',
    hourlyRate: 18,
    rating: 4.1,
    reviews: 89,
    bio: 'Experienced in residential and commercial cleaning...',
    image: 'https://randomuser.me/api/portraits/women/22.jpg'
  },
];

const ServiceProviderList = ({ setStep, user }) => {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState('specificDate');
  const [time, setTime] = useState([]);
  const [priceRange, setPriceRange] = useState([10, 82]);
  const [sortBy, setSortBy] = useState('recommended');

  const handleTimeChange = (e) => {
    const value = e.target.value;
    setTime((prev) => 
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  // Sort providers based on selected sorting option
  const sortedProviders = useMemo(() => {
    let sorted = [...providersData];
    
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
        // Here we'll use a simple algorithm combining rating and reviews
        return sorted.sort((a, b) => {
          const scoreA = a.rating * (1 + Math.log(a.reviews));
          const scoreB = b.rating * (1 + Math.log(b.reviews));
          return scoreB - scoreA;
        });
    }
  }, [sortBy]);

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
                    <li onClick={() => navigate('/dashboard')}>Dashboard</li>
                    <li onClick={() => navigate('/profile')}>Profile</li>
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
                    value="emergencyBookings"
                    checked={availability === 'emergencyBookings'}
                    onChange={() => setAvailability(prev => prev === 'emergencyBookings' ? 'specificDate' : 'emergencyBookings')}
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
              <div className="price-slider">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([10, parseInt(e.target.value)])}
                  className="range-slider"
                />
                <p className="price-range">${priceRange[0]} - ${priceRange[1]}</p>
              </div>
            </div>
          </div>

          <div className="provider-cards">
            {sortedProviders.map((provider) => (
              <div className="provider-card" key={provider.id}>
                <div className="provider-image">
                  <img src={provider.image} alt={provider.name} />
                </div>
                <div className="provider-info">
                  <div className="provider-card-header">
                    <h3>{provider.name}</h3>
                    <p className="provider-rate">${provider.hourlyRate}/hr</p>
                  </div>
                  
                  <div className="availability-badge">Available Today</div>
                  
                  <div className="provider-rating">
                    <span className="rating-stars">⭐</span>
                    <span className="rating-value">{provider.rating}</span>
                    <span className="review-count">({provider.reviews} reviews)</span>
                  </div>
                  
                  <p className="provider-bio">{provider.bio}</p>
                  
                  <button className="book-button">Select and Book</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderList;