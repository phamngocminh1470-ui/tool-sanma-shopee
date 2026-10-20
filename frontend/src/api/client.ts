import {
  Voucher,
  VoucherListResponse,
  Connector,
  AutomationRule,
  SystemNotification,
  DashboardSummary,
  ScanRunLog,
  SystemSettings,
  SystemHealth,
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Dashboard & Reports
  getDashboardSummary: () => request<DashboardSummary>('/reports/dashboard'),
  getScanHistory: (limit = 30) => request<ScanRunLog[]>(`/reports/scan-history?limit=${limit}`),

  // Vouchers
  getVouchers: (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request<VoucherListResponse>(`/vouchers?${query.toString()}`);
  },
  getCollection: (name: string, page = 1, pageSize = 20) =>
    request<VoucherListResponse>(`/vouchers/collections/${name}?page=${page}&page_size=${pageSize}`),
  getVoucherDetail: (id: number) =>
    request<{ voucher: Voucher; history: any[]; tags: string[]; raw_data: any }>(`/vouchers/${id}`),
  toggleAccountSave: (id: number) =>
    request<{ success: boolean; is_saved_to_account: boolean; message: string }>(`/vouchers/${id}/toggle-account-save`, {
      method: 'POST',
    }),

  // Auto Hunter
  getHunterStatus: () =>
    request<{
      scheduler_running: boolean;
      is_paused: boolean;
      is_scanning_now: boolean;
      current_scan_id?: string;
      last_scan_time?: string;
      next_scan_time?: string;
      interval_minutes: number;
    }>('/hunter/status'),
  triggerScanNow: () =>
    request<{
      success: boolean;
      message: string;
      scan_id?: string;
      summary?: string;
      total_found?: number;
      new_records?: number;
      updated_records?: number;
      duplicates?: number;
      errors?: number;
      duration_ms?: number;
    }>('/hunter/scan-now', { method: 'POST' }),
  pauseHunter: () => request<{ success: boolean; message: string }>('/hunter/pause', { method: 'POST' }),
  resumeHunter: () => request<{ success: boolean; message: string }>('/hunter/resume', { method: 'POST' }),

  // Connectors
  getConnectors: () => request<Connector[]>('/connectors'),
  updateConnector: (id: string, data: Partial<Connector>) =>
    request<Connector>(`/connectors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  testConnector: (id: string) =>
    request<{ id: string; success: boolean; status: string; message: string; records_found: number; duration_ms: number }>(
      `/connectors/${id}/test`,
      { method: 'POST' }
    ),
  runConnector: (id: string) => request<any>(`/connectors/${id}/run`, { method: 'POST' }),

  // Automation Rules
  getRules: () => request<AutomationRule[]>('/rules'),
  createRule: (data: Partial<AutomationRule>) =>
    request<AutomationRule>('/rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id: number, data: Partial<AutomationRule>) =>
    request<AutomationRule>(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id: number) => request<{ success: boolean }>(`/rules/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: (limit = 50) => request<SystemNotification[]>(`/notifications?limit=${limit}`),
  markNotificationRead: (id: number) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/mark-all-read', { method: 'POST' }),
  deleteNotification: (id: number) => request<{ success: boolean }>(`/notifications/${id}`, { method: 'DELETE' }),
  testTelegram: (bot_token: string, chat_id: string) =>
    request<{ success: boolean; message: string }>('/notifications/test-telegram', {
      method: 'POST',
      body: JSON.stringify({ bot_token, chat_id }),
    }),

  // Settings
  getSettings: () => request<SystemSettings>('/settings'),
  updateSettings: (data: Partial<SystemSettings>) =>
    request<SystemSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // System Health
  getSystemHealth: () => request<SystemHealth>('/system/health'),
  getAuditLogs: (limit = 50) => request<any[]>(`/system/audit-logs?limit=${limit}`),

  // Backups
  createBackup: () => request<{ success: boolean; filename: string; size_mb: number; message: string }>('/backup/create', { method: 'POST' }),
  getBackups: () => request<{ filename: string; size_mb: number; created_at: string }[]>('/backup/list'),
  restoreBackup: (filename: string) =>
    request<{ success: boolean; message: string }>(`/backup/restore/${encodeURIComponent(filename)}`, { method: 'POST' }),

  // Tunnel / Online Link
  getTunnelStatus: () =>
    request<{ is_running: boolean; url: string | null; error: string | null; started_at: string | null }>('/tunnel/status'),
  startTunnel: () =>
    request<{ success: boolean; url: string | null; message: string; status: string }>('/tunnel/start', { method: 'POST' }),
  stopTunnel: () =>
    request<{ success: boolean; message: string; status: string }>('/tunnel/stop', { method: 'POST' }),
};
