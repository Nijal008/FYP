import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

// Mock data for demonstration
const MOCK_USERS = [
  { id: 1, name: 'Samir Shrestha', email: 'samirsha08@gmail.com', role: 'seeker', status: 'active', created_at: '2025-03-21' },
  { id: 2, name: 'Nischal Shakya', email: 'nishanka365@gmail.com', role: 'seeker', status: 'active', created_at: '2025-03-21' },
  { id: 3, name: 'Rohan Pradhan', email: 'rohan@example.com', role: 'provider', status: 'active', created_at: '2025-03-22' },
  { id: 4, name: 'Sarala Thapa', email: 'sarala@example.com', role: 'provider', status: 'inactive', created_at: '2025-03-20' },
  { id: 5, name: 'Bikash Maharjan', email: 'bikash@example.com', role: 'seeker', status: 'active', created_at: '2025-03-23' },
];

const MOCK_SERVICES = [
  { id: 1, title: 'Web Development', provider: 'Rohan Pradhan', category: 'IT', price: 15000, status: 'active' },
  { id: 2, title: 'Logo Design', provider: 'Sarala Thapa', category: 'Design', price: 5000, status: 'active' },
  { id: 3, title: 'Mobile App Development', provider: 'Rohan Pradhan', category: 'IT', price: 25000, status: 'active' },
  { id: 4, title: 'Content Writing', provider: 'Bibek KC', category: 'Writing', price: 3000, status: 'inactive' },
  { id: 5, title: 'Social Media Marketing', provider: 'Sarala Thapa', category: 'Marketing', price: 8000, status: 'active' },
];

const MOCK_BOOKINGS = [
  { id: 1, service: 'Web Development', seeker: 'Samir Shrestha', provider: 'Rohan Pradhan', status: 'completed', created_at: '2025-03-22' },
  { id: 2, service: 'Logo Design', seeker: 'Nischal Shakya', provider: 'Sarala Thapa', status: 'pending', created_at: '2025-03-23' },
  { id: 3, service: 'Mobile App Development', seeker: 'Bikash Maharjan', provider: 'Rohan Pradhan', status: 'in-progress', created_at: '2025-03-24' },
  { id: 4, service: 'Web Development', seeker: 'Nischal Shakya', provider: 'Rohan Pradhan', status: 'canceled', created_at: '2025-03-21' },
  { id: 5, service: 'Content Writing', seeker: 'Samir Shrestha', provider: 'Bibek KC', status: 'pending', created_at: '2025-03-25' },
];

// Revenue data for chart visualization
const REVENUE_DATA = [
  { month: 'Jan', amount: 12000 },
  { month: 'Feb', amount: 19000 },
  { month: 'Mar', amount: 25000 },
  { month: 'Apr', amount: 18000 },
  { month: 'May', amount: 29000 },
  { month: 'Jun', amount: 35000 },
];

