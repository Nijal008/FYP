import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Signup.css';
import axios from 'axios'; 

const Signup = ({ userRole }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: userRole || 'seeker' // Default to seeker if no role is provided
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If userRole is not provided via props, check localStorage
  useEffect(() => {
    if (!userRole) {
      const storedRole = localStorage.getItem('selectedRole');
      if (storedRole) {
        setFormData(prev => ({ ...prev, role: storedRole }));
      } else {
        // If no role is found, redirect to role selection
        navigate('/role-selection');
      }
    }
  }, [userRole, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Create user data object to send to the API
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      // Call the API endpoint
      const response = await axios.post('http://localhost:3000/api/signup', userData);
      
      // Clear the selected role from localStorage
      localStorage.removeItem('selectedRole');
      
      // Show success message
      console.log('Signup successful:', response.data);
      
      // Redirect based on role
      if (formData.role === 'seeker') {
        // Redirect service seekers to home page
        navigate('/');
      } else {
        // Redirect providers to login page
        navigate('/login');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage(
        error.response?.data?.message || 
        'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h2>Create Your Account</h2>
          <p>Join Hirely as a {formData.role === 'provider' ? 'Service Provider' : 'Service Seeker'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          
          <button type="submit" className="btn-signup" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
          
          <div className="signup-footer">
            <p>Already have an account? <a href="#" onClick={() => navigate('/login')}>Log in</a></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
