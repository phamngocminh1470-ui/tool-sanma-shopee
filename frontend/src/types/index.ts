export type ViewTab =
  | 'dashboard'
  | 'auto_hunter'
  | 'all_vouchers'
  | 'new_vouchers'
  | 'deep_discount'
  | 'expiring_soon'
  | 'verified'
  | 'unverified'
  | 'categories'
  | 'archive'
  | 'sources'
  | 'history'
  | 'notifications'
  | 'reports'
  | 'rules'
  | 'settings'
  | 'health'
  | 'about';

export interface Voucher {
  id: number;
  code: string;
  fingerprint: string;
  program_name: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  discount_unit: string;
  min_spend: number;
  max_discount?: number;
  category: string;
  shop_name?: string;
  product_url?: string;
  source_url?: string;
  connector_name: string;
  claim_url?: string;
  usage_scope: string;
  starts_at?: string;
  expires_at?: string;
  terms?: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED' | 'EXPIRING_SOON' | 'EXPIRED' | 'NEEDS_REVIEW' | 'INELIGIBLE';
  is_saved_to_account: boolean;
  is_archived: boolean;
  overall_score: number;
  value_score: number;
  reliability_score: number;
  applicability_score: number;
  urgency_score: number;
  confidence_score: number;
  ranking_reason?: string;
  tags: string; // JSON array string
  detected_at: string;
  updated_at: string;
}

export interface VoucherHistory {
  id: number;
  voucher_id: number;
  changed_at: string;
  change_type: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  connector_name?: string;
}

export interface VoucherListResponse {
  items: Voucher[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Connector {
  id: string;
  name: string;
  description?: string;
  endpoint_url: string;
  connector_type: string;
  is_enabled: boolean;
  status: 'ACTIVE' | 'DEGRADED' | 'DISABLED' | 'ERROR' | 'NEEDS_CONFIGURATION';
  last_run_at?: string;
  last_success_at?: string;
  total_found: number;
  new_records: number;
  updated_records: number;
  duplicates_count: number;
  error_count: number;
  avg_duration_ms: number;
  last_error_message?: string;
  config_data: string;
}

export interface AutomationRule {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  priority: number;
  trigger_event: string;
  condition_type: string;
  condition_value: string;
  action_type: string;
  action_payload?: string;
  execution_count: number;
  last_triggered_at?: string;
  created_at: string;
}

export interface SystemNotification {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'VOUCHER_ALERT';
  channel: string;
  is_read: boolean;
  action_url?: string;
  voucher_id?: number;
  created_at: string;
}

export interface CategoryMetric {
  category: string;
  count: number;
  avg_score: number;
}

export interface TierMetric {
  tier: string;
  count: number;
}

export interface ConnectorMetric {
  id: string;
  name: string;
  status: string;
  total_found: number;
  new_records: number;
  error_count: number;
}

export interface DashboardSummary {
  total_vouchers: number;
  new_24h: number;
  verified_count: number;
  unverified_count: number;
  expiring_soon_count: number;
  archived_count: number;
  avg_voucher_score: number;
  active_connectors: number;
  total_connectors: number;
  last_scan_time?: string;
  next_scan_time?: string;
  scheduler_running: boolean;
  categories: CategoryMetric[];
  tiers: TierMetric[];
  connectors: ConnectorMetric[];
}

export interface ScanRunLog {
  id: number;
  scan_id: string;
  started_at: string;
  finished_at?: string;
  status: string;
  trigger_type: string;
  total_found: number;
  new_records: number;
  updated_records: number;
  duplicates: number;
  errors: number;
  duration_ms: number;
  summary?: string;
}

export interface SystemSettings {
  project_name: string;
  version: string;
  copyright: string;
  slogan: string;
  auto_scan_enabled: boolean;
  scan_interval_minutes: number;
  max_concurrent_workers: number;
  request_timeout_seconds: number;
  telegram_configured: boolean;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  min_score_for_alert: number;
  weight_value: number;
  weight_reliability: number;
  weight_applicability: number;
  weight_urgency: number;
  weight_confidence: number;
}

export interface SystemHealth {
  status: string;
  platform: string;
  python_version: string;
  cpu_percent: number;
  process_memory_mb: number;
  system_memory_used_percent: number;
  system_memory_total_gb: number;
  system_memory_available_gb: number;
  disk_free_gb: number;
  db_size_mb: number;
  active_workers: number;
  is_scanning: boolean;
  version: string;
  brand: string;
  copyright: string;
}
