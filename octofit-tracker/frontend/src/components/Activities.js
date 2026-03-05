import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, requestJson } from '../api';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
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
  const [form, setForm] = useState({
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
      await requestJson(`${getApiBaseUrl()}/activities/`, {
        method: 'POST',
        body: JSON.stringify({
          activity_type: form.activity_type,
          duration: Number(form.duration),
          calories: Number(form.calories),
          date: form.date,
        }),
      });
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
    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/activities/${activityId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          activity_type: editingForm.activity_type,
          duration: Number(editingForm.duration),
          calories: Number(editingForm.calories),
          date: editingForm.date,
        }),
      });
      cancelEditActivity();
      await fetchActivities();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Delete this activity?')) {
      return;
    }

    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/activities/${activityId}/`, {
        method: 'DELETE',
      });
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
                    value={filters.user}
                    onChange={handleFilterChange}
                  />
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
            <div className="col-md-3">
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
            <div className="col-md-3">
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
          <strong>No data available</strong> - No activities found. Please check the backend API.
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
                            <span className="badge bg-warning text-dark">{activity.id || index + 1}</span>
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
                            {editingActivityId === activity.id ? (
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
                            )}
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
    </div>
  );
};

export default Activities;
