import { useSettings } from '../context/SettingsContext';

// Shown only when printing (`hidden print:block`). Pulls the hospital identity
// from the public settings so printed reports carry the configured letterhead.
export default function PrintHeader({ title }) {
  const { publicSettings } = useSettings();
  const name = publicSettings.hospital_name || 'New Leaf Complex';
  const contact = [publicSettings.hospital_address, publicSettings.hospital_phone, publicSettings.hospital_email]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <div className="hidden print:block mb-5 border-b border-gray-300 pb-3">
      <div className="text-xl font-bold text-gray-900">{name}</div>
      {contact && <div className="text-xs text-gray-600 mt-0.5">{contact}</div>}
      {title && <div className="text-sm font-semibold text-gray-800 mt-2">{title}</div>}
    </div>
  );
}
