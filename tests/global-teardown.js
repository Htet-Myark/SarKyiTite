/**
 * Runs once after all Playwright tests finish.
 * Deletes every user whose username starts with "testpw_" from the test database.
 *
 * Requires the backend to be running with a TEST MongoDB URI, e.g.:
 *   MONGODB_URI=mongodb://localhost:27017/library_test npm run dev
 *
 * Set TEST_MONGODB_URI in tests/.env to point at that same database.
 */

require('dotenv').config({ path: `${__dirname}/.env` });
const dns = require('dns');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const TEST_PREFIX = 'testpw_';

module.exports = async function globalTeardown() {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    console.warn('[teardown] TEST_MONGODB_URI not set — skipping DB cleanup.');
    return;
  }

  await mongoose.connect(uri);

  const User = mongoose.model(
    'User',
    new mongoose.Schema({ username: String }, { strict: false })
  );

  const result = await User.deleteMany({
    email: { $regex: '@test\\.com$' },
  });

  console.log(`[teardown] Deleted ${result.deletedCount} test user(s) from DB.`);
  await mongoose.disconnect();
};
