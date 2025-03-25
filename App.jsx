import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/Common.css';
import './styles/HomePage.css';
import './styles/Login.css';
import './styles/Signup.css';
import './styles/RoleSelection.css';
import './styles/ServiceListing.css';
import './styles/Booking.css';
import './styles/ServiceProviderList.css';
import './styles/ContactUs.css';
import './styles/Dashboard.css';

import Homepage from './homepage';
import Login from './login';
import Profile from './pages/Profile';
import Bookings from './pages/Bookings';
import Settings from './pages/Settings';
import Signup from './Signup';
import RoleSelection from './RoleSelection';
import ServiceListings from './ServiceListings';
import Booking from './Booking';
import ServiceProviderList from './ServiceProviderList';
import ContactUs from './ContactUs';
import ProviderDashboard from './ProviderDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Check for logged in user on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setUserRole(parsedUser.role);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
    setUserRole(userData.role);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setUserRole(null);
    return <Navigate to="/" />;
  };

  // Protected route component
  const ProtectedRoute = ({ children, allowedRole }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    if (allowedRole && user.role !== allowedRole) {
      return <Navigate to="/" />;
    }
    
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage setUserRole={setUserRole} user={user} onLogout={handleLogout} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/role-selection" element={<RoleSelection setUserRole={setUserRole} />} />
        <Route path="/signup" element={<Signup userRole={userRole} />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/services" element={<ServiceListings />} />
        <Route path="/service/:id" element={<Booking user={user} />} />
        <Route path="/service-providers" element={<ServiceProviderList />} />
        
        {/* Protected routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute>
            <Bookings user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/provider-dashboard" element={
          <ProtectedRoute allowedRole="provider">
            <ProviderDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
