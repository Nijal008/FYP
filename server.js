const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'service rental'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Signup 
app.post('/api/signup', (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  
  const query = 'INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?)';
  db.query(query, [firstName + ' ' + lastName, email, password, 'seeker'], (err, result) => {
    if (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ message: 'Something went wrong, please try again.' });
    }
    res.status(201).json({ message: 'Account created successfully!' });
  });
});

// Login 
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Something went wrong, please try again.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful!', user });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
