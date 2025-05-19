const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
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
  console.log('Signup request received:', req.body);
  const { firstName, lastName, email, password, role, phone, address } = req.body;
  
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
    
    // Hash the password with bcrypt
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('Password hashing error:', hashErr);
        return res.status(500).json({ message: 'Error creating account, please try again.' });
      }
      
      // Check if email already exists
      const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
      db.query(checkEmailQuery, [email], (emailErr, emailResults) => {
        if (emailErr) {
          console.error('Email check error:', emailErr);
          return res.status(500).json({ message: 'Database error, please try again.' });
        }
        
        if (emailResults.length > 0) {
          return res.status(400).json({ message: 'Email already in use.' });
        }
        
        // Update insert query to include phone and address
        const insertQuery = 'INSERT INTO users (name, email, password, role_id, type, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const fullName = `${firstName} ${lastName}`;
        
        db.query(insertQuery, [
          fullName, 
          email, 
          hashedPassword, 
          roleId, 
          allowedRole,
          phone || null,    // Add phone field
          address || null,  // Add address field
          'active'         // Default status
        ], (insertErr, insertResults) => {
          if (insertErr) {
            console.error('User insert error:', insertErr);
            return res.status(500).json({ message: 'Error creating account, please try again.' });
          }
          
          res.status(201).json({ 
            message: 'Account created successfully!',
            user: {
              id: insertResults.insertId,
              name: fullName,
              email: email,
              role: allowedRole,
              phone: phone || null,
              address: address || null
            }
          });
        });
      });
    });
  });
});
app.get('/api/services', (req, res) => {
  const query = 'SELECT * FROM services';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      return res.status(500).json({ message: 'Failed to fetch services' });
    }
    res.status(200).json(results);
  });
});


