import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithAuth } from '../api';
import Pagination from './Pagination';
import { CardSkeleton } from './Skeleton';

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

const Users = ({ isAdmin = false }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ next: null, previous: null, count: null });
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = `${getApiBaseUrl()}/users/?page=${page}`;
      const response = await fetchWithAuth(apiUrl);
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized. Please login first.');
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.results) {
        setUsers(data.results);
        setPagination({ next: data.next, previous: data.previous, count: data.count });
      } else {
        const list = Array.isArray(data) ? data : [];
        setUsers(list);
        setPagination({ next: null, previous: null, count: list.length });
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = search
    ? users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="d-flex align-items-center mb-1">
        <div className="user-icon-circle me-3">
          <i className="bi bi-people-fill"></i>
        </div>
        <div>
          <h1 className="display-6 fw-bold mb-0">Users</h1>
          <p className="text-muted mb-0">Manage and view all registered users</p>
        </div>
      </div>

      <div className="mt-3">
        {/* Search */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body py-3">
          <div className="input-group">
            <span className="input-group-text bg-transparent border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input className="form-control border-start-0 shadow-none" placeholder="Search by username or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button className="btn btn-outline-secondary" type="button" onClick={() => setSearch('')}><i className="bi bi-x-lg"></i></button>}
          </div>
          </div>
        </div>

        {loading && <CardSkeleton count={4} />}

        {error && !loading && (
          <div className="alert alert-danger"><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="card border-0 shadow-sm text-center py-5">
            <i className="bi bi-person-x fs-1 text-muted"></i>
            <p className="text-muted mt-2 mb-0">No users found.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="text-muted small mb-3"><strong>{filtered.length}</strong> user{filtered.length !== 1 ? 's' : ''}</p>
            <div className="row g-3">
              {filtered.map((user, index) => {
                const gradient = GRADIENTS[index % GRADIENTS.length];
                return (
                  <div key={user.id || user.username || index} className="col-sm-6 col-lg-4 col-xl-3">
                    <div className="card border-0 shadow-sm h-100 user-card-hover" style={{ overflow: 'hidden' }}>
                      {/* Colored header strip */}
                      <div style={{ height: 6, background: gradient }}></div>
                      <div className="card-body text-center pt-4 pb-3">
                        <div className="user-avatar-circle mx-auto mb-3" style={{ background: gradient }}>
                          {(user.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <h6 className="fw-bold mb-0">{user.username}</h6>
                        <small className="text-muted d-block mb-3">{user.email || 'No email'}</small>
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                          {user.first_name && (
                            <span className="user-stat-chip">
                              <i className="bi bi-person-fill me-1 text-primary"></i>{user.first_name}
                            </span>
                          )}
                          {user.last_name && (
                            <span className="user-stat-chip">
                              <i className="bi bi-person-fill me-1 text-primary"></i>{user.last_name}
                            </span>
                          )}
                          {user.is_staff && (
                            <span className="user-stat-chip" style={{ background: 'rgba(255,193,7,0.15)', color: '#856404' }}>
                              <i className="bi bi-shield-fill-check me-1"></i>Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              page={page}
              hasNext={!!pagination.next}
              hasPrev={!!pagination.previous}
              total={pagination.count}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Users;
