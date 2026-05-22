import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import BrowseBooks from './BrowseBooks';
import MyBooks from './MyBooks';
import Bookmarks from './Bookmarks';
import Warnings from './Warnings';
import BookRequests from './BookRequests';
import api from '../../api';

const NAV = [
  { id: 'browse', label: 'Browse Books', icon: '🔍' },
  { id: 'mybooks', label: 'My Borrowed Books', icon: '📖' },
  { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
  { id: 'warnings', label: 'Warnings', icon: '⚠️' },
  { id: 'requests', label: 'Book Requests', icon: '📬' }
];

export default function UserDashboard() {
  const [tab, setTab] = useState('browse');
  const [unreadWarnings, setUnreadWarnings] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(res => setUnreadWarnings(res.data.unreadWarnings || 0));
  }, []);

  const handleTabChange = (id) => {
    setTab(id);
    if (id === 'warnings') setUnreadWarnings(0);
  };

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        navItems={NAV}
        activeTab={tab}
        onTabChange={handleTabChange}
        unreadWarnings={unreadWarnings}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <span className="mobile-title">Sar Kyi Tite</span>
        </div>
        {tab === 'browse' && <BrowseBooks />}
        {tab === 'mybooks' && <MyBooks />}
        {tab === 'bookmarks' && <Bookmarks />}
        {tab === 'warnings' && <Warnings />}
        {tab === 'requests' && <BookRequests />}
      </main>
    </div>
  );
}
