export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
export type SecurityEventType = 
  | 'LOGIN_FAILED' 
  | 'RATE_LIMIT_EXCEEDED' 
  | 'SQL_INJECTION_ATTEMPT' 
  | 'XSS_ATTEMPT' 
  | 'UNAUTHORIZED_ACCESS'
  | 'ANOMALOUS_BEHAVIOR'
  | 'SYSTEM_ERROR';

export interface SecurityEvent {
  id?: string;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  source_ip?: string;
  user_id?: string;
  session_id?: string;
  endpoint?: string;
  payload?: Record<string, unknown>;
  risk_score?: number;
  created_at?: string | Date;
}

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: SecuritySeverity;
  description: string;
  affected_components: string[];
  root_cause: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface EvidenceLog {
  id: string;
  incident_id: string;
  action_taken: string;
  executed_by?: string;
  timestamp: string;
  evidence_snapshot: Record<string, unknown>;
  hash_signature: string;
}

export interface SecurityRule {
  id: string;
  rule_type: 'IP_BLOCK' | 'USER_ISOLATE' | 'RATE_LIMIT_ADJUST' | 'CUSTOM';
  target_value: string;
  action: 'BLOCK' | 'LOG' | 'ALERT' | 'ISOLATE';
  expires_at?: string;
  created_at: string;
  created_by?: string;
  reason?: string;
  incident_id?: string;
}
