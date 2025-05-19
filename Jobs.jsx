import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Jobs.css';
import Sidebar from './Sidebar';

function Jobs() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [jobsPerPage] = useState(10);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newJob, setNewJob] = useState({
        title: '',
        company: '',
        location: '',
        description: '',
        requirements: '',
        salary: '',
        status: 'active'
    });

    useEffect(() => {
        // Check if admin is logged in
        const adminUser = localStorage.getItem('adminUser');
        if (!adminUser) {
            navigate('/admin/login');
            return;
        }

        // Fetch jobs data
        const fetchJobs = async () => {
            try {
                //  fetch this data from your API
                // For now,  use mock data
                
                // Mock data for demonstration
                const mockJobs = [
                    { id: 1, title: 'Frontend Developer', company: 'Tech Solutions', location: 'Kathmandu', status: 'active', date: '2023-06-15', applications: 12 },
                    { id: 2, title: 'UX Designer', company: 'Creative Labs', location: 'Pokhara', status: 'active', date: '2023-06-14', applications: 8 },
                    { id: 3, title: 'Project Manager', company: 'Global Systems', location: 'Kathmandu', status: 'closed', date: '2023-06-13', applications: 15 },
                    { id: 4, title: 'Data Analyst', company: 'Data Insights', location: 'Biratnagar', status: 'active', date: '2023-06-12', applications: 5 },
                    { id: 5, title: 'Backend Developer', company: 'Tech Solutions', location: 'Kathmandu', status: 'active', date: '2023-06-11', applications: 10 },
                    { id: 6, title: 'Content Writer', company: 'Media Group', location: 'Pokhara', status: 'closed', date: '2023-06-10', applications: 7 },
                    { id: 7, title: 'HR Manager', company: 'Corporate Services', location: 'Kathmandu', status: 'active', date: '2023-06-09', applications: 9 },
                    { id: 8, title: 'Marketing Specialist', company: 'Brand Builders', location: 'Chitwan', status: 'active', date: '2023-06-08', applications: 6 },
                    { id: 9, title: 'Full Stack Developer', company: 'Web Solutions', location: 'Kathmandu', status: 'active', date: '2023-06-07', applications: 14 },
                    { id: 10, title: 'Customer Support', company: 'Service Center', location: 'Butwal', status: 'closed', date: '2023-06-06', applications: 4 },
                    { id: 11, title: 'Network Engineer', company: 'IT Services', location: 'Kathmandu', status: 'active', date: '2023-06-05', applications: 3 },
                    { id: 12, title: 'Graphic Designer', company: 'Creative Studios', location: 'Pokhara', status: 'active', date: '2023-06-04', applications: 11 }
                ];

                setJobs(mockJobs);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching jobs:', error);
                setLoading(false);
            }
        };

        fetchJobs();
    }, [navigate]);

    // Filter jobs based on search term and status
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             job.company.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleDeleteJob = (jobId) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            // In a real app, you would send a delete request to your API
            setJobs(jobs.filter(job => job.id !== jobId));
        }
    };

    const handleStatusChange = (jobId, newStatus) => {
        // In a real app, you would send an update request to your API
        setJobs(jobs.map(job => 
            job.id === jobId ? { ...job, status: newStatus } : job
        ));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewJob({
            ...newJob,
            [name]: value
        });
    };

    const handleAddJob = (e) => {
        e.preventDefault();
        // In a real app,   send a post request to your API
        const newJobWithId = {
            ...newJob,
            id: jobs.length + 1,
            date: new Date().toISOString().split('T')[0],
            applications: 0
        };
        
        setJobs([newJobWithId, ...jobs]);
        setShowAddModal(false);
        setNewJob({
            title: '',
            company: '',
            location: '',
            description: '',
            requirements: '',
            salary: '',
            status: 'active'
        });
    };

    if (loading) {
        return <div className="loading">Loading jobs...</div>;
    }

    return (
        <div className="admin-jobs">
            <Sidebar />
            
            <div className="jobs-content">
                <div className="jobs-header">
                    <h1>Job Management</h1>
                    <button className="add-job-btn" onClick={() => setShowAddModal(true)}>Add New Job</button>
                </div>

                <div className="filters">
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder="Search jobs..." 
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
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="jobs-table-container">
                    <table className="jobs-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Location</th>
                                <th>Posted Date</th>
                                <th>Applications</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentJobs.map(job => (
                                <tr key={job.id}>
                                    <td>{job.id}</td>
                                    <td>{job.title}</td>
                                    <td>{job.company}</td>
                                    <td>{job.location}</td>
                                    <td>{job.date}</td>
                                    <td>{job.applications}</td>
                                    <td>
                                        <select 
                                            className={`status-select ${job.status}`}
                                            value={job.status}
                                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                        >
                                            <option value="active">Active</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="view-btn">View</button>
                                            <button className="edit-btn">Edit</button>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteJob(job.id)}
                                            >
                                                Delete
                                            </button>
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

            {/* Add Job Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="job-modal">
                        <div className="modal-header">
                            <h2>Add New Job</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddJob}>
                            <div className="form-group">
                                <label>Job Title</label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    value={newJob.title} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Company</label>
                                <input 
                                    type="text" 
                                    name="company" 
                                    value={newJob.company} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input 
                                    type="text" 
                                    name="location" 
                                    value={newJob.location} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    name="description" 
                                    value={newJob.description} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Requirements</label>
                                <textarea 
                                    name="requirements" 
                                    value={newJob.requirements} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Salary</label>
                                <input 
                                    type="text" 
                                    name="salary" 
                                    value={newJob.salary} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select 
                                    name="status" 
                                    value={newJob.status} 
                                    onChange={handleInputChange}
                                >
                                    <option value="active">Active</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="cancel-btn" 
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Add Job
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Jobs;