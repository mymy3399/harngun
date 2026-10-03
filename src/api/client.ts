import {
  Trip,
  Member,
  Expense,
  Settlement,
  ActivityLog,
  MemberBalance,
  ExpenseCategory,
  SplitType,
} from '../types';

const BASE_URL = '/api';

export async function fetchTrips(): Promise<Trip[]> {
  const res = await fetch(`${BASE_URL}/trips`);
  if (!res.ok) throw new Error('Failed to fetch trips');
  return res.json();
}

export async function createTrip(
  name: string,
  creatorName?: string,
  promptPay?: string,
  avatar?: string
): Promise<{ trip: Trip; defaultMemberId: string }> {
  const res = await fetch(`${BASE_URL}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, creatorName, promptPay, avatar }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create trip');
  }
  return res.json();
}

export async function updateTripName(id: string, name: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/trips/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update trip name');
}

export async function fetchMembers(tripId: string): Promise<Member[]> {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/members`);
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

export async function addMember(
  tripId: string,
  name: string,
  promptPay: string,
  avatar: string
): Promise<Member> {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/members`, {
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

  const res = await fetch(`${BASE_URL}/trips/${tripId}/expenses?${query.toString()}`);
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
  const res = await fetch(`${BASE_URL}/trips/${tripId}/expenses`, {
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
  const res = await fetch(`${BASE_URL}/trips/${tripId}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deletedBy }),
  });
  if (!res.ok) throw new Error('Failed to delete expense');
}

export async function seedBulkExpenses(tripId: string, count: number = 50): Promise<number> {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/expenses/seed-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  });
  if (!res.ok) throw new Error('Failed to seed bulk expenses');
  const data = await res.json();
  return data.addedCount;
}

export async function fetchBalances(tripId: string): Promise<{
  balances: MemberBalance[];
  totalGroupExpense: number;
}> {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/balances`);
  if (!res.ok) throw new Error('Failed to fetch balances');
  return res.json();
}

export async function fetchSettlements(tripId: string): Promise<Settlement[]> {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/settlements`);
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
  const res = await fetch(`${BASE_URL}/trips/${tripId}/settlements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromMemberId, toMemberId, amount, note }),
  });
  if (!res.ok) throw new Error('Failed to record settlement');
  return res.json();
}

export async function undoSettlement(settlementId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/trips/any/settlements/${settlementId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to undo settlement');
}

export async function fetchLogs(tripId: string): Promise<ActivityLog[]> {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/logs`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function uploadReceiptFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('receipt', file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload receipt');
  const data = await res.json();
  return data.url;
}