app.post('/api/provider/services', (req, res) => {
  const { providerId, services } = req.body;
  
  if (!providerId || !services || !Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ message: 'Provider ID and at least one service are required' });
  }
  
  // Create an array of promises for each service registration
  const servicePromises = services.map(service => {
    return new Promise((resolve, reject) => {
      const insertQuery = 'INSERT INTO provider_services (provider_id, service_id, hourly_rate, availability_status, professional_bio) VALUES (?, ?, ?, ?, ?)';
      db.query(insertQuery, [
        providerId, 
        service.serviceId, 
        service.hourlyRate, 
        service.availabilityStatus || 'available',
        service.professionalBio || null
      ], (err, result) => {
        if (err) {
          console.error('Error registering provider service:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });
  
  // Execute all service registrations
  Promise.all(servicePromises)
    .then(() => {
      res.status(201).json({ 
        message: 'Provider services registered successfully',
        providerId: providerId
      });
    })
    .catch(error => {
      res.status(500).json({ message: 'Failed to register provider services' });
    });
});



// Get services for a specific provider
app.get('/api/provider/:id/services', (req, res) => {
  const providerId = req.params.id;
  
  const query = `
    SELECT ps.*, s.name as service_name, s.description as service_description, s.image_path
    FROM provider_services ps
    JOIN services s ON ps.service_id = s.id
    WHERE ps.provider_id = ?
  `;
  
  db.query(query, [providerId], (err, results) => {
    if (err) {
      console.error('Error fetching provider services:', err);
      return res.status(500).json({ message: 'Failed to fetch provider services' });
    }
    
    res.status(200).json(results);
  });
});
// Update the login endpoint to use bcrypt for password verification
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  const query = `
    SELECT u.*, r.name as role_name 
    FROM users u
    JOIN user_roles r ON u.role_id = r.id
    WHERE u.email = ?
  `;
  
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Login query error:', err);
      return res.status(500).json({ message: 'Database error, please try again.' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = results[0];
    
    // Compare the provided password with the stored hash
    bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
      if (bcryptErr) {
        console.error('Password comparison error:', bcryptErr);
        return res.status(500).json({ message: 'Authentication error, please try again.' });
      }
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // Password is correct, create user object to return (excluding password)
      const userToReturn = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        type: user.type
      };
      
      // Generate token if you're using JWT (not implemented here)
      
      res.status(200).json({
        message: 'Login successful',
        user: userToReturn,
        token: 'your-jwt-token-here' // Replace with actual JWT token generation
      });
    });
  });
});

// Add a new endpoint for changing password
app.put('/api/users/:id/password', (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;
  
  // Validate required fields
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  
  // First verify the current password
  const verifyQuery = 'SELECT password FROM users WHERE id = ?';
  db.query(verifyQuery, [userId], (verifyErr, verifyResults) => {
    if (verifyErr) {
      console.error('Password verification error:', verifyErr);
      return res.status(500).json({ message: 'Something went wrong, please try again.' });
    }
    
    if (verifyResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const storedHashedPassword = verifyResults[0].password;
    
    // Check if current password matches
    bcrypt.compare(currentPassword, storedHashedPassword, (compareErr, isMatch) => {
      if (compareErr) {
        console.error('Password comparison error:', compareErr);
        return res.status(500).json({ message: 'Authentication error, please try again.' });
      }
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Hash the new password
      bcrypt.hash(newPassword, 10, (hashErr, hashedNewPassword) => {
        if (hashErr) {
          console.error('Password hashing error:', hashErr);
          return res.status(500).json({ message: 'Error updating password, please try again.' });
        }
        
        // Update the password
        const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
        db.query(updateQuery, [hashedNewPassword, userId], (updateErr, updateResult) => {
          if (updateErr) {
            console.error('Password update error:', updateErr);
            return res.status(500).json({ message: 'Failed to update password' });
          }
          
          res.status(200).json({ message: 'Password updated successfully' });
        });
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

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Admin login attempt:', email);

  const query = `
    SELECT u.*, r.name as role_name 
    FROM users u
    JOIN user_roles r ON u.role_id = r.id
    WHERE u.email = ? AND r.name = 'admin'
  `;
  
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Admin login error:', err);
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
      success: true,
      message: 'Login successful!',
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        isAdmin: true
      },
      token: sessionToken
    });
  });
});

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

// Add this endpoint before app.listen()

// Create admin user endpoint
app.post('/api/setup/admin', (req, res) => {
  const { name, email, password } = req.body;
  
  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  
  // Check if email already exists
  db.query('SELECT * FROM users WHERE email = ?', [email], (emailErr, emailResults) => {
    if (emailErr) {
      console.error('Email check error:', emailErr);
      return res.status(500).json({ message: 'Database error, please try again.' });
    }
    
    if (emailResults.length > 0) {
      return res.status(400).json({ message: 'Email already in use.' });
    }
    
    // Get admin role_id
    db.query('SELECT id FROM user_roles WHERE name = "admin"', (roleErr, roleResults) => {
      if (roleErr) {
        console.error('Error fetching admin role ID:', roleErr);
        return res.status(500).json({ message: 'Failed to fetch admin role' });
      }
      
      let adminRoleId;
      
      if (roleResults.length === 0) {
        // Create admin role if it doesn't exist
        db.query('INSERT INTO user_roles (name, description) VALUES ("admin", "Administrator with full access")', 
          (insertRoleErr, insertRoleResult) => {
            if (insertRoleErr) {
              console.error('Error creating admin role:', insertRoleErr);
              return res.status(500).json({ message: 'Failed to create admin role' });
            }
            adminRoleId = insertRoleResult.insertId;
            createAdminUser(adminRoleId);
          });
      } else {
        adminRoleId = roleResults[0].id;
        createAdminUser(adminRoleId);
      }
      
      function createAdminUser(roleId) {
        // Hash the password with bcrypt
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error('Password hashing error:', hashErr);
            return res.status(500).json({ message: 'Error creating account, please try again.' });
          }
          
          // Insert the new admin user
          const insertQuery = 'INSERT INTO users (name, email, password, role_id, type, status) VALUES (?, ?, ?, ?, ?, ?)';
          db.query(insertQuery, [name, email, hashedPassword, roleId, 'admin', 'active'], (insertErr, insertResult) => {
            if (insertErr) {
              console.error('Admin user creation error:', insertErr);
              return res.status(500).json({ message: 'Failed to create admin user' });
            }
            
            res.status(201).json({ 
              message: 'Admin user created successfully',
              user: {
                id: insertResult.insertId,
                name: name,
                email: email,
                role: 'admin'
              }
            });
          });
        });
      }
    });
  });
});


