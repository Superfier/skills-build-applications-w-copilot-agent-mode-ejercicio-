import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiBaseUrl, requestJson, fetchAllPages } from '../api';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

const Activities = ({ isAdmin = false, currentUser = null }) => {
  const addToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editingForm, setEditingForm] = useState({
    activity_type: '',
    duration: 0,
    calories: 0,
    date: '',
  });
  // URL ?user= param takes priority, then default to logged-in user
  const initialUser = searchParams.get('user') || currentUser?.username || '';
  const [filters, setFilters] = useState({
    user: initialUser,
    date_from: '',
    date_to: '',
  });
  const [allUsers, setAllUsers] = useState([]);
  const [form, setForm] = useState({
    user: '',
    activity_type: 'run',
    duration: 30,
    calories: 250,
    date: new Date().toISOString().slice(0, 10),
  });

  const fetchActivities = useCallback(async () => {
    try {
      const searchParams = new URLSearchParams();
      if (filters.user.trim()) {
        searchParams.set('user', filters.user.trim());
      }
      if (filters.date_from) {
        searchParams.set('date_from', filters.date_from);
      }
      if (filters.date_to) {
        searchParams.set('date_to', filters.date_to);
      }

      const url = `${getApiBaseUrl()}/activities/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const activitiesList = await fetchAllPages(url);
      setActivities(Array.isArray(activitiesList) ? activitiesList : []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError.message);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await requestJson(`${getApiBaseUrl()}/users/`);
        const list = data.results || data;
        setAllUsers(Array.isArray(list) ? list : []);
      } catch (_) { /* ignore */ }
    };
    loadUsers();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    if (name === 'user') {
      if (value) {
        setSearchParams({ user: value }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      user: '',
      date_from: '',
      date_to: '',
    });
    setSearchParams({}, { replace: true });
  };

  const handleCreateActivity = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const body = {
          activity_type: form.activity_type,
          duration: Number(form.duration),
          calories: Number(form.calories),
          date: form.date,
        };
      if (form.user.trim()) {
        body.user = form.user.trim();
      }
      await requestJson(`${getApiBaseUrl()}/activities/`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      addToast('Activity created successfully!');
      await fetchActivities();
    } catch (saveError) {
      addToast(saveError.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const startEditActivity = (activity) => {
    setEditingActivityId(activity.id);
    setEditingForm({
      activity_type: activity.activity_type,
      duration: activity.duration,
      calories: activity.calories,
      date: activity.date,
    });
  };

  const cancelEditActivity = () => {
    setEditingActivityId(null);
    setEditingForm({
      activity_type: '',
      duration: 0,
      calories: 0,
      date: '',
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateActivity = async (activityId) => {
    const encodedActivityId = encodeURIComponent(String(activityId || ''));
    if (!encodedActivityId) {
      setError('Unable to update activity: missing activity identifier.');
      return;
    }

    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/activities/${encodedActivityId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          activity_type: editingForm.activity_type,
          duration: Number(editingForm.duration),
          calories: Number(editingForm.calories),
          date: editingForm.date,
        }),
      });
      cancelEditActivity();
      addToast('Activity updated!');
      await fetchActivities();
    } catch (saveError) {
      addToast(saveError.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    const encodedActivityId = encodeURIComponent(String(activityId || ''));
    if (!encodedActivityId) {
      setError('Unable to delete activity: missing activity identifier.');
      return;
    }

    setConfirmDelete(activityId);
  };

  const executeDelete = async () => {
    const activityId = confirmDelete;
    setConfirmDelete(null);
    const encodedActivityId = encodeURIComponent(String(activityId || ''));

    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/activities/${encodedActivityId}/`, {
        method: 'DELETE',
      });
      addToast('Activity deleted.', 'warning');
      if (editingActivityId === activityId) {
        cancelEditActivity();
      }
      await fetchActivities();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSaving(false);
    }
  };

  const getActivityIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('run')) return 'bi-person-walking';
    if (t.includes('cycle') || t.includes('bike')) return 'bi-bicycle';
    if (t.includes('swim')) return 'bi-water';
    if (t.includes('yoga')) return 'bi-peace';
    if (t.includes('gym') || t.includes('weight') || t.includes('strength')) return 'bi-trophy';
    return 'bi-activity';
  };

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="d-flex align-items-center mb-1">
        <div className="activity-icon-circle me-3">
          <i className="bi bi-lightning-charge-fill"></i>
        </div>
        <div>
          <h1 className="display-6 fw-bold mb-0">Activities</h1>
          <p className="text-muted mb-0">Track all fitness activities and workouts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3 mt-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small text-uppercase fw-semibold text-muted mb-1" htmlFor="activity-filter-user">
                <i className="bi bi-funnel me-1"></i>User
              </label>
              <input
                id="activity-filter-user"
                name="user"
                className="form-control form-control-sm"
                placeholder="Filter by username"
                list="activity-user-list"
                value={filters.user}
                onChange={handleFilterChange}
                autoComplete="off"
              />
              <datalist id="activity-user-list">
                {allUsers.map(u => <option key={u.username} value={u.username} />)}
              </datalist>
            </div>
            <div className="col-md-3">
              <label className="form-label small text-uppercase fw-semibold text-muted mb-1" htmlFor="activity-filter-date-from">From</label>
              <input
                id="activity-filter-date-from"
                name="date_from"
                type="date"
                className="form-control form-control-sm"
                value={filters.date_from}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small text-uppercase fw-semibold text-muted mb-1" htmlFor="activity-filter-date-to">To</label>
              <input
                id="activity-filter-date-to"
                name="date_to"
                type="date"
                className="form-control form-control-sm"
                value={filters.date_to}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3 d-grid">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
                <i className="bi bi-x-circle me-1"></i>Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      <div className="card border-0 shadow-sm mb-4 activity-create-card">
        <div className="card-body py-3">
          <h6 className="text-uppercase fw-semibold text-muted small mb-2">
            <i className="bi bi-plus-circle me-1"></i>New Activity
          </h6>
          <form className="row g-2 align-items-end" onSubmit={handleCreateActivity}>
            {isAdmin && (
              <div className="col-lg-2 col-md-4">
                <label className="form-label visually-hidden">User</label>
                <input
                  name="user"
                  className="form-control form-control-sm"
                  placeholder="User"
                  list="activity-create-user-list"
                  value={form.user}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <datalist id="activity-create-user-list">
                  {allUsers.map(u => <option key={u.username} value={u.username} />)}
                </datalist>
              </div>
            )}
            <div className="col-lg-2 col-md-4">
              <label className="form-label visually-hidden">Type</label>
              <input name="activity_type" className="form-control form-control-sm" placeholder="Type (run, swim...)" value={form.activity_type} onChange={handleChange} required />
            </div>
            <div className="col-lg-2 col-md-4">
              <label className="form-label visually-hidden">Duration</label>
              <div className="input-group input-group-sm">
                <input name="duration" type="number" min="1" className="form-control" placeholder="Duration" value={form.duration} onChange={handleChange} required />
                <span className="input-group-text">min</span>
              </div>
            </div>
            <div className="col-lg-2 col-md-4">
              <label className="form-label visually-hidden">Calories</label>
              <div className="input-group input-group-sm">
                <input name="calories" type="number" min="0" step="0.1" className="form-control" placeholder="Calories" value={form.calories} onChange={handleChange} required />
                <span className="input-group-text">cal</span>
              </div>
            </div>
            <div className="col-lg-2 col-md-4">
              <label className="form-label visually-hidden">Date</label>
              <input name="date" type="date" className="form-control form-control-sm" value={form.date} onChange={handleChange} required />
            </div>
            <div className="col-lg-2 col-md-4 d-grid">
              <button className="btn btn-warning btn-sm fw-bold" type="submit" disabled={saving}>
                <i className="bi bi-plus-lg me-1"></i>{saving ? 'Saving...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
          <p className="mt-3 text-muted">Loading activities...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i><strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && activities.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-inbox display-1 text-muted"></i>
          <h5 className="mt-3 text-muted">No activities found</h5>
          <p className="text-muted">
            {filters.user || filters.date_from || filters.date_to
              ? `No activities for ${filters.user ? `"${filters.user}"` : 'the selected filters'}. Use the form above to add one.`
              : 'Start tracking by adding your first activity above.'}
          </p>
        </div>
      )}

      {/* Activities List */}
      {!loading && !error && activities.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted small">
              <i className="bi bi-list-check me-1"></i>
              Showing <strong>{activities.length}</strong> activit{activities.length === 1 ? 'y' : 'ies'}
            </span>
          </div>
          <div className="d-flex flex-column gap-3">
            {activities.map((activity, index) => {
              const isEditing = editingActivityId === activity.id;
              const typeIcon = getActivityIcon(activity.activity_type);
              return (
                <div key={activity.id || `${activity.user}-${activity.date}-${index}`} className={`card border-0 shadow-sm activity-list-item ${isEditing ? 'activity-card-editing' : ''}`}>
                  <div className="card-body py-3 px-3">
                    <div className="d-flex align-items-center gap-3">
                      {/* Icon */}
                      <div className="activity-type-icon flex-shrink-0">
                        <i className={`bi ${typeIcon}`}></i>
                      </div>

                      {/* Main info */}
                      <div className="flex-grow-1 min-w-0">
                        {isEditing ? (
                          <div className="row g-2 align-items-center">
                            <div className="col-md-3">
                              <input name="activity_type" className="form-control form-control-sm fw-bold" value={editingForm.activity_type} onChange={handleEditChange} />
                            </div>
                            <div className="col-md-2">
                              <div className="input-group input-group-sm">
                                <input name="duration" type="number" min="1" className="form-control" value={editingForm.duration} onChange={handleEditChange} />
                                <span className="input-group-text">min</span>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="input-group input-group-sm">
                                <input name="calories" type="number" min="0" step="0.1" className="form-control" value={editingForm.calories} onChange={handleEditChange} />
                                <span className="input-group-text">cal</span>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <input name="date" type="date" className="form-control form-control-sm" value={editingForm.date || ''} onChange={handleEditChange} />
                            </div>
                            <div className="col-md-3 d-flex gap-1">
                              <button className="btn btn-primary btn-sm flex-fill" onClick={() => handleUpdateActivity(activity.id)} disabled={saving}>
                                <i className="bi bi-check-lg"></i> Save
                              </button>
                              <button className="btn btn-outline-secondary btn-sm flex-fill" onClick={cancelEditActivity} disabled={saving}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center gap-2" style={{ minWidth: '180px' }}>
                              <h6 className="mb-0 fw-bold text-capitalize">{activity.activity_type}</h6>
                              <span className="text-muted small">
                                <i className="bi bi-person me-1"></i>{activity.user}
                              </span>
                            </div>
                            <div className="d-flex justify-content-center gap-2 flex-grow-1">
                              <span className="activity-stat">
                                <i className="bi bi-clock text-primary"></i>
                                <span className="ms-1 fw-semibold">{activity.duration} <small className="text-muted">min</small></span>
                              </span>
                              <span className="activity-stat">
                                <i className="bi bi-fire text-danger"></i>
                                <span className="ms-1 fw-semibold">{activity.calories} <small className="text-muted">cal</small></span>
                              </span>
                            </div>
                            <span className="text-muted small text-nowrap">
                              <i className="bi bi-calendar3 me-1"></i>{activity.date ? new Date(activity.date).toLocaleDateString() : '—'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {!isEditing && (() => {
                        const canEdit = isAdmin || activity.user === currentUser?.username;
                        if (!canEdit) return null;
                        return (
                          <div className="d-flex gap-1 flex-shrink-0">
                            <button className="btn btn-outline-primary btn-sm" onClick={() => startEditActivity(activity)} disabled={saving} title="Edit">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteActivity(activity.id)} disabled={saving} title="Delete">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmModal
        show={confirmDelete !== null}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Activities;
