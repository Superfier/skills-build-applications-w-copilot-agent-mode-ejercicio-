import React, { useState, useEffect } from 'react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const codespaceUrl = process.env.REACT_APP_CODESPACE_NAME 
          ? `https://${process.env.REACT_APP_CODESPACE_NAME}-8000.app.github.dev`
          : 'http://localhost:8000';
        
        const apiUrl = `${codespaceUrl}/api/leaderboard/`;
        console.log('Fetching leaderboard from:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Leaderboard data:', data);
        
        // Handle both paginated (.results) and plain array responses
        const leaderboardList = data.results || data;
        const sortedList = Array.isArray(leaderboardList) 
          ? leaderboardList.sort((a, b) => b.score - a.score) 
          : [];
        setLeaderboard(sortedList);
        setError(null);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError(error.message);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getMedalIcon = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `${rank + 1}`;
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold text-dark">
            <i className="bi bi-trophy-fill me-2"></i>Leaderboard
          </h1>
          <p className="lead text-muted">Compete with your team and climb the rankings</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading leaderboard...</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          <strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>No data available</strong> - No leaderboard data found. Please check the backend API.
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-danger text-white">
                <h5 className="card-title mb-0">
                  <i className="bi bi-list-check me-2"></i>Team Rankings ({leaderboard.length})
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="text-center" style={{ width: '80px' }}>Rank</th>
                        <th scope="col">Team</th>
                        <th scope="col" className="text-center">Score</th>
                        <th scope="col">Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, index) => (
                        <tr 
                          key={entry.id} 
                          className={index === 0 ? 'table-success' : index === 1 ? 'table-info' : index === 2 ? 'table-warning' : ''}
                        >
                          <td className="text-center align-middle">
                            <div className="d-flex align-items-center justify-content-center">
                              {index < 3 ? (
                                <span className="fs-4">{getMedalIcon(index)}</span>
                              ) : (
                                <span className="badge bg-secondary">#{index + 1}</span>
                              )}
                            </div>
                          </td>
                          <td className="align-middle">
                            <strong>{entry.team}</strong>
                          </td>
                          <td className="text-center align-middle">
                            <h5 className="mb-0">
                              <span className="badge bg-primary">{entry.score}</span>
                            </h5>
                          </td>
                          <td className="align-middle">
                            <small className="text-muted">
                              {entry.week ? new Date(entry.week).toLocaleDateString() : '—'}
                            </small>
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

export default Leaderboard;
