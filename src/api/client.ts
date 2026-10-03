import {
  Trip,
  Member,
  Expense,
  Settlement,
  ActivityLog,
  MemberBalance,
  ExpenseCategory,
  SplitType,
  User,
} from '../types';

const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('hg_auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('hg_auth_token', token);
  } else {
    localStorage.removeItem('hg_auth_token');
  }
}

// Authenticated fetch wrapper
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Session expired
    setAuthToken(null);
    localStorage.removeItem('hg_auth_user');
  }

  return res;
}

// Auth API
export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
  promptpay?: string
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, promptpay }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'สมัครสมาชิกไม่สำเร็จ');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'เข้าสู่ระบบไม่สำเร็จ');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function loginWithGoogleCredential(credential: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function loginWithGoogleProfile(profile: {
  email: string;
  name?: string;
  picture?: string;
  googleId?: string;
}): Promise<{ token: string; user: User }> {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await authFetch(`${BASE_URL}/auth/me`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await authFetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
  } finally {
    setAuthToken(null);
    localStorage.removeItem('hg_auth_user');
  }
}

export async function fetchAuthConfig(): Promise<{ googleClientId: string }> {
  try {
    const res = await fetch(`${BASE_URL}/auth/config`);
    if (!res.ok) return { googleClientId: '' };
    return res.json();
  } catch {
    return { googleClientId: '' };
  }
}

export async function saveGoogleClientId(googleClientId: string): Promise<{ success: boolean; googleClientId: string }> {
  const res = await fetch(`${BASE_URL}/auth/config/google-client-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ googleClientId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to save Google Client ID');
  }
  return res.json();
}

// Trips API
export async function fetchTrips(): Promise<Trip[]> {
  const res = await authFetch(`${BASE_URL}/trips`);
  if (!res.ok) throw new Error('Failed to fetch trips');
  return res.json();
}

export async function createTrip(
  name: string,
  promptPay?: string
): Promise<{ trip: Trip; defaultMemberId: string }> {
  const res = await authFetch(`${BASE_URL}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, promptPay }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create trip');
  }
  return res.json();
}

export async function updateTripName(id: string, name: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/trips/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update trip name');
}

export async function fetchTripInvitePreview(code: string): Promise<{
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
}> {
  const res = await fetch(`${BASE_URL}/trips/invite/${code}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'ไม่พบกลุ่มตามรหัสเชิญนี้');
  }
  return res.json();
}

export async function joinTripByInviteCode(inviteCode: string): Promise<{
  success: boolean;
  alreadyJoined?: boolean;
  tripId: string;
  tripName: string;
}> {
  const res = await authFetch(`${BASE_URL}/trips/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'เข้าร่วมกลุ่มไม่สำเร็จ');
  }
  return res.json();
}

// Members API
export async function fetchMembers(tripId: string): Promise<Member[]> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/members`);
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

export async function addMember(
  tripId: string,
  name: string,
  promptPay: string,
  avatar: string
): Promise<Member> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, promptPay, avatar }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add member');
  }
  return res.json();
}

// Expenses API
export async function fetchExpenses(
  tripId: string,
  params: {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    paidBy?: string;
    sortBy?: 'date' | 'amount';
    order?: 'asc' | 'desc';
  } = {}
): Promise<{
  data: Expense[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.paidBy) query.set('paidBy', params.paidBy);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.order) query.set('order', params.order);

  const res = await authFetch(`${BASE_URL}/trips/${tripId}/expenses?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}

export async function addExpense(
  tripId: string,
  payload: {
    title: string;
    category: ExpenseCategory;
    baseAmount: number;
    hasSC: boolean;
    hasVat: boolean;
    totalAmount: number;
    paidById: string;
    splitType: SplitType;
    splits: Record<string, number>;
    date: string;
    receiptImage?: string | null;
    creatorName?: string;
  }
): Promise<Expense> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save expense');
  }
  return res.json();
}

export async function deleteExpense(
  tripId: string,
  expenseId: string,
  deletedBy?: string
): Promise<void> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deletedBy }),
  });
  if (!res.ok) throw new Error('Failed to delete expense');
}

export async function seedBulkExpenses(tripId: string, count: number = 50): Promise<number> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/expenses/seed-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  });
  if (!res.ok) throw new Error('Failed to seed bulk expenses');
  const data = await res.json();
  return data.addedCount;
}

// Balances & Settlements API
export async function fetchBalances(tripId: string): Promise<{
  balances: MemberBalance[];
  totalGroupExpense: number;
}> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/balances`);
  if (!res.ok) throw new Error('Failed to fetch balances');
  return res.json();
}

export async function fetchSettlements(tripId: string): Promise<Settlement[]> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/settlements`);
  if (!res.ok) throw new Error('Failed to fetch settlements');
  return res.json();
}

export async function recordSettlement(
  tripId: string,
  fromMemberId: string,
  toMemberId: string,
  amount: number,
  note?: string
): Promise<Settlement> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/settlements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromMemberId, toMemberId, amount, note }),
  });
  if (!res.ok) throw new Error('Failed to record settlement');
  return res.json();
}

export async function undoSettlement(settlementId: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/trips/any/settlements/${settlementId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to undo settlement');
}

export async function fetchLogs(tripId: string): Promise<ActivityLog[]> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/logs`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function uploadReceiptFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('receipt', file);

  const res = await authFetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload receipt');
  const data = await res.json();
  return data.url;
}

export interface TripNotificationSettings {
  telegram_bot_token: string;
  telegram_chat_id: string;
  telegram_enabled: boolean;
  has_server_bot: boolean;
}

export async function fetchNotificationSettings(tripId: string): Promise<TripNotificationSettings> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/notifications`);
  if (!res.ok) throw new Error('Failed to load notification settings');
  return res.json();
}

export async function updateNotificationSettings(
  tripId: string,
  settings: {
    telegram_bot_token?: string;
    telegram_chat_id?: string;
    telegram_enabled: boolean;
  }
): Promise<{ success: boolean }> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/notifications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update notification settings');
  }
  return res.json();
}

export async function testTelegramNotification(
  tripId: string,
  payload?: { botToken?: string; chatId?: string }
): Promise<{ success: boolean; message: string }> {
  const res = await authFetch(`${BASE_URL}/trips/${tripId}/test-telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'ส่งข้อความทดสอบไม่สำเร็จ');
  }
  return data;
}

