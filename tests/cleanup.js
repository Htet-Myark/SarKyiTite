/**
 * Run anytime to wipe all test users from the database:
 *   node tests/cleanup.js
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

require('dotenv').config({ path: `${__dirname}/../backend/.env` });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.connection.collection('users');

  const testUsers = await User.find({ email: { $regex: '@test\\.com$' } }).toArray();

  if (testUsers.length === 0) {
    console.log('No test users found.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${testUsers.length} test user(s):`);
  testUsers.forEach(u => console.log(`  - ${u.username} | ${u.email}`));

  const result = await User.deleteMany({ email: { $regex: '@test\\.com$' } });
  console.log(`\nDeleted: ${result.deletedCount} user(s).`);

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
