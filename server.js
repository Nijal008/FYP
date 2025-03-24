const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
// Change the port from 3000 to 5173
// Keep the port at 3000 for your backend
const port = 3000;

// Update CORS to allow requests from port 5172
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'service_rental'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Signup with role selection (excluding admin role)
app.post('/api/signup', (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  
  // Only allow seeker or provider roles
  const allowedRole = role === 'provider' ? 'provider' : 'seeker';
  
  // Get role_id from user_roles table
  const roleQuery = 'SELECT id FROM user_roles WHERE name = ?';
  db.query(roleQuery, [allowedRole], (roleErr, roleResults) => {
    if (roleErr || roleResults.length === 0) {
      console.error('Role lookup error:', roleErr);
      return res.status(500).json({ message: 'Invalid role selected.' });
    }
    
    const roleId = roleResults[0].id;
    
    // Insert the new user
    const query = 'INSERT INTO users (name, email, password, role_id, type) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [firstName + ' ' + lastName, email, password, roleId, allowedRole], (err, result) => {
      if (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ message: 'Something went wrong, please try again.' });
      }
      res.status(201).json({ 
        message: 'Account created successfully!',
        userId: result.insertId,
        role: allowedRole
      });
    });
  });
});

// Login with role information
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const query = `
    SELECT u.*, r.name as role_name 
    FROM users u
    JOIN user_roles r ON u.role_id = r.id
    WHERE u.email = ? AND r.name IN ('seeker', 'provider')
  `;
  
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Something went wrong, please try again.' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    const user = results[0];
    
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    // Update last_login timestamp
    db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    // Create a session
    const sessionToken = generateSessionToken();
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip;
    
    db.query(
      'INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))',
      [user.id, sessionToken, ipAddress, userAgent]
    );
    
    res.status(200).json({
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        profilePic: user.profile_pic
      },
      token: sessionToken
    });
  });
});

// Helper function to generate a session token
function generateSessionToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Get user roles for role selection (excluding admin role)
app.get('/api/roles', (req, res) => {
  const query = 'SELECT id, name, description FROM user_roles WHERE name IN ("seeker", "provider")';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching roles:', err);
      return res.status(500).json({ message: 'Failed to fetch roles' });
    }
    res.status(200).json(results);
  });
});

// Add service listing endpoint
app.get('/api/services', (req, res) => {
  const query = 'SELECT * FROM skills';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      return res.status(500).json({ message: 'Failed to fetch services' });
    }
    res.status(200).json(results);
  });
});

// Add service providers endpoint
app.get('/api/service-providers', (req, res) => {
  const query = `
    SELECT u.id, u.name, u.profile_pic, u.bio, us.rate_per_hour,
           (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) as rating,
           (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as reviews
    FROM users u
    JOIN user_skills us ON u.id = us.user_id
    WHERE u.role_id = 2 AND u.status = 'active'
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching service providers:', err);
      return res.status(500).json({ message: 'Failed to fetch service providers' });
    }
    res.status(200).json(results);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
