import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './styles/Booking.css';

const Booking = ({ user }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const serviceName = location.state?.serviceName || 'Service';
  
  const [bookingLocation, setBookingLocation] = useState('');
  const [street, setStreet] = useState('');
  const [workLength, setWorkLength] = useState('');
  const [details, setDetails] = useState('');

  const handleContinue = () => {
    // Validate form fields
    if (!bookingLocation || !street || !workLength || !details) {
      alert('Please fill in all fields before continuing');
      return;
    }
    
    // Handle form submission logic here
    console.log({ 
      serviceId: id,
      serviceName,
      location: bookingLocation, 
      street, 
      workLength, 
      details 
    });
    
    // Navigate to service providers list
    navigate('/service-providers');
  };

  return (
    <div className="booking-container">
      <h2>{serviceName}</h2>
      
      <div className="form-group">
        <label>Your Location</label>
        <input
          type="text"
          value={bookingLocation}
          onChange={(e) => setBookingLocation(e.target.value)}
          placeholder="Enter your location"
        />
      </div>
      
      <div className="form-group">
        <label>Street no./City</label>
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Enter street number and city"
        />
      </div>

      <h3>Estimated Work length:</h3>
      <div className="work-length-options">
        <label>
          <input
            type="radio"
            name="workLength"
            value="Small"
            checked={workLength === 'Small'}
            onChange={(e) => setWorkLength(e.target.value)}
          />
          <span>Small - Est. 1 hr</span>
        </label>
        
        <label>
          <input
            type="radio"
            name="workLength"
            value="Medium"
            checked={workLength === 'Medium'}
            onChange={(e) => setWorkLength(e.target.value)}
          />
          <span>Medium - Est. 2-3 hrs</span>
        </label>
        
        <label>
          <input
            type="radio"
            name="workLength"
            value="Large"
            checked={workLength === 'Large'}
            onChange={(e) => setWorkLength(e.target.value)}
          />
          <span>Large - Est. 4+ hrs</span>
        </label>
      </div>

      <div className="form-group">
        <label>Tell us details about the work:</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe what needs to be done, any specific requirements, etc."
        />
      </div>
      
      <button className="btn-continue" onClick={handleContinue}>Continue</button>
    </div>
  );
};

export default Booking;