const cron = require('node-cron');
const BorrowRecord = require('../models/BorrowRecord');
const User = require('../models/User');
const { sendAutoWarningEmail } = require('../utils/email');

const WARNING_DAYS = 7;

async function checkAndWarn() {
  try {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - WARNING_DAYS);

    const records = await BorrowRecord.find({
      status: { $in: ['borrowed', 'overdue'] },
      autoWarningSent: false,
      borrowDate: { $lte: threshold }
    }).populate('book', 'title').populate('user', 'username email');

    for (const record of records) {
      const daysBorrowed = Math.floor((new Date() - record.borrowDate) / (1000 * 60 * 60 * 24));
      const message = `Reminder: You have had "${record.book.title}" for ${daysBorrowed} days. Please return it before your 14-day due date to avoid penalties.`;

      await User.findByIdAndUpdate(record.user._id, {
        $push: { warnings: { message } }
      });

      try {
        await sendAutoWarningEmail(record.user.email, record.user.username, record.book.title, daysBorrowed);
      } catch (emailErr) {
        console.error('Auto-warning email failed:', emailErr.message);
      }

      record.autoWarningSent = true;
      await record.save();

      console.log(`Auto-warning sent to ${record.user.username} for "${record.book.title}"`);
    }

    if (records.length > 0) {
      console.log(`Auto-warning job: sent ${records.length} warning(s)`);
    }
  } catch (err) {
    console.error('Auto-warning job error:', err.message);
  }
}

function startAutoWarningJob() {
  // Runs every day at 9:00 AM
  cron.schedule('0 9 * * *', checkAndWarn);
  console.log('Auto-warning job scheduled (daily at 9am)');
}

module.exports = { startAutoWarningJob, checkAndWarn };
