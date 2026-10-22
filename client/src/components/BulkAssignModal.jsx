import { useState } from 'react';
import { UserCheck, Loader2, X } from 'lucide-react';
import { useTranslation } from '../i18n';

/**
 * Supervisor/admin bulk assignment. Opens as a small dialog, lets the caller
 * pick a technician and apply the assignment to every selected ticket.
 */
export default function BulkAssignModal({ open, technicians, count, onClose, onAssign, saving }) {
  const { t } = useTranslation();
  const [technicianId, setTechnicianId] = useState('');

  if (!open) return null;

  const submit = () => {
    if (!technicianId) return;
    onAssign(Number(technicianId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={saving ? undefined : onClose} />
      <div role="dialog" aria-modal="true" aria-label={t('common.bulkAssign.ariaLabel')} className="relative bg-surface rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-text" /> {t('common.bulkAssign.title', { count })}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{t('common.bulkAssign.subtitle')}</p>
          </div>
          <button onClick={onClose} disabled={saving} aria-label={t('common.modal.close')} title={t('common.modal.close')} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.bulkAssign.technician')}</label>
        <select
          value={technicianId}
          onChange={(e) => setTechnicianId(e.target.value)}
          aria-label={t('common.bulkAssign.selectTechnician')}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">{t('common.bulkAssign.selectTechnician')}</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            {t('common.actions.cancel')}
          </button>
          <button
            onClick={submit}
            disabled={!technicianId || saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            {t('common.actions.assign')}
          </button>
        </div>
      </div>
    </div>
  );
}
