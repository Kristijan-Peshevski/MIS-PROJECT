import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle, Eye, AlertTriangle } from 'lucide-react';
import ResolutionForm from './ResolutionForm';

export default function AnalystWorkspace({ activeRole, activeUser }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeResolutionIncident, setActiveResolutionIncident] = useState(null);
  const [viewResolution, setViewResolution] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8080/api/incidents');
      const data = await res.json();
      setIncidents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (incidentId) => {
    if (!activeUser || activeUser.uloga !== 'ANALITICAR') {
      alert("Само регистрирани аналитичари можат да преземаат инциденти. Ве молиме изберете улога на Аналитичар во левото мени.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/incidents/${incidentId}/claim?analystId=${activeUser.id}`, {
        method: 'POST'
      });

      if (res.ok) {
        fetchIncidents();
        if (selectedIncident && selectedIncident.incidentId === incidentId) {
          // Update selected modal details
          const updatedInc = await res.json();
          setSelectedIncident(updatedInc);
        }
      } else {
        const txt = await res.text();
        alert(txt || "Грешка при преземање на тикетот.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewDetails = async (incident) => {
    setSelectedIncident(incident);
    setViewResolution(null);
    if (incident.status === 'CLOSED') {
      try {
        const res = await fetch(`http://localhost:8080/api/incidents/${incident.incidentId}/resolution`);
        if (res.ok) {
          const resData = await res.json();
          setViewResolution(resData);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filterStatus === 'ALL') return true;
    return inc.status === filterStatus;
  });

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="header-title">Работен простор за Аналитичари</h1>
          <p className="header-subtitle">Управување, класификација и санација на отворени безбедносни закани</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className="role-select" 
            style={{ width: '180px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Сите статуси</option>
            <option value="NEW">Нови инциденти</option>
            <option value="UNDER_INVESTIGATION">Под истрага</option>
            <option value="CLOSED">Затворени</option>
          </select>
          <button className="btn-action btn-claim" onClick={fetchIncidents}>Освежи</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center mt-4">Се вчитуваат инциденти...</div>
      ) : (
        <div className="workspace-table-container">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>ID на инцидент</th>
                <th>Наслов</th>
                <th>Тип</th>
                <th>Итност</th>
                <th>ИТ Средство</th>
                <th>Пријавувач</th>
                <th>Статус</th>
                <th>Доделен</th>
                <th>Акција</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted" style={{ padding: '24px' }}>
                    Нема пронајдено инциденти.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc.incidentId}>
                    <td style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{inc.incidentId}</td>
                    <td style={{ fontWeight: '500' }}>{inc.naslov}</td>
                    <td>{inc.tipIncident}</td>
                    <td>
                      <span className={`badge ${
                        inc.itnost === 'KRITICNA' ? 'badge-kriticna' : inc.itnost === 'VISOKA' ? 'badge-visoka' : inc.itnost === 'SREDNA' ? 'badge-sredna' : 'badge-niska'
                      }`}>
                        {inc.itnost}
                      </span>
                    </td>
                    <td>{inc.asset.imeSredstvo}</td>
                    <td style={{ fontSize: '0.85rem' }}>{inc.korisnik.email}</td>
                    <td>
                      <span className={`badge ${
                        inc.status === 'CLOSED' ? 'badge-closed' : inc.status === 'UNDER_INVESTIGATION' ? 'badge-investigating' : 'badge-new'
                      }`}>
                        {inc.status === 'CLOSED' ? 'Решен' : inc.status === 'UNDER_INVESTIGATION' ? 'Истрага' : 'Нов'}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {inc.dodelenAnalitichar ? `${inc.dodelenAnalitichar.ime} ${inc.dodelenAnalitichar.prezime}` : '/'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-action btn-claim" onClick={() => handleViewDetails(inc)} title="Детали">
                          <Eye size={14} />
                        </button>
                        
                        {inc.status === 'NEW' && (
                          <button className="btn-action btn-claim" onClick={() => handleClaim(inc.incidentId)}>
                            <Shield size={14} /> Преземи
                          </button>
                        )}
                        
                        {inc.status === 'UNDER_INVESTIGATION' && (
                          <button className="btn-action btn-resolve" onClick={() => setActiveResolutionIncident(inc)}>
                            <CheckCircle size={14} /> Затвори
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedIncident && (
        <div className="modal-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedIncident(null)}>X</button>
            <h2 style={{ marginBottom: '16px', color: 'var(--color-primary)' }}>Детали за инцидентот: {selectedIncident.incidentId}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem' }}>
              <div>
                <strong>Наслов:</strong> {selectedIncident.naslov}
              </div>
              <div>
                <strong>Опис:</strong>
                <p style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '6px' }}>
                  {selectedIncident.opis}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong>Тип:</strong> {selectedIncident.tipIncident}
                </div>
                <div>
                  <strong>Итност:</strong> {selectedIncident.itnost}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong>ИТ Средство:</strong> {selectedIncident.asset.imeSredstvo} ({selectedIncident.asset.ipAdresa})
                </div>
                <div>
                  <strong>Критичност на средство:</strong> {selectedIncident.asset.kritichnost}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong>Пријавувач:</strong> {selectedIncident.korisnik.ime} {selectedIncident.korisnik.prezime} ({selectedIncident.korisnik.email})
                </div>
                <div>
                  <strong>Датум на пријава:</strong> {new Date(selectedIncident.datumKreiranje).toLocaleString()}
                </div>
              </div>
              <div>
                <strong>Статус:</strong> {selectedIncident.status}
              </div>
              <div>
                <strong>Доделен аналитичар:</strong> {selectedIncident.dodelenAnalitichar ? `${selectedIncident.dodelenAnalitichar.ime} ${selectedIncident.dodelenAnalitichar.prezime}` : 'Не е доделен'}
              </div>

              {/* Display Resolution Details if closed */}
              {selectedIncident.status === 'CLOSED' && viewResolution && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h3 style={{ color: 'var(--color-success)', marginBottom: '8px' }}>Детали за санација</h3>
                  <div>
                    <strong>Дијагноза:</strong> {viewResolution.dijagnoza}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <strong>Преземени чекори за санација:</strong>
                    <p style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: '4px' }}>
                      {viewResolution.prezemeniChekori}
                    </p>
                  </div>
                  {viewResolution.preporaki && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>Препораки за во иднина:</strong>
                      <p style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
                        {viewResolution.preporaki}
                      </p>
                    </div>
                  )}
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <strong>Затворен на:</strong> {new Date(viewResolution.datumZatvoranje).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              {selectedIncident.status === 'NEW' && (
                <button className="btn-primary" onClick={() => handleClaim(selectedIncident.incidentId)}>
                  Преземи инцидент во истрага
                </button>
              )}
              {selectedIncident.status === 'UNDER_INVESTIGATION' && (
                <button className="btn-primary" onClick={() => { setActiveResolutionIncident(selectedIncident); setSelectedIncident(null); }}>
                  Затвори инцидент
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {activeResolutionIncident && (
        <div className="modal-overlay" onClick={() => setActiveResolutionIncident(null)}>
          <div className="glass-card modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveResolutionIncident(null)}>X</button>
            <ResolutionForm 
              incident={activeResolutionIncident} 
              onSuccess={() => {
                setActiveResolutionIncident(null);
                fetchIncidents();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
