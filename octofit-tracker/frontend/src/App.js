import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import OctoFitLogo from './components/OctoFitLogo';
import Users from './components/Users';
import Teams from './components/Teams';
import Activities from './components/Activities';
import Workouts from './components/Workouts';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { getApiBaseUrl, getAuthToken, setAuthToken, setCurrentUser, getCurrentUser, fetchWithAuth } from './api';
import { ToastProvider } from './components/ToastProvider';
import ConfirmModal from './components/ConfirmModal';

function Home() {
  return <Dashboard />;
}

function AuthPanel({ onAuthenticated, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/auth/login/' : '/auth/register/';
    const payload = mode === 'login'
      ? { username, password }
      : { username, password, email };

    try {
      const response = await fetchWithAuth(`${getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed.');
      }

      setAuthToken(data.token);
      setCurrentUser(data.user);
      onAuthenticated();
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left: Branding Panel */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <div className="auth-branding-icon mb-3">
              <OctoFitLogo size={64} />
            </div>
            <h2 className="fw-bold text-white mb-2">OctoFit Tracker</h2>
            <p className="text-white-50 mb-4">Your fitness journey starts here. Track activities, compete with teams, and climb the leaderboard.</p>
            <div className="d-flex flex-column gap-2">
              {[
                { icon: 'bi-lightning-charge-fill', text: 'Log activities & calories' },
                { icon: 'bi-people-fill', text: 'Join & compete in teams' },
                { icon: 'bi-trophy-fill', text: 'Real-time leaderboards' },
                { icon: 'bi-graph-up-arrow', text: 'Personal dashboard' },
              ].map((f, i) => (
                <div key={i} className="d-flex align-items-center gap-2 text-white-50">
                  <i className={`bi ${f.icon} text-white`}></i>
                  <small>{f.text}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="text-center mb-4">
              <h3 className="fw-bold mb-1">{mode === 'login' ? 'Welcome back' : 'Create account'}</h3>
              <p className="text-muted small">{mode === 'login' ? 'Sign in to continue to OctoFit' : 'Fill in the details to get started'}</p>
            </div>

            {error && (
              <div className="alert alert-danger py-2 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-circle-fill"></i>
                <span className="small">{error}</span>
              </div>
            )}

            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="username">
                  <i className="bi bi-person me-1"></i>Username
                </label>
                <input
                  id="username"
                  className="form-control auth-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {mode === 'register' && (
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="email">
                    <i className="bi bi-envelope me-1"></i>Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control auth-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="form-label small fw-semibold" htmlFor="password">
                  <i className="bi bi-lock me-1"></i>Password
                </label>
                <div className="input-group">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control auth-input border-end-0"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0 auth-input"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 fw-bold auth-submit-btn" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Please wait...</>
                ) : mode === 'login' ? (
                  <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
                ) : (
                  <><i className="bi bi-person-plus-fill me-2"></i>Create Account</>
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="text-muted small">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </span>
              <button
                type="button"
                className="btn btn-link btn-sm fw-semibold p-0 ms-1"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authVersion, setAuthVersion] = useState(0);
  const [authMode, setAuthMode] = useState('login');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isAuthenticated = Boolean(getAuthToken());
  const currentUser = getCurrentUser();
  const isAdmin = Boolean(currentUser && currentUser.is_staff);

  const isActive = (path) => location.pathname === path;

  // Close navbar collapse on mobile when a link is clicked
  const closeNavbar = () => {
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      navbarCollapse.classList.remove('show');
    }
  };

  const handleLogout = async () => {
    try {
      await fetchWithAuth(`${getApiBaseUrl()}/auth/logout/`, { method: 'POST' });
    } catch (error) {
      // Ignore network errors and clear local token anyway for demo usability.
    } finally {
      setAuthToken(null);
      setCurrentUser(null);
      navigate('/');
      setAuthVersion((v) => v + 1);
    }
  };

  return (
    <div className="App" key={authVersion}>
      <ConfirmModal
        show={showLogoutConfirm}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas cerrar sesión?"
        confirmText="Cerrar sesión"
        confirmColor="danger"
        onConfirm={() => { setShowLogoutConfirm(false); handleLogout(); }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <OctoFitLogo size={38} className="brand-logo" />
            <span className="brand-text">
              <span className="brand-octo">Octo</span>
              <span className="brand-fit">Fit</span>
              <span className="brand-tracker">Tracker</span>
            </span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {isAuthenticated ? (
                <>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/" onClick={closeNavbar}>Home</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/users') ? 'active' : ''}`} to="/users" onClick={closeNavbar}>Users</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/teams') ? 'active' : ''}`} to="/teams" onClick={closeNavbar}>Teams</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/activities') ? 'active' : ''}`} to="/activities" onClick={closeNavbar}>Activities</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/workouts') ? 'active' : ''}`} to="/workouts" onClick={closeNavbar}>Workouts</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`} to="/leaderboard" onClick={closeNavbar}>Leaderboard</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/profile') ? 'active' : ''}`} to="/profile" onClick={closeNavbar}>
                      <i className="bi bi-person-circle me-1"></i>Profile
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button type="button" className="btn btn-sm btn-danger ms-3 mt-1" onClick={() => { closeNavbar(); setShowLogoutConfirm(true); }}>
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="btn btn-outline-light btn-sm me-2 mt-1" to="/login" onClick={closeNavbar}>
                      <i className="bi bi-box-arrow-in-right me-1"></i>Sign In
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="btn btn-primary btn-sm mt-1" to="/register" onClick={closeNavbar}>
                      <i className="bi bi-person-plus-fill me-1"></i>Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main>
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={
              <AuthPanel
                key="login"
                initialMode="login"
                onAuthenticated={() => { setAuthVersion((v) => v + 1); navigate('/'); }}
              />
            } />
            <Route path="/register" element={
              <AuthPanel
                key="register"
                initialMode="register"
                onAuthenticated={() => { setAuthVersion((v) => v + 1); navigate('/'); }}
              />
            } />
            <Route path="*" element={
              <LandingPage
                onGoToLogin={() => navigate('/login')}
                onGoToRegister={() => navigate('/register')}
              />
            } />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<Users isAdmin={isAdmin} />} />
            <Route path="/teams" element={<Teams isAdmin={isAdmin} currentUser={currentUser} />} />
            <Route path="/activities" element={<Activities isAdmin={isAdmin} currentUser={currentUser} />} />
            <Route path="/workouts" element={<Workouts isAdmin={isAdmin} />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        )}
      </main>

      <footer className="bg-dark text-white text-center border-top border-primary">
        <div className="container py-4">
          <p className="mb-0 text-muted small">&copy; 2026 OctoFit Tracker. Local demo with real authentication.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}

export default App;
