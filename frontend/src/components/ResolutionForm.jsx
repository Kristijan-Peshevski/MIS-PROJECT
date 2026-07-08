import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ResolutionForm({ incident, onSuccess }) {
  const [formData, setFormData] = useState({
    dijagnoza: 'TRUE_POSITIVE',
    prezemeniChekori: '',
    preporaki: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.prezemeniChekori.trim()) {
      setError('Мора да внесете преземени чекори за санација.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/incidents/${incident.incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
      } else {
        const text = await res.text();
        setError(text || 'Неуспешно затворање на инцидентот.');
      }
    } catch (e) {
      console.error(e);
      setError('Грешка во комуникација со серверот.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-success)' }}>
        <CheckCircle2 size={48} />
      </div>
      <h2 className="form-title" style={{ color: 'var(--color-success)' }}>Резолуција и Затворање на Инцидент</h2>
      <p className="form-subtitle">Инцидент ID: {incident.incidentId} • Наслов: "{incident.naslov}"</p>

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '20px', 
          fontSize: '0.9rem',
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--color-danger)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Краен Заклучок / Дијагноза *</label>
          <select name="dijagnoza" className="form-select" value={formData.dijagnoza} onChange={handleChange}>
            <option value="TRUE_POSITIVE">Вистински Позитивен (True Positive - Реален Напад)</option>
            <option value="FALSE_POSITIVE">Лажен Аларм (False Positive)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Преземени чекори за санација *</label>
          <textarea 
            name="prezemeniChekori" 
            className="form-textarea" 
            placeholder="Внесете ги сите преземени дејствија (на пример: изолација на хост, блокирање порти, скенирање со антивирус)..." 
            value={formData.prezemeniChekori} 
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label className="form-label">Препораки за превенција во иднина</label>
          <textarea 
            name="preporaki" 
            className="form-textarea" 
            placeholder="Внесете препораки за корисникот или мрежната одбрана..." 
            value={formData.preporaki} 
            onChange={handleChange}
          ></textarea>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ background: 'linear-gradient(135deg, var(--color-success), #10B981)' }}>
          {loading ? 'Се затвора...' : 'Затвори го инцидентот'}
        </button>
      </form>
    </div>
  );
}
