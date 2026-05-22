import { useState, useEffect } from 'react';
import api from '../../api';

export default function AdminOverview({ setTab }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data));
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of the library system</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📚</div>
          <div className="stat-info">
            <div className="value">{stats?.totalBooks ?? '—'}</div>
            <div className="label">Total Books</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">👥</div>
          <div className="stat-info">
            <div className="value">{stats?.totalUsers ?? '—'}</div>
            <div className="label">Registered Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">📖</div>
          <div className="stat-info">
            <div className="value">{stats?.activeBorrows ?? '—'}</div>
            <div className="label">Active Borrows</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⚠️</div>
          <div className="stat-info">
            <div className="value">{stats?.overdueCount ?? '—'}</div>
            <div className="label">Overdue Books</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => setTab('users')}>
          <div className="card-body" style={{ textAlign: 'center', padding: '28px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>👥</div>
            <h3 style={{ fontSize: '16px', color: 'var(--gray-800)', marginBottom: '6px' }}>Manage Users</h3>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>View users, send warnings</p>
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => setTab('browse')}>
          <div className="card-body" style={{ textAlign: 'center', padding: '28px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📚</div>
            <h3 style={{ fontSize: '16px', color: 'var(--gray-800)', marginBottom: '6px' }}>Browse Books</h3>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>View all books in the library</p>
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => setTab('borrows')}>
          <div className="card-body" style={{ textAlign: 'center', padding: '28px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
            <h3 style={{ fontSize: '16px', color: 'var(--gray-800)', marginBottom: '6px' }}>All Borrows</h3>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>View all borrow records</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '28px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ fontSize: '16px', color: 'var(--gray-800)', marginBottom: '6px' }}>Overdue Items</h3>
            <p style={{ fontSize: '13px', color: 'var(--danger)' }}>{stats?.overdueCount ?? 0} overdue borrows</p>
          </div>
        </div>
      </div>
    </>
  );
}
