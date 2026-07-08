import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, FileEdit, UserCheck, Terminal } from 'lucide-react';
import Dashboard from './components/Dashboard';
import IncidentForm from './components/IncidentForm';
import AnalystWorkspace from './components/AnalystWorkspace';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    // Fetch users seeded from Database
    fetch('http://localhost:8080/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (data.length > 0) {
          // Default to the first analyst (Kristijan Peshevski)
          const defaultAnalyst = data.find(u => u.uloga === 'ANALITICAR') || data[0];
          setActiveUser(defaultAnalyst);
        }
      })
      .catch(err => console.error("Грешка при влечење на корисници:", err));
  }, []);

  const handleUserChange = (e) => {
    const userId = parseInt(e.target.value);
    const user = users.find(u => u.id === userId);
    if (user) {
      setActiveUser(user);
    }
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
              
              {/* Show analyst workspace if role is ANALITICAR or MENADZER */}
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

        {/* User Role Simulation Panel */}
        <div className="role-selector">
          <label className="role-label">
            <UserCheck size={12} style={{ marginRight: '4px' }} />
            Симулација на Корисник
          </label>
          <select 
            className="role-select" 
            value={activeUser ? activeUser.id : ''} 
            onChange={handleUserChange}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.ime} {u.prezime} ({u.uloga})
              </option>
            ))}
          </select>
          {activeUser && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px', paddingLeft: '4px' }}>
              Улога: <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{activeUser.uloga}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard activeRole={activeUser ? activeUser.uloga : 'KORISNIK'} />}
        {activeTab === 'report' && <IncidentForm />}
        {activeTab === 'workspace' && (
          <AnalystWorkspace 
            activeRole={activeUser ? activeUser.uloga : 'KORISNIK'} 
            activeUser={activeUser}
          />
        )}
      </main>
    </div>
  );
}
