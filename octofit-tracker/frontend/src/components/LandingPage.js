import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../api';

const MEDAL_GRADIENTS = [
  'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
  'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
  'linear-gradient(135deg, #d4a373 0%, #a0522d 100%)',
];
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

const getMedalEmoji = (rank) => {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return null;
};

const LandingPage = ({ onGoToLogin, onGoToRegister }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/public/stats/`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (_) { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const stats = data?.stats || {};
  const leaderboard = data?.leaderboard || [];
  const topAthletes = data?.top_athletes || [];
  const maxLbScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.score), 1) : 1;
  const maxAthleteScore = topAthletes.length > 0 ? Math.max(...topAthletes.map(a => a.total_calories), 1) : 1;

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="container text-center">
          <div className="landing-hero-badge mb-3">
            <i className="bi bi-heart-pulse-fill me-2"></i>Fitness Tracker
          </div>
          <h1 className="landing-hero-title">
            Track. Compete. <span className="landing-hero-accent">Win.</span>
          </h1>
          <p className="landing-hero-subtitle">
            OctoFit Tracker helps you log activities, join teams, and climb the leaderboard. Compete with friends and reach your fitness goals together.
          </p>
          <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
            <button className="btn btn-lg btn-light fw-bold px-4 landing-cta-btn" onClick={onGoToRegister}>
              <i className="bi bi-person-plus-fill me-2"></i>Get Started
            </button>
            <button className="btn btn-lg btn-outline-light fw-bold px-4" onClick={onGoToLogin}>
              <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="landing-stats-bar">
        <div className="container">
          <div className="row text-center g-3">
            <div className="col-4">
              <div className="landing-stat-number">{loading ? '—' : stats.total_users || 0}</div>
              <div className="landing-stat-label">Athletes</div>
            </div>
            <div className="col-4">
              <div className="landing-stat-number">{loading ? '—' : stats.total_teams || 0}</div>
              <div className="landing-stat-label">Teams</div>
            </div>
            <div className="col-4">
              <div className="landing-stat-number">{loading ? '—' : stats.total_activities || 0}</div>
              <div className="landing-stat-label">Activities Logged</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold mb-2">Everything you need to stay fit</h2>
          <p className="text-center text-muted mb-5">OctoFit Tracker packs all the tools for tracking your fitness journey</p>
          <div className="row g-4">
            {[
              { icon: 'bi-lightning-charge-fill', color: '#ffc107', title: 'Activity Tracking', desc: 'Log runs, swims, yoga sessions & more. Track duration and calories burned.' },
              { icon: 'bi-people-fill', color: '#4facfe', title: 'Team Competition', desc: 'Create or join teams and compete together on the leaderboard.' },
              { icon: 'bi-trophy-fill', color: '#f5af19', title: 'Leaderboards', desc: 'Real-time rankings based on team calories. Climb to the top!' },
              { icon: 'bi-heart-pulse-fill', color: '#e74c3c', title: 'Workout Library', desc: 'Browse workouts with exercises, difficulty levels, and smart suggestions.' },
              { icon: 'bi-graph-up-arrow', color: '#43e97b', title: 'Personal Dashboard', desc: 'View your stats, activity history, and personalized insights.' },
              { icon: 'bi-shield-fill-check', color: '#764ba2', title: 'Secure Auth', desc: 'Token-based authentication keeps your data safe and private.' },
            ].map((f, i) => (
              <div key={i} className="col-sm-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 landing-feature-card">
                  <div className="card-body text-center py-4">
                    <div className="landing-feature-icon mx-auto mb-3" style={{ background: `${f.color}20`, color: f.color }}>
                      <i className={`bi ${f.icon}`}></i>
                    </div>
                    <h6 className="fw-bold">{f.title}</h6>
                    <p className="text-muted small mb-0">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      {leaderboard.length > 0 && (
        <section className="py-5 landing-section-alt">
          <div className="container">
            <div className="text-center mb-4">
              <h2 className="fw-bold"><i className="bi bi-trophy-fill text-warning me-2"></i>Team Rankings</h2>
              <p className="text-muted">See which teams are leading the pack</p>
            </div>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-0">
                    {leaderboard.map((entry, index) => {
                      const pct = Math.round((entry.score / maxLbScore) * 100);
                      const bg = index < 3 ? MEDAL_GRADIENTS[index] : GRADIENTS[(index - 3) % GRADIENTS.length];
                      return (
                        <div key={index} className={`d-flex align-items-center gap-3 px-3 py-3 ${index < leaderboard.length - 1 ? 'border-bottom' : ''} landing-rank-row`}>
                          <div className="lb-rank-pos" style={index < 3 ? { background: bg } : {}}>
                            {getMedalEmoji(index) || <span className="fw-bold text-muted">#{index + 1}</span>}
                          </div>
                          <div className="lb-rank-avatar" style={{ background: bg }}>
                            {(entry.team_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <h6 className="fw-bold mb-0 text-truncate">{entry.team_name || 'Team'}</h6>
                            <div className="lb-rank-bar-wrap mt-1">
                              <div className="lb-rank-bar-fill" style={{ width: `${pct}%`, background: bg }}></div>
                            </div>
                          </div>
                          <div className="text-end flex-shrink-0">
                            <span className={`fw-bold ${index < 3 ? 'fs-5' : ''}`}>{(entry.score || 0).toLocaleString()}</span>
                            <br /><small className="text-muted">cal</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Top Athletes */}
      {topAthletes.length > 0 && (
        <section className="py-5">
          <div className="container">
            <div className="text-center mb-4">
              <h2 className="fw-bold"><i className="bi bi-star-fill text-warning me-2"></i>Top Athletes</h2>
              <p className="text-muted">The most active members of our community</p>
            </div>
            <div className="row g-3 justify-content-center">
              {topAthletes.map((athlete, index) => {
                const bg = index < 3 ? MEDAL_GRADIENTS[index] : GRADIENTS[(index - 3) % GRADIENTS.length];
                const pct = Math.round((athlete.total_calories / maxAthleteScore) * 100);
                return (
                  <div key={index} className="col-sm-6 col-md-4 col-lg">
                    <div className="card border-0 shadow-sm text-center h-100 landing-athlete-card">
                      <div className="card-body py-4">
                        {getMedalEmoji(index) && <div className="fs-3 mb-2">{getMedalEmoji(index)}</div>}
                        <div className="landing-athlete-avatar mx-auto mb-2" style={{ background: bg }}>
                          {athlete.username.charAt(0).toUpperCase()}
                        </div>
                        <h6 className="fw-bold mb-1">{athlete.username}</h6>
                        <div className="fw-bold" style={{ color: index < 3 ? '#f5af19' : '#4a5568' }}>
                          {athlete.total_calories.toLocaleString()} cal
                        </div>
                        <div className="lb-rank-bar-wrap mt-2 mx-auto" style={{ maxWidth: '80%' }}>
                          <div className="lb-rank-bar-fill" style={{ width: `${pct}%`, background: bg }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="landing-cta-section">
        <div className="container text-center">
          <h2 className="fw-bold text-white mb-3">Ready to start your fitness journey?</h2>
          <p className="text-white-50 mb-4">Join our community and start tracking your progress today</p>
          <button className="btn btn-lg btn-light fw-bold px-5 landing-cta-btn" onClick={onGoToRegister}>
            <i className="bi bi-rocket-takeoff-fill me-2"></i>Create Free Account
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
