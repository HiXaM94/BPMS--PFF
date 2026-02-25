import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Save, Bell, Shield, Palette, Globe, 
  Database, Zap, Mail, Smartphone, Lock, Key, Users, Building2,
  AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { auditService } from '../services/AuditService';
import { cacheService } from '../services/CacheService';

export default function Settings() {
  const { profile } = useAuth();
  const { t, switchLanguage, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [settings, setSettings] = useState({
    general: {
      company_name: '',
      timezone: 'UTC',
      date_format: 'YYYY-MM-DD',
      language: 'en'
    },
    notifications: {
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false,
      digest_frequency: 'daily',
      notify_task_assigned: true,
      notify_task_completed: true,
      notify_document_approved: true,
      notify_leave_request: true
    },
    security: {
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_numbers: true,
      password_require_special: true,
      session_timeout: 30,
      two_factor_enabled: false,
      ip_whitelist_enabled: false,
      allowed_ips: []
    },
    ai: {
      enabled: true,
      auto_recommendations: true,
      document_processing: true,
      candidate_scoring: true,
      performance_insights: true,
      model: 'gpt-4-turbo-preview'
    },
    integrations: {
      slack_enabled: false,
      slack_webhook: '',
      teams_enabled: false,
      teams_webhook: '',
      email_provider: 'smtp',
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_password: ''
    }
  });

  useEffect(() => {
    loadSettings();
  }, [profile]);

  const loadSettings = async () => {
    if (!supabase || !profile?.entreprise_id) return;

    try {
      const data = await cacheService.getOrSet(
        `settings:${profile.entreprise_id}`,
        async () => {
          const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .eq('entreprise_id', profile.entreprise_id);
          if (error) throw error;
          return data;
        },
        300
      );

      if (data && data.length > 0) {
        const loadedSettings = { ...settings };
        data.forEach(setting => {
          if (loadedSettings[setting.category]) {
            loadedSettings[setting.category] = {
              ...loadedSettings[setting.category],
              ...setting.value
            };
          }
        });
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!supabase || !profile?.entreprise_id) return;

    setLoading(true);
    setSaveStatus(null);

    try {
      // Save each category
      for (const [category, values] of Object.entries(settings)) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            entreprise_id: profile.entreprise_id,
            category,
            key: 'config',
            value: values,
            updated_by: profile.id
          }, {
            onConflict: 'entreprise_id,category,key'
          });

        if (error) throw error;

        // Log audit trail
        await auditService.logSettingsChange(
          category,
          'config',
          null,
          values
        );
      }

      cacheService.invalidatePattern('^settings:');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', label: t('settings.general'), icon: SettingsIcon },
    { id: 'notifications', label: t('settings.notificationSettings'), icon: Bell },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'ai', label: t('settings.aiFeatures'), icon: Zap },
    { id: 'integrations', label: t('settings.integrations'), icon: Database }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.general')}
        icon={SettingsIcon}
      />

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={settings.general.company_name}
                        onChange={(e) => updateSetting('general', 'company_name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Globe size={16} className="inline mr-2" />
                          Timezone
                        </label>
                        <select
                          value={settings.general.timezone}
                          onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Africa/Casablanca">Casablanca</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Format
                        </label>
                        <select
                          value={settings.general.date_format}
                          onChange={(e) => updateSetting('general', 'date_format', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        >
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={locale}
                        onChange={(e) => { switchLanguage(e.target.value); updateSetting('general', 'language', e.target.value); }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="text-brand-600" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-600">Receive updates via email</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email_enabled}
                          onChange={(e) => updateSetting('notifications', 'email_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="text-brand-600" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-600">Browser push notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push_enabled}
                          onChange={(e) => updateSetting('notifications', 'push_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="text-brand-600" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">SMS Notifications</p>
                          <p className="text-sm text-gray-600">Critical alerts via SMS</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.sms_enabled}
                          onChange={(e) => updateSetting('notifications', 'sms_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-3">Notification Types</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'notify_task_assigned', label: 'Task Assignments' },
                          { key: 'notify_task_completed', label: 'Task Completions' },
                          { key: 'notify_document_approved', label: 'Document Approvals' },
                          { key: 'notify_leave_request', label: 'Leave Requests' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications[item.key]}
                              onChange={(e) => updateSetting('notifications', item.key, e.target.checked)}
                              className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex gap-3">
                        <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                        <div>
                          <p className="font-medium text-amber-900">Security Best Practices</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Enable two-factor authentication and use strong password policies to protect your organization.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Password Policy</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">
                            Minimum Password Length
                          </label>
                          <input
                            type="number"
                            min="6"
                            max="32"
                            value={settings.security.password_min_length}
                            onChange={(e) => updateSetting('security', 'password_min_length', parseInt(e.target.value))}
                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                        </div>

                        {[
                          { key: 'password_require_uppercase', label: 'Require Uppercase Letters' },
                          { key: 'password_require_numbers', label: 'Require Numbers' },
                          { key: 'password_require_special', label: 'Require Special Characters' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.security[item.key]}
                              onChange={(e) => updateSetting('security', item.key, e.target.checked)}
                              className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-3">Session Management</h4>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="1440"
                          value={settings.security.session_timeout}
                          onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                          className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Key className="text-brand-600" size={20} />
                          <div>
                            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-600">Add an extra layer of security</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.security.two_factor_enabled}
                            onChange={(e) => updateSetting('security', 'two_factor_enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Settings */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Features</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <Zap className="text-purple-600" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">AI Assistant Enabled</p>
                          <p className="text-sm text-gray-600">Enable AI-powered features across the platform</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.ai.enabled}
                          onChange={(e) => updateSetting('ai', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      {[
                        { key: 'auto_recommendations', label: 'Automatic Recommendations', desc: 'AI suggests actions based on data patterns' },
                        { key: 'document_processing', label: 'Document Processing', desc: 'Extract and analyze document content' },
                        { key: 'candidate_scoring', label: 'Candidate Scoring', desc: 'AI-powered candidate evaluation' },
                        { key: 'performance_insights', label: 'Performance Insights', desc: 'Team performance analysis and suggestions' }
                      ].map(item => (
                        <label key={item.key} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.ai[item.key]}
                            onChange={(e) => updateSetting('ai', item.key, e.target.checked)}
                            disabled={!settings.ai.enabled}
                            className="mt-1 w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 disabled:opacity-50"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-600">{item.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="pt-4 border-t">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI Model
                      </label>
                      <select
                        value={settings.ai.model}
                        onChange={(e) => updateSetting('ai', 'model', e.target.value)}
                        disabled={!settings.ai.enabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50"
                      >
                        <option value="gpt-4-turbo-preview">GPT-4 Turbo (Recommended)</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrations</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Building2 className="text-purple-600" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Slack</p>
                            <p className="text-sm text-gray-600">Team communication</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.integrations.slack_enabled}
                            onChange={(e) => updateSetting('integrations', 'slack_enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>
                      {settings.integrations.slack_enabled && (
                        <input
                          type="text"
                          value={settings.integrations.slack_webhook}
                          onChange={(e) => updateSetting('integrations', 'slack_webhook', e.target.value)}
                          placeholder="https://hooks.slack.com/services/..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                        />
                      )}
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Microsoft Teams</p>
                            <p className="text-sm text-gray-600">Collaboration platform</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.integrations.teams_enabled}
                            onChange={(e) => updateSetting('integrations', 'teams_enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>
                      {settings.integrations.teams_enabled && (
                        <input
                          type="text"
                          value={settings.integrations.teams_webhook}
                          onChange={(e) => updateSetting('integrations', 'teams_webhook', e.target.value)}
                          placeholder="https://outlook.office.com/webhook/..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between pt-6 border-t mt-6">
              <div>
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={20} />
                    <span className="text-sm font-medium">{t('settings.saved')}</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">Failed to save settings</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={saveSettings}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {t('settings.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
