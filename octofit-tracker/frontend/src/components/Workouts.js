import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, requestJson } from '../api';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';
import { CardSkeleton } from './Skeleton';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const Workouts = ({ isAdmin = false }) => {
  const addToast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', difficulty: 'Medium' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', difficulty: '' });
  const [suggestions, setSuggestions] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchWorkouts = useCallback(async () => {
    try {
      const data = await requestJson(`${getApiBaseUrl()}/workouts/`);
      const list = data.results || data;
      setWorkouts(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const data = await requestJson(`${getApiBaseUrl()}/workouts/suggestions/`);
      setSuggestions(data);
    } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => { fetchWorkouts(); fetchSuggestions(); }, [fetchWorkouts, fetchSuggestions]);

  const getDifficultyColor = (difficulty) => {
    const level = difficulty?.toLowerCase();
    if (level === 'easy') return 'success';
    if (level === 'medium') return 'warning';
    if (level === 'hard') return 'danger';
    return 'secondary';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/workouts/`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ name: '', description: '', difficulty: 'Medium' });
      addToast('Workout created!');
      await fetchWorkouts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (w) => {
    setEditingId(w.id);
    setEditForm({ name: w.name, description: w.description, difficulty: w.difficulty });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '', difficulty: '' });
  };

  const handleUpdate = async (id) => {
    const encoded = encodeURIComponent(String(id));
    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/workouts/${encoded}/`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      cancelEdit();
      addToast('Workout updated!');
      await fetchWorkouts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const executeDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/workouts/${encodeURIComponent(String(id))}/`, { method: 'DELETE' });
      if (editingId === id) cancelEdit();
      addToast('Workout deleted.', 'warning');
      await fetchWorkouts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold text-dark">
            <i className="bi bi-dumbbell me-2"></i>Workouts
          </h1>
          <p className="lead text-muted">{isAdmin ? 'Create and manage workout routines' : 'Browse workout routines'}</p>

          {isAdmin && (
          <form className="row g-2 mt-2" onSubmit={handleCreate}>
            <div className="col-md-3">
              <input className="form-control" placeholder="Workout name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required maxLength={100} />
            </div>
            <div className="col-md-4">
              <input className="form-control" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-warning" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </form>
          )}
        </div>
      </div>

      {loading && <CardSkeleton count={3} />}

      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i><strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && workouts.length === 0 && (
        <div className="alert alert-info"><i className="bi bi-info-circle-fill me-2"></i>No workouts found. Create one above!</div>
      )}

      {suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-info text-white">
            <h6 className="mb-0"><i className="bi bi-lightbulb-fill me-2"></i>Recommended for You (Level: {suggestions.difficulty_level})</h6>
          </div>
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              Based on {suggestions.stats.total_activities} activities, {suggestions.stats.total_calories} total calories (avg {suggestions.stats.avg_calories}/activity)
            </small>
            <div className="d-flex flex-wrap gap-2">
              {suggestions.suggestions.map((s) => (
                <span key={s.id} className={`badge bg-${getDifficultyColor(s.difficulty)} px-3 py-2`}>
                  {s.name} ({s.difficulty})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && workouts.length > 0 && (
        <div className="row">
          {workouts.map((workout, index) => {
            const isEditing = editingId === workout.id;
            return (
              <div key={workout.id || index} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm border-0 workout-card">
                  <div className={`card-header bg-${getDifficultyColor(isEditing ? editForm.difficulty : workout.difficulty)} text-white d-flex justify-content-between align-items-center`}>
                    {isEditing ? (
                      <input className="form-control form-control-sm bg-transparent text-white border-white" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                    ) : (
                      <h5 className="card-title mb-0">{workout.name}</h5>
                    )}
                  </div>
                  <div className="card-body">
                    {isEditing ? (
                      <>
                        <textarea className="form-control mb-2" rows={2} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
                        <select className="form-select form-select-sm" value={editForm.difficulty} onChange={(e) => setEditForm((p) => ({ ...p, difficulty: e.target.value }))}>
                          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </>
                    ) : (
                      <>
                        <p className="card-text text-muted">{workout.description}</p>
                        <span className={`badge bg-${getDifficultyColor(workout.difficulty)}`}>{workout.difficulty}</span>
                        {workout.suggested_for && workout.suggested_for.length > 0 && (
                          <div className="alert alert-light border border-secondary py-2 px-3 mt-2 mb-0">
                            <i className="bi bi-people-fill me-2"></i>
                            <small className="text-muted">Suggested for <strong>{workout.suggested_for.length}</strong> user{workout.suggested_for.length !== 1 ? 's' : ''}</small>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {isAdmin && (
                  <div className="card-footer bg-light d-flex gap-2">
                    {isEditing ? (
                      <>
                        <button className="btn btn-primary btn-sm flex-fill" onClick={() => handleUpdate(workout.id)} disabled={saving}>Save</button>
                        <button className="btn btn-secondary btn-sm flex-fill" onClick={cancelEdit} disabled={saving}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-outline-primary btn-sm flex-fill" onClick={() => startEdit(workout)} disabled={saving}>
                          <i className="bi bi-pencil me-1"></i>Edit
                        </button>
                        <button className="btn btn-outline-danger btn-sm flex-fill" onClick={() => handleDelete(workout.id)} disabled={saving}>
                          <i className="bi bi-trash me-1"></i>Delete
                        </button>
                      </>
                    )}
                  </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        show={confirmDelete !== null}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Workouts;
