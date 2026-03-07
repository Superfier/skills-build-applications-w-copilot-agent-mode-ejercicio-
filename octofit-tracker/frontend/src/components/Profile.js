import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, requestJson, fetchAllPages } from '../api';
import { useToast } from './ToastProvider';
import { CardSkeleton } from './Skeleton';

const Profile = () => {
  const addToast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [stats, setStats] = useState({ activities: 0, calories: 0, duration: 0, team: null });

  const fetchProfile = useCallback(async () => {
    try {
      const data = await requestJson(`${getApiBaseUrl()}/auth/me/`);
      setUser(data);
      setForm({ first_name: data.first_name || '', last_name: data.last_name || '', email: data.email || '' });

      // Fetch user stats in parallel
      const [activities, teams] = await Promise.all([
        fetchAllPages(`${getApiBaseUrl()}/activities/?user=${encodeURIComponent(data.username)}`),
        fetchAllPages(`${getApiBaseUrl()}/teams/`),
      ]);
      const myActivities = activities.filter(a => a.user === data.username);
      const totalCalories = myActivities.reduce((sum, a) => sum + Number(a.calories || 0), 0);
      const totalDuration = myActivities.reduce((sum, a) => sum + Number(a.duration || 0), 0);
      const myTeam = teams.find(t => Array.isArray(t.members) && t.members.includes(data.username));
      setStats({ activities: myActivities.length, calories: Math.round(totalCalories), duration: totalDuration, team: myTeam?.name || null });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = await requestJson(`${getApiBaseUrl()}/auth/me/`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setUser(data);
      setEditing(false);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm({ first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '' });
    setEditing(false);
    setError(null);
  };

  const getInitials = (u) => {
    if (u?.first_name && u?.last_name) return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
    return (u?.username || '?')[0].toUpperCase();
  };

  const getDisplayName = (u) => {
    if (u?.first_name || u?.last_name) return `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return u?.username || '';
  };

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="d-flex align-items-center mb-1">
        <div className="profile-icon-circle me-3">
          <i className="bi bi-person-circle"></i>
        </div>
        <div>
          <h1 className="display-6 fw-bold mb-0">My Profile</h1>
          <p className="text-muted mb-0">View and manage your personal information</p>
        </div>
      </div>

      {loading && <div className="mt-3"><CardSkeleton count={2} /></div>}

      {error && !loading && (
        <div className="alert alert-danger mt-3 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-circle-fill"></i>
          <span>{error}</span>
        </div>
      )}

      {!loading && user && (
        <div className="row g-4 mt-2">
          {/* Left Column: Profile Card */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm profile-card">
              <div className="profile-card-header">
                <div className="profile-avatar">
                  {getInitials(user)}
                </div>
              </div>
              <div className="card-body text-center pt-4">
                <h4 className="fw-bold mb-0">{getDisplayName(user)}</h4>
                <p className="text-muted small">@{user.username}</p>
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {user.is_staff && (
                    <span className="badge bg-warning text-dark">
                      <i className="bi bi-shield-fill-check me-1"></i>Admin
                    </span>
                  )}
                  {stats.team && (
                    <span className="badge bg-info text-dark">
                      <i className="bi bi-people-fill me-1"></i>{stats.team}
                    </span>
                  )}
                </div>
                {user.email && (
                  <p className="small text-muted mb-0">
                    <i className="bi bi-envelope me-1"></i>{user.email}
                  </p>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body">
                <h6 className="fw-bold text-uppercase text-muted small mb-3">
                  <i className="bi bi-bar-chart-fill me-1"></i>My Stats
                </h6>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="profile-stat-icon" style={{ background: 'rgba(255,193,7,.15)', color: '#ffc107' }}>
                      <i className="bi bi-lightning-charge-fill"></i>
                    </div>
                    <div>
                      <div className="fw-bold">{stats.activities}</div>
                      <div className="text-muted small">Activities</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="profile-stat-icon" style={{ background: 'rgba(220,53,69,.15)', color: '#dc3545' }}>
                      <i className="bi bi-fire"></i>
                    </div>
                    <div>
                      <div className="fw-bold">{stats.calories.toLocaleString()} cal</div>
                      <div className="text-muted small">Total Calories</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="profile-stat-icon" style={{ background: 'rgba(13,110,253,.15)', color: '#0d6efd' }}>
                      <i className="bi bi-clock-fill"></i>
                    </div>
                    <div>
                      <div className="fw-bold">{stats.duration} min</div>
                      <div className="text-muted small">Total Duration</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-pencil-square me-2"></i>Personal Information
                  </h5>
                  {!editing && (
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setEditing(true)}>
                      <i className="bi bi-pen me-1"></i>Edit
                    </button>
                  )}
                </div>

                {!editing ? (
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <div className="profile-field">
                        <label className="profile-field-label">
                          <i className="bi bi-person me-1"></i>Username
                        </label>
                        <div className="profile-field-value">@{user.username}</div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="profile-field">
                        <label className="profile-field-label">
                          <i className="bi bi-envelope me-1"></i>Email
                        </label>
                        <div className="profile-field-value">{user.email || '—'}</div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="profile-field">
                        <label className="profile-field-label">
                          <i className="bi bi-type me-1"></i>First Name
                        </label>
                        <div className="profile-field-value">{user.first_name || '—'}</div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="profile-field">
                        <label className="profile-field-label">
                          <i className="bi bi-type me-1"></i>Last Name
                        </label>
                        <div className="profile-field-value">{user.last_name || '—'}</div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="profile-field">
                        <label className="profile-field-label">
                          <i className="bi bi-shield me-1"></i>Role
                        </label>
                        <div className="profile-field-value">{user.is_staff ? 'Administrator' : 'Member'}</div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="profile-field">
                        <label className="profile-field-label">
                          <i className="bi bi-people me-1"></i>Team
                        </label>
                        <div className="profile-field-value">{stats.team || '—'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">
                          <i className="bi bi-person me-1"></i>Username
                        </label>
                        <input className="form-control bg-light" value={user.username} disabled />
                        <small className="text-muted">Username cannot be changed</small>
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-muted" htmlFor="profile-first-name">
                          <i className="bi bi-type me-1"></i>First Name
                        </label>
                        <input id="profile-first-name" className="form-control" name="first_name" value={form.first_name} onChange={handleChange} maxLength={150} placeholder="Enter first name" />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-muted" htmlFor="profile-last-name">
                          <i className="bi bi-type me-1"></i>Last Name
                        </label>
                        <input id="profile-last-name" className="form-control" name="last_name" value={form.last_name} onChange={handleChange} maxLength={150} placeholder="Enter last name" />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted" htmlFor="profile-email">
                          <i className="bi bi-envelope me-1"></i>Email
                        </label>
                        <input id="profile-email" type="email" className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-4">
                      <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                        {saving ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                        ) : (
                          <><i className="bi bi-check-lg me-1"></i>Save Changes</>
                        )}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit} disabled={saving}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
