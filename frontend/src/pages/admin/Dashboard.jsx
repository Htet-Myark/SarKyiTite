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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        navItems={NAV}
        activeTab={tab}
        onTabChange={setTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <span className="mobile-title">Sar Kyi Tite</span>
        </div>
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
