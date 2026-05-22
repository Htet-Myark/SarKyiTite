require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');
const BorrowRecord = require('./models/BorrowRecord');
const Book = require('./models/Book');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find all records without a snapshot
  const records = await BorrowRecord.find({
    $or: [
      { 'bookSnapshot.title': { $exists: false } },
      { 'bookSnapshot.title': '' }
    ]
  });

  console.log(`Found ${records.length} borrow records missing a snapshot`);

  let fixed = 0;
  let lost = 0;

  for (const record of records) {
    // Look up the book — include soft-deleted ones
    const book = await Book.findById(record.book);
    if (book) {
      record.bookSnapshot = { title: book.title, author: book.author };
      await record.save();
      fixed++;
    } else {
      lost++;
      console.log(`  ⚠ Record ${record._id} — book no longer exists in DB`);
    }
  }

  console.log(`\nMigration complete: ${fixed} fixed, ${lost} unrecoverable (book was hard-deleted)`);
  await mongoose.disconnect();
}

migrate().catch(err => { console.error(err); process.exit(1); });
