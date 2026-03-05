import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, requestJson } from '../api';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');

  const fetchTeams = useCallback(async () => {
    try {
      const data = await requestJson(`${getApiBaseUrl()}/teams/`);

      // Handle both paginated (.results) and plain array responses
      const teamsList = data.results || data;
      setTeams(Array.isArray(teamsList) ? teamsList : []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError.message);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    if (!teamName.trim()) {
      return;
    }

    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/teams/`, {
        method: 'POST',
        body: JSON.stringify({ name: teamName.trim() }),
      });
      setTeamName('');
      await fetchTeams();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name || '');
  };

  const cancelEdit = () => {
    setEditingTeamId(null);
    setEditingTeamName('');
  };

  const handleUpdateTeam = async (teamId) => {
    if (!editingTeamName.trim()) {
      return;
    }

    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/teams/${teamId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editingTeamName.trim() }),
      });
      cancelEdit();
      await fetchTeams();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team?')) {
      return;
    }

    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/teams/${teamId}/`, {
        method: 'DELETE',
      });
      if (editingTeamId === teamId) {
        cancelEdit();
      }
      await fetchTeams();
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
            <i className="bi bi-diagram-3-fill me-2"></i>Teams
          </h1>
          <p className="lead text-muted">Manage and view all teams</p>
          <form className="mt-3" onSubmit={handleCreateTeam}>
            <div className="input-group">
              <input
                className="form-control"
                placeholder="New team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={100}
                required
              />
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving ? 'Creating...' : 'Create Team'}
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
          <p className="mt-3 text-muted">Loading teams...</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          <strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && teams.length === 0 && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>No data available</strong> - No teams found. Please check the backend API.
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && teams.length > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <i className="bi bi-list-check me-2"></i>Team List ({teams.length})
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="text-center" style={{ width: '60px' }}>ID</th>
                        <th scope="col">Team Name</th>
                        <th scope="col" className="text-center">Members</th>
                        <th scope="col">Created At</th>
                        <th scope="col" className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team, index) => (
                        <tr key={team.id || team.name || index}>
                          <td className="text-center align-middle">
                            <span className="badge bg-success">{team.id || index + 1}</span>
                          </td>
                          <td className="align-middle">
                            {editingTeamId === team.id ? (
                              <input
                                className="form-control form-control-sm"
                                value={editingTeamName}
                                onChange={(e) => setEditingTeamName(e.target.value)}
                                maxLength={100}
                              />
                            ) : (
                              <strong>{team.name}</strong>
                            )}
                          </td>
                          <td className="text-center align-middle">
                            <span className="badge bg-info text-dark">
                              {Array.isArray(team.members) ? team.members.length : 0}
                            </span>
                          </td>
                          <td className="align-middle">
                            {team.created_at ? new Date(team.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="text-center align-middle">
                            {editingTeamId === team.id ? (
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleUpdateTeam(team.id)}
                                  disabled={saving}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={cancelEdit}
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
                                  onClick={() => startEdit(team)}
                                  disabled={saving}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteTeam(team.id)}
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

export default Teams;
