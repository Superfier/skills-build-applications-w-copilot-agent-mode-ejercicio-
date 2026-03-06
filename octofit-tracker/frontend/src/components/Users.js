import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithAuth } from '../api';
import Pagination from './Pagination';
import { TableSkeleton } from './Skeleton';

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

  return (
    <div className="container mt-5 mb-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold text-dark">
            <i className="bi bi-people-fill me-2"></i>Users
          </h1>
          <p className="lead text-muted">Manage and view all registered users</p>
          <div className="input-group mb-3" style={{ maxWidth: 400 }}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Search by username..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button className="btn btn-outline-secondary" type="button" onClick={() => setSearch('')}>Clear</button>}
          </div>
        </div>
      </div>

      {loading && (
        <TableSkeleton rows={5} cols={5} headerColor="primary" title="Loading Users..." />
      )}

      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          <strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>No data available</strong> - No users found. Please check the backend API.
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && !error && users.length > 0 && (() => {
        const filtered = search ? users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase())) : users;
        return (<>
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  <i className="bi bi-list-check me-2"></i>User List ({filtered.length})
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="text-center" style={{ width: '60px' }}>ID</th>
                        <th scope="col">Username</th>
                        <th scope="col">Email</th>
                        <th scope="col">First Name</th>
                        <th scope="col">Last Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((user, index) => (
                        <tr key={user.id || user.username || index}>
                          <td className="text-center align-middle">
                            <span className="badge bg-secondary">{user.id || user.username || index + 1}</span>
                          </td>
                          <td className="align-middle">
                            <strong>{user.username}</strong>
                          </td>
                          <td className="align-middle">{user.email}</td>
                          <td className="align-middle">{user.first_name || '—'}</td>
                          <td className="align-middle">{user.last_name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Pagination
          page={page}
          hasNext={!!pagination.next}
          hasPrev={!!pagination.previous}
          total={pagination.count}
          onPageChange={setPage}
        />
        </>);
      })()}
    </div>
  );
};

export default Users;
