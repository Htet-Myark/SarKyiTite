require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');
const User = require('./models/User');
const Book = require('./models/Book');

const books = [
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', totalCopies: 5, availableCopies: 5, publishedYear: 1925, description: 'A story of the fabulously wealthy Jay Gatsby and his love for Daisy Buchanan.' },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', totalCopies: 4, availableCopies: 4, publishedYear: 1960, description: 'A gripping tale of race and injustice in the American South.' },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', totalCopies: 3, availableCopies: 3, publishedYear: 1988, description: 'Explores cosmology and the nature of the universe in accessible terms.' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', totalCopies: 4, availableCopies: 4, publishedYear: 2011, description: 'A brief history of humankind from the Stone Age to the present.' },
  { title: 'Clean Code', author: 'Robert C. Martin', category: 'Technology', totalCopies: 3, availableCopies: 3, publishedYear: 2008, description: 'A handbook of agile software craftsmanship.' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'Technology', totalCopies: 2, availableCopies: 2, publishedYear: 1999, description: 'Essential wisdom for software developers.' },
  { title: 'Steve Jobs', author: 'Walter Isaacson', category: 'Biography', totalCopies: 3, availableCopies: 3, publishedYear: 2011, description: 'The authorized biography of Apple co-founder Steve Jobs.' },
  { title: 'Meditations', author: 'Marcus Aurelius', category: 'Philosophy', totalCopies: 4, availableCopies: 4, publishedYear: 180, description: 'Reflections and writings of the Roman Emperor Marcus Aurelius.' },
  { title: 'The Selfish Gene', author: 'Richard Dawkins', category: 'Science', totalCopies: 2, availableCopies: 2, publishedYear: 1976, description: 'A landmark work in evolutionary biology.' },
  { title: '1984', author: 'George Orwell', category: 'Fiction', totalCopies: 5, availableCopies: 5, publishedYear: 1949, description: 'A dystopian vision of a totalitarian future society.' },
  { title: 'The Art of War', author: 'Sun Tzu', category: 'Philosophy', totalCopies: 3, availableCopies: 3, publishedYear: -500, description: 'Ancient Chinese military treatise on strategy and tactics.' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Science', totalCopies: 3, availableCopies: 3, publishedYear: 2011, description: 'Explores the two systems that drive the way we think.' }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Book.deleteMany({});
  await User.deleteMany({});

  await Book.insertMany(books);
  console.log(`Inserted ${books.length} books`);

  await User.create({ username: 'admin', email: 'admin@library.com', password: 'admin123', role: 'admin' });
  await User.create({ username: 'john', email: 'john@example.com', password: 'user123', role: 'user' });
  await User.create({ username: 'jane', email: 'jane@example.com', password: 'user123', role: 'user' });
  console.log('Created users: admin / admin123, john / user123, jane / user123');

  await mongoose.disconnect();
  console.log('Seed complete!');
}

seed().catch(err => { console.error(err); process.exit(1); });
