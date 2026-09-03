import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditLogEntry } from '@/types';

export type AuditAction = AuditLogEntry['action'];

export interface RecordAuditParams {
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(
  supabase: SupabaseClient,
  params: RecordAuditParams
): Promise<void> {
  const { action, targetType, targetId, metadata } = params;

  try {
    const { error } = await supabase
      .from('admin_audit_log')
      .insert({
        action,
        target_type: targetType || null,
        target_id: targetId || null,
        metadata: metadata || null,
      });

    if (error) {
      console.warn('[audit] Failed to write audit log:', error.message);
    }
  } catch (err) {
    console.warn('[audit] Unexpected error writing audit log:', err);
  }
}
