import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR } from './constants';

export default function Profile({ user, onUpdate }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', address: '', dateOfBirth: '', avatar: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile({ user }) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/chat');
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
        avatar: user.avatar || ''
      });
    }
  }, [user, navigate]);

  if (!user) return null;
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAvatarUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=77e2e30d9f873158f6e93e44cc303cb8`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        setForm(f => ({ ...f, avatar: data.data.url }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      localStorage.setItem('user', JSON.stringify(data));
      onUpdate?.(data);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="profile-container">
      <form className="profile-card" onSubmit={handleSubmit}>
        <img className="profile-avatar" src={form.avatar || DEFAULT_AVATAR} alt="avatar" />
        <input type="file" accept="image/*" onChange={handleAvatarUpload} />
        <input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} />
        <input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} />
        <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>Save</button>
        <button type="button" onClick={() => navigate('/chat')}>Back to Chat</button>
      </form>
  return (
    <div className="profile-container">
      <div className="profile-card">
        <img className="profile-avatar" src={user.avatar || '/default-avatar.png'} alt="avatar" />
        <h2 className="profile-name">{user.firstName || user.email}</h2>
        <p className="profile-email">{user.email}</p>
        <button className="profile-back" onClick={handleBack}>Back to Chat</button>
      </div>
    </div>
  );
}