// Quick admin setup endpoint with predefined credentials
app.post('/api/setup/quickadmin', (req, res) => {
  const adminName = 'System Admin';
  const adminEmail = 'admin@hirely.com';
  const adminPassword = 'Admin@123';
  
  // Check if email already exists
  db.query('SELECT * FROM users WHERE email = ?', [adminEmail], (emailErr, emailResults) => {
    if (emailErr) {
      console.error('Email check error:', emailErr);
      return res.status(500).json({ message: 'Database error, please try again.' });
    }
    
    if (emailResults.length > 0) {
      return res.status(200).json({ 
        message: 'Admin user already exists',
        user: {
          id: emailResults[0].id,
          email: adminEmail
        }
      });
    }
    
    // Get or create admin role
    db.query('SELECT id FROM user_roles WHERE name = "admin"', (roleErr, roleResults) => {
      if (roleErr) {
        console.error('Error fetching admin role ID:', roleErr);
        return res.status(500).json({ message: 'Failed to fetch admin role' });
      }
      
      let adminRoleId;
      
      if (roleResults.length === 0) {
        // Create admin role if it doesn't exist
        db.query('INSERT INTO user_roles (name, description) VALUES ("admin", "Administrator with full access")', 
          (insertRoleErr, insertRoleResult) => {
            if (insertRoleErr) {
              console.error('Error creating admin role:', insertRoleErr);
              return res.status(500).json({ message: 'Failed to create admin role' });
            }
            adminRoleId = insertRoleResult.insertId;
            createAdminUser(adminRoleId);
          });
      } else {
        adminRoleId = roleResults[0].id;
        createAdminUser(adminRoleId);
      }
      
      function createAdminUser(roleId) {
        // Hash the password with bcrypt
        bcrypt.hash(adminPassword, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error('Password hashing error:', hashErr);
            return res.status(500).json({ message: 'Error creating account, please try again.' });
          }
          
          // Insert the new admin user
          const insertQuery = 'INSERT INTO users (name, email, password, role_id, type, status) VALUES (?, ?, ?, ?, ?, ?)';
          db.query(insertQuery, [adminName, adminEmail, hashedPassword, roleId, 'admin', 'active'], (insertErr, insertResult) => {
            if (insertErr) {
              console.error('Admin user creation error:', insertErr);
              return res.status(500).json({ message: 'Failed to create admin user' });
            }
            
            res.status(201).json({ 
              message: 'Admin user created successfully',
              user: {
                id: insertResult.insertId,
                name: adminName,
                email: adminEmail,
                role: 'admin',
                credentials: {
                  email: adminEmail,
                  password: adminPassword
                }
              }
            });
          });
        });
      }
    });
  });
});

