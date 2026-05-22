import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const TIMEOUT_MINUTES = 30;
const WARNING_MINUTES = 2;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;
const WARNING_MS = WARNING_MINUTES * 60 * 1000;

export default function SessionTimeout() {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_MINUTES * 60);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const countdownRef = useRef(null);

  const clearAllTimers = () => {
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);
    clearInterval(countdownRef.current);
  };

  const doLogout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    logout();
  }, [logout]);

  const resetTimer = useCallback(() => {
    if (!user) return;
    clearAllTimers();
    setShowWarning(false);

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(WARNING_MINUTES * 60);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, TIMEOUT_MS - WARNING_MS);

    timeoutRef.current = setTimeout(doLogout, TIMEOUT_MS);
  }, [user, doLogout]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearAllTimers();
    };
  }, [user, resetTimer]);

  const handleStayLoggedIn = () => {
    resetTimer();
  };

  if (!user || !showWarning) return null;

  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏱️</div>
        <h3 style={{ marginBottom: '8px' }}>Session Expiring Soon</h3>
        <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '20px' }}>
          You've been inactive. You'll be logged out automatically in:
        </p>
        <div style={{
          fontSize: '40px', fontWeight: '700', color: countdown <= 30 ? 'var(--danger)' : 'var(--warning)',
          marginBottom: '24px', fontVariantNumeric: 'tabular-nums'
        }}>
          {mins}:{secs}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={doLogout}>
            Log Out Now
          </button>
          <button className="btn btn-primary" onClick={handleStayLoggedIn}>
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
