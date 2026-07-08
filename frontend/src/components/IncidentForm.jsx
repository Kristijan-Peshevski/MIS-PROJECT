import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send } from 'lucide-react';

export default function IncidentForm() {
  const [assets, setAssets] = useState([]);
  const [formData, setFormData] = useState({
    naslov: '',
    tipIncident: 'PHISHING',
    opis: '',
    itnost: 'SREDNA',
    reporterEmail: '',
    assetId: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetch('http://localhost:8080/api/assets')
      .then(res => res.json())
      .then(data => {
        setAssets(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, assetId: data[0].id.toString() }));
        }
      })
      .catch(err => console.error("Грешка при влечење на средства:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // Validation
    if (!formData.naslov.trim() || !formData.opis.trim() || !formData.reporterEmail.trim() || !formData.assetId) {
      setMessage({ text: 'Ве молиме пополнете ги сите задолжителни полиња.', type: 'danger' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:8080/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ 
          text: `Инцидентот е успешно регистриран под ID: ${data.incidentId}. Секундарната итност е автоматски поставена соодветно на критичноста на средството.`, 
          type: 'success' 
        });
        setFormData({
          naslov: '',
          tipIncident: 'PHISHING',
          opis: '',
          itnost: 'SREDNA',
          reporterEmail: '',
          assetId: assets[0]?.id.toString() || ''
        });
      } else {
        const errText = await res.text();
        setMessage({ text: errText || 'Настана грешка при зачувување.', type: 'danger' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Грешка во комуникацијата со серверот.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card form-container">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-danger)' }}>
        <ShieldAlert size={48} className="glow-red" />
      </div>
      <h2 className="form-title">Пријави Безбедносен Инцидент</h2>
      <p className="form-subtitle">Внесете ги потребните технички детали за инцидентот за брза реакција на SOC тимот.</p>

      {message.text && (
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '20px', 
          fontSize: '0.9rem',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Вашата Е-Пошта *</label>
          <input 
            type="email" 
            name="reporterEmail" 
            className="form-input" 
            placeholder="пример: korisnik@company.com" 
            value={formData.reporterEmail} 
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Краток Наслов *</label>
          <input 
            type="text" 
            name="naslov" 
            className="form-input" 
            placeholder="пример: Сомнителен ransomware на компјутер" 
            value={formData.naslov} 
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Тип на Инцидент *</label>
            <select name="tipIncident" className="form-select" value={formData.tipIncident} onChange={handleChange}>
              <option value="PHISHING">Фишинг (Phishing)</option>
              <option value="MALWARE">Малициозен софтвер (Malware)</option>
              <option value="DDOS">DDoS Напад</option>
              <option value="UNAUTHORIZED_ACCESS">Неовластен Пристап</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ниво на итност *</label>
            <select name="itnost" className="form-select" value={formData.itnost} onChange={handleChange}>
              <option value="NISKA">Ниска</option>
              <option value="SREDNA">Средна</option>
              <option value="VISOKA">Висока</option>
              <option value="KRITICNA">Критична</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Засегнато ИТ Средство (Asset) *</label>
          <select name="assetId" className="form-select" value={formData.assetId} onChange={handleChange}>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.imeSredstvo} ({asset.ipAdresa}) [{asset.kritichnost}]
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Технички опис на инцидентот *</label>
          <textarea 
            name="opis" 
            className="form-textarea" 
            placeholder="Опишете ги аномалиите детално..." 
            value={formData.opis} 
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          <Send size={18} />
          {loading ? 'Се поднесува...' : 'Поднеси Безбедносен Инцидент'}
        </button>
      </form>
    </div>
  );
}
