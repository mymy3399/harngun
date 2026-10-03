export type SplitType = 'EQUAL' | 'EXACT' | 'SHARES';

export type ExpenseCategory = 'food' | 'stay' | 'transport' | 'activity' | 'shopping' | 'other';

export interface Trip {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  trip_id: string;
  name: string;
  promptpay: string;
  avatar: string;
  created_at?: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  amount: number;
  share_count?: number;
}

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  category: ExpenseCategory;
  base_amount: number;
  has_sc: boolean | number;
  has_vat: boolean | number;
  total_amount: number;
  paid_by_id: string;
  split_type: SplitType;
  receipt_image?: string | null;
  date: string;
  created_at: string;
  // Computed / expanded fields
  payer_name?: string;
  payer_avatar?: string;
  splits?: Record<string, number>;
  split_details?: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  trip_id: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  note?: string;
  settled_at: string;
  from_name?: string;
  to_name?: string;
  from_avatar?: string;
  to_avatar?: string;
}

export interface ActivityLog {
  id: string;
  trip_id: string;
  text: string;
  created_at: string;
}

export interface MemberBalance {
  member_id: string;
  name: string;
  avatar: string;
  promptpay: string;
  total_paid: number;
  total_consumed: number;
  settlements_paid: number;
  settlements_received: number;
  net_balance: number;
}

export interface RecommendedTransaction {
  fromId: string;
  toId: string;
  amount: number;
  fromM?: Member;
  toM?: Member;
}

export interface CategoryInfo {
  id: ExpenseCategory;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'food', label: 'อาหาร/เครื่องดื่ม', icon: '🍜', color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30' },
  { id: 'stay', label: 'ที่พัก/โรงแรม', icon: '🏨', color: 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30' },
  { id: 'transport', label: 'เดินทาง/น้ำมัน', icon: '🚗', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'activity', label: 'กิจกรรม/ตั๋ว', icon: '🎟️', color: 'from-purple-500/20 to-fuchsia-500/20 text-purple-300 border-purple-500/30' },
  { id: 'shopping', label: 'ช้อปปิ้ง/ของฝาก', icon: '🛍️', color: 'from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30' },
  { id: 'other', label: 'เบ็ดเตล็ด', icon: '📦', color: 'from-slate-500/20 to-gray-500/20 text-slate-300 border-slate-500/30' },
];
