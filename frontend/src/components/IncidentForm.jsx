import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, Database } from 'lucide-react';
import axios from 'axios';

/**
 * IncidentForm — реактивен формулар за пријавување безбедносен инцидент.
 *
 * <p>Комуникација: React ➝ axios ➝ POST /api/incidents ➝ Spring Boot ➝
 * Apache XML-RPC ➝ Odoo Helpdesk (model: helpdesk.ticket).
 *
 * <p>Vite dev proxy: /api -> http://localhost:8080 (види vite.config.js)
 * <p>Docker / Nginx: /api -> http://backend:8080 (види nginx.conf)
 */
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

  // Вчитување на листата на ИТ средства од Spring Boot (од H2 преку AssetRepository).
  useEffect(() => {
    axios.get('/api/assets')
      .then(res => {
        setAssets(res.data || []);
        if (res.data && res.data.length > 0) {
          setFormData(prev => ({ ...prev, assetId: res.data[0].id.toString() }));
        }
      })
      .catch(err => {
        console.error('Грешка при вчитување на средства:', err);
        setMessage({ text: 'Не можат да се вчитаат ИТ средствата. Проверете ja врската со серверот.', type: 'danger' });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Поднесување на формуларот:
   *   payload = { title, description, assetId, type } + reporterEmail/itnost
   *   Повик: POST /api/incidents  (Spring Boot -> Odoo XML-RPC)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // Frontend валидација
    if (!formData.naslov.trim() || !formData.opis.trim() ||
        !formData.reporterEmail.trim() || !formData.assetId) {
      setMessage({
        text: 'Ве молиме пополнете ги сите задолжителни полиња.',
        type: 'danger'
      });
      return;
    }

    // Payload кон Spring Boot. Полето assetId мора да биде број (Long).
    const payload = {
      title: formData.naslov,
      description: formData.opis,
      assetId: parseInt(formData.assetId, 10),
      type: formData.tipIncident,
      itnost: formData.itnost,
      reporterEmail: formData.reporterEmail
    };

    try {
      setLoading(true);
      const response = await axios.post('/api/incidents', payload);

      // Успешен одговор од Spring Boot (кој повика Odoo create())
      const data = response.data || {};
      const odooTicketId = data.odoo_ticket_id ?? data.incidentId;

      setMessage({
        text: `✓ Инцидентот е успешно регистриран во Odoo Helpdesk (Ticket #${odooTicketId}, priority=${data.priority}). ` +
              `Приоритетот е автоматски пресметан врз основа на критичноста на средството.`,
        type: 'success'
      });

      // Ресетирање на формуларот (со задржување на првото средство)
      setFormData({
        naslov: '',
        tipIncident: 'PHISHING',
        opis: '',
        itnost: 'SREDNA',
        reporterEmail: '',
        assetId: assets[0]?.id.toString() || ''
      });
    } catch (error) {
      console.error('Грешка при поднесување:', error);
      const errMsg = error.response?.data?.error || error.response?.data?.message
        || error.message || 'Настана грешка при комуникација со серверот.';
      setMessage({ text: `Грешка: ${errMsg}`, type: 'danger' });
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
      <p className="form-subtitle">
        Внесете ги потребните технички детали за инцидентот. Системот автоматски го пренесува
        инцидентот во Odoo Helpdesk преку Spring Boot XML-RPC мост.
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
        background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.8rem',
        color: 'var(--color-info, #6366f1)'
      }}>
        <Database size={16} />
        <span>Odoo ERP активен — инцидентите се зачувуваат во helpdesk.ticket</span>
      </div>

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
          {loading ? 'Се испраќа до Odoo...' : 'Поднеси Безбедносен Инцидент'}
        </button>
      </form>
    </div>
  );
}
