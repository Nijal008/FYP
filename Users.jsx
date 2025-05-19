import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Users.css';
import Sidebar from './Sidebar';

function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);

    useEffect(() => {
        // Check if admin is logged in
        const adminUser = localStorage.getItem('adminUser');
        if (!adminUser) {
            navigate('/admin/login');
            return;
        }

        // Fetch users data
        // Update the fetchUsers function around line 25
        const fetchUsers = async () => {
          try {
            setLoading(true);
            console.log('Attempting to fetch users from API...');
            
            const response = await axios.get('http://localhost:3000/api/admin/users');
            console.log('API response:', response.data);
            
            if (response.data && Array.isArray(response.data)) {
              setUsers(response.data);
            } else {
              console.error('Invalid response format:', response.data);
              // Fallback to mock data if API response is invalid
              setUsers([
                { id: 1, name: 'John Doe', email: 'john@example.com', role_name: 'provider', status: 'active', created_at: '2023-06-10' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', role_name: 'seeker', status: 'active', created_at: '2023-06-09' },
                { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role_name: 'provider', status: 'inactive', created_at: '2023-06-08' },
                { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role_name: 'seeker', status: 'active', created_at: '2023-06-07' }
              ]);
            }
          } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback to mock data if API call fails
            setUsers([
              { id: 1, name: 'John Doe', email: 'john@example.com', role_name: 'provider', status: 'active', created_at: '2023-06-10' },
              { id: 2, name: 'Jane Smith', email: 'jane@example.com', role_name: 'seeker', status: 'active', created_at: '2023-06-09' },
              { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role_name: 'provider', status: 'inactive', created_at: '2023-06-08' },
              { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role_name: 'seeker', status: 'active', created_at: '2023-06-07' }
            ]);
          } finally {
            setLoading(false);
          }
        };

        fetchUsers();
    }, [navigate]);

    // Filter users based on search term and role
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        
        return matchesSearch && matchesRole;
    });

    // Pagination
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Update the table row rendering in the Users.jsx component
    <tbody>
        {currentUsers.map(user => (
            <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                    <span className={`role-badge ${user.role_name}`}>
                        {user.displayRole || (user.role_name === 'seeker' ? 'User' : 
                         user.role_name === 'provider' ? 'Service Provider' : 
                         user.role_name)}
                    </span>
                </td>
                <td>
                    <span className={`status-badge ${user.status?.toLowerCase()}`}>
                        {user.status || 'Active'}
                    </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <div className="action-buttons">
                        <button className="view-btn">View</button>
                        <button className="edit-btn">Edit</button>
                        <button 
                            className="delete-btn"
                            onClick={() => handleDeleteUser(user.id)}
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        ))}
    </tbody>

    // Update the handleDeleteUser function
    const handleDeleteUser = (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            // Send delete request to the API
            axios.delete(`http://localhost:3000/api/admin/users/${userId}`)
                .then(response => {
                    console.log('User deleted:', response.data);
                    // Remove the user from the state
                    setUsers(users.filter(user => user.id !== userId));
                })
                .catch(error => {
                    console.error('Error deleting user:', error);
                    alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
                });
        }
    };

    // Update the handleStatusChange function
    const handleStatusChange = (userId, newStatus) => {
        // Send update request to the API
        axios.put(`http://localhost:3000/api/admin/users/${userId}/status`, { status: newStatus })
            .then(response => {
                console.log('User status updated:', response.data);
                // Update the user in the state
                setUsers(users.map(user => 
                    user.id === userId ? { ...user, status: newStatus } : user
                ));
            })
            .catch(error => {
                console.error('Error updating user status:', error);
                alert('Failed to update user status: ' + (error.response?.data?.message || error.message));
            });
    };

    if (loading) {
        return <div className="loading">Loading users...</div>;
    }

    return (
        <div className="admin-users">
            <Sidebar />
            
            <div className="users-content">
                <div className="users-header">
                    <h1>User Management</h1>
                    <button className="add-user-btn">Add New User</button>
                </div>

                <div className="filters">
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="role-filter">
                        <select 
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value="seeker">Job Seekers</option>
                            <option value="recruiter">Recruiters</option>
                        </select>
                    </div>
                </div>

                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Join Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>
                                            {user.role === 'seeker' ? 'Job Seeker' : 'Recruiter'}
                                        </span>
                                    </td>
                                    <td>{user.date}</td>
                                    <td>
                                        <select 
                                            className={`status-select ${user.status}`}
                                            value={user.status}
                                            onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="view-btn">View</button>
                                            <button className="edit-btn">Edit</button>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteUser(user.id)}
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
        </div>
    );
}

export default Users;