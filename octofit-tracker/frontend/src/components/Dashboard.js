import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl, requestJson, fetchAllPages, getCurrentUser } from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersData, teamsData, activities, leaderboardData, workoutsData] = await Promise.all([
          requestJson(`${getApiBaseUrl()}/users/`),
          requestJson(`${getApiBaseUrl()}/teams/`),
          fetchAllPages(`${getApiBaseUrl()}/activities/`),
          requestJson(`${getApiBaseUrl()}/leaderboard/`),
          requestJson(`${getApiBaseUrl()}/workouts/`),
        ]);

        const users = Array.isArray(usersData?.results) ? usersData.results : (Array.isArray(usersData) ? usersData : []);
        const teams = Array.isArray(teamsData?.results) ? teamsData.results : (Array.isArray(teamsData) ? teamsData : []);
        const leaderboard = Array.isArray(leaderboardData?.results) ? leaderboardData.results : (Array.isArray(leaderboardData) ? leaderboardData : []);
        const workouts = Array.isArray(workoutsData?.results) ? workoutsData.results : (Array.isArray(workoutsData) ? workoutsData : []);

        const totalCalories = activities.reduce((sum, a) => sum + Number(a.calories || 0), 0);
        const totalDuration = activities.reduce((sum, a) => sum + Number(a.duration || 0), 0);

        // My activities
        const myActivities = currentUser
          ? activities.filter(a => a.user === currentUser.username)
          : [];
        const myCalories = myActivities.reduce((sum, a) => sum + Number(a.calories || 0), 0);
        const myDuration = myActivities.reduce((sum, a) => sum + Number(a.duration || 0), 0);

        // Group by activity type
        const byType = {};
        activities.forEach((a) => {
          const type = a.activity_type || 'other';
          if (!byType[type]) byType[type] = { count: 0, calories: 0, duration: 0 };
          byType[type].count += 1;
          byType[type].calories += Number(a.calories || 0);
          byType[type].duration += Number(a.duration || 0);
        });

        // Group by date (last 7 unique dates)
        const byDate = {};
        activities.forEach((a) => {
          const d = a.date || 'unknown';
          if (!byDate[d]) byDate[d] = { calories: 0, count: 0 };
          byDate[d].calories += Number(a.calories || 0);
          byDate[d].count += 1;
        });
        const sortedDates = Object.keys(byDate).sort().slice(-7);

        // Top users by calories
        const byUser = {};
        activities.forEach((a) => {
          const u = a.user || 'unknown';
          if (!byUser[u]) byUser[u] = 0;
          byUser[u] += Number(a.calories || 0);
        });
        const topUsers = Object.entries(byUser)
          .map(([user, calories]) => ({ user, calories: Math.round(calories) }))
          .sort((a, b) => b.calories - a.calories)
          .slice(0, 5);

        setStats({
          userCount: users.length,
          teamCount: teams.length,
          activityCount: activities.length,
          workoutCount: workouts.length,
          totalCalories: Math.round(totalCalories),
          totalDuration,
          myActivities: myActivities.length,
          myCalories: Math.round(myCalories),
          myDuration,
          byType,
          byDate,
          sortedDates,
          topUsers,
          leaderboard: leaderboard.sort((a, b) => b.score - a.score).slice(0, 5),
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentUser]);

  const GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];

  if (loading) {
    return (
      <div className="container mt-5 text-center py-5">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fs-5">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger"><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  const maxDateCalories = Math.max(...stats.sortedDates.map((d) => stats.byDate[d].calories), 1);
  const typeEntries = Object.entries(stats.byType);
  const maxTypeCalories = Math.max(...typeEntries.map(([, v]) => v.calories), 1);
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard-wrap">
      {/* ─── HERO ─── */}
      <section className="dashboard-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <p className="hero-greeting mb-1">{greeting()},</p>
              <h1 className="hero-title">{currentUser?.username || 'Athlete'}</h1>
              <p className="hero-subtitle">Ready to crush your goals today?</p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link to="/workouts" className="btn btn-hero-primary btn-lg">
                  <i className="bi bi-lightning-charge-fill me-2"></i>Start Workout
                </Link>
                <Link to="/activities" className="btn btn-hero-outline btn-lg">
                  <i className="bi bi-plus-circle me-2"></i>Log Activity
                </Link>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block text-center">
              <div className="hero-stats-ring">
                <div className="ring-inner">
                  <span className="ring-number">{stats.myCalories}</span>
                  <span className="ring-label">My Calories</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container dashboard-body">
        {/* ─── MY STATS ─── */}
        <div className="row g-3 mb-4 stat-cards-row">
          {[
            { icon: 'bi-lightning-fill', label: 'My Activities', value: stats.myActivities, gradient: GRADIENTS[0] },
            { icon: 'bi-fire', label: 'My Calories', value: stats.myCalories.toLocaleString(), gradient: GRADIENTS[1] },
            { icon: 'bi-clock-history', label: 'My Minutes', value: stats.myDuration.toLocaleString(), gradient: GRADIENTS[2] },
          ].map((card) => (
            <div key={card.label} className="col-6 col-md-4">
              <div className="stat-card" style={{ background: card.gradient }}>
                <i className={`bi ${card.icon} stat-card-icon`}></i>
                <div className="stat-card-value">{card.value}</div>
                <div className="stat-card-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── COMMUNITY STATS ─── */}
        <h5 className="section-title"><i className="bi bi-globe2 me-2"></i>Community</h5>
        <div className="row g-3 mb-4">
          {[
            { icon: 'bi-people-fill', label: 'Users', value: stats.userCount, gradient: GRADIENTS[3] },
            { icon: 'bi-diagram-3-fill', label: 'Teams', value: stats.teamCount, gradient: GRADIENTS[4] },
            { icon: 'bi-lightning-fill', label: 'Activities', value: stats.activityCount, gradient: GRADIENTS[5] },
            { icon: 'bi-fire', label: 'Total Calories', value: stats.totalCalories.toLocaleString(), gradient: GRADIENTS[6] },
            { icon: 'bi-stopwatch-fill', label: 'Total Minutes', value: stats.totalDuration.toLocaleString(), gradient: GRADIENTS[7] },
          ].map((card) => (
            <div key={card.label} className="col-6 col-lg">
              <div className="stat-card stat-card-sm" style={{ background: card.gradient }}>
                <i className={`bi ${card.icon} stat-card-icon`}></i>
                <div className="stat-card-value">{card.value}</div>
                <div className="stat-card-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4 mb-4">
          {/* ─── CALORIES BY DATE ─── */}
          <div className="col-lg-6">
            <div className="glass-card h-100">
              <h6 className="glass-card-title"><i className="bi bi-bar-chart-fill me-2 text-primary"></i>Calories by Date</h6>
              {stats.sortedDates.length === 0 && <p className="text-muted text-center py-3">No data yet</p>}
              <div className="bar-chart">
                {stats.sortedDates.map((date, i) => {
                  const pct = (stats.byDate[date].calories / maxDateCalories) * 100;
                  const cal = Math.round(stats.byDate[date].calories);
                  return (
                    <div key={date} className="bar-chart-col">
                      <span className="bar-value">{cal}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ height: `${Math.max(pct, 5)}%`, background: GRADIENTS[i % GRADIENTS.length] }}></div>
                      </div>
                      <span className="bar-label">{date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── BY ACTIVITY TYPE ─── */}
          <div className="col-lg-6">
            <div className="glass-card h-100">
              <h6 className="glass-card-title"><i className="bi bi-pie-chart-fill me-2 text-success"></i>By Activity Type</h6>
              {typeEntries.length === 0 && <p className="text-muted text-center py-3">No data yet</p>}
              {typeEntries.map(([type, data], i) => {
                const pct = (data.calories / maxTypeCalories) * 100;
                return (
                  <div key={type} className="type-row">
                    <div className="type-info">
                      <span className="type-dot" style={{ background: GRADIENTS[i % GRADIENTS.length] }}></span>
                      <span className="text-capitalize fw-semibold">{type}</span>
                      <span className="text-muted ms-1 small">({data.count}x)</span>
                    </div>
                    <div className="type-bar-wrap">
                      <div className="type-bar" style={{ width: `${pct}%`, background: GRADIENTS[i % GRADIENTS.length] }}></div>
                    </div>
                    <span className="type-cal">{Math.round(data.calories)} cal</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="row g-4 mb-5">
          {/* ─── TOP USERS ─── */}
          <div className="col-lg-6">
            <div className="glass-card h-100">
              <h6 className="glass-card-title"><i className="bi bi-star-fill me-2 text-warning"></i>Top Athletes</h6>
              {stats.topUsers.length === 0 ? <p className="text-muted text-center py-3">No data yet</p> : (
                <div className="podium-list">
                  {stats.topUsers.map((u, i) => (
                    <div key={u.user} className={`podium-item ${i === 0 ? 'podium-gold' : ''}`}>
                      <div className="podium-rank">{i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}</div>
                      <div className="podium-avatar" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                        {u.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="podium-info">
                        <span className="podium-name">{u.user}</span>
                        <span className="podium-score">{u.calories} cal</span>
                      </div>
                      <div className="podium-bar-wrap">
                        <div className="podium-bar" style={{ width: `${(u.calories / (stats.topUsers[0]?.calories || 1)) * 100}%`, background: GRADIENTS[i % GRADIENTS.length] }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── LEADERBOARD ─── */}
          <div className="col-lg-6">
            <div className="glass-card h-100">
              <h6 className="glass-card-title"><i className="bi bi-trophy-fill me-2 text-danger"></i>Team Leaderboard</h6>
              {stats.leaderboard.length === 0 ? <p className="text-muted text-center py-3">No data yet</p> : (
                <div className="podium-list">
                  {stats.leaderboard.map((entry, i) => (
                    <div key={entry.id || i} className={`podium-item ${i === 0 ? 'podium-gold' : ''}`}>
                      <div className="podium-rank">{i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}</div>
                      <div className="podium-avatar" style={{ background: GRADIENTS[(i + 3) % GRADIENTS.length] }}>
                        {(entry.team_name || entry.team || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="podium-info">
                        <span className="podium-name">{entry.team_name || entry.team}</span>
                        <span className="podium-score">{entry.score} pts</span>
                      </div>
                      <div className="podium-bar-wrap">
                        <div className="podium-bar" style={{ width: `${(entry.score / (stats.leaderboard[0]?.score || 1)) * 100}%`, background: GRADIENTS[(i + 3) % GRADIENTS.length] }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── QUICK ACTIONS ─── */}
        <h5 className="section-title"><i className="bi bi-grid-fill me-2"></i>Quick Actions</h5>
        <div className="row g-3 mb-5">
          {[
            { to: '/workouts', icon: 'bi-lightning-charge-fill', label: 'Workouts', color: '#667eea' },
            { to: '/activities', icon: 'bi-activity', label: 'Activities', color: '#f5576c' },
            { to: '/teams', icon: 'bi-diagram-3-fill', label: 'Teams', color: '#43e97b' },
            { to: '/leaderboard', icon: 'bi-trophy-fill', label: 'Leaderboard', color: '#ffc107' },
            { to: '/users', icon: 'bi-people-fill', label: 'Users', color: '#00d4ff' },
            { to: '/profile', icon: 'bi-person-circle', label: 'Profile', color: '#a18cd1' },
          ].map((action) => (
            <div key={action.to} className="col-6 col-md-4 col-lg-2">
              <Link to={action.to} className="quick-action-card">
                <i className={`bi ${action.icon}`} style={{ color: action.color }}></i>
                <span>{action.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
