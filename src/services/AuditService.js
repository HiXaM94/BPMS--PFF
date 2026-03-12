/**
 * AuditService.js
 * Track and log all critical actions for compliance and security
 */

import { supabase } from './supabase';

class AuditService {
  /**
   * Check if a value is a valid UUID format
   */
  _isValidUUID(value) {
    if (!value || typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  /**
   * Log an audit event
   */
  async log(action, entityType, entityId, oldValues = null, newValues = null, metadata = {}) {
    if (!supabase) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('users')
        .select('entreprise_id')
        .eq('id', user?.id)
        .single();

      // If entity_id is not a valid UUID, move it to metadata to avoid DB type error
      let safeEntityId = entityId;
      if (entityId && !this._isValidUUID(entityId)) {
        metadata = { ...metadata, entity_ref: entityId };
        safeEntityId = null;
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          entreprise_id: profile?.entreprise_id,
          action,
          entity_type: entityType,
          entity_id: safeEntityId,
          old_values: oldValues,
          new_values: newValues,
          ip_address: metadata.ip_address,
          user_agent: metadata.user_agent || navigator.userAgent
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Audit log error:', error);
      return null;
    }
  }

  /**
   * Log user login
   */
  async logLogin(userId, metadata = {}) {
    return this.log('LOGIN', 'user', userId, null, { login_time: new Date() }, metadata);
  }

  /**
   * Log user logout
   */
  async logLogout(userId, metadata = {}) {
    return this.log('LOGOUT', 'user', userId, null, { logout_time: new Date() }, metadata);
  }

  /**
   * Log role change
   */
  async logRoleChange(userId, oldRole, newRole, metadata = {}) {
    return this.log(
      'ROLE_CHANGE',
      'user',
      userId,
      { role: oldRole },
      { role: newRole },
      metadata
    );
  }

  /**
   * Log document access
   */
  async logDocumentAccess(documentId, action, metadata = {}) {
    return this.log(`DOCUMENT_${action.toUpperCase()}`, 'document', documentId, null, null, metadata);
  }

  /**
   * Log permission change
   */
  async logPermissionChange(userId, permission, granted, metadata = {}) {
    return this.log(
      'PERMISSION_CHANGE',
      'user',
      userId,
      null,
      { permission, granted },
      metadata
    );
  }

  /**
   * Log data export
   */
  async logDataExport(entityType, recordCount, format, metadata = {}) {
    return this.log(
      'DATA_EXPORT',
      entityType,
      null,
      null,
      { record_count: recordCount, format },
      metadata
    );
  }

  /**
   * Log data import
   */
  async logDataImport(entityType, recordCount, metadata = {}) {
    return this.log(
      'DATA_IMPORT',
      entityType,
      null,
      null,
      { record_count: recordCount },
      metadata
    );
  }

  /**
   * Log settings change
   */
  async logSettingsChange(category, key, oldValue, newValue, metadata = {}) {
    return this.log(
      'SETTINGS_UPDATE',
      'settings',
      null,
      { category, key, value: oldValue },
      { category, key, value: newValue },
      metadata
    );
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(userId, limit = 50) {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for an entity
   */
  async getEntityLogs(entityType, entityId, limit = 50) {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get entity logs:', error);
      return [];
    }
  }

  /**
   * Get recent audit logs for entreprise
   */
  async getEntrepriseLogs(entrepriseId, limit = 100, filters = {}) {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('audit_logs')
        .select('*, users(name, email)')
        .eq('entreprise_id', entrepriseId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get entreprise logs:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(entrepriseId, timeframe = '30d') {
    if (!supabase) return null;

    try {
      const startDate = new Date();
      const days = parseInt(timeframe);
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, entity_type, created_at')
        .eq('entreprise_id', entrepriseId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const stats = {
        total: data.length,
        byAction: {},
        byEntityType: {},
        byDay: {}
      };

      data.forEach(log => {
        // Count by action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

        // Count by entity type
        stats.byEntityType[log.entity_type] = (stats.byEntityType[log.entity_type] || 0) + 1;

        // Count by day
        const day = new Date(log.created_at).toISOString().split('T')[0];
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      return null;
    }
  }

  /**
   * Search audit logs
   */
  async search(entrepriseId, searchTerm, limit = 50) {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, users(name, email)')
        .eq('entreprise_id', entrepriseId)
        .or(`action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Audit search error:', error);
      return [];
    }
  }
}

export const auditService = new AuditService();
