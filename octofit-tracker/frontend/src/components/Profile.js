import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, requestJson } from '../api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const data = await requestJson(`${getApiBaseUrl()}/auth/me/`);
      setUser(data);
      setForm({ first_name: data.first_name || '', last_name: data.last_name || '', email: data.email || '' });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess('');
    try {
      const data = await requestJson(`${getApiBaseUrl()}/auth/me/`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setUser(data);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
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
            <i className="bi bi-person-circle me-2"></i>My Profile
          </h1>
          <p className="lead text-muted">View and edit your personal information</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading profile...</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i><strong>Error!</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>{success}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {!loading && user && (
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0"><i className="bi bi-pencil-square me-2"></i>Edit Profile</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted">Username</label>
                  <input className="form-control" value={user.username} disabled />
                  <small className="text-muted">Username cannot be changed</small>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="profile-first-name">First Name</label>
                    <input id="profile-first-name" className="form-control" name="first_name" value={form.first_name} onChange={handleChange} maxLength={150} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="profile-last-name">Last Name</label>
                    <input id="profile-last-name" className="form-control" name="last_name" value={form.last_name} onChange={handleChange} maxLength={150} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="profile-email">Email</label>
                    <input id="profile-email" type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
