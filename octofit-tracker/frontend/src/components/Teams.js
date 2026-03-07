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

  const GRADIENTS = [
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="d-flex align-items-center mb-1">
        <div className="team-icon-circle me-3">
          <i className="bi bi-diagram-3-fill"></i>
        </div>
        <div>
          <h1 className="display-6 fw-bold mb-0">Teams</h1>
          <p className="text-muted mb-0">Manage and view all teams</p>
        </div>
      </div>

      <div className="mt-3">
        {/* Create Team */}
        {isAdmin && (
          <div className="card border-0 shadow-sm mb-4 team-create-card">
            <div className="card-body py-3">
            <form className="d-flex gap-2" onSubmit={handleCreateTeam}>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0"><i className="bi bi-plus-circle text-muted"></i></span>
                <input className="form-control border-start-0 shadow-none" placeholder="New team name..." value={teamName} onChange={(e) => setTeamName(e.target.value)} maxLength={100} required />
              </div>
              <button className="btn btn-primary px-4" type="submit" disabled={saving}>Create</button>
            </form>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-danger"><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>
        )}

        {loading && (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            <p className="mt-3 text-muted">Loading teams...</p>
          </div>
        )}

        {!loading && !error && teams.length === 0 && (
          <div className="card border-0 shadow-sm text-center py-5">
            <i className="bi bi-people fs-1 text-muted"></i>
            <p className="text-muted mt-2 mb-0">No teams yet. {isAdmin ? 'Create one above!' : ''}</p>
          </div>
        )}

        {!loading && !error && teams.length > 0 && (
          <>
            <p className="text-muted small mb-3"><strong>{teams.length}</strong> team{teams.length !== 1 ? 's' : ''}</p>
            <div className="row g-3">
              {teams.map((team, index) => {
                const teamIdStr = String(team.id);
                const isEditing = editingTeamId === teamIdStr;
                const isExpanded = expandedTeamId === teamIdStr;
                const memberCount = Array.isArray(team.members) ? team.members.length : 0;

                return (
                  <div key={teamIdStr || team.name || index} className="col-sm-6 col-xl-4">
                    <div className="card border-0 shadow-sm h-100 team-card-hover" style={{ overflow: 'hidden' }}>
                      <div className="team-card-stripe" style={{ background: GRADIENTS[index % GRADIENTS.length] }}></div>
                      <div className="card-body">
                      <div className="d-flex align-items-start gap-3 mb-3">
                        <div className="team-avatar-circle" style={{ background: GRADIENTS[index % GRADIENTS.length] }}>
                          {(team.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          {isEditing ? (
                            <input className="form-control form-control-sm fw-bold" value={editingTeamName} onChange={(e) => setEditingTeamName(e.target.value)} maxLength={100} />
                          ) : (
                            <h6 className="fw-bold mb-1 text-truncate">{team.name}</h6>
                          )}
                          <small className="text-muted">{team.created_at ? new Date(team.created_at).toLocaleDateString() : 'No date'}</small>
                        </div>
                      </div>

                      {/* Member count toggle */}
                      <button type="button" className="btn btn-sm btn-light w-100 d-flex justify-content-between align-items-center mb-3" onClick={() => toggleExpand(team.id)}>
                        <span><i className="bi bi-person-fill me-1"></i>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                      </button>

                      {/* Expanded member section */}
                      {isExpanded && (
                        <div className="mb-3 p-2 rounded" style={{ background: 'rgba(0,0,0,0.03)' }}>
                          <div className="d-flex flex-wrap gap-1 mb-2">
                            {(Array.isArray(team.members) ? team.members : []).map((m) => (
                              <span key={m} className="badge bg-secondary d-flex align-items-center gap-1">
                                {m}
                                {isAdmin && <button type="button" className="btn-close btn-close-white" style={{ fontSize: '0.5rem' }} onClick={() => removeMember(team, m)} disabled={saving} aria-label="Remove"></button>}
                              </span>
                            ))}
                            {memberCount === 0 && <span className="text-muted small">No members yet</span>}
                          </div>
                          {isAdmin && (
                            <div className="input-group input-group-sm">
                              <input className="form-control" placeholder="Add username" value={memberInput} onChange={(e) => setMemberInput(e.target.value)} list={`user-suggestions-${teamIdStr}`} />
                              <datalist id={`user-suggestions-${teamIdStr}`}>
                                {users.filter((u) => !(team.members || []).includes(u.username)).map((u) => <option key={u.username} value={u.username} />)}
                              </datalist>
                              <button className="btn btn-success" type="button" onClick={() => addMember(team, memberInput)} disabled={saving || !memberInput.trim()}>Add</button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="d-flex justify-content-end gap-2 mt-auto">
                        {isAdmin && isEditing ? (
                          <>
                            <button type="button" className="btn btn-sm btn-primary" onClick={() => handleUpdateTeam(team.id)} disabled={saving}>Save</button>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
                          </>
                        ) : isAdmin ? (
                          <>
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => startEdit(team)} disabled={saving}><i className="bi bi-pencil"></i></button>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTeam(team.id)} disabled={saving}><i className="bi bi-trash"></i></button>
                          </>
                        ) : (() => {
                          const myUsername = currentUser?.username;
                          const isMember = Array.isArray(team.members) && myUsername && team.members.includes(myUsername);
                          return isMember ? (
                            <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => removeMember(team, myUsername)} disabled={saving}>Leave</button>
                          ) : (
                            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => addMember(team, myUsername)} disabled={saving || !myUsername}>Join</button>
                          );
                        })()}
                      </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

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