// Get all users for admin dashboard (excluding admin users)
app.get('/api/admin/users', (req, res) => {
  // First, get the admin role_id
  db.query('SELECT id FROM user_roles WHERE name = "admin"', (roleErr, roleResults) => {
    if (roleErr) {
      console.error('Error fetching admin role ID:', roleErr);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
    
    const adminRoleId = roleResults.length > 0 ? roleResults[0].id : -1;
    
    // Now fetch users excluding those with admin role_id
    const query = `
      SELECT u.id, u.name, u.email, u.type, u.status, u.created_at, 
             r.name as role_name, r.id as role_id,
             (SELECT COUNT(*) FROM bookings WHERE provider_id = u.id) as total_bookings
      FROM users u
      JOIN user_roles r ON u.role_id = r.id
      WHERE u.role_id != ?
      ORDER BY u.created_at DESC
    `;
    
    db.query(query, [adminRoleId], (err, results) => {
      if (err) {
        console.error('Error fetching users for admin:', err);
        return res.status(500).json({ message: 'Failed to fetch users' });
      }
      
      // Remove sensitive information like passwords and format the data
      const safeResults = results.map(user => {
        const { password, ...safeUser } = user;
        
        // Format the role name for display
        let displayRole = 'Unknown';
        if (safeUser.role_name === 'seeker') {
          displayRole = 'User';
        } else if (safeUser.role_name === 'provider') {
          displayRole = 'Service Provider';
        }
        
        return {
          ...safeUser,
          displayRole: displayRole,
          actions: {
            canView: true,
            canEdit: true,
            canDelete: user.role_id !== adminRoleId
          }
        };
      });
      
      res.status(200).json(safeResults);
    });
  });
});

// Add endpoint for admin to get all bookings
app.get('/api/admin/bookings', (req, res) => {
  const query = `
    SELECT b.*, 
           s.name as service_name,
           u_provider.name as provider_name,
           u_seeker.name as seeker_name
    FROM bookings b
    LEFT JOIN services s ON b.service_id = s.id
    LEFT JOIN users u_provider ON b.provider_id = u_provider.id
    LEFT JOIN users u_seeker ON b.seeker_id = u_seeker.id
    ORDER BY b.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching bookings for admin:', err);
      return res.status(500).json({ 
        message: 'Failed to fetch bookings',
        error: err.message
      });
    }
    
    res.status(200).json(results);
  });
});

// Add a new endpoint to handle user actions
app.put('/api/admin/users/:id/status', (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;
  
  if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  
  const query = 'UPDATE users SET status = ? WHERE id = ?';
  db.query(query, [status, userId], (err, result) => {
    if (err) {
      console.error('Error updating user status:', err);
      return res.status(500).json({ message: 'Failed to update user status' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: `User status updated to ${status}` });
  });
});
// Add endpoint to delete a user
app.delete('/api/admin/users/:id', (req, res) => {
  const userId = req.params.id;
  
  // First check if user is an admin
  db.query('SELECT role_id FROM users WHERE id = ?', [userId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking user role:', checkErr);
      return res.status(500).json({ message: 'Failed to check user role' });
    }
    
    if (checkResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get admin role ID
    db.query('SELECT id FROM user_roles WHERE name = "admin"', (roleErr, roleResults) => {
      if (roleErr) {
        console.error('Error fetching admin role ID:', roleErr);
        return res.status(500).json({ message: 'Failed to check admin role' });
      }
      
      const adminRoleId = roleResults.length > 0 ? roleResults[0].id : -1;
      
      // Don't allow deleting admin users
      if (checkResults[0].role_id === adminRoleId) {
        return res.status(403).json({ message: 'Cannot delete admin users' });
      }
      
      // Delete the user
      db.query('DELETE FROM users WHERE id = ?', [userId], (deleteErr, deleteResult) => {
        if (deleteErr) {
          console.error('Error deleting user:', deleteErr);
          return res.status(500).json({ message: 'Failed to delete user' });
        }
        
        res.status(200).json({ message: 'User deleted successfully' });
      });
    });
  });
});

// Endpoint to get provider services
app.get('/api/provider-services', (req, res) => {
  try {
    // Get the service filter from query parameters
    const serviceId = req.query.serviceId;
    
    // Base query - include profile_pic from users table
    let query = `
      SELECT ps.id, ps.provider_id, ps.service_id, ps.hourly_rate, 
             ps.availability_status, ps.professional_bio, ps.created_at, ps.updated_at,
             u.name as provider_name, u.profile_pic, s.name as service_name
      FROM provider_services ps
      LEFT JOIN users u ON ps.provider_id = u.id
      LEFT JOIN services s ON ps.service_id = s.id
      WHERE ps.availability_status = 'available'
    `;
    
    // Add service filter if provided
    const queryParams = [];
    if (serviceId) {
      query += ` AND ps.service_id = ?`;
      queryParams.push(serviceId);
    }
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch provider services' });
      }
      
      res.json(results);
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch provider services' });
  }
});

// Check if a provider exists and has services before booking
app.get('/api/provider/:id/check-availability', (req, res) => {
  const providerId = req.params.id;
  
  // First check if the provider exists
  db.query('SELECT id, name, status FROM users WHERE id = ?', [providerId], (userErr, userResults) => {
    if (userErr) {
      console.error('Error checking provider existence:', userErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to check provider details',
        error: userErr.message
      });
    }
    
    if (userResults.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Provider not found',
        details: 'The requested provider does not exist in our system'
      });
    }
    
    const provider = userResults[0];
    
    // Check if provider is active
    if (provider.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Provider is not active',
        details: `Provider status is ${provider.status}`
      });
    }
    
    // Provider exists and is active - we'll skip the provider_services check
    // since we're using direct service booking
    res.status(200).json({
      success: true,
      message: 'Provider is available for booking',
      provider: {
        id: provider.id,
        name: provider.name
      }
    });
  });
});


// Update your bookings endpoint with better error handling
app.post('/api/bookings', (req, res) => {
  const { seeker_id, provider_id, service_id, date, start_time, end_time, total_cost, notes } = req.body;
  
  console.log('Booking request received:', req.body);
  
  if (!seeker_id || !provider_id || !service_id || !date || !start_time || !end_time || !total_cost) {
    console.error('Missing required booking information:', { 
      seeker_id, provider_id, service_id, date, start_time, end_time, total_cost 
    });
    return res.status(400).json({ 
      success: false,
      message: 'Missing required booking information' 
    });
  }
  
  // First verify that the provider offers this service
  const checkServiceQuery = `
    SELECT * FROM provider_services 
    WHERE provider_id = ? AND service_id = ?
  `;
  
  db.query(checkServiceQuery, [provider_id, service_id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking provider service:', checkErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify provider service',
        error: checkErr.message
      });
    }
    
    // If provider doesn't offer this service, return an error
    if (checkResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This provider does not offer the selected service'
      });
    }
    
    // Provider offers the service, proceed with booking
    const insertQuery = `
      INSERT INTO bookings (
        seeker_id, provider_id, service_id, date, 
        start_time, end_time, total_cost, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const queryParams = [
      seeker_id, 
      provider_id, 
      service_id, 
      date, 
      start_time, 
      end_time, 
      total_cost, 
      'pending', 
      notes || ''
    ];
    
    console.log('Executing query with params:', queryParams);
    
    db.query(insertQuery, queryParams, (insertErr, insertResult) => {
      if (insertErr) {
        console.error('Error creating booking:', insertErr);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to create booking',
          error: insertErr.message,
          sqlState: insertErr.sqlState,
          code: insertErr.code
        });
      }
      
      console.log('Booking created successfully:', insertResult.insertId);
      
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: {
          id: insertResult.insertId,
          seeker_id,
          provider_id,
          service_id,
          date,
          start_time,
          end_time,
          total_cost,
          status: 'pending',
          notes: notes || ''
        }
      });
    });
  });
});

