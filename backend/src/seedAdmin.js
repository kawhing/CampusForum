const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@campus.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      const allowBlockedSyncEnv = process.env.ALLOW_ADMIN_SYNC_WHEN_BLOCKED;
      const allowBlockedSync = allowBlockedSyncEnv !== undefined
        ? allowBlockedSyncEnv.toLowerCase() === 'true'
        : false;
      if (existing.isBlocked) {
        if (!allowBlockedSync) {
          console.warn(
            `Admin account is currently blocked (reason: ${existing.blockReason || 'unspecified'}). ` +
            'Credentials were not synced. Please review and unblock manually or set ALLOW_ADMIN_SYNC_WHEN_BLOCKED=true for emergency recovery.'
          );
          return;
        }
        console.warn('Admin account is blocked; proceeding with credential sync because ALLOW_ADMIN_SYNC_WHEN_BLOCKED=true.');
      }

      let isPasswordMatch;
      try {
        isPasswordMatch = await existing.comparePassword(adminPassword);
      } catch (err) {
        console.error(
          'Failed to verify admin password during startup sync. Please check database integrity and the comparePassword implementation.',
          err
        );
        return;
      }

      const shouldUpdateEmail = existing.email !== adminEmail;
      const shouldUpdateUsername = existing.username !== adminUsername;
      const allowPasswordSyncEnv = process.env.ALLOW_ADMIN_PASSWORD_SYNC;
      const allowPasswordSync = allowPasswordSyncEnv === undefined
        ? true
        : allowPasswordSyncEnv.toLowerCase() === 'true';
      const shouldUpdatePassword = allowPasswordSync && !isPasswordMatch;
      const updatedFields = [];

      if (shouldUpdateEmail) {
        existing.email = adminEmail;
        updatedFields.push('email');
      }

      if (shouldUpdateUsername) {
        existing.username = adminUsername;
        updatedFields.push('username');
      }

      if (shouldUpdatePassword) {
        existing.password = adminPassword; // hashed by UserSchema pre-save hook (see backend/src/models/User.js)
        updatedFields.push('password');
        console.warn(
          `[${new Date().toISOString()}] Admin password was reset to match the environment configuration during startup sync.`
        );
      } else if (!isPasswordMatch && !allowPasswordSync) {
        console.warn(
          'Admin password differs from environment configuration but ALLOW_ADMIN_PASSWORD_SYNC is disabled; password was not changed.'
        );
      }

      if (updatedFields.length > 0) {
        await existing.save();
        console.log(`Admin account synced with environment configuration. Updated fields: ${updatedFields.join(', ')}.`);
      } else {
        console.log('Admin account already up to date, skipping seed.');
      }
      return;
    }

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
