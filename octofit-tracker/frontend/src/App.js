import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import './App.css';
import octoFitLogo from './octofitapp-small.png';
import Users from './components/Users';
import Teams from './components/Teams';
import Activities from './components/Activities';
import Workouts from './components/Workouts';
import Leaderboard from './components/Leaderboard';

function Home() {
  return (
    <div className="container mt-5 mb-5">
      <div className="jumbotron">
        <div className="row align-items-center">
          <div className="col-lg-8">
            <h1 className="display-4 fw-bold">Welcome to OctoFit Tracker</h1>
            <p className="lead">Track your fitness activities, join teams, and compete on the leaderboard!</p>
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
            <div className="display-1 mb-3" style={{ fontSize: '5rem' }}>🏆</div>
            <p className="fs-5 text-muted">Join the fitness revolution</p>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-md-3 mb-4">
          <div className="text-center">
            <div className="display-6 text-primary mb-2">👥</div>
            <h5>Track Users</h5>
            <p className="text-muted">Manage all registered users</p>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="text-center">
            <div className="display-6 text-success mb-2">👨‍👩‍👧‍👦</div>
            <h5>Create Teams</h5>
            <p className="text-muted">Build and manage teams</p>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="text-center">
            <div className="display-6 text-warning mb-2">⚡</div>
            <h5>Log Activities</h5>
            <p className="text-muted">Record fitness activities</p>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="text-center">
            <div className="display-6 text-danger mb-2">🏅</div>
            <h5>Compete</h5>
            <p className="text-muted">Climb the leaderboard</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  
  console.log('App component loaded with REACT_APP_CODESPACE_NAME:', process.env.REACT_APP_CODESPACE_NAME);
  console.log('Current route:', location.pathname);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="App">
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
                <Link 
                  className={`nav-link ${isActive('/') ? 'active' : ''}`} 
                  to="/"
                  aria-current={isActive('/') ? 'page' : undefined}
                >
                  <i className="bi bi-house-fill me-1"></i>Home
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${isActive('/users') ? 'active' : ''}`} 
                  to="/users"
                  aria-current={isActive('/users') ? 'page' : undefined}
                >
                  <i className="bi bi-people-fill me-1"></i>Users
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${isActive('/teams') ? 'active' : ''}`} 
                  to="/teams"
                  aria-current={isActive('/teams') ? 'page' : undefined}
                >
                  <i className="bi bi-diagram-3-fill me-1"></i>Teams
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${isActive('/activities') ? 'active' : ''}`} 
                  to="/activities"
                  aria-current={isActive('/activities') ? 'page' : undefined}
                >
                  <i className="bi bi-lightning-fill me-1"></i>Activities
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${isActive('/workouts') ? 'active' : ''}`} 
                  to="/workouts"
                  aria-current={isActive('/workouts') ? 'page' : undefined}
                >
                  <i className="bi bi-dumbbell me-1"></i>Workouts
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`} 
                  to="/leaderboard"
                  aria-current={isActive('/leaderboard') ? 'page' : undefined}
                >
                  <i className="bi bi-trophy-fill me-1"></i>Leaderboard
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </main>

      <footer className="bg-dark text-white text-center border-top border-primary">
        <div className="container py-4">
          <div className="row">
            <div className="col-md-6 text-start">
              <h6 className="mb-3">OctoFit Tracker</h6>
              <p className="small text-muted mb-0">
                Your ultimate fitness tracking and team competition platform.
              </p>
            </div>
            <div className="col-md-6 text-md-end text-start">
              <h6 className="mb-3">Quick Links</h6>
              <div className="small">
                <Link to="/users" className="text-decoration-none text-white-50 me-3">Users</Link>
                <Link to="/teams" className="text-decoration-none text-white-50 me-3">Teams</Link>
                <Link to="/activities" className="text-decoration-none text-white-50 me-3">Activities</Link>
                <Link to="/workouts" className="text-decoration-none text-white-50">Workouts</Link>
              </div>
            </div>
          </div>
          <hr className="my-3 border-secondary" />
          <p className="mb-0 text-muted small">&copy; 2026 OctoFit Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
