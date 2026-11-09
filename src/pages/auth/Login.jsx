import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiBarChart2,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUsers,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isEmailValid } from '../../utils/helpers';

const DEMOS = [
  { label: 'Admin', email: 'admin@ems.com', password: 'Admin@123', note: 'Full access' },
  { label: 'HR', email: 'hr@ems.com', password: 'Hr@123', note: 'People operations' },
  { label: 'Employee', email: 'employee@ems.com', password: 'Emp@123', note: 'Self service' },
];

export default function Login() {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from || '/dashboard';

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your email address.');
    if (!isEmailValid(email)) return setError('Please enter a valid email address.');
    if (!password) return setError('Please enter your password.');

    setSubmitting(true);
    try {
      const loggedIn = login(email, password, remember);
      showToast(`Welcome back, ${loggedIn.name.split(' ')[0]}!`, 'success');
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  return (
    <div className="login-page">
      <section className="login-banner">
        <div className="login-brand">
          <span className="brand-mark brand-mark--light">E</span>
          <div>
            <strong>EMS</strong>
            <span>Employee Management System</span>
          </div>
        </div>

        <div className="login-banner-copy">
          <span className="login-kicker">People operations, simplified</span>
          <h1>Everything your HR team needs, in one place.</h1>
          <p>
            A modern HRMS workspace for employee records, attendance, leave approvals, department
            structure and workforce analytics.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <span><FiUsers /></span>
              <div>
                <strong>Employee directory</strong>
                <p>Profiles, documents and reporting lines in one view.</p>
              </div>
            </div>
            <div className="login-feature">
              <span><FiBarChart2 /></span>
              <div>
                <strong>Live workforce insights</strong>
                <p>Attendance trends, joinings and leave analytics.</p>
              </div>
            </div>
            <div className="login-feature">
              <span><FiShield /></span>
              <div>
                <strong>Role-based access</strong>
                <p>Admin, HR and employee workspaces with scoped permissions.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="login-banner-footer">Nexora Technologies Pvt. Ltd. · HRMS Proof of Concept</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-head">
            <span className="login-mobile-brand">
              <span className="brand-mark">E</span> EMS
            </span>
            <h2>Sign in to your workspace</h2>
            <p>Use your work email and password to continue.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error ? <div className="form-alert">{error}</div> : null}

            <div className="field">
              <label className="field-label" htmlFor="login-email">Email Address</label>
              <div className="input-with-icon">
                <FiMail />
                <input
                  id="login-email"
                  type="email"
                  className="field-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <div className="field-label-row">
                <label className="field-label" htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => showToast('Demo environment: use one of the accounts below to sign in.', 'info')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-with-icon">
                <FiLock />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="field-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Remember me for 30 days</span>
            </label>

            <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg login-submit" disabled={submitting}>
              {submitting ? <span className="btn-spinner" /> : <FiArrowRight />}
              <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>

          <div className="demo-block">
            <p className="demo-title">Demo credentials</p>
            <div className="demo-grid">
              {DEMOS.map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  className="demo-chip"
                  onClick={() => fillDemo(demo)}
                >
                  <strong>{demo.label}</strong>
                  <span>{demo.email}</span>
                  <small>{demo.note}</small>
                </button>
              ))}
            </div>
            <p className="demo-hint">Click a role to auto-fill its credentials, then sign in.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
