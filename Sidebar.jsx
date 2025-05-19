import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isOpen, setIsOpen] = useState(!isMobile);
    
    // Check if the current path matches the given path
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Toggle sidebar for mobile
    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    // Close sidebar when clicking outside on mobile
    const handleOverlayClick = () => {
        if (isMobile) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {isMobile && (
                <button 
                    className="sidebar-toggle-btn" 
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed',
                        top: '15px',
                        left: isOpen ? '260px' : '15px',
                        zIndex: 1001,
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        transition: 'left 0.3s ease',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                >
                    <ion-icon name={isOpen ? "close-outline" : "menu-outline"}></ion-icon>
                </button>
            )}
            
            {isMobile && isOpen && (
                <div 
                    onClick={handleOverlayClick}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999
                    }}
                ></div>
            )}
            
            <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/src/assets/Logo.png" alt="HamroJob Logo" className="sidebar-logo" />
                    <h3>Admin Panel</h3>
                </div>
                
                <nav className="sidebar-nav">
                    <ul>
                        <li className={isActive('/admin/dashboard') ? 'active' : ''}>
                            <Link to="/admin/dashboard">
                                <ion-icon name="grid-outline"></ion-icon>
                                <span>Dashboard</span>
                            </Link>
                        </li>
                        <li className={isActive('/admin/users') ? 'active' : ''}>
                            <Link to="/admin/users">
                                <ion-icon name="people-outline"></ion-icon>
                                <span>Users</span>
                            </Link>
                        </li>
                        <li className={isActive('/admin/jobs') ? 'active' : ''}>
                            <Link to="/admin/jobs">
                                <ion-icon name="briefcase-outline"></ion-icon>
                                <span>Jobs</span>
                            </Link>
                        </li>
                        <li className={isActive('/admin/applications') ? 'active' : ''}>
                            <Link to="/admin/applications">
                                <ion-icon name="document-text-outline"></ion-icon>
                                <span>Applications</span>
                            </Link>
                        </li>
                        <li className={isActive('/admin/settings') ? 'active' : ''}>
                            <Link to="/admin/settings">
                                <ion-icon name="settings-outline"></ion-icon>
                                <span>Settings</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
                
                <div className="sidebar-footer">
                    <p>&copy; 2023 HamroJob</p>
                </div>
            </div>
        </>
    );
}

export default Sidebar;