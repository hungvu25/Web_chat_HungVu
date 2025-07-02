import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from './constants.js';

export default function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.firstName) return 'First name is required.';
    if (!form.lastName) return 'Last name is required.';
    if (!form.gender) return 'Gender is required.';
    if (!form.email || !form.password) return 'Email and password are required.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Invalid email format.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) return setError(err);
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        {error && <div className="error">{error}</div>}
        <input 
          name="firstName" 
          type="text" 
          placeholder="First Name" 
          value={form.firstName} 
          onChange={handleChange} 
          style={{ color: 'black', width: '100%', background: '#fff' }} 
        />
        <input 
          name="lastName" 
          type="text" 
          placeholder="Last Name" 
          value={form.lastName} 
          onChange={handleChange} 
          style={{ color: 'black', width: '100%', background: '#fff' }} 
        />
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          style={{
            color: form.gender ? 'black' : '#888',
            width: '100%',
            padding: '0.6em 1em',
            borderRadius: 8,
            border: '1.5px solid #e0e7ff',
            fontSize: '1em',
            background: '#fff',
            marginBottom: 0,
            marginTop: 0,
            height: '44px',
            boxSizing: 'border-box',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            display: 'block',
          }}
        >
          <option value="" disabled hidden>Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          value={form.email} 
          onChange={handleChange} 
          style={{ color: 'black', width: '100%', background: '#fff' }} 
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Password" 
          value={form.password} 
          onChange={handleChange} 
          style={{ color: 'black', width: '100%', background: '#fff' }} 
        />
        <button type="submit">Register</button>
        <div className="auth-links">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </form>
    </div>
  );
}
