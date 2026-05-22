import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import AdminOverview from './Overview';
import ManageUsers from './ManageUsers';
import AddBook from './AddBook';
import BrowseBooks from './BrowseBooks';
import AllBorrows from './AllBorrows';
import AdminBookRequests from './BookRequests';

const NAV = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users', label: 'Manage Users', icon: '👥' },
  { id: 'browse', label: 'Browse Books', icon: '📚' },
  { id: 'addbook', label: 'Add Book', icon: '➕' },
  { id: 'borrows', label: 'All Borrows', icon: '📋' },
  { id: 'requests', label: 'Book Requests', icon: '📬' }
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="layout">
      <Sidebar navItems={NAV} activeTab={tab} onTabChange={setTab} />
      <main className="main-content">
        {tab === 'overview' && <AdminOverview setTab={setTab} />}
        {tab === 'users' && <ManageUsers />}
        {tab === 'browse' && <BrowseBooks />}
        {tab === 'addbook' && <AddBook />}
        {tab === 'borrows' && <AllBorrows />}
        {tab === 'requests' && <AdminBookRequests />}
      </main>
    </div>
  );
}
