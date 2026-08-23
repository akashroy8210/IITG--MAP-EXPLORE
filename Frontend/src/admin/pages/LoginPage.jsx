import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import NeoButton from '../components/NeoButton';
import NeoInput from '../components/NeoInput';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  // If already authenticated, redirect to dashboard or intended page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const data = await login(email.trim(), password);
      if (data && data.token) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Login failed. Make sure backend and MongoDB are running.';
      setError(msg);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--neo-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="neo-card"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: 36,
          background: 'var(--neo-white)',
          boxShadow: 'var(--neo-shadow-lg)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span className="brand-badge" style={{ fontSize: 12, padding: '4px 10px', marginBottom: 8 }}>
            PATHFINDER OS
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 28,
              fontWeight: 900,
              margin: '6px 0',
              textTransform: 'uppercase',
              letterSpacing: '-0.5px',
            }}
          >
            ADMIN / DEVOPS LOGIN
          </h1>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: 0 }}>
            Enter your credentials to manage students & question maps
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--neo-pink)',
              color: 'var(--neo-white)',
              border: 'var(--neo-border-sm)',
              boxShadow: 'var(--neo-shadow-sm)',
              fontWeight: 800,
              fontSize: 13,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <NeoInput
            label="EMAIL ADDRESS"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@iitg.ac.in"
            required
            autoComplete="email"
          />

          <div style={{ position: 'relative' }}>
            <NeoInput
              label="PASSWORD"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: 36,
                background: 'var(--neo-yellow)',
                border: '2px solid var(--neo-black)',
                fontWeight: 800,
                fontSize: 11,
                padding: '3px 8px',
                cursor: 'pointer',
              }}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>

          <NeoButton
            type="submit"
            variant="purple"
            disabled={loading}
            style={{ width: '100%', marginTop: 12, padding: 14 }}
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER ADMIN PANEL →'}
          </NeoButton>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px solid var(--neo-black)', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--neo-gray)' }}>
            STUDENT LOGIN HAS MOVED TO <a href="/login" style={{ color: 'var(--neo-purple)', fontWeight: 800 }}>/login</a>
          </span>
        </div>
      </div>
    </div>
  );
}
