const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const email = process.env.ADMIN_EMAIL || 'bijnoorwellness@gmail.com';
const phone = process.env.ADMIN_PHONE || '9999999999';
const password = process.env.ADMIN_PASSWORD || 'mastermonkeys007';

if (!uri) {
  console.error('MONGODB_URI not found in environment or .env.local');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const passwordHash = await bcrypt.hash(password, 10);
    const users = mongoose.connection.collection('users');
    const now = new Date();
    const res = await users.updateOne(
      { email },
      {
        $set: {
          email,
          phone,
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          isActive: true,
          emailVerified: true,
          updatedAt: now,
          createdAt: now,
        },
      },
      { upsert: true }
    );
    console.log('Upserted admin user:', email);
    console.log(res.result || res);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(2);
  }
})();
