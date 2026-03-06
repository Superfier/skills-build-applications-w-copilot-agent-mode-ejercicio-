import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, requestJson } from '../api';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

const Activities = ({ isAdmin = false, currentUser = null }) => {
  const addToast = useToast();
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
  const [filters, setFilters] = useState({
    user: '',
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
      const data = await requestJson(url);

      // Handle both paginated (.results) and plain array responses
      const activitiesList = data.results || data;
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
  };

  const clearFilters = () => {
    setFilters({
      user: '',
      date_from: '',
      date_to: '',
    });
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
      setError(saveError.message);
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
      setError(saveError.message);
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

  return (
    <div className="container mt-5 mb-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold text-dark">
            <i className="bi bi-lightning-fill me-2"></i>Activities
          </h1>
          <p className="lead text-muted">Track all fitness activities and workouts</p>
          <div className="card mb-3 border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-2 align-items-end">
                <div className="col-md-4">
                  <label className="form-label mb-1" htmlFor="activity-filter-user">User</label>
                  <input
                    id="activity-filter-user"
                    name="user"
                    className="form-control"
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
                  <label className="form-label mb-1" htmlFor="activity-filter-date-from">From</label>
                  <input
                    id="activity-filter-date-from"
                    name="date_from"
                    type="date"
                    className="form-control"
                    value={filters.date_from}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label mb-1" htmlFor="activity-filter-date-to">To</label>
                  <input
                    id="activity-filter-date-to"
                    name="date_to"
                    type="date"
                    className="form-control"
                    value={filters.date_to}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-2 d-grid">
                  <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
          <form className="row g-2 mt-2" onSubmit={handleCreateActivity}>
            <div className="col-md-2">
              <input
                name="user"
                className="form-control"
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
            <div className="col-md-2">
              <input
                name="activity_type"
                className="form-control"
                placeholder="Activity type"
                value={form.activity_type}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-2">
              <input
                name="duration"
                type="number"
                min="1"
                className="form-control"
                placeholder="Minutes"
                value={form.duration}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-2">
              <input
                name="calories"
                type="number"
                min="0"
                step="0.1"
                className="form-control"
                placeholder="Calories"
                value={form.calories}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-2">
              <input
                name="date"
                type="date"
                className="form-control"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-warning" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading activities...</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          <strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && activities.length === 0 && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          {filters.user || filters.date_from || filters.date_to ? (
            <><strong>No results</strong> - No activities found for {filters.user ? `"${filters.user}"` : 'the selected filters'}. Use the form above to add a new activity.</>
          ) : (
            <><strong>No data available</strong> - No activities found. Please check the backend API.</>
          )}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && activities.length > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-warning text-dark">
                <h5 className="card-title mb-0">
                  <i className="bi bi-list-check me-2"></i>Activity Log ({activities.length})
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="text-center" style={{ width: '60px' }}>ID</th>
                        <th scope="col">User</th>
                        <th scope="col">Activity Type</th>
                        <th scope="col" className="text-center">Duration (min)</th>
                        <th scope="col" className="text-center">Calories</th>
                        <th scope="col">Date</th>
                        <th scope="col" className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity, index) => (
                        <tr key={activity.id || `${activity.user}-${activity.date}-${index}`}>
                          <td className="text-center align-middle">
                            <span className="badge bg-warning text-dark">{typeof activity.id === 'string' && activity.id.length > 12 ? `${activity.id.slice(0, 6)}...${activity.id.slice(-4)}` : activity.id || index + 1}</span>
                          </td>
                          <td className="align-middle">{activity.user}</td>
                          <td className="align-middle">
                            {editingActivityId === activity.id ? (
                              <input
                                name="activity_type"
                                className="form-control form-control-sm"
                                value={editingForm.activity_type}
                                onChange={handleEditChange}
                              />
                            ) : (
                              <span className="badge bg-light text-dark">{activity.activity_type}</span>
                            )}
                          </td>
                          <td className="text-center align-middle">
                            {editingActivityId === activity.id ? (
                              <input
                                name="duration"
                                type="number"
                                min="1"
                                className="form-control form-control-sm"
                                value={editingForm.duration}
                                onChange={handleEditChange}
                              />
                            ) : (
                              <strong>{activity.duration}</strong>
                            )}
                          </td>
                          <td className="text-center align-middle">
                            {editingActivityId === activity.id ? (
                              <input
                                name="calories"
                                type="number"
                                min="0"
                                step="0.1"
                                className="form-control form-control-sm"
                                value={editingForm.calories}
                                onChange={handleEditChange}
                              />
                            ) : (
                              <strong className="text-danger">{activity.calories}</strong>
                            )}
                          </td>
                          <td className="align-middle">
                            {editingActivityId === activity.id ? (
                              <input
                                name="date"
                                type="date"
                                className="form-control form-control-sm"
                                value={editingForm.date || ''}
                                onChange={handleEditChange}
                              />
                            ) : (
                              activity.date ? new Date(activity.date).toLocaleDateString() : '—'
                            )}
                          </td>
                          <td className="text-center align-middle">
                            {(() => {
                              const canEdit = isAdmin || activity.user === currentUser?.username;
                              if (!canEdit) return <span className="text-muted">—</span>;
                              return editingActivityId === activity.id ? (
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleUpdateActivity(activity.id)}
                                  disabled={saving}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={cancelEditActivity}
                                  disabled={saving}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => startEditActivity(activity)}
                                  disabled={saving}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteActivity(activity.id)}
                                  disabled={saving}
                                >
                                  Delete
                                </button>
                              </div>
                            );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
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
