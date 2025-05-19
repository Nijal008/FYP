import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/BookingDetails.css';

const BookingDetails = ({ user }) => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3000/api/bookings/${bookingId}`);
        
        if (response.data.success) {
          setBooking(response.data.booking);
        } else {
          throw new Error(response.data.message || 'Failed to fetch booking details');
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  return (
    <div className="booking-details-container">
      <div className="booking-details-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          &larr; Back to Bookings
        </button>
        <h1>Booking Details</h1>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading booking details...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : booking ? (
        <div className="booking-details-card">
          <div className="booking-status">
            <span className={`status-badge ${booking.status.toLowerCase()}`}>
              {booking.status}
            </span>
          </div>

          <div className="booking-info-section">
            <h2>Service Information</h2>
            <div className="booking-info-grid">
              <div className="info-item">
                <span className="info-label">Service:</span>
                <span className="info-value">{booking.service_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Provider:</span>
                <span className="info-value">{booking.provider_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date:</span>
                <span className="info-value">{formatDate(booking.booking_date)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Time:</span>
                <span className="info-value">{formatTime(booking.time_slot)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Hourly Rate:</span>
                <span className="info-value">${booking.hourly_rate}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Amount:</span>
                <span className="info-value">${booking.total_amount}</span>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="booking-notes-section">
              <h2>Notes</h2>
              <p>{booking.notes}</p>
            </div>
          )}

          {booking.status === 'Confirmed' && (
            <div className="booking-actions">
              <button 
                className="cancel-booking-btn"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to cancel this booking?')) {
                    try {
                      const response = await axios.put(`http://localhost:3000/api/bookings/${bookingId}/cancel`);
                      if (response.data.success) {
                        alert('Booking cancelled successfully');
                        // Refresh booking data
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error('Error cancelling booking:', error);
                      alert('Failed to cancel booking. Please try again.');
                    }
                  }
                }}
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="not-found">
          <p>Booking not found.</p>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;