import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Login.css';
import loginIllustration from './images/login-illustration.png';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!email || !password) {
        setError('Please enter both email and password');
        setIsLoading(false);
        return;
      }
      
      // Connect to the database for authentication
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Login successful
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        if (typeof onLogin === 'function') {
          onLogin(data.user);
        }
        
        // Redirect based on user role
        if (data.user.role === 'provider') {
          navigate('/provider-dashboard');
        } else {
          navigate('/profile');
        }
      } else {
        // Login failed
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    // Redirect to the role selection page first instead of directly to provider signup
    navigate('/role-selection');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-illustration">
          <img src={loginIllustration} alt="Login" />
        </div>
        <div className="login-form-container">

          <h2 className="login-welcome">Welcome Back</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div className="forgot-password">
              <a href="#" onClick={(e) => {e.preventDefault(); navigate('/forgot-password');}}>Forgot Password?</a>
            </div>
            
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            
            <div className="login-divider">
              <span>OR</span>
            </div>
            
            
            <button 
              className="create-account-btn" 
              onClick={handleCreateAccount}
            >
              Create an Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
