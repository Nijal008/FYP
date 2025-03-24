import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfileMenu from './components/UserProfileMenu';
import searchIcon from './images/search.png';
import howItWorks from './images/Howitworks.png';
import webDeveloper from './images/webdeveloper.jpg';
import cleaning from './images/Cleaning.jpg';
import photographer from './images/photographer.jpg';

function Homepage({ user, onLogout }) {
  const navigate = useNavigate();
  
  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <h1>Hirely</h1>
          <p>"Find Skilled Professionals Anytime, Anywhere!"</p>
        </div>
        <nav className="nav">
          <ul>
            <li onClick={() => navigate('/')} className={window.location.pathname === '/' ? 'active' : ''}>Home</li>
            <li onClick={() => navigate('/services')} className={window.location.pathname === '/services' ? 'active' : ''}>Services</li>
            {!user ? (
              <li onClick={() => navigate('/login')}>Login/Signup</li>
            ) : (
              <UserProfileMenu user={user} onLogout={onLogout} />
            )}
          </ul>
        </nav>
      </header>

      <div className="hero-section">
        <h1>Find Your Perfect Service Provider</h1>
        <p>Discover trusted professionals for any task</p>
        <div className="search-container">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="What service are you looking for?" 
              className="search-input"
            />
            <button type="submit" className="search-button">
              <img src={searchIcon} alt="Search" className="search-icon" />
            </button>
          </div>
         
        </div>
      </div>

      <section className="features-section">
        <h2>Features</h2>
        <div className="feature-icons">
          <div className="feature-card">
            <div className="feature-icon chat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <p>Real-Time Chat</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon emergency-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <p>Emergency Booking</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon payment-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <p>Secured Payments</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon verified-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p>Verified Professionals</p>
          </div>
        </div>
      </section>

      <section className="services-section">
        <div className="section-header">
          <h2>Services</h2>
          <a onClick={() => navigate('/services')} className="view-more" style={{ cursor: 'pointer' }}>View More »</a>
        </div>
        <div className="service-cards">
          <div className="service-card">
            <img src={webDeveloper} alt="Web Developer" />
            <h3>Web Developer</h3>
          </div>
          <div className="service-card">
            <img src={cleaning} alt="House Cleaner" />
            <h3>House Cleaner</h3>
          </div>
          <div className="service-card">
            <img src={photographer} alt="Photography" />
            <h3>Photography</h3>
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="steps-container">
          <img src={howItWorks} alt="How it works" className="full-width-image" />
        </div>
      </section>

      <section className="cta-section">
        <h2>Instant access to the help you need</h2>
        <button onClick={() => navigate('/role-selection')} className="join-button">Join Hirely</button>
      </section>

      <footer className="footer">
        <div className="footer-links">
          <a href="#">About Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms & Privacy</a>
          <a href="#" onClick={() => navigate('/contact')}>Contact us</a>
        </div>
        <div className="footer-brand">
          <h2>Hirely</h2>
          <div className="social-links">
            <p>Follow us! We're Friendly:</p>
            <div className="social-icons">
              <a href="#" className="social-icon">📘</a>
              <a href="#" className="social-icon">📸</a>
              <a href="#" className="social-icon">🐦</a>
              <a href="#" className="social-icon">🔗</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;