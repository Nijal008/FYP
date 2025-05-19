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
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import BookingsList from './components/BookingsList';
import BookingDetail from './components/BookingDetail';
import BookingForm from './components/BookingForm';
import BookingDetails from './BookingDetails'; // Add this import properly

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [adminUser, setAdminUser] = useState(null);

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
    
    // Check for admin user
    const storedAdminUser = localStorage.getItem('adminUser');
    if (storedAdminUser) {
      try {
        const parsedAdminUser = JSON.parse(storedAdminUser);
        setAdminUser(parsedAdminUser);
      } catch (error) {
        console.error('Error parsing stored admin user:', error);
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
    setUserRole(userData.role);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  // Handle admin login
  const handleAdminLogin = (adminData) => {
    setAdminUser(adminData);
    localStorage.setItem('adminUser', JSON.stringify(adminData));
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setUserRole(null);
    return <Navigate to="/" />;
  };
  
  // Handle admin logout
  const handleAdminLogout = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    setAdminUser(null);
    return <Navigate to="/admin/login" />;
  };

  // Protected route component
  const ProtectedRoute = ({ children, allowedRole }) => {
    console.log('ProtectedRoute - User:', user, 'Required role:', allowedRole);
    
    if (!user) {
      console.log('No user, redirecting to login');
      return <Navigate to="/login" />;
    }
    
    if (allowedRole && user.role !== allowedRole) {
      console.log(`User role ${user.role} doesn't match required role ${allowedRole}`);
      return <Navigate to="/" />;
    }
    
    console.log('Access granted to protected route');
    return children;
  };
  
  // Admin protected route component
  const AdminRoute = ({ children }) => {
    if (!adminUser) {
      return <Navigate to="/admin/login" />;
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
        {/* Update this route to accept state directly from ServiceListings */}
        <Route path="/service-providers" element={<ServiceProviderList user={user} />} />
        {/* Keep the existing route for backward compatibility */}
        <Route path="/service/:serviceId" element={<Booking user={user} />} />
        
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
        
        {/* Fix the provider dashboard route - add both paths */}
        <Route path="/provider-dashboard" element={
          <ProtectedRoute allowedRole="provider">
            <ProviderDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/ProviderDashboard" element={
          <ProtectedRoute allowedRole="provider">
            <ProviderDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin onAdminLogin={handleAdminLogin} />} />
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard onAdminLogout={handleAdminLogout} />
          </AdminRoute>
        } />
        
        {/* Booking routes */}
        <Route path="/book-service/:providerId/:serviceId" element={<BookingForm />} />
        <Route path="/bookings" element={
          <ProtectedRoute>
            <BookingsList user={user} />
          </ProtectedRoute>
        } />
        <Route path="/bookings/:id" element={
          <ProtectedRoute>
            <BookingDetail user={user} />
          </ProtectedRoute>
        } />
        <Route path="/booking/:bookingId" element={
          <ProtectedRoute>
            <BookingDetails user={user} />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;