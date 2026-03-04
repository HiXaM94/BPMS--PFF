import { useState, useEffect } from 'react';
import { 
  Shield, Users, Lock, Key, Plus, Edit2, Trash2, Search,
  CheckCircle2, XCircle, AlertCircle, Loader2, Save
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { auditService } from '../services/AuditService';
import { cacheService } from '../services/CacheService';

export default function Permissions() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('roles');
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const roles = [
    { id: 'ADMIN', name: 'Administrator', description: 'Full system access', color: 'red' },
    { id: 'HR', name: 'HR Manager', description: 'Manage employees and HR operations', color: 'blue' },
    { id: 'TEAM_MANAGER', name: 'Team Manager', description: 'Manage team and projects', color: 'green' },
    { id: 'EMPLOYEE', name: 'Employee', description: 'Standard user access', color: 'gray' }
  ];

  useEffect(() => {
    loadPermissions();
    loadRolePermissions();
  }, []);

  const loadPermissions = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const data = await cacheService.getOrSet('permissions:all', async () => {
        const { data, error } = await supabase
          .from('permissions')
          .select('*')
          .order('category', { ascending: true });
        if (error) throw error;
        return data || [];
      }, 300);
      setPermissions(data);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async () => {
    if (!supabase || !profile?.entreprise_id) return;

    try {
      const data = await cacheService.getOrSet(`role_perms:${profile.entreprise_id}`, async () => {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('*, permissions(*)')
          .eq('entreprise_id', profile.entreprise_id);
        if (error) throw error;
        return data || [];
      }, 180);
      setRolePermissions(data);
    } catch (error) {
      console.error('Failed to load role permissions:', error);
    }
  };

  const getRolePermissions = (roleId) => {
    return rolePermissions
      .filter(rp => rp.role === roleId)
      .map(rp => rp.permission_id);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setSelectedPermissions(getRolePermissions(role.id));
    setShowModal(true);
  };

  const handleSaveRolePermissions = async () => {
    if (!supabase || !profile?.entreprise_id || !editingRole) return;

    setLoading(true);

    try {
      // Delete existing permissions for this role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role', editingRole.id)
        .eq('entreprise_id', profile.entreprise_id);

      // Insert new permissions
      const newPermissions = selectedPermissions.map(permId => ({
        role: editingRole.id,
        permission_id: permId,
        entreprise_id: profile.entreprise_id
      }));

      if (newPermissions.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(newPermissions);

        if (error) throw error;
      }

      // Log audit trail
      await auditService.log(
        'ROLE_PERMISSIONS_UPDATE',
        'role',
        editingRole.id,
        { permissions: getRolePermissions(editingRole.id) },
        { permissions: selectedPermissions }
      );

      cacheService.invalidatePattern('^role_perms:');
      await loadRolePermissions();
      setShowModal(false);
      setEditingRole(null);
      setSelectedPermissions([]);
    } catch (error) {
      console.error('Failed to save role permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId) => {
    setSelectedPermissions(prev =>
      prev.includes(permId)
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const filteredPermissions = permissions.filter(perm =>
    perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perm.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColorClass = (color) => {
    const colors = {
      red: 'bg-red-100 text-red-700 border-red-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('permissions.title')}
        subtitle={t('permissions.roleManagement')}
        icon={Shield}
      />

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-1">
            {[
              { id: 'roles', label: t('permissions.roleManagement'), icon: Users },
              { id: 'permissions', label: t('permissions.permissionAssignment'), icon: Key }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Role Management Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map(role => {
                  const rolePerms = getRolePermissions(role.id);
                  return (
                    <div
                      key={role.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClass(role.color)}`}>
                            <Shield size={24} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{role.name}</h3>
                            <p className="text-sm text-gray-600">{role.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditRole(role)}
                          className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Key size={16} />
                          <span>{rolePerms.length} permissions</span>
                        </div>
                        <button
                          onClick={() => handleEditRole(role)}
                          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Manage →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('permissions.searchPermissions')}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {/* Permissions List */}
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {perms
                        .filter(perm =>
                          !searchTerm ||
                          perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          perm.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(perm => (
                          <div
                            key={perm.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{perm.name}</p>
                              {perm.description && (
                                <p className="text-sm text-gray-600 mt-1">{perm.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                                {perm.action}
                              </span>
                              <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                                {perm.resource}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Role Permissions Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingRole(null);
          setSelectedPermissions([]);
        }}
        title={`Manage Permissions - ${editingRole?.name}`}
        size="large"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-blue-900">
                  Select the permissions that users with the <strong>{editingRole?.name}</strong> role should have.
                  Changes will apply to all users with this role.
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-4">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                  {category}
                </h4>
                <div className="space-y-1">
                  {perms.map(perm => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="mt-1 w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                        {perm.description && (
                          <p className="text-xs text-gray-600 mt-0.5">{perm.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                          {perm.action}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-600">
              {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRole(null);
                  setSelectedPermissions([]);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveRolePermissions}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {t('permissions.savePermissions')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
