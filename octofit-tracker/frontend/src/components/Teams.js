import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, requestJson } from '../api';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

const Teams = ({ isAdmin = false, currentUser = null }) => {
  const addToast = useToast();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [memberInput, setMemberInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await requestJson(`${getApiBaseUrl()}/teams/`);
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

  const fetchUsers = useCallback(async () => {
    try {
      const data = await requestJson(`${getApiBaseUrl()}/users/`);
      const usersList = data.results || data;
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => { fetchTeams(); fetchUsers(); }, [fetchTeams, fetchUsers]);

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
      addToast('Team created successfully!');
      await fetchTeams();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (team) => {
    setEditingTeamId(String(team.id));
    setEditingTeamName(team.name || '');
  };

  const cancelEdit = () => {
    setEditingTeamId(null);
    setEditingTeamName('');
  };

  const handleUpdateTeam = async (teamId) => {
    const encodedTeamId = encodeURIComponent(String(teamId || ''));
    if (!encodedTeamId) {
      setError('Unable to update team: missing team identifier.');
      return;
    }

    if (!editingTeamName.trim()) {
      return;
    }

    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/teams/${encodedTeamId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editingTeamName.trim() }),
      });
      cancelEdit();
      addToast('Team updated!');
      await fetchTeams();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    const encodedTeamId = encodeURIComponent(String(teamId || ''));
    if (!encodedTeamId) {
      setError('Unable to delete team: missing team identifier.');
      return;
    }

    setConfirmDelete(teamId);
  };

  const executeDeleteTeam = async () => {
    const teamId = confirmDelete;
    setConfirmDelete(null);
    const encodedTeamId = encodeURIComponent(String(teamId || ''));

    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/teams/${encodedTeamId}/`, {
        method: 'DELETE',
      });
      if (editingTeamId === teamId) cancelEdit();
      if (expandedTeamId === String(teamId)) setExpandedTeamId(null);
      addToast('Team deleted.', 'warning');
      await fetchTeams();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (teamId) => {
    setExpandedTeamId((prev) => (prev === String(teamId) ? null : String(teamId)));
    setMemberInput('');
  };

  const addMember = async (team, username) => {
    if (!username.trim()) return;
    const members = Array.isArray(team.members) ? [...team.members] : [];
    if (members.includes(username.trim())) {
      setError(`"${username.trim()}" is already a member.`);
      return;
    }
    members.push(username.trim());
    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/teams/${encodeURIComponent(String(team.id))}/`, {
        method: 'PATCH',
        body: JSON.stringify({ members }),
      });
      setMemberInput('');
      addToast(`Member added!`);
      await fetchTeams();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (team, username) => {
    const members = (Array.isArray(team.members) ? team.members : []).filter((m) => m !== username);
    setSaving(true);
    try {
      await requestJson(`${getApiBaseUrl()}/teams/${encodeURIComponent(String(team.id))}/`, {
        method: 'PATCH',
        body: JSON.stringify({ members }),
      });
      addToast('Member removed.', 'warning');
      await fetchTeams();
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
            <i className="bi bi-diagram-3-fill me-2"></i>Teams
          </h1>
          <p className="lead text-muted">Manage and view all teams</p>
          {isAdmin && (
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
              <button className="btn btn-primary" type="submit" disabled={saving}>Add</button>
            </div>
          </form>
          )}
        </div>
      </div>

      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          <strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading teams...</p>
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
                      {teams.map((team, index) => {
                        const teamIdStr = String(team.id);
                        const isEditing = editingTeamId === teamIdStr;
                        return (
                          <React.Fragment key={teamIdStr || team.name || index}>
                          <tr>
                            <td className="text-center align-middle">
                              <span className="badge bg-success">{typeof team.id === 'string' && team.id.length > 12 ? `${team.id.slice(0, 6)}...${team.id.slice(-4)}` : team.id || index + 1}</span>
                            </td>
                            <td className="align-middle">
                              {isEditing ? (
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
                              <button type="button" className="btn btn-sm btn-link p-0" onClick={() => toggleExpand(team.id)}>
                                <span className="badge bg-info text-dark">
                                  {Array.isArray(team.members) ? team.members.length : 0}
                                  <i className={`bi bi-chevron-${expandedTeamId === teamIdStr ? 'up' : 'down'} ms-1`}></i>
                                </span>
                              </button>
                            </td>
                            <td className="align-middle">
                              {team.created_at ? new Date(team.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="text-center align-middle">
                              <div className="d-flex justify-content-center gap-2">
                                {isAdmin && isEditing ? (
                                  <>
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
                                  </>
                                ) : isAdmin ? (
                                  <>
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
                                  </>
                                ) : (
                                  (() => {
                                    const myUsername = currentUser?.username;
                                    const isMember = Array.isArray(team.members) && myUsername && team.members.includes(myUsername);
                                    return isMember ? (
                                      <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => removeMember(team, myUsername)} disabled={saving}>Leave</button>
                                    ) : (
                                      <button type="button" className="btn btn-sm btn-outline-success" onClick={() => addMember(team, myUsername)} disabled={saving || !myUsername}>Join</button>
                                    );
                                  })()
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedTeamId === teamIdStr && (
                            <tr>
                              <td colSpan={5} className="bg-light">
                                <div className="p-2">
                                  <strong className="d-block mb-2">Members:</strong>
                                  <div className="d-flex flex-wrap gap-1 mb-2">
                                    {(Array.isArray(team.members) ? team.members : []).map((m) => (
                                      <span key={m} className="badge bg-secondary d-flex align-items-center gap-1">
                                        {m}
                                        {isAdmin && <button type="button" className="btn-close btn-close-white" style={{ fontSize: '0.5rem' }} onClick={() => removeMember(team, m)} disabled={saving} aria-label="Remove"></button>}
                                      </span>
                                    ))}
                                    {(!team.members || team.members.length === 0) && <span className="text-muted">No members yet</span>}
                                  </div>
                                  {isAdmin && (
                                  <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
                                    <input className="form-control" placeholder="Add username" value={memberInput} onChange={(e) => setMemberInput(e.target.value)} list="user-suggestions" />
                                    <datalist id="user-suggestions">
                                      {users.filter((u) => !(team.members || []).includes(u.username)).map((u) => <option key={u.username} value={u.username} />)}
                                    </datalist>
                                    <button className="btn btn-success" type="button" onClick={() => addMember(team, memberInput)} disabled={saving || !memberInput.trim()}>Add</button>
                                  </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        );
                      })}
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
        title="Delete Team"
        message="Are you sure you want to delete this team? This cannot be undone."
        onConfirm={executeDeleteTeam}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

export default Teams;