// Get bookings for a user (both as seeker and provider)
app.get('/api/users/:userId/bookings', (req, res) => {
  const userId = req.params.userId;
  
  const query = `
    SELECT b.*, 
           s.name as service_name,
           u_provider.name as provider_name,
           u_seeker.name as seeker_name
    FROM bookings b
    LEFT JOIN services s ON b.service_id = s.id
    LEFT JOIN users u_provider ON b.provider_id = u_provider.id
    LEFT JOIN users u_seeker ON b.seeker_id = u_seeker.id
    WHERE b.seeker_id = ? OR b.provider_id = ?
    ORDER BY b.date DESC, b.start_time ASC
  `;
  
  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch bookings',
        error: err.message
      });
    }
    
    // Add a field to indicate if the user is the provider or seeker for this booking
    const bookingsWithRole = results.map(booking => ({
      ...booking,
      userRole: booking.seeker_id == userId ? 'seeker' : 'provider'
    }));
    
    res.status(200).json({
      success: true,
      bookings: bookingsWithRole
    });
  });
});

// Add this near the beginning of your server.js file with other table creations
db.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seeker_id INT NOT NULL,
    provider_id INT NOT NULL,
    service_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'canceled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating bookings table:', err);
  } else {
    console.log('Bookings table ready');
  }
});
// Get bookings for a provider
app.get('/api/provider/:providerId/bookings', (req, res) => {
  const providerId = req.params.providerId;
  
  const query = `
    SELECT b.*, 
           s.name as service_name,
           u.name as seeker_name
    FROM bookings b
    LEFT JOIN services s ON b.service_id = s.id
    LEFT JOIN users u ON b.seeker_id = u.id
    WHERE b.provider_id = ?
    ORDER BY b.date DESC, b.start_time ASC
  `;
  
  db.query(query, [providerId], (err, results) => {
    if (err) {
      console.error('Error fetching provider bookings:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch bookings',
        error: err.message
      });
    }
    
    res.status(200).json(results);
  });
});

