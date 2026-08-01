import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, FileEdit, Terminal, LogIn, LogOut, UserCheck, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import IncidentForm from './components/IncidentForm';
import AnalystWorkspace from './components/AnalystWorkspace';
import AuthModal from './components/AuthModal';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeUser, setActiveUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  useEffect(() => {
    // Read saved user session from localStorage
    const savedUser = localStorage.getItem('soc_active_user');
    if (savedUser) {
      try {
        setActiveUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('soc_active_user');
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setActiveUser(user);
    localStorage.setItem('soc_active_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setActiveUser(null);
    localStorage.removeItem('soc_active_user');
    if (activeTab === 'workspace') {
      setActiveTab('dashboard');
    }
  };

  const openLoginModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="logo-container">
            <Shield className="logo-icon" size={28} />
            <span className="logo-text">SOC PORTAL</span>
          </div>

          <nav>
            <ul className="nav-links">
              <li>
                <div 
                  className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={18} />
                  <span>Контролна табла</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('report')}
                >
                  <FileEdit size={18} />
                  <span>Пријави инцидент</span>
                </div>
              </li>
              
              {/* Show analyst workspace if logged in role is ANALITICAR or MENADZER */}
              {activeUser && (activeUser.uloga === 'ANALITICAR' || activeUser.uloga === 'MENADZER') && (
                <li>
                  <div 
                    className={`nav-item ${activeTab === 'workspace' ? 'active' : ''}`}
                    onClick={() => setActiveTab('workspace')}
                  >
                    <Terminal size={18} />
                    <span>SOC Аналитичари</span>
                  </div>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* Sidebar Footer System Info */}
        <div className="sidebar-footer">
          <div className="system-status-badge">
            <span className="status-dot"></span> PostgreSQL & Odoo Active
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navigation Header */}
        <header className="top-header">
          <div className="header-title">
            <h1>Информациски систем за безбедносни инциденти</h1>
            <span className="header-subtitle">Security Operations Center (SOC) Portal</span>
          </div>

          <div className="header-user-profile">
            {activeUser ? (
              <div className="user-profile-badge">
                <div className="avatar-circle">
                  {activeUser.ime ? activeUser.ime.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <div className="user-info">
                  <span className="user-name">{activeUser.ime} {activeUser.prezime}</span>
                  <span className="user-role">{activeUser.uloga}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Одјави се">
                  <LogOut size={16} />
                  <span>Одјави се</span>
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="login-header-btn" onClick={() => openLoginModal('login')}>
                  <LogIn size={16} />
                  <span>Најава</span>
                </button>
                <button className="register-header-btn" onClick={() => openLoginModal('register')}>
                  <UserCheck size={16} />
                  <span>Регистрација</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="content-pane">
          {activeTab === 'dashboard' && <Dashboard activeRole={activeUser ? activeUser.uloga : 'KORISNIK'} />}
          {activeTab === 'report' && (
            <IncidentForm 
              activeUser={activeUser}
              onRequireLogin={() => openLoginModal('login')}
            />
          )}
          {activeTab === 'workspace' && activeUser && (
            <AnalystWorkspace 
              activeRole={activeUser.uloga} 
              activeUser={activeUser}
            />
          )}
        </div>
      </main>

      {/* Login & Register Modal Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialTab={authModalTab}
      />
    </div>
  );
}
