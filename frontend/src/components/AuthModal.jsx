import React, { useState } from 'react';
import { X, LogIn, UserPlus, Shield, Lock, Mail, User, Briefcase } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialTab = 'login' }) {
  const [isLoginTab, setIsLoginTab] = useState(initialTab === 'login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regIme, setRegIme] = useState('');
  const [regPrezime, setRegPrezime] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUloga, setRegUloga] = useState('KORISNIK');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, lozinka: loginPassword })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(typeof data === 'string' ? data : (data?.message || 'Погрешни податоци за најава.'));
      }

      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Грешка при најавување.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ime: regIme,
          prezime: regPrezime,
          email: regEmail,
          lozinka: regPassword,
          uloga: regUloga
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(typeof data === 'string' ? data : (data?.message || 'Грешка при регистрација.'));
      }

      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Грешка при регистрација.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="auth-modal-content">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="auth-modal-header">
          <Shield className="auth-logo-icon" size={32} />
          <h2>SOC PORTAL — АВТЕНТИКАЦИЈА</h2>
          <p>Внесете ги вашите пристапни податоци за безбеден пристап</p>
        </div>

        {/* Auth Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLoginTab ? 'active' : ''}`}
            onClick={() => { setIsLoginTab(true); setError(''); }}
          >
            <LogIn size={16} />
            <span>Најава</span>
          </button>
          <button
            className={`auth-tab ${!isLoginTab ? 'active' : ''}`}
            onClick={() => { setIsLoginTab(false); setError(''); }}
          >
            <UserPlus size={16} />
            <span>Регистрација</span>
          </button>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        {/* Login Form */}
        {isLoginTab ? (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="input-group">
              <label><Mail size={14} /> Е-пошта</label>
              <input
                type="email"
                required
                placeholder="вашата.епошта@finki.ukim.mk"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label><Lock size={14} /> Лозинка</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Најавување...' : 'Најави се'}
            </button>

            <div className="auth-demo-hint">
              <strong>Демо пристап со лозинка: <code>postgres</code></strong><br/>
              • <code>kristijan.peshevski@finki.ukim.mk</code> (Аналитичар)<br/>
              • <code>gorgi.siveski@finki.ukim.mk</code> (Аналитичар)<br/>
              • <code>profesor.mis@finki.ukim.mk</code> (Менаџер)
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <div className="form-row">
              <div className="input-group">
                <label><User size={14} /> Име</label>
                <input
                  type="text"
                  required
                  placeholder="Име"
                  value={regIme}
                  onChange={(e) => setRegIme(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label><User size={14} /> Презиме</label>
                <input
                  type="text"
                  required
                  placeholder="Презиме"
                  value={regPrezime}
                  onChange={(e) => setRegPrezime(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label><Mail size={14} /> Е-пошта</label>
              <input
                type="email"
                required
                placeholder="вашата.епошта@company.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label><Lock size={14} /> Лозинка</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label><Briefcase size={14} /> Улога во системот</label>
              <select
                value={regUloga}
                onChange={(e) => setRegUloga(e.target.value)}
              >
                <option value="KORISNIK">Корисник (Пријавувач на инциденти)</option>
                <option value="ANALITICAR">SOC Аналитичар</option>
                <option value="MENADZER">Менаџер</option>
              </select>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Регистрирање...' : 'Креирај профил'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
