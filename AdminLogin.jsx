import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import './AdminLogin.css';
Modal.setAppElement('#root');

function AdminLogin({ onAdminLogin }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailValid, setEmailValid] = useState(null);
    const [passwordValid, setPasswordValid] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [redirectNow, setRedirectNow] = useState(false);

    useEffect(() => {
        // Check if admin is already logged in
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
            navigate('/admin/dashboard');
        }
    }, [navigate]);

    // If redirectNow is true, navigate to dashboard
    useEffect(() => {
        if (redirectNow) {
            navigate('/admin/dashboard');
        }
    }, [redirectNow, navigate]);

    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        if (value) {
            setEmailValid(validateEmail(value));
        } else {
            setEmailValid(null);
        }
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        if (value) {
            setPasswordValid(validatePassword(value));
        } else {
            setPasswordValid(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all fields before submission
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        
        if (!isEmailValid || !isPasswordValid) {
            setError('Please correct the errors in the form.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Connect to the main server on port 3000 instead of 3001
            const response = await axios.post("http://localhost:3000/api/admin/login", {
                email,
                password
            });

            console.log("Full server response:", response);
            
            // Check for success in multiple possible formats
            if (response.data.success || response.data.message === 'Login successful!') {
                // Store admin data
                const adminData = response.data.admin || response.data.user;
                if (adminData) {
                    localStorage.setItem('adminUser', JSON.stringify(adminData));
                }
                if (response.data.token) {
                    localStorage.setItem('adminToken', response.data.token);
                }
                
                // Call the onAdminLogin handler if provided
                if (onAdminLogin) {
                    onAdminLogin(adminData);
                }
                
                // Set success message
                setModalMessage('Admin login successful!');
                setModalIsOpen(true);
                
                // Force navigation after a short delay
                setTimeout(() => {
                    console.log('Forcing navigation to dashboard...');
                    window.location.href = '/admin/dashboard';
                }, 1500);
            } else {
                setError(response.data.message || "Login failed. Invalid credentials.");
            }
        } catch (err) {
            console.error("Admin Login Error:", err);
            setError(err.response?.data?.message || "A login error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setModalIsOpen(false);
        // Also redirect when modal is manually closed
        setRedirectNow(true);
    };

    // Add a manual redirect button to the modal
    const handleManualRedirect = () => {
        setModalIsOpen(false);
        navigate('/admin/dashboard');
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-wrapper">
                <div className="admin-login-left">
                    <div className="admin-login-brand">
                        <h1>Hirely</h1>
                        <div className="brand-tagline">Admin Portal</div>
                    </div>
                    <div className="login-info">
                        <h2>Welcome Back</h2>
                        <p>Login to access the admin dashboard and manage your platform.</p>
                        <div className="admin-features">
                            <div className="feature-item">
                                <i className="feature-icon users-icon"></i>
                                <span>User Management</span>
                            </div>
                            <div className="feature-item">
                                <i className="feature-icon services-icon"></i>
                                <span>Service Control</span>
                            </div>
                            <div className="feature-item">
                                <i className="feature-icon bookings-icon"></i>
                                <span>Booking Oversight</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="admin-login-right">
                    <div className="login-form-container">
                        <h2>Admin Login</h2>
                        <p>Enter your credentials to continue</p>
                        
                        {error && <div className="error-message">{error}</div>}
                        
                        <form className="admin-login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <div className="input-wrapper">
                                    <i className="input-icon email-icon"></i>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        className={emailValid === false ? 'is-invalid' : emailValid === true ? 'is-valid' : ''}
                                        placeholder="Enter admin email"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                                {emailValid === false && (
                                    <div className="validation-feedback invalid-feedback">
                                        Please enter a valid email address
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <i className="input-icon password-icon"></i>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className={passwordValid === false ? 'is-invalid' : passwordValid === true ? 'is-valid' : ''}
                                        placeholder="Enter admin password"
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>
                                {passwordValid === false && (
                                    <div className="validation-feedback invalid-feedback">
                                        Password must be at least 6 characters
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-actions">
                                <button type="submit" className="login-button" disabled={loading}>
                                    {loading ? (
                                        <span className="loading-spinner"></span>
                                    ) : 'Login to Dashboard'}
                                </button>
                            </div>
                            
                            <div className="back-to-site">
                                <a href="/" className="back-link">Return to Home Page</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                className="success-modal"
                overlayClassName="modal-overlay"
            >
                <div className="modal-content">
                    <div className="success-icon"></div>
                    <h2>{modalMessage}</h2>
                    <p>You will be redirected to the dashboard shortly.</p>
                    <button onClick={handleManualRedirect} className="modal-button">
                        Go to Dashboard Now
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default AdminLogin;