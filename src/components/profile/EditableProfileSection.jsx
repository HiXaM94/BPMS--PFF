import { useState } from 'react';
import { Edit2, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { auditService } from '../../services/AuditService';

export default function EditableProfileSection({ 
  userId, 
  field, 
  label, 
  value, 
  type = 'text',
  editable = true,
  options = null,
  onUpdate 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ [field]: editValue })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log audit trail
      await auditService.log(
        'PROFILE_UPDATE',
        'user',
        userId,
        { [field]: value },
        { [field]: editValue }
      );

      if (onUpdate) {
        onUpdate(field, editValue);
      }

      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
  };

  if (!editable) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <p className="text-gray-900">{value || '-'}</p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      {isEditing ? (
        <div className="space-y-2">
          {type === 'select' && options ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 text-sm rounded-lg transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between group">
          <p className="text-gray-900">{value || '-'}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-all"
          >
            <Edit2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