// Update booking status
app.put('/api/bookings/:bookingId/status', (req, res) => {
  const bookingId = req.params.bookingId;
  const { status } = req.body;
  
  if (!status || !['pending', 'confirmed', 'completed', 'canceled'].includes(status)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid status value' 
    });
  }
  
  const query = 'UPDATE bookings SET status = ? WHERE id = ?';
  
  db.query(query, [status, bookingId], (err, result) => {
    if (err) {
      console.error('Error updating booking status:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update booking status',
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: `Booking status updated to ${status}` 
    });
  });
});

// Modify your existing /api/services endpoint to support filtering by name
app.get('/api/services', (req, res) => {
  try {
    const { name } = req.query;
    
    let query = 'SELECT * FROM services';
    const queryParams = [];
    
    if (name) {
      query += ' WHERE name = ?';
      queryParams.push(name);
    }
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching services:', err);
        return res.status(500).json({ message: 'Failed to fetch services' });
      }
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error in services endpoint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Add this endpoint to get provider ratings
app.get('/api/provider/:providerId/ratings', (req, res) => {
  const providerId = req.params.providerId;
  
  const query = `
    SELECT AVG(r.rating) as averageRating
    FROM reviews r
    WHERE r.reviewee_id = ?
  `;
  
  db.query(query, [providerId], (err, results) => {
    if (err) {
      console.error('Error fetching provider ratings:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch ratings',
        error: err.message
      });
    }
    
    const averageRating = results[0].averageRating || 0;
    
    res.status(200).json({
      averageRating: parseFloat(averageRating)
    });
  });
});

// Add this endpoint to get provider services
app.get('/api/provider/:providerId/services', (req, res) => {
  const providerId = req.params.providerId;
  
  const query = `
    SELECT ps.*, s.name as service_name, s.category
    FROM provider_services ps
    JOIN services s ON ps.service_id = s.id
    WHERE ps.provider_id = ?
  `;
  
  db.query(query, [providerId], (err, results) => {
    if (err) {
      console.error('Error fetching provider services:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch services',
        error: err.message
      });
    }
    
    res.status(200).json(results);
  });
});
app.put('/api/provider/:id/profile', (req, res) => {
  const providerId = req.params.id;
  const { name, email, phone, address, hourly_rate, professional_bio } = req.body;
  
  console.log('Provider profile update request received:', { 
    providerId, 
    updateData: { name, email, phone, address, hourly_rate, professional_bio } 
  });
  
  // Validate required fields
  if (!providerId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Provider ID is required' 
    });
  }
  
  // First update the user table with basic info
  const updateUserQuery = `
    UPDATE users 
    SET name = ?, 
        email = ?, 
        phone = ?, 
        address = ?,
        updated_at = NOW()
    WHERE id = ?
  `;
  
  db.query(
    updateUserQuery, 
    [name, email, phone, address, providerId], 
    (userErr, userResult) => {
      if (userErr) {
        console.error('Error updating provider basic info:', userErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update provider profile',
          error: userErr.message
        });
      }
      
      // Check if we need to update provider-specific info
      if (hourly_rate !== undefined || professional_bio !== undefined) {
        // Check if provider has any services
        db.query(
          'SELECT * FROM provider_services WHERE provider_id = ?', 
          [providerId], 
          (checkErr, checkResults) => {
            if (checkErr) {
              console.error('Error checking provider services:', checkErr);
              // Still return success for user update
              return res.status(200).json({
                success: true,
                message: 'Basic profile updated, but failed to update provider details',
                user: { id: providerId, name, email, phone, address }
              });
            }
            
            // If provider has services, update hourly_rate for all services
            if (checkResults.length > 0 && hourly_rate !== undefined) {
              db.query(
                'UPDATE provider_services SET hourly_rate = ? WHERE provider_id = ?',
                [hourly_rate, providerId],
                (rateErr) => {
                  if (rateErr) {
                    console.error('Error updating provider hourly rate:', rateErr);
                  }
                }
              );
            }
            
            // Also update the bio in the users table
            if (professional_bio !== undefined) {
              db.query(
                'UPDATE users SET bio = ? WHERE id = ?',
                [professional_bio, providerId],
                (bioErr) => {
                  if (bioErr) {
                    console.error('Error updating provider bio:', bioErr);
                  }
                }
              );
            }
            
            // Return success response
            res.status(200).json({
              success: true,
              message: 'Provider profile updated successfully',
              user: {
                id: providerId,
                name,
                email,
                phone,
                address,
                hourly_rate,
                professional_bio
              }
            });
          }
        );
      } else {
        // If no provider-specific info to update, return success
        res.status(200).json({
          success: true,
          message: 'Provider profile updated successfully',
          user: {
            id: providerId,
            name,
            email,
            phone,
            address
          }
        });
      }
    }
  );
});
app.get('/api/provider/:id/profile', (req, res) => {
  const providerId = req.params.id;
  
  // Get basic user info
  const userQuery = `
    SELECT u.id, u.name, u.email, u.phone, u.address, u.bio, u.profile_pic, u.status
    FROM users u
    WHERE u.id = ?
  `;
  
  db.query(userQuery, [providerId], (userErr, userResults) => {
    if (userErr) {
      console.error('Error fetching provider profile:', userErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch provider profile',
        error: userErr.message
      });
    }
    
    if (userResults.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Provider not found' 
      });
    }
    
    const provider = userResults[0];
    
    // Get provider services to find hourly rate
    const servicesQuery = `
      SELECT hourly_rate
      FROM provider_services
      WHERE provider_id = ?
      LIMIT 1
    `;
    
    db.query(servicesQuery, [providerId], (servicesErr, servicesResults) => {
      if (servicesErr) {
        console.error('Error fetching provider services:', servicesErr);
        // Still return basic profile
        return res.status(200).json({
          success: true,
          provider: {
            ...provider,
            professional_bio: provider.bio,
            hourly_rate: null
          }
        });
      }
      
      // Add hourly rate if available
      const hourly_rate = servicesResults.length > 0 ? servicesResults[0].hourly_rate : null;
      
      res.status(200).json({
        success: true,
        provider: {
          ...provider,
          professional_bio: provider.bio,
          hourly_rate: hourly_rate
        }
      });
    });
  });
});
// Add this endpoint to get providers by service
app.get('/api/providers/by-service/:serviceId', (req, res) => {
  const serviceId = req.params.serviceId;
  
  // Validate service ID
  if (!serviceId) {
    return res.status(400).json({
      success: false,
      message: 'Service ID is required'
    });
  }
  
  const query = `
    SELECT 
      ps.id as provider_service_id,
      ps.provider_id,
      ps.service_id,
      ps.hourly_rate,
      ps.availability_status,
      ps.professional_bio,
      u.id as user_id,
      u.name as provider_name,
      u.email,
      u.phone,
      u.address,
      u.profile_pic,
      u.bio,
      s.name as service_name,
      s.description as service_description,
      s.image_path as service_image,
      (SELECT AVG(r.rating) FROM reviews r WHERE r.reviewee_id = u.id) as average_rating,
      (SELECT COUNT(r.id) FROM reviews r WHERE r.reviewee_id = u.id) as review_count
    FROM provider_services ps
    JOIN users u ON ps.provider_id = u.id
    JOIN services s ON ps.service_id = s.id
    WHERE ps.service_id = ? AND u.status = 'active'
    ORDER BY average_rating DESC, review_count DESC
  `;
  
  db.query(query, [serviceId], (err, results) => {
    if (err) {
      console.error('Error fetching providers by service:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch providers',
        error: err.message
      });
    }
    
    // Format the results
    const providers = results.map(provider => ({
      id: provider.provider_service_id,
      providerId: provider.provider_id,
      serviceId: provider.service_id,
      name: provider.provider_name,
      email: provider.email,
      phone: provider.phone,
      location: provider.address,
      hourlyRate: provider.hourly_rate,
      rating: provider.average_rating || 0,
      reviewCount: provider.review_count || 0,
      bio: provider.professional_bio || provider.bio || '',
      profilePic: provider.profile_pic,
      serviceName: provider.service_name,
      serviceDescription: provider.service_description,
      serviceImage: provider.service_image,
      availabilityStatus: provider.availability_status
    }));
    
    res.status(200).json({
      success: true,
      providers: providers
    });
  });
});
// Add this endpoint to update provider availability
app.put('/api/provider-services/:id/availability', (req, res) => {
  const serviceId = req.params.id;
  const { status } = req.body;
  
  if (!status || !['available', 'unavailable'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid availability status'
    });
  }
  
  const query = 'UPDATE provider_services SET availability_status = ? WHERE id = ?';
  
  db.query(query, [status, serviceId], (err, result) => {
    if (err) {
      console.error('Error updating provider availability:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update availability',
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Provider service not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Availability updated to ${status}`
    });
  });
});
// Get all bookings for a user
app.get('/api/bookings/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // Query to get bookings where the user is either the client or the provider
  const query = `
    SELECT 
      b.id,
      b.service_id,
      b.provider_id,
      b.client_id,
      b.booking_date,
      b.time_slot,
      b.status,
      b.total_amount,
      b.notes,
      b.created_at,
      s.name as service_name,
      p.name as provider_name,
      c.name as client_name
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN users p ON b.provider_id = p.id
    JOIN users c ON b.client_id = c.id
    WHERE b.client_id = ? OR b.provider_id = ?
    ORDER BY b.booking_date DESC, b.created_at DESC
  `;
  
  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings',
        error: err.message
      });
    }
    
    res.status(200).json({
      success: true,
      bookings: results
    });
  });
});

// Get a specific booking by ID
app.get('/api/bookings/:bookingId', (req, res) => {
  const bookingId = req.params.bookingId;
  
  const query = `
    SELECT 
      b.id,
      b.service_id,
      b.provider_id,
      b.client_id,
      b.booking_date,
      b.time_slot,
      b.status,
      b.total_amount,
      b.notes,
      b.created_at,
      s.name as service_name,
      p.name as provider_name,
      c.name as client_name,
      ps.hourly_rate
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN users p ON b.provider_id = p.id
    JOIN users c ON b.client_id = c.id
    LEFT JOIN provider_services ps ON (b.provider_id = ps.provider_id AND b.service_id = ps.service_id)
    WHERE b.id = ?
  `;
  
  db.query(query, [bookingId], (err, results) => {
    if (err) {
      console.error('Error fetching booking details:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch booking details',
        error: err.message
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      booking: results[0]
    });
  });
});

// Cancel a booking
app.put('/api/bookings/:bookingId/cancel', (req, res) => {
  const bookingId = req.params.bookingId;
  
  const query = 'UPDATE bookings SET status = "Cancelled", updated_at = NOW() WHERE id = ?';
  
  db.query(query, [bookingId], (err, result) => {
    if (err) {
      console.error('Error cancelling booking:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel booking',
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  });
});

// Get all bookings for a user
app.get('/api/bookings/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // Query to match your database schema
  const query = `
    SELECT 
      b.*,
      s.name as service_name
    FROM bookings b
    LEFT JOIN services s ON b.service_id = s.id
    WHERE b.seeker_id = ? OR b.provider_id = ?
    ORDER BY b.date DESC, b.created_at DESC
  `;
  
  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings',
        error: err.message
      });
    }
    
    res.status(200).json({
      success: true,
      bookings: results
    });
  });
});

// Cancel a booking
app.put('/api/bookings/:bookingId/cancel', (req, res) => {
  const bookingId = req.params.bookingId;
  
  const query = 'UPDATE bookings SET status = "canceled", updated_at = NOW() WHERE id = ?';
  
  db.query(query, [bookingId], (err, result) => {
    if (err) {
      console.error('Error cancelling booking:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel booking',
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  });
});