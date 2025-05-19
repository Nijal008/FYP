import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Applications.css';
import Sidebar from './Sidebar';

function Applications() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [applicationsPerPage] = useState(10);

    useEffect(() => {
        // Check if admin is logged in
        const adminUser = localStorage.getItem('adminUser');
        if (!adminUser) {
            navigate('/admin/login');
            return;
        }

        // Fetch applications data
        const fetchApplications = async () => {
            try {
                
                
                // Mock data for demonstration
                const mockApplications = [
                    { id: 1, jobTitle: 'Frontend Developer', company: 'Tech Solutions', applicant: 'John Doe', date: '2023-06-15', status: 'pending' },
                    { id: 2, jobTitle: 'UX Designer', company: 'Creative Labs', applicant: 'Jane Smith', date: '2023-06-14', status: 'reviewed' },
                    { id: 3, jobTitle: 'Project Manager', company: 'Global Systems', applicant: 'Bob Johnson', date: '2023-06-13', status: 'accepted' },
                    { id: 4, jobTitle: 'Data Analyst', company: 'Data Insights', applicant: 'Alice Brown', date: '2023-06-12', status: 'rejected' },
                    { id: 5, jobTitle: 'Backend Developer', company: 'Tech Solutions', applicant: 'Charlie Wilson', date: '2023-06-11', status: 'pending' },
                    { id: 6, jobTitle: 'Content Writer', company: 'Media Group', applicant: 'Diana Miller', date: '2023-06-10', status: 'reviewed' },
                    { id: 7, jobTitle: 'HR Manager', company: 'Corporate Services', applicant: 'Edward Davis', date: '2023-06-09', status: 'accepted' },
                    { id: 8, jobTitle: 'Marketing Specialist', company: 'Brand Builders', applicant: 'Fiona Clark', date: '2023-06-08', status: 'pending' },
                    { id: 9, jobTitle: 'Full Stack Developer', company: 'Web Solutions', applicant: 'George White', date: '2023-06-07', status: 'reviewed' },
                    { id: 10, jobTitle: 'Customer Support', company: 'Service Center', applicant: 'Hannah Green', date: '2023-06-06', status: 'rejected' },
                    { id: 11, jobTitle: 'Network Engineer', company: 'IT Services', applicant: 'Ian Black', date: '2023-06-05', status: 'pending' },
                    { id: 12, jobTitle: 'Graphic Designer', company: 'Creative Studios', applicant: 'Julia Red', date: '2023-06-04', status: 'accepted' }
                ];

                setApplications(mockApplications);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching applications:', error);
                setLoading(false);
            }
        };

        fetchApplications();
    }, [navigate]);

    // Filter applications based on search term and status
    const filteredApplications = applications.filter(application => {
        const matchesSearch = 
            application.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            application.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            application.applicant.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || application.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const indexOfLastApplication = currentPage * applicationsPerPage;
    const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
    const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication);
    const totalPages = Math.ceil(filteredApplications.length / applicationsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Handle status change
    const handleStatusChange = (id, newStatus) => {
        setApplications(applications.map(app => 
            app.id === id ? { ...app, status: newStatus } : app
        ));
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="admin-applications">
            <Sidebar />
            
            <div className="applications-content">
                <div className="applications-header">
                    <h1>Application Management</h1>
                </div>

                <div className="filters">
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder="Search applications..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="status-filter">
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="applications-table-container">
                    <table className="applications-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Job Title</th>
                                <th>Company</th>
                                <th>Applicant</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentApplications.map(application => (
                                <tr key={application.id}>
                                    <td>{application.id}</td>
                                    <td>{application.jobTitle}</td>
                                    <td>{application.company}</td>
                                    <td>{application.applicant}</td>
                                    <td>{application.date}</td>
                                    <td>
                                        <select 
                                            className={`status-select ${application.status}`}
                                            value={application.status}
                                            onChange={(e) => handleStatusChange(application.id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="accepted">Accepted</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="view-btn">View</button>
                                            <button className="download-btn">Download CV</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index}
                                onClick={() => paginate(index + 1)}
                                className={currentPage === index + 1 ? 'active' : ''}
                            >
                                {index + 1}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Applications;