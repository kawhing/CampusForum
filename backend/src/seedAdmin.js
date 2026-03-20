const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log('Admin account already exists, skipping seed.');
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@campus.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      username: adminUsername,
      role: 'admin',
    });
    await admin.save();
    console.log(`Admin account created — email: ${adminEmail}`);
  } catch (err) {
    console.error('Failed to seed admin account:', err.message, err.stack);
  }
};

module.exports = seedAdmin;
