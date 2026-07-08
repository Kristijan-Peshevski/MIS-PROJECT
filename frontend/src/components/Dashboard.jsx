import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield, CheckCircle, Clock, Server } from 'lucide-react';

export default function Dashboard({ activeRole }) {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatsAndRecent();
  }, []);

  const fetchStatsAndRecent = async () => {
    try {
      setLoading(true);
      const [statsRes, incidentsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/incidents')
      ]);
      const statsData = await statsRes.json();
      const incidentsData = await incidentsRes.json();
      
      setStats(statsData);
      setIncidents(incidentsData.slice(0, 5)); // Show top 5 recent
    } catch (error) {
      console.error("Грешка при влечење на податоци:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-4">Се вчитуваат податоци...</div>;
  }

  // Fallback stats if null
  const currentStats = stats || {
    total: 0,
    new: 0,
    underInvestigation: 0,
    closed: 0,
    averageResolutionTimeMinutes: 0,
    byType: {},
    byItnost: {}
  };

  const criticalIncidents = incidents.filter(inc => inc.itnost === 'KRITICNA' && inc.status !== 'CLOSED');

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="header-title">Сигурносна Контролна Табла</h1>
          <p className="header-subtitle">Преглед на безбедносната состојба и аналитика во реално време</p>
        </div>
        <button className="btn-action btn-claim" onClick={fetchStatsAndRecent} style={{ padding: '10px 18px' }}>
          Освежи
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div className="stat-header">
            <span>Вкупно Нови</span>
            <AlertTriangle size={18} className="glow-red" style={{ color: 'var(--color-danger)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{currentStats.new}</div>
        </div>

        <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div className="stat-header">
            <span>Под Истрага</span>
            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{currentStats.underInvestigation}</div>
        </div>

        <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div className="stat-header">
            <span>Решени</span>
            <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{currentStats.closed}</div>
        </div>

        <div className="glass-card stat-card" style={{ borderLeft: '4px solid #A855F7' }}>
          <div className="stat-header">
            <span>Реакција (мин)</span>
            <Clock size={18} style={{ color: '#A855F7' }} />
          </div>
          <div className="stat-value" style={{ color: '#A855F7' }}>{currentStats.averageResolutionTimeMinutes}</div>
        </div>
      </div>

      <div className="dashboard-details">
        {/* Recent Incidents */}
        <div className="glass-card critical-alerts-card">
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} style={{ color: 'var(--color-primary)' }} />
            Неодамнешни Безбедносни Инциденти
          </h3>
          {incidents.length === 0 ? (
            <p className="text-muted" style={{ padding: '20px 0' }}>Нема регистрирано инциденти.</p>
          ) : (
            incidents.map((inc) => (
              <div key={inc.incidentId} className="critical-alert-item" style={{ 
                borderLeftColor: inc.status === 'CLOSED' ? 'var(--color-success)' : inc.itnost === 'KRITICNA' ? 'var(--color-danger)' : 'var(--color-warning)'
              }}>
                <div className="critical-alert-left">
                  <span className="critical-alert-title">{inc.naslov}</span>
                  <span className="critical-alert-meta">
                    {inc.incidentId} • {inc.tipIncident} • Средство: {inc.asset.imeSredstvo}
                  </span>
                </div>
                <div className="critical-alert-right">
                  <span className={`badge ${
                    inc.status === 'CLOSED' ? 'badge-closed' : inc.status === 'UNDER_INVESTIGATION' ? 'badge-investigating' : 'badge-new'
                  }`}>
                    {inc.status === 'CLOSED' ? 'Решен' : inc.status === 'UNDER_INVESTIGATION' ? 'Истрага' : 'Нов'}
                  </span>
                  <span className={`badge ${
                    inc.itnost === 'KRITICNA' ? 'badge-kriticna' : inc.itnost === 'VISOKA' ? 'badge-visoka' : inc.itnost === 'SREDNA' ? 'badge-sredna' : 'badge-niska'
                  }`}>
                    {inc.itnost}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Charts & Analytics */}
        <div className="glass-card critical-alerts-card">
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Тип на инциденти</h3>
          <div className="chart-list">
            {['PHISHING', 'MALWARE', 'DDOS', 'UNAUTHORIZED_ACCESS'].map((type) => {
              const count = currentStats.byType[type] || 0;
              const percentage = currentStats.total > 0 ? (count / currentStats.total) * 100 : 0;
              return (
                <div key={type} className="chart-bar-container">
                  <div className="chart-bar-labels">
                    <span>{type}</span>
                    <span style={{ fontWeight: 'bold' }}>{count}</span>
                  </div>
                  <div className="chart-bar-bg">
                    <div className="chart-bar-fill" style={{ 
                      width: `${percentage}%`,
                      background: type === 'PHISHING' ? 'linear-gradient(90deg, #3B82F6, #60A5FA)' :
                                  type === 'MALWARE' ? 'linear-gradient(90deg, #EF4444, #F87171)' :
                                  type === 'DDOS' ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' :
                                  'linear-gradient(90deg, #10B981, #34D399)'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
