import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Bookings.css';

const Bookings = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Simulate fetching bookings from an API
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would fetch from your API
        // For now, we'll use mock data
        setTimeout(() => {
          const mockBookings = [
            {
              id: 1,
              serviceProvider: {
                id: 101,
                name: 'John Doe',
                image: 'https://randomuser.me/api/portraits/men/32.jpg',
                rating: 4.8
              },
              service: 'House Cleaning',
              status: 'confirmed',
              date: '2023-06-15',
              time: '10:00 AM - 12:00 PM',
              price: 75,
              address: '123 Main St, Anytown, USA'
            },
            {
              id: 2,
              serviceProvider: {
                id: 102,
                name: 'Jane Smith',
                image: 'https://randomuser.me/api/portraits/women/44.jpg',
                rating: 4.5
              },
              service: 'Plumbing Repair',
              status: 'completed',
              date: '2023-05-28',
              time: '2:00 PM - 4:00 PM',
              price: 120,
              address: '456 Oak Ave, Somewhere, USA'
            },
            {
              id: 3,
              serviceProvider: {
                id: 103,
                name: 'Mike Johnson',
                image: 'https://randomuser.me/api/portraits/men/45.jpg',
                rating: 4.9
              },
              service: 'Electrical Work',
              status: 'cancelled',
              date: '2023-06-10',
              time: '9:00 AM - 11:00 AM',
              price: 95,
              address: '789 Pine St, Nowhere, USA'
            }
          ];
          setBookings(mockBookings);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const filteredBookings = bookings.filter(booking => {
    const today = new Date();
    const bookingDate = new Date(booking.date);
    
    if (activeTab === 'upcoming') {
      return bookingDate >= today && booking.status !== 'cancelled';
    } else if (activeTab === 'completed') {
      return booking.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return booking.status === 'cancelled';
    }
    return true;
  });

  const handleCancelBooking = (bookingId) => {
    // In a real app, you would call your API to cancel the booking
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      )
    );
  };

  return (
    <div className="bookings-container">
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

      <div className="bookings-content">
        <div className="profile-sidebar">
          <div className="sidebar-menu">
            <div className="menu-item" onClick={() => navigate('/profile')}>
              <i className="fas fa-user"></i>
              <span>My Profile</span>
            </div>
            <div className="menu-item active">
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

        <div className="bookings-main">
          <div className="bookings-header">
            <h2>My Bookings</h2>
          </div>

          <div className="bookings-tabs">
            <div 
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </div>
            <div 
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </div>
            <div 
              className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled
            </div>
          </div>

          <div className="bookings-list">
            {isLoading ? (
              <div className="loading">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="no-bookings">
                <i className="fas fa-calendar-times"></i>
                <p>No {activeTab} bookings found</p>
              </div>
            ) : (
              filteredBookings.map(booking => (
                <div key={booking.id} className={`booking-card ${booking.status}`}>
                  <div className="booking-provider">
                    <img src={booking.serviceProvider.image} alt={booking.serviceProvider.name} />
                    <div className="provider-info">
                      <h3>{booking.serviceProvider.name}</h3>
                      <div className="provider-rating">
                        <i className="fas fa-star"></i>
                        <span>{booking.serviceProvider.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="booking-details">
                    <div className="booking-service">
                      <h4>{booking.service}</h4>
                      <span className={`booking-status ${booking.status}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="booking-info">
                      <div className="info-item">
                        <i className="fas fa-calendar"></i>
                        <span>{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-clock"></i>
                        <span>{booking.time}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{booking.address}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-dollar-sign"></i>
                        <span>${booking.price}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="booking-actions">
                    {booking.status === 'confirmed' && (
                      <>
                        <button className="btn-reschedule">
                          <i className="fas fa-calendar-alt"></i> Reschedule
                        </button>
                        <button 
                          className="btn-cancel"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          <i className="fas fa-times-circle"></i> Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'completed' && (
                      <button className="btn-review">
                        <i className="fas fa-star"></i> Leave Review
                      </button>
                    )}
                    <button className="btn-details">
                      <i className="fas fa-info-circle"></i> View Details
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

export default Bookings;