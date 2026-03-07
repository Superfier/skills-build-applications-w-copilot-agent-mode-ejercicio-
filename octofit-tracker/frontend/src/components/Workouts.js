import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, requestJson } from '../api';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';
import { CardSkeleton } from './Skeleton';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const getDifficultyColor = (difficulty) => {
  const level = difficulty?.toLowerCase();
  if (level === 'easy') return 'success';
  if (level === 'medium') return 'warning';
  if (level === 'hard') return 'danger';
  return 'secondary';
};

/* ───────── Workout Detail Modal ───────── */
const WorkoutDetailModal = ({ workout, show, onClose, isAdmin, onStartWorkout, addToast }) => {
  const [exercises, setExercises] = useState([]);
  const [loadingEx, setLoadingEx] = useState(false);
  const [exForm, setExForm] = useState({ name: '', sets: 3, reps: 10, duration: 0, muscle_group: '', order: 0 });
  const [savingEx, setSavingEx] = useState(false);
  const [confirmDeleteEx, setConfirmDeleteEx] = useState(null);
  const [starting, setStarting] = useState(false);
  const [editingExId, setEditingExId] = useState(null);
  const [editExForm, setEditExForm] = useState({ name: '', sets: 0, reps: 0, duration: 0, muscle_group: '' });

  const fetchExercises = useCallback(async () => {
    if (!workout) return;
    setLoadingEx(true);
    try {
      const data = await requestJson(`${getApiBaseUrl()}/exercises/?workout=${encodeURIComponent(workout.id)}`);
      setExercises(Array.isArray(data.results || data) ? (data.results || data) : []);
    } catch (_) { setExercises([]); }
    finally { setLoadingEx(false); }
  }, [workout]);

  useEffect(() => { if (show && workout) fetchExercises(); }, [show, workout, fetchExercises]);

  if (!show || !workout) return null;

  const handleAddExercise = async (e) => {
    e.preventDefault();
    setSavingEx(true);
    try {
      await requestJson(`${getApiBaseUrl()}/exercises/`, {
        method: 'POST',
        body: JSON.stringify({ ...exForm, workout: workout.id }),
      });
      setExForm({ name: '', sets: 3, reps: 10, duration: 0, muscle_group: '', order: exercises.length });
      addToast('Exercise added!');
      await fetchExercises();
    } catch (err) { addToast(err.message, 'danger'); }
    finally { setSavingEx(false); }
  };

  const handleDeleteExercise = async () => {
    const id = confirmDeleteEx;
    setConfirmDeleteEx(null);
    try {
      await requestJson(`${getApiBaseUrl()}/exercises/${encodeURIComponent(id)}/`, { method: 'DELETE' });
      addToast('Exercise removed.', 'warning');
      await fetchExercises();
    } catch (err) { addToast(err.message, 'danger'); }
  };

  const startEditEx = (ex) => {
    setEditingExId(ex.id);
    setEditExForm({ name: ex.name, sets: ex.sets, reps: ex.reps, duration: ex.duration, muscle_group: ex.muscle_group });
  };

  const cancelEditEx = () => {
    setEditingExId(null);
    setEditExForm({ name: '', sets: 0, reps: 0, duration: 0, muscle_group: '' });
  };

  const handleUpdateExercise = async (id) => {
    setSavingEx(true);
    try {
      await requestJson(`${getApiBaseUrl()}/exercises/${encodeURIComponent(id)}/`, {
        method: 'PATCH',
        body: JSON.stringify(editExForm),
      });
      cancelEditEx();
      addToast('Exercise updated!');
      await fetchExercises();
    } catch (err) { addToast(err.message, 'danger'); }
    finally { setSavingEx(false); }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStartWorkout(workout);
      onClose();
    } finally { setStarting(false); }
  };

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose}></div>
      <div className="modal d-block fade show" tabIndex="-1" onClick={onClose}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className={`modal-header bg-${getDifficultyColor(workout.difficulty)} text-white`}>
              <h5 className="modal-title"><i className="bi bi-dumbbell me-2"></i>{workout.name}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <p className="text-muted">{workout.description}</p>
              <div className="d-flex gap-3 mb-3 flex-wrap">
                <span className={`badge bg-${getDifficultyColor(workout.difficulty)} px-3 py-2`}>{workout.difficulty}</span>
                {workout.estimated_duration > 0 && <span className="badge bg-secondary px-3 py-2"><i className="bi bi-clock me-1"></i>{workout.estimated_duration} min</span>}
                {workout.estimated_calories > 0 && <span className="badge bg-secondary px-3 py-2"><i className="bi bi-fire me-1"></i>{workout.estimated_calories} cal</span>}
              </div>

              <h6 className="fw-bold mt-3 mb-2"><i className="bi bi-list-ol me-2"></i>Exercises ({exercises.length})</h6>
              {loadingEx && <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-secondary"></div></div>}
              {!loadingEx && exercises.length === 0 && <p className="text-muted small">No exercises yet.</p>}
              {!loadingEx && exercises.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Exercise</th>
                        <th>Muscle Group</th>
                        <th>Sets</th>
                        <th>Reps</th>
                        <th>Duration</th>
                        {isAdmin && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {exercises.map((ex, i) => (
                        editingExId === ex.id ? (
                          <tr key={ex.id}>
                            <td className="text-muted">{i + 1}</td>
                            <td><input className="form-control form-control-sm" value={editExForm.name} onChange={(e) => setEditExForm(p => ({ ...p, name: e.target.value }))} required /></td>
                            <td><input className="form-control form-control-sm" value={editExForm.muscle_group} onChange={(e) => setEditExForm(p => ({ ...p, muscle_group: e.target.value }))} /></td>
                            <td><input type="number" className="form-control form-control-sm" style={{width: '60px'}} value={editExForm.sets} min={1} onChange={(e) => setEditExForm(p => ({ ...p, sets: Number(e.target.value) }))} /></td>
                            <td><input type="number" className="form-control form-control-sm" style={{width: '60px'}} value={editExForm.reps} min={0} onChange={(e) => setEditExForm(p => ({ ...p, reps: Number(e.target.value) }))} /></td>
                            <td><input type="number" className="form-control form-control-sm" style={{width: '70px'}} value={editExForm.duration} min={0} onChange={(e) => setEditExForm(p => ({ ...p, duration: Number(e.target.value) }))} /></td>
                            <td className="d-flex gap-1">
                              <button className="btn btn-success btn-sm py-0 px-1" title="Save" disabled={savingEx} onClick={() => handleUpdateExercise(ex.id)}>
                                <i className="bi bi-check-lg"></i>
                              </button>
                              <button className="btn btn-outline-secondary btn-sm py-0 px-1" title="Cancel" onClick={cancelEditEx}>
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={ex.id || i}>
                            <td className="text-muted">{i + 1}</td>
                            <td className="fw-semibold">{ex.name}</td>
                            <td><span className="badge bg-light text-dark">{ex.muscle_group}</span></td>
                            <td>{ex.sets}</td>
                            <td>{ex.reps}</td>
                            <td>{ex.duration > 0 ? `${ex.duration}s` : '—'}</td>
                            {isAdmin && (
                              <td className="d-flex gap-1">
                                <button className="btn btn-outline-primary btn-sm py-0 px-1" title="Edit" onClick={() => startEditEx(ex)}>
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button className="btn btn-outline-danger btn-sm py-0 px-1" title="Delete" onClick={() => setConfirmDeleteEx(ex.id)}>
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {isAdmin && (
                <form className="row g-2 mt-2 align-items-end" onSubmit={handleAddExercise}>
                  <div className="col-md-3">
                    <input className="form-control form-control-sm" placeholder="Exercise name" value={exForm.name} onChange={(e) => setExForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="col-md-2">
                    <input className="form-control form-control-sm" placeholder="Muscle group" value={exForm.muscle_group} onChange={(e) => setExForm(p => ({ ...p, muscle_group: e.target.value }))} required />
                  </div>
                  <div className="col-md-1">
                    <input type="number" className="form-control form-control-sm" placeholder="Sets" value={exForm.sets} min={1} onChange={(e) => setExForm(p => ({ ...p, sets: Number(e.target.value) }))} />
                  </div>
                  <div className="col-md-1">
                    <input type="number" className="form-control form-control-sm" placeholder="Reps" value={exForm.reps} min={0} onChange={(e) => setExForm(p => ({ ...p, reps: Number(e.target.value) }))} />
                  </div>
                  <div className="col-md-2">
                    <input type="number" className="form-control form-control-sm" placeholder="Duration (s)" value={exForm.duration} min={0} onChange={(e) => setExForm(p => ({ ...p, duration: Number(e.target.value) }))} />
                  </div>
                  <div className="col-md-2 d-grid">
                    <button className="btn btn-success btn-sm" type="submit" disabled={savingEx}>{savingEx ? '...' : 'Add Exercise'}</button>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={handleStart} disabled={starting}>
                <i className="bi bi-play-fill me-1"></i>{starting ? 'Starting...' : 'Start Workout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={confirmDeleteEx !== null}
        title="Delete Exercise"
        message="Delete this exercise from the workout?"
        onConfirm={handleDeleteExercise}
        onCancel={() => setConfirmDeleteEx(null)}
      />
    </>
  );
};

/* ───────── Main Workouts Component ───────── */
const Workouts = ({ isAdmin = false }) => {
  const addToast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', difficulty: 'Medium', estimated_calories: 0, estimated_duration: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', difficulty: '', estimated_calories: 0, estimated_duration: 0 });
  const [suggestions, setSuggestions] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterDifficulty, setFilterDifficulty] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

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

  const filteredWorkouts = filterDifficulty
    ? workouts.filter((w) => w.difficulty === filterDifficulty)
    : workouts;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/workouts/`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ name: '', description: '', difficulty: 'Medium', estimated_calories: 0, estimated_duration: 0 });
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
    setEditForm({ name: w.name, description: w.description, difficulty: w.difficulty, estimated_calories: w.estimated_calories || 0, estimated_duration: w.estimated_duration || 0 });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '', difficulty: '', estimated_calories: 0, estimated_duration: 0 });
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

  const handleDelete = (id) => setConfirmDelete(id);

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

  const handleStartWorkout = async (workout) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await requestJson(`${getApiBaseUrl()}/activities/`, {
        method: 'POST',
        body: JSON.stringify({
          activity_type: workout.name,
          duration: workout.estimated_duration || 0,
          calories: workout.estimated_calories || 0,
          date: today,
        }),
      });
      addToast(`Workout "${workout.name}" logged as activity!`, 'success');
    } catch (err) {
      addToast(err.message, 'danger');
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
            <div className="col-md-2">
              <input className="form-control" placeholder="Workout name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required maxLength={100} />
            </div>
            <div className="col-md-3">
              <input className="form-control" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-md-1">
              <input type="number" className="form-control" placeholder="Cal" title="Estimated calories" value={form.estimated_calories} min={0} onChange={(e) => setForm((p) => ({ ...p, estimated_calories: Number(e.target.value) }))} />
            </div>
            <div className="col-md-1">
              <input type="number" className="form-control" placeholder="Min" title="Estimated duration (min)" value={form.estimated_duration} min={0} onChange={(e) => setForm((p) => ({ ...p, estimated_duration: Number(e.target.value) }))} />
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-warning" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </form>
          )}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        <button className={`btn btn-sm ${!filterDifficulty ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setFilterDifficulty(null)}>All</button>
        {DIFFICULTIES.map((d) => (
          <button key={d} className={`btn btn-sm ${filterDifficulty === d ? `btn-${getDifficultyColor(d)}` : `btn-outline-${getDifficultyColor(d)}`}`} onClick={() => setFilterDifficulty(filterDifficulty === d ? null : d)}>
            {d}
          </button>
        ))}
      </div>

      {loading && <CardSkeleton count={3} />}

      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i><strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && filteredWorkouts.length === 0 && (
        <div className="alert alert-info"><i className="bi bi-info-circle-fill me-2"></i>No workouts found.{filterDifficulty ? ' Try a different difficulty filter.' : ''}</div>
      )}

      {suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 && !filterDifficulty && (
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

      {!loading && !error && filteredWorkouts.length > 0 && (
        <div className="row">
          {filteredWorkouts.map((workout, index) => {
            const isEditing = editingId === workout.id;
            return (
              <div key={workout.id || index} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm border-0 workout-card" style={{ cursor: isEditing ? 'default' : 'pointer' }}
                  onClick={() => { if (!isEditing) setSelectedWorkout(workout); }}>
                  <div className={`card-header bg-${getDifficultyColor(isEditing ? editForm.difficulty : workout.difficulty)} text-white d-flex justify-content-between align-items-center`}>
                    {isEditing ? (
                      <input className="form-control form-control-sm bg-transparent text-white border-white" value={editForm.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                    ) : (
                      <h5 className="card-title mb-0">{workout.name}</h5>
                    )}
                  </div>
                  <div className="card-body">
                    {isEditing ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <textarea className="form-control mb-2" rows={2} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
                        <select className="form-select form-select-sm mb-2" value={editForm.difficulty} onChange={(e) => setEditForm((p) => ({ ...p, difficulty: e.target.value }))}>
                          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <div className="row g-2">
                          <div className="col-6">
                            <input type="number" className="form-control form-control-sm" placeholder="Calories" value={editForm.estimated_calories} min={0} onChange={(e) => setEditForm(p => ({ ...p, estimated_calories: Number(e.target.value) }))} />
                          </div>
                          <div className="col-6">
                            <input type="number" className="form-control form-control-sm" placeholder="Duration (min)" value={editForm.estimated_duration} min={0} onChange={(e) => setEditForm(p => ({ ...p, estimated_duration: Number(e.target.value) }))} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="card-text text-muted">{workout.description}</p>
                        <div className="d-flex gap-2 flex-wrap align-items-center">
                          <span className={`badge bg-${getDifficultyColor(workout.difficulty)}`}>{workout.difficulty}</span>
                          {workout.estimated_duration > 0 && <span className="badge bg-secondary"><i className="bi bi-clock me-1"></i>{workout.estimated_duration} min</span>}
                          {workout.estimated_calories > 0 && <span className="badge bg-secondary"><i className="bi bi-fire me-1"></i>{workout.estimated_calories} cal</span>}
                        </div>
                        {workout.exercises && workout.exercises.length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted"><i className="bi bi-list-check me-1"></i>{workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}</small>
                          </div>
                        )}
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
                  <div className="card-footer bg-light d-flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {isEditing ? (
                      <>
                        <button className="btn btn-primary btn-sm flex-fill" onClick={() => handleUpdate(workout.id)} disabled={saving}>Save</button>
                        <button className="btn btn-secondary btn-sm flex-fill" onClick={cancelEdit} disabled={saving}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-outline-primary btn-sm flex-fill" onClick={(e) => { e.stopPropagation(); startEdit(workout); }} disabled={saving}>
                          <i className="bi bi-pencil me-1"></i>Edit
                        </button>
                        <button className="btn btn-outline-danger btn-sm flex-fill" onClick={(e) => { e.stopPropagation(); handleDelete(workout.id); }} disabled={saving}>
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

      <WorkoutDetailModal
        workout={selectedWorkout}
        show={selectedWorkout !== null}
        onClose={() => setSelectedWorkout(null)}
        isAdmin={isAdmin}
        onStartWorkout={handleStartWorkout}
        addToast={addToast}
      />

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
