import React, { useState, useEffect } from 'react';

const Workouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const codespaceName = process.env.REACT_APP_CODESPACE_NAME;
        const apiUrl = codespaceName
          ? `https://${codespaceName}-8000.app.github.dev/api/workouts/`
          : 'http://localhost:8000/api/workouts/';
        console.log('Fetching workouts from:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Workouts data:', data);
        
        // Handle both paginated (.results) and plain array responses
        const workoutsList = data.results || data;
        setWorkouts(Array.isArray(workoutsList) ? workoutsList : []);
        setError(null);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setError(error.message);
        setWorkouts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  const getDifficultyColor = (difficulty) => {
    const level = difficulty?.toLowerCase();
    if (level === 'easy') return 'success';
    if (level === 'medium') return 'warning';
    if (level === 'hard') return 'danger';
    return 'secondary';
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold text-dark">
            <i className="bi bi-dumbbell me-2"></i>Workouts
          </h1>
          <p className="lead text-muted">Explore personalized workout suggestions</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading workouts...</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          <strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && workouts.length === 0 && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>No data available</strong> - No workouts found. Please check the backend API.
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && workouts.length > 0 && (
        <div className="row">
          {workouts.map((workout) => (
            <div key={workout.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm border-0 workout-card">
                <div className={`card-header bg-${getDifficultyColor(workout.difficulty)} text-white`}>
                  <h5 className="card-title mb-0">{workout.name}</h5>
                </div>
                <div className="card-body">
                  <p className="card-text text-muted">{workout.description}</p>
                  <div className="mb-3">
                    <span className={`badge bg-${getDifficultyColor(workout.difficulty)}`}>
                      {workout.difficulty}
                    </span>
                  </div>
                  {workout.suggested_for && workout.suggested_for.length > 0 && (
                    <div className="alert alert-light border border-secondary py-2 px-3 mb-0">
                      <i className="bi bi-people-fill me-2"></i>
                      <small className="text-muted">
                        Suggested for <strong>{workout.suggested_for.length}</strong> user{workout.suggested_for.length !== 1 ? 's' : ''}
                      </small>
                    </div>
                  )}
                </div>
                <div className="card-footer bg-light">
                  <button className="btn btn-primary btn-sm w-100" disabled>
                    <i className="bi bi-play-fill me-2"></i>Start Workout
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workouts;