function AdminDashboard({ onAdminLogout }) {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalServices: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    completedBookings: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Add state for modals and selected items
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    // Check if admin is logged in
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/admin/login');
      return;
    }

    try {
      setAdminData(JSON.parse(adminUser));
    } catch (error) {
      console.error('Error parsing admin user:', error);
      navigate('/admin/login');
    }

    // Load dashboard data
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch real users from the database
        const usersResponse = await axios.get('http://localhost:3000/api/admin/users');
        const fetchedUsers = usersResponse.data;
        
        setUsers(fetchedUsers);
        
        // Fetch real services from the database
        const servicesResponse = await axios.get('http://localhost:3000/api/provider-services');
        const fetchedServices = servicesResponse.data;
        
        // Transform the fetched services to match the expected format
        const formattedServices = fetchedServices.map(service => ({
          id: service.id,
          title: service.service_name || 'Unnamed Service',
          provider: service.provider_name || 'Unknown Provider',
          category: service.category || 'General',
          price: service.hourly_rate || 0,
          status: service.availability_status === 'available' ? 'active' : 'inactive'
        }));
        
        setServices(formattedServices);
        
        // Fetch real bookings from the database
        try {
          const bookingsResponse = await axios.get('http://localhost:3000/api/admin/bookings');
          const fetchedBookings = bookingsResponse.data;
          
          // Transform the fetched bookings to match the expected format
          const formattedBookings = fetchedBookings.map(booking => ({
            id: booking.id,
            service: booking.service_name || 'Unknown Service',
            seeker: booking.seeker_name || 'Unknown Seeker',
            provider: booking.provider_name || 'Unknown Provider',
            status: booking.status || 'pending',
            created_at: booking.created_at ? new Date(booking.created_at).toISOString().split('T')[0] : ''
          }));
          
          setBookings(formattedBookings);
          
          // Calculate stats based on real data
          const activeUsersCount = fetchedUsers.filter(user => user.status === 'active').length;
          const completedBookingsCount = fetchedBookings.filter(booking => booking.status === 'completed').length;
          
          // Calculate total revenue from completed bookings
          const totalRevenue = fetchedBookings
            .filter(booking => booking.status === 'completed')
            .reduce((sum, booking) => sum + (parseFloat(booking.total_cost) || 0), 0);
          
          // Update stats with real data
          setStats({
            totalUsers: fetchedUsers.length,
            activeUsers: activeUsersCount,
            totalServices: fetchedServices.length,
            totalBookings: fetchedBookings.length,
            totalRevenue: totalRevenue || 12500, // Use calculated revenue or fallback
            completedBookings: completedBookingsCount
          });
        } catch (bookingError) {
          console.error('Error fetching booking data:', bookingError);
          // Fall back to mock data for bookings
          setBookings(MOCK_BOOKINGS);
          setStats(prevStats => ({
            ...prevStats,
            totalBookings: MOCK_BOOKINGS.length,
            completedBookings: MOCK_BOOKINGS.filter(booking => booking.status === 'completed').length
          }));
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        alert('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    
    // Call the onAdminLogout handler if provided
    if (onAdminLogout) {
      onAdminLogout();
    } else {
      navigate('/admin/login');
    }
  };

  const handleSearch = (data) => {
    if (!searchTerm) return data;
    
    return data.filter(item => 
      Object.values(item).some(
        value => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const handleStatusFilter = (data, statusField = 'status') => {
    if (filterStatus === 'all') return data;
    
    return data.filter(item => item[statusField] === filterStatus);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', { 
      style: 'currency', 
      currency: 'NPR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderDashboardContent = () => {
    return (
      <div className="dashboard-content">
        <div className="dashboard-overview">
          <div className="dashboard-title">Dashboard Overview</div>
          <div className="dashboard-subtitle">Today: {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
        
        {loading ? (
          <div className="loading">Loading dashboard data...</div>
        ) : (
          <>
            <div className="stats-container">
              <div className="stat-card">
                <h3>Total Users</h3>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-subtitle">{stats.activeUsers} active</div>
              </div>
              <div className="stat-card">
                <h3>Total Services</h3>
                <div className="stat-value">{stats.totalServices}</div>
                <div className="stat-subtitle">across multiple categories</div>
              </div>
              <div className="stat-card">
                <h3>Total Bookings</h3>
                <div className="stat-value">{stats.totalBookings}</div>
                <div className="stat-subtitle">{stats.completedBookings} completed</div>
              </div>
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <div className="stat-value">NPR {stats.totalRevenue.toLocaleString()}</div>
                <div className="stat-subtitle">from all services</div>
              </div>
            </div>
            
            <div className="dashboard-charts">
              <div className="chart-container">
                <h3>Revenue Trend</h3>
                <div className="mock-chart">
                  {REVENUE_DATA.map((item, index) => (
                    <div key={index} className="chart-bar-container">
                      <div 
                        className="chart-bar" 
                        style={{ height: `${(item.amount / 35000) * 100}%` }}
                        title={`${item.month}: ${formatCurrency(item.amount)}`}
                      ></div>
                      <div className="chart-label">{item.month}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="chart-container">
                <h3>Recent Bookings</h3>
                <div className="recent-bookings">
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 4).map(booking => (
                        <tr key={booking.id}>
                          <td>{booking.service}</td>
                          <td>
                            <span className={`status-badge status-${booking.status}`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderUsersContent = () => {
    const filteredUsers = handleStatusFilter(handleSearch(users));
    
    return (
      <div className="users-content">
        <h2>User Management</h2>
        
        <div className="table-controls">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.created_at}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view-btn" 
                        title="View Details"
                        onClick={() => handleView(user, 'user')}
                      >
                        <i className="fa fa-eye"></i>
                      </button>
                      <button 
                        className="action-btn edit-btn" 
                        title="Edit User"
                        onClick={() => handleEdit(user, 'user')}
                      >
                        <i className="fa fa-edit"></i>
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        title="Delete User"
                        onClick={() => handleDelete(user, 'user')}
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderServicesContent = () => {
      const filteredServices = handleStatusFilter(handleSearch(services));
      
      return (
        <div className="services-content">
          <h2>Service Management</h2>
          
          <div className="table-controls">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search services..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-box">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Provider</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map(service => (
                  <tr key={service.id}>
                    <td>{service.id}</td>
                    <td>{service.title}</td>
                    <td>{service.provider}</td>
                    <td>{service.category}</td>
                    <td>{formatCurrency(service.price)}</td>
                    <td>
                      <span className={`status-badge status-${service.status}`}>
                        {service.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view-btn" 
                          title="View Details"
                          onClick={() => handleView(service, 'service')}
                        >
                          <i className="fa fa-eye"></i>
                        </button>
                        <button 
                          className="action-btn edit-btn" 
                          title="Edit Service"
                          onClick={() => handleEdit(service, 'service')}
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          title="Delete Service"
                          onClick={() => handleDelete(service, 'service')}
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

  const renderBookingsContent = () => {
    const filteredBookings = handleStatusFilter(handleSearch(bookings));
    
    return (
      <div className="bookings-content">
        <h2>Booking Management</h2>
        
        <div className="table-controls">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Service</th>
                <th>Seeker</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.service}</td>
                  <td>{booking.seeker}</td>
                  <td>{booking.provider}</td>
                  <td>
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>{booking.created_at}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view-btn" 
                        title="View Details"
                        onClick={() => handleView(booking, 'booking')}
                      >
                        <i className="fa fa-eye"></i>
                      </button>
                      <button 
                        className="action-btn edit-btn" 
                        title="Edit Booking"
                        onClick={() => handleEdit(booking, 'booking')}
                      >
                        <i className="fa fa-edit"></i>
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        title="Delete Booking"
                        onClick={() => handleDelete(booking, 'booking')}
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSettingsContent = () => {
    return (
      <div className="settings-content">
        <h2>Admin Settings</h2>
        
        <div className="settings-panel">
          <div className="settings-section">
            <h3>Profile Settings</h3>
            <form className="settings-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={adminData?.name || 'Admin User'} readOnly />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={adminData?.email || 'admin@example.com'} readOnly />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input type="text" value="Administrator" readOnly />
              </div>
              <button type="button" className="btn-primary">Edit Profile</button>
            </form>
          </div>
          
          <div className="settings-section">
            <h3>Security Settings</h3>
            <form className="settings-form">
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" placeholder="Enter new password" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" />
              </div>
              <button type="button" className="btn-primary">Change Password</button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'users':
        return renderUsersContent();
      case 'services':
        return renderServicesContent();
      case 'bookings':
        return renderBookingsContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return <div>Select a tab to view content</div>;
    }
  };

  if (!adminData) {
    return <div className="loading">Checking authentication...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <div className="admin-logo">
          <h1>Hirely</h1>
        </div>
        <div className="admin-profile">
          <span>Welcome, {adminData?.name || 'User Name'}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      
      <div className="admin-content">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <ul>
              <li 
                className={activeTab === 'dashboard' ? 'active' : ''} 
                onClick={() => setActiveTab('dashboard')}
              >
                <i className="dashboard-icon"></i>Dashboard
              </li>
              <li 
                className={activeTab === 'users' ? 'active' : ''} 
                onClick={() => setActiveTab('users')}
              >
                <i className="users-icon"></i>Users
              </li>
              <li 
                className={activeTab === 'services' ? 'active' : ''} 
                onClick={() => setActiveTab('services')}
              >
                <i className="services-icon"></i>Services
              </li>
              <li 
                className={activeTab === 'bookings' ? 'active' : ''} 
                onClick={() => setActiveTab('bookings')}
              >
                <i className="bookings-icon"></i>Bookings
              </li>
              <li 
                className={activeTab === 'settings' ? 'active' : ''} 
                onClick={() => setActiveTab('settings')}
              >
                <i className="settings-icon"></i>Settings
              </li>
            </ul>
          </nav>
        </aside>
        
        <main className="admin-main">
          <div className="scrollable-content">
            {renderContent()}
          </div>
        </main>
      </div>
      
      {/* View Modal */}
      {isViewModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>
                {selectedItem.type === 'user' ? 'User Details' : 
                 selectedItem.type === 'service' ? 'Service Details' : 
                 'Booking Details'}
              </h3>
              <button className="close-btn" onClick={closeAllModals}>×</button>
            </div>
            <div className="modal-body">
              {selectedItem.type === 'user' && (
                <div className="details-container">
                  <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{selectedItem.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedItem.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedItem.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{selectedItem.role}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{selectedItem.status}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{selectedItem.created_at}</span>
                  </div>
                </div>
              )}
              
              {selectedItem.type === 'service' && (
                <div className="details-container">
                  <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{selectedItem.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Title:</span>
                    <span className="detail-value">{selectedItem.title}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Provider:</span>
                    <span className="detail-value">{selectedItem.provider}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{selectedItem.category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value">{formatCurrency(selectedItem.price)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{selectedItem.status}</span>
                  </div>
                </div>
              )}
              
              {selectedItem.type === 'booking' && (
                <div className="details-container">
                  <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{selectedItem.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Service:</span>
                    <span className="detail-value">{selectedItem.service}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Seeker:</span>
                    <span className="detail-value">{selectedItem.seeker}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Provider:</span>
                    <span className="detail-value">{selectedItem.provider}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{selectedItem.status}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{selectedItem.created_at}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeAllModals}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>
                {selectedItem.type === 'user' ? 'Edit User' : 
                 selectedItem.type === 'service' ? 'Edit Service' : 
                 'Edit Booking'}
              </h3>
              <button className="close-btn" onClick={closeAllModals}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
                {selectedItem.type === 'user' && (
                  <>
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={editFormData.name || ''} 
                        onChange={handleEditFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={editFormData.email || ''} 
                        onChange={handleEditFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <select 
                        name="role" 
                        value={editFormData.role || 'seeker'} 
                        onChange={handleEditFormChange}
                      >
                        <option value="seeker">Seeker</option>
                        <option value="provider">Provider</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        name="status" 
                        value={editFormData.status || 'active'} 
                        onChange={handleEditFormChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
                
                {selectedItem.type === 'service' && (
                  <>
                    <div className="form-group">
                      <label>Title</label>
                      <input 
                        type="text" 
                        name="title" 
                        value={editFormData.title || ''} 
                        onChange={handleEditFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <input 
                        type="text" 
                        name="category" 
                        value={editFormData.category || ''} 
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Price (NPR)</label>
                      <input 
                        type="number" 
                        name="price" 
                        value={editFormData.price || 0} 
                        onChange={handleEditFormChange}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        name="status" 
                        value={editFormData.status || 'active'} 
                        onChange={handleEditFormChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
                
                {selectedItem.type === 'booking' && (
                  <>
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        name="status" 
                        value={editFormData.status || 'pending'} 
                        onChange={handleEditFormChange}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Save Changes</button>
                  <button type="button" className="btn-secondary" onClick={closeAllModals}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="close-btn" onClick={closeAllModals}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this {selectedItem.type}?</p>
              <p>This action cannot be undone.</p>
              
              <div className="delete-details">
                {selectedItem.type === 'user' && (
                  <p><strong>{selectedItem.name}</strong> (ID: {selectedItem.id})</p>
                )}
                
                {selectedItem.type === 'service' && (
                  <p><strong>{selectedItem.title}</strong> (ID: {selectedItem.id})</p>
                )}
                
                {selectedItem.type === 'booking' && (
                  <p><strong>Booking #{selectedItem.id}</strong> - {selectedItem.service}</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-danger" onClick={handleDeleteConfirm}>Delete</button>
              <button className="btn-secondary" onClick={closeAllModals}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;


// Add these handler functions for action buttons
const handleView = (item, type) => {
  setSelectedItem({ ...item, type });
  setIsViewModalOpen(true);
};

const handleEdit = (item, type) => {
  setSelectedItem({ ...item, type });
  
  // Set form data based on item type
  if (type === 'user') {
    setEditFormData({
      name: item.name || '',
      email: item.email || '',
      role: item.role || 'seeker',
      status: item.status || 'active'
    });
  } else if (type === 'service') {
    setEditFormData({
      title: item.title || '',
      category: item.category || '',
      price: item.price || 0,
      status: item.status || 'active'
    });
  } else if (type === 'booking') {
    setEditFormData({
      status: item.status || 'pending'
    });
  }
  
  setIsEditModalOpen(true);
};

const handleDelete = (item, type) => {
  setSelectedItem({ ...item, type });
  setIsDeleteModalOpen(true);
};

const handleEditFormChange = (e) => {
  const { name, value } = e.target;
  setEditFormData({
    ...editFormData,
    [name]: value
  });
};

const handleEditSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    
    if (selectedItem.type === 'user') {
      await axios.put(`http://localhost:3000/api/admin/users/${selectedItem.id}`, editFormData);
      
      // Update users state
      setUsers(users.map(user => 
        user.id === selectedItem.id ? { ...user, ...editFormData } : user
      ));
      
    } else if (selectedItem.type === 'service') {
      await axios.put(`http://localhost:3000/api/admin/services/${selectedItem.id}`, editFormData);
      
      // Update services state
      setServices(services.map(service => 
        service.id === selectedItem.id ? { 
          ...service, 
          title: editFormData.title,
          category: editFormData.category,
          price: editFormData.price,
          status: editFormData.status
        } : service
      ));
      
    } else if (selectedItem.type === 'booking') {
      await axios.put(`http://localhost:3000/api/admin/bookings/${selectedItem.id}`, {
        status: editFormData.status
      });
      
      // Update bookings state
      setBookings(bookings.map(booking => 
        booking.id === selectedItem.id ? { ...booking, status: editFormData.status } : booking
      ));
    }
    
    setIsEditModalOpen(false);
    alert('Item updated successfully!');
    
  } catch (error) {
    console.error('Error updating item:', error);
    alert('Failed to update. Please try again.');
  } finally {
    setLoading(false);
  }
};

const handleDeleteConfirm = async () => {
  try {
    setLoading(true);
    
    if (selectedItem.type === 'user') {
      await axios.delete(`http://localhost:3000/api/admin/users/${selectedItem.id}`);
      setUsers(users.filter(user => user.id !== selectedItem.id));
      
    } else if (selectedItem.type === 'service') {
      await axios.delete(`http://localhost:3000/api/admin/services/${selectedItem.id}`);
      setServices(services.filter(service => service.id !== selectedItem.id));
      
    } else if (selectedItem.type === 'booking') {
      await axios.delete(`http://localhost:3000/api/admin/bookings/${selectedItem.id}`);
      setBookings(bookings.filter(booking => booking.id !== selectedItem.id));
    }
    
    setIsDeleteModalOpen(false);
    alert('Item deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Failed to delete. Please try again.');
  } finally {
    setLoading(false);
  }
};

const closeAllModals = () => {
  setIsViewModalOpen(false);
  setIsEditModalOpen(false);
  setIsDeleteModalOpen(false);
  setSelectedItem(null);
  setEditFormData({});
};
