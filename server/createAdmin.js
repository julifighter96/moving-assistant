const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'recognition.db'));

async function createAdminUser() {
  const adminUser = {
    username: 'admin',
    password: 'admin123', // Dies ist das initiale Passwort
    email: 'admin@riedlin.de',
    role: 'admin'
  };

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);

    // Insert admin user
    db.run(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [adminUser.username, hashedPassword, adminUser.email, adminUser.role],
      function(err) {
        if (err) {
          console.error('Error creating admin user:', err);
          process.exit(1);
        }
    
        process.exit(0);
      }
    );
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdminUser(); 