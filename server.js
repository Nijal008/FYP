const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Update CORS to allow requests from multiple origins
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5176', 'http://[::1]:5176'],
  credentials: true
}));

app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'service_rental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Add this to verify the connection is working
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release(); // Release the connection when done
});

// Create user_settings table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notifications JSON,
    language VARCHAR(50) DEFAULT 'english',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) {
    console.error('Error creating user_settings table:', err);
  } else {
    console.log('user_settings table ready');
  }
});

// Signup with role selection (excluding admin role)
app.post('/api/signup', (req, res) => {
  console.log('Signup request received:', req.body); // Add logging
  const { firstName, lastName, email, password, role } = req.body;
  
  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    console.log('Missing required fields for signup');
    return res.status(400).json({ message: 'All fields are required.' });
  }
  
  // Only allow seeker or provider roles
  const allowedRole = role === 'provider' ? 'provider' : 'seeker';
  
  // Get role_id from user_roles table
  const roleQuery = 'SELECT id FROM user_roles WHERE name = ?';
  db.query(roleQuery, [allowedRole], (roleErr, roleResults) => {
    if (roleErr) {
      console.error('Role lookup error:', roleErr);
      return res.status(500).json({ message: 'Database error, please try again.' });
    }
    
    if (roleResults.length === 0) {
      console.error('Role not found:', allowedRole);
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

// Get user profile
app.get('/api/users/:id/profile', (req, res) => {
  const userId = req.params.id;
  
  const query = `
    SELECT u.*, r.name as role_name 
    FROM users u
    JOIN user_roles r ON u.role_id = r.id
    WHERE u.id = ?
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ message: 'Failed to fetch profile data' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = results[0];
    
    // Remove password before sending to client
    delete user.password;
    
    res.status(200).json(user);
  });
});

// Update user profile
app.put('/api/users/:id/profile', (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, bio, address, profile_pic } = req.body;
  
  // Validate required fields
  if (!name && !email) {
    return res.status(400).json({ message: 'At least one field is required to update' });
  }
  
  // Check if the user exists
  db.query('SELECT * FROM users WHERE id = ?', [userId], (checkErr, checkResults) => {
    if (checkErr || checkResults.length === 0) {
      console.error('User check error:', checkErr);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log the current user data and what we're trying to update to
    console.log('Current user data:', checkResults[0]);
    console.log('Updating with:', { name, email, phone, bio, address, profile_pic });
    
    // Modify the update query to handle the updated_at column correctly
    let updateQuery = 'UPDATE users SET ';
    let params = [];
    let updates = [];
    
    // Only add fields that are provided in the request
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }
    
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }
    
    if (profile_pic !== undefined) {
      updates.push('profile_pic = ?');
      params.push(profile_pic);
    }
    
    // Add updated_at timestamp
    updates.push('updated_at = NOW()');
    
    // If no updates, return early
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateQuery += updates.join(', ');
    updateQuery += ' WHERE id = ?';
    params.push(userId);
    
    console.log('Final update query:', updateQuery);
    console.log('Parameters:', params);
    
    // Execute the update
    db.query(updateQuery, params, (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error updating user profile:', updateErr);
        return res.status(500).json({ message: 'Failed to update profile in database' });
      }
      
      console.log('Update result:', updateResult);
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found or no changes made' });
      }
      
      // Return updated user data
      db.query('SELECT * FROM users WHERE id = ?', [userId], (fetchErr, fetchResults) => {
        if (fetchErr || fetchResults.length === 0) {
          console.error('Error fetching updated user data:', fetchErr);
          return res.status(500).json({ message: 'Profile updated but failed to fetch updated data' });
        }
        
        const updatedUser = fetchResults[0];
        delete updatedUser.password;
        
        res.status(200).json(updatedUser);
      });
    });
  });
});

// Get user settings
app.get('/api/users/:id/settings', (req, res) => {
  const userId = req.params.id;
  
  // Check if the settings table exists
  db.query("SHOW TABLES LIKE 'user_settings'", (tableErr, tableResults) => {
    if (tableErr || tableResults.length === 0) {
      // If the table doesn't exist, just return the user data
      const query = 'SELECT email FROM users WHERE id = ?';
      db.query(query, [userId], (err, results) => {
        if (err || results.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Return just the email as settings
        res.status(200).json({
          email: results[0].email,
          notifications: {
            email: true,
            sms: false,
            app: true
          },
          language: 'english'
        });
      });
      return;
    }
    
    // If the table exists, fetch the settings
    const query = 'SELECT * FROM user_settings WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching user settings:', err);
        return res.status(500).json({ message: 'Failed to fetch settings' });
      }
      
      if (results.length === 0) {
        // No settings found, return default settings
        return res.status(200).json({
          notifications: {
            email: true,
            sms: false,
            app: true
          },
          language: 'english'
        });
      }
      
      // Return the settings
      res.status(200).json(results[0]);
    });
  });
});

// Update user settings
app.put('/api/users/:id/settings', (req, res) => {
  const userId = req.params.id;
  const { email, notifications, language } = req.body;
  
  // Check if the settings table exists
  db.query("SHOW TABLES LIKE 'user_settings'", (tableErr, tableResults) => {
    if (tableErr || tableResults.length === 0) {
      // If the table doesn't exist but email is provided, update user email
      if (email) {
        db.query('UPDATE users SET email = ? WHERE id = ?', [email, userId], (updateErr, updateResult) => {
          if (updateErr) {
            console.error('Error updating user email:', updateErr);
            return res.status(500).json({ message: 'Failed to update email' });
          }
          
          if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
          }
          
          res.status(200).json({ message: 'Email updated successfully' });
        });
        return;
      }
      
      // If no email is provided and table doesn't exist, return an error
      return res.status(404).json({ message: 'Settings not supported yet' });
    }
    
    // If the table exists, check if settings already exist for this user
    db.query('SELECT * FROM user_settings WHERE user_id = ?', [userId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking user settings:', checkErr);
        return res.status(500).json({ message: 'Failed to check settings' });
      }
      
      const notificationsJson = JSON.stringify(notifications || {});
      
      if (checkResults.length === 0) {
        // No settings exist, create new settings
        const insertQuery = 'INSERT INTO user_settings (user_id, notifications, language) VALUES (?, ?, ?)';
        db.query(insertQuery, [userId, notificationsJson, language || 'english'], (insertErr) => {
          if (insertErr) {
            console.error('Error creating user settings:', insertErr);
            return res.status(500).json({ message: 'Failed to create settings' });
          }
          
          // If email is provided, update user email as well
          if (email) {
            db.query('UPDATE users SET email = ? WHERE id = ?', [email, userId], (updateErr) => {
              if (updateErr) {
                console.error('Error updating user email:', updateErr);
                // Still return success for settings update
              }
            });
          }
          
          res.status(200).json({ message: 'Settings created successfully' });
        });
      } else {
        // Settings exist, update them
        const updateQuery = 'UPDATE user_settings SET notifications = ?, language = ? WHERE user_id = ?';
        db.query(updateQuery, [notificationsJson, language || 'english', userId], (updateErr) => {
          if (updateErr) {
            console.error('Error updating user settings:', updateErr);
            return res.status(500).json({ message: 'Failed to update settings' });
          }
          
          // If email is provided, update user email as well
          if (email) {
            db.query('UPDATE users SET email = ? WHERE id = ?', [email, userId], (updateErr) => {
              if (updateErr) {
                console.error('Error updating user email:', updateErr);
                // Still return success for settings update
              }
            });
          }
          
          res.status(200).json({ message: 'Settings updated successfully' });
        });
      }
    });
  });
});

// Change password endpoint
app.post('/password/change', (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  
  console.log('Password change request received:', { email, passwordLength: currentPassword?.length });

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Email, current password, and new password are required' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }

  // Check if the user exists and password is correct
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error during password change:', err);
      return res.status(500).json({ message: 'Database error, please try again' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = results[0];
    console.log('User found:', { userId: user.id, passwordFromDB: user.password?.substring(0, 3) + '...' });
    
    // Verify current password
    if (user.password !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update the password
    const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
    console.log('Updating password for user:', user.id);
    
    db.query(updateQuery, [newPassword, user.id], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error updating password:', updateErr);
        return res.status(500).json({ message: 'Failed to update password' });
      }
      
      console.log('Password update result:', updateResult);
      
      if (updateResult.affectedRows === 0) {
        return res.status(500).json({ message: 'Failed to update password' });
      }
      
      res.status(200).json({ message: 'Password updated successfully' });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});