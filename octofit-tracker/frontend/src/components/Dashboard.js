import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, requestJson } from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersData, teamsData, activitiesData, leaderboardData] = await Promise.all([
          requestJson(`${getApiBaseUrl()}/users/`),
          requestJson(`${getApiBaseUrl()}/teams/`),
          requestJson(`${getApiBaseUrl()}/activities/`),
          requestJson(`${getApiBaseUrl()}/leaderboard/`),
        ]);

        const users = Array.isArray(usersData?.results) ? usersData.results : (Array.isArray(usersData) ? usersData : []);
        const teams = Array.isArray(teamsData?.results) ? teamsData.results : (Array.isArray(teamsData) ? teamsData : []);
        const activities = Array.isArray(activitiesData?.results) ? activitiesData.results : (Array.isArray(activitiesData) ? activitiesData : []);
        const leaderboard = Array.isArray(leaderboardData?.results) ? leaderboardData.results : (Array.isArray(leaderboardData) ? leaderboardData : []);

        const totalCalories = activities.reduce((sum, a) => sum + Number(a.calories || 0), 0);
        const totalDuration = activities.reduce((sum, a) => sum + Number(a.duration || 0), 0);

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
          totalCalories: Math.round(totalCalories),
          totalDuration,
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
  }, []);

  const COLORS = ['#667eea', '#764ba2', '#00d4ff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#fd7e14'];

  if (loading) {
    return (
      <div className="container mt-5 text-center py-5">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
        <p className="mt-3 text-muted">Loading dashboard...</p>
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

  return (
    <div className="container mt-5 mb-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold text-dark">
            <i className="bi bi-graph-up-arrow me-2"></i>Dashboard
          </h1>
          <p className="lead text-muted">Overview of your fitness community stats</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        {[
          { icon: 'bi-people-fill', label: 'Users', value: stats.userCount, color: 'primary' },
          { icon: 'bi-diagram-3-fill', label: 'Teams', value: stats.teamCount, color: 'success' },
          { icon: 'bi-lightning-fill', label: 'Activities', value: stats.activityCount, color: 'warning' },
          { icon: 'bi-fire', label: 'Total Calories', value: stats.totalCalories.toLocaleString(), color: 'danger' },
          { icon: 'bi-clock-fill', label: 'Total Minutes', value: stats.totalDuration.toLocaleString(), color: 'info' },
        ].map((card) => (
          <div key={card.label} className="col-6 col-md-4 col-lg">
            <div className={`card border-0 shadow-sm text-center`}>
              <div className="card-body py-3">
                <i className={`bi ${card.icon} fs-2 text-${card.color}`}></i>
                <h3 className="fw-bold mt-2 mb-0">{card.value}</h3>
                <small className="text-muted">{card.label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Calories by date bar chart */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-primary text-white"><h6 className="mb-0"><i className="bi bi-calendar3 me-2"></i>Calories by Date</h6></div>
            <div className="card-body">
              {stats.sortedDates.length === 0 && <p className="text-muted">No data</p>}
              {stats.sortedDates.map((date, i) => {
                const pct = (stats.byDate[date].calories / maxDateCalories) * 100;
                return (
                  <div key={date} className="mb-2">
                    <div className="d-flex justify-content-between small">
                      <span>{date}</span>
                      <span className="fw-bold">{Math.round(stats.byDate[date].calories)} cal</span>
                    </div>
                    <div className="progress" style={{ height: '18px' }}>
                      <div className="progress-bar" role="progressbar" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Breakdown by activity type */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-success text-white"><h6 className="mb-0"><i className="bi bi-pie-chart-fill me-2"></i>By Activity Type</h6></div>
            <div className="card-body">
              {typeEntries.length === 0 && <p className="text-muted">No data</p>}
              {typeEntries.map(([type, data], i) => {
                const pct = (data.calories / maxTypeCalories) * 100;
                return (
                  <div key={type} className="mb-2">
                    <div className="d-flex justify-content-between small">
                      <span className="text-capitalize">{type} <span className="text-muted">({data.count}x)</span></span>
                      <span className="fw-bold">{Math.round(data.calories)} cal</span>
                    </div>
                    <div className="progress" style={{ height: '18px' }}>
                      <div className="progress-bar" role="progressbar" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top users */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-warning text-dark"><h6 className="mb-0"><i className="bi bi-star-fill me-2"></i>Top Users by Calories</h6></div>
            <div className="card-body p-0">
              {stats.topUsers.length === 0 ? <p className="text-muted p-3">No data</p> : (
                <ul className="list-group list-group-flush">
                  {stats.topUsers.map((u, i) => (
                    <li key={u.user} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>{i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`} <strong>{u.user}</strong></span>
                      <span className="badge bg-primary rounded-pill">{u.calories} cal</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Mini leaderboard */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-danger text-white"><h6 className="mb-0"><i className="bi bi-trophy-fill me-2"></i>Top Teams</h6></div>
            <div className="card-body p-0">
              {stats.leaderboard.length === 0 ? <p className="text-muted p-3">No data</p> : (
                <ul className="list-group list-group-flush">
                  {stats.leaderboard.map((entry, i) => (
                    <li key={entry.id || i} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>{i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`} <strong>{entry.team_name || entry.team}</strong></span>
                      <span className="badge bg-danger rounded-pill">{entry.score} pts</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
