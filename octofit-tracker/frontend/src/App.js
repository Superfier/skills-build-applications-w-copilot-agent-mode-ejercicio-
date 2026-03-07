import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import octoFitLogo from './octofitapp-small.png';
import Users from './components/Users';
import Teams from './components/Teams';
import Activities from './components/Activities';
import Workouts from './components/Workouts';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import { getApiBaseUrl, getAuthToken, setAuthToken, setCurrentUser, getCurrentUser, fetchWithAuth } from './api';
import { ToastProvider } from './components/ToastProvider';

function Home() {
  return (
    <div className="container mt-5 mb-5">
      <div className="jumbotron">
        <div className="row align-items-center">
          <div className="col-lg-8">
            <h1 className="display-4 fw-bold">Welcome to OctoFit Tracker</h1>
            <p className="lead">Track your fitness activities, join teams, and compete on the leaderboard.</p>
            <hr className="my-4" />
            <p className="mb-4">Use the navigation menu above to explore different sections of the app.</p>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/users" className="btn btn-light btn-lg">
                <i className="bi bi-people-fill me-2"></i>View Users
              </Link>
              <Link to="/leaderboard" className="btn btn-light btn-lg">
                <i className="bi bi-trophy-fill me-2"></i>See Rankings
              </Link>
            </div>
          </div>
          <div className="col-lg-4 text-center d-none d-lg-block">
            <div className="display-1 mb-3" style={{ fontSize: '5rem' }}>Trophy</div>
            <p className="fs-5 text-muted">Join the fitness revolution</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-shield-lock-fill me-2"></i>
                {mode === 'login' ? 'Login' : 'Register'}
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted">Real authentication for local demo with Django token auth.</p>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="username">Username</label>
                  <input id="username" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                {mode === 'register' && (
                  <div className="mb-3">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input id="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="password">Password</label>
                  <input id="password" type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
                </button>
              </form>
              <button
                type="button"
                className="btn btn-link w-100 mt-3"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
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
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <img src={octoFitLogo} alt="OctoFit Logo" />
            OctoFit Tracker
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
                <Link className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard" onClick={closeNavbar}>
                  <i className="bi bi-graph-up me-1"></i>Dashboard
                </Link>
              </li>
              {isAuthenticated && (
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/profile') ? 'active' : ''}`} to="/profile" onClick={closeNavbar}>
                    <i className="bi bi-person-circle me-1"></i>Profile
                  </Link>
                </li>
              )}
              {isAuthenticated && (
                <li className="nav-item">
                  <button type="button" className="btn btn-sm btn-danger ms-3 mt-1" onClick={() => { closeNavbar(); handleLogout(); }}>
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main>
        {!isAuthenticated ? (
          <AuthPanel onAuthenticated={() => setAuthVersion((v) => v + 1)} />
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<Users isAdmin={isAdmin} />} />
            <Route path="/teams" element={<Teams isAdmin={isAdmin} currentUser={currentUser} />} />
            <Route path="/activities" element={<Activities isAdmin={isAdmin} currentUser={currentUser} />} />
            <Route path="/workouts" element={<Workouts isAdmin={isAdmin} />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
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
