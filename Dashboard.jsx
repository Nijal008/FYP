import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import Sidebar from './Sidebar';

function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalJobs: 0,
        activeJobs: 0,
        applications: 0
    });
    const [recentJobs, setRecentJobs] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if admin is logged in
        const adminUser = localStorage.getItem('adminUser');
        if (!adminUser) {
            navigate('/admin/login');
            return;
        }

        // Fetch dashboard data
        const fetchDashboardData = async () => {
            try {
                // In a real app, you would fetch this data from your API
                // For now, we'll use mock data
                
                // Mock data for demonstration
                setStats({
                    totalUsers: 120,
                    totalJobs: 45,
                    activeJobs: 32,
                    applications: 78
                });

                setRecentJobs([
                    { id: 1, title: 'Frontend Developer', company: 'Tech Solutions', date: '2023-06-15' },
                    { id: 2, title: 'UX Designer', company: 'Creative Labs', date: '2023-06-14' },
                    { id: 3, title: 'Project Manager', company: 'Global Systems', date: '2023-06-13' },
                    { id: 4, title: 'Data Analyst', company: 'Data Insights', date: '2023-06-12' }
                ]);

                setRecentUsers([
                    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'seeker', date: '2023-06-15' },
                    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'recruiter', date: '2023-06-14' },
                    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'seeker', date: '2023-06-13' },
                    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'seeker', date: '2023-06-12' }
                ]);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="admin-dashboard">
            <Sidebar />
            
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>Admin Dashboard</h1>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>

                <div className="stats-container">
                    <div className="stat-card">
                        <h3>Total Users</h3>
                        <p className="stat-value">{stats.totalUsers}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Jobs</h3>
                        <p className="stat-value">{stats.totalJobs}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Jobs</h3>
                        <p className="stat-value">{stats.activeJobs}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Applications</h3>
                        <p className="stat-value">{stats.applications}</p>
                    </div>
                </div>

                <div className="dashboard-sections">
                    <div className="section">
                        <h2>Recent Jobs</h2>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Company</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentJobs.map(job => (
                                    <tr key={job.id}>
                                        <td>{job.id}</td>
                                        <td>{job.title}</td>
                                        <td>{job.company}</td>
                                        <td>{job.date}</td>
                                        <td>
                                            <button className="action-btn view">View</button>
                                            <button className="action-btn edit">Edit</button>
                                            <button className="action-btn delete">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="view-all-btn">View All Jobs</button>
                    </div>

                    <div className="section">
                        <h2>Recent Users</h2>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td>{user.date}</td>
                                        <td>
                                            <button className="action-btn view">View</button>
                                            <button className="action-btn edit">Edit</button>
                                            <button className="action-btn delete">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="view-all-btn">View All Users</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;