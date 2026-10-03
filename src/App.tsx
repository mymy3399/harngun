import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trip,
  Member,
  Expense,
  Settlement,
  ActivityLog,
  MemberBalance,
  RecommendedTransaction,
  ExpenseCategory,
  SplitType,
  User,
} from './types';
import { Plus } from 'lucide-react';
import * as api from './api/client';
import { calculateSettlementsFromBalances } from './utils/settlement';

import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { SummaryTab } from './components/SummaryTab';
import { ExpenseList } from './components/ExpenseList';
import { SettleTab } from './components/SettleTab';
import { MembersTab } from './components/MembersTab';
import { ExpenseModal } from './components/ExpenseModal';
import { PromptPayQRModal } from './components/PromptPayQRModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { TripSwitcherModal } from './components/TripSwitcherModal';
import { ShareModal } from './components/ShareModal';
import { LoginModal } from './components/LoginModal';

export default function App() {
  // Auth & User State
  const [authUser, setAuthUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hg_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');

  // Global & Trip State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('tripId');
    if (fromUrl) return fromUrl;
    return localStorage.getItem('hg_active_trip') || '';
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('hg_user') || '';
  });

  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [totalGroupExpense, setTotalGroupExpense] = useState<number>(0);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Expenses filter & pagination state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPayer, setSelectedPayer] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<RecommendedTransaction | null>(null);
  const [showReceiptViewer, setShowReceiptViewer] = useState<{ url: string; title: string } | null>(null);
  const [showTripSwitcher, setShowTripSwitcher] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSeedingBulk, setIsSeedingBulk] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Active Trip object
  const currentTrip = useMemo(() => {
    return trips.find(t => t.id === activeTripId) || trips[0] || null;
  }, [trips, activeTripId]);

  // Current User object
  const currentUser = useMemo(() => {
    return members.find(m => m.id === currentUserId) || members[0];
  }, [members, currentUserId]);

  // Current User Balance
  const currentUserBalance = useMemo(() => {
    const b = balances.find(item => item.member_id === currentUserId);
    return b ? b.net_balance : 0;
  }, [balances, currentUserId]);

  // Greedy Minimal Settlement Transactions
  const transactions = useMemo(() => {
    return calculateSettlementsFromBalances(balances, members);
  }, [balances, members]);

  // Save active trip & current user to LocalStorage
  useEffect(() => {
    if (activeTripId) {
      localStorage.setItem('hg_active_trip', activeTripId);
      const url = new URL(window.location.href);
      url.searchParams.set('tripId', activeTripId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTripId]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('hg_user', currentUserId);
    }
  }, [currentUserId]);

  // Load Trips initial
  const loadTrips = useCallback(async () => {
    try {
      const data = await api.fetchTrips();
      setTrips(data);
      if (data.length > 0) {
        if (!activeTripId || !data.some(t => t.id === activeTripId)) {
          setActiveTripId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  }, [activeTripId]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    api.fetchAuthConfig().then(cfg => {
      if (cfg?.googleClientId) setGoogleClientId(cfg.googleClientId);
    });
  }, []);

  // Load active trip data (members, balances, settlements, logs)
  const refreshTripData = useCallback(async () => {
    if (!activeTripId) return;
    try {
      const [membersData, balancesData, settlementsData, logsData] = await Promise.all([
        api.fetchMembers(activeTripId),
        api.fetchBalances(activeTripId),
        api.fetchSettlements(activeTripId),
        api.fetchLogs(activeTripId),
      ]);

      setMembers(membersData);
      setBalances(balancesData.balances);
      setTotalGroupExpense(balancesData.totalGroupExpense);
      setSettlements(settlementsData);
      setLogs(logsData);

      // Auto-set current user if not selected or invalid
      if (!currentUserId || !membersData.some(m => m.id === currentUserId)) {
        if (membersData.length > 0) {
          setCurrentUserId(membersData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to refresh trip data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTripId, currentUserId]);

  // Load expenses with pagination and filters
  const loadExpenses = useCallback(async () => {
    if (!activeTripId) return;
    try {
      const res = await api.fetchExpenses(activeTripId, {
        page: pagination.page,
        limit: pagination.limit,
        q: searchQuery,
        category: selectedCategory,
        paidBy: selectedPayer,
        sortBy,
        order,
      });
      setExpenses(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  }, [activeTripId, pagination.page, pagination.limit, searchQuery, selectedCategory, selectedPayer, sortBy, order]);

  useEffect(() => {
    if (activeTripId) {
      refreshTripData();
    }
  }, [activeTripId, refreshTripData]);

  useEffect(() => {
    if (activeTripId) {
      loadExpenses();
    }
  }, [activeTripId, loadExpenses]);

  // Action Handlers
  const handleSaveExpense = async (payload: {
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
  }) => {
    if (!activeTripId) return;
    await api.addExpense(activeTripId, {
      ...payload,
      creatorName: currentUser?.name || 'สมาชิก',
    });
    // Refresh both list and aggregated balances
    await Promise.all([loadExpenses(), refreshTripData(), loadTrips()]);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!activeTripId) return;
    await api.deleteExpense(activeTripId, id, currentUser?.name || 'สมาชิก');
    await Promise.all([loadExpenses(), refreshTripData(), loadTrips()]);
  };

  const handleAddMember = async (name: string, promptPay: string, avatar: string) => {
    if (!activeTripId) return;
    await api.addMember(activeTripId, name, promptPay, avatar);
    await Promise.all([refreshTripData(), loadTrips()]);
  };

  const handleConfirmPaidQR = async (tx: RecommendedTransaction) => {
    if (!activeTripId) return;
    await api.recordSettlement(
      activeTripId,
      tx.fromId,
      tx.toId,
      tx.amount,
      'โอนผ่าน PromptPay QR'
    );
    // Refresh balances and settlements so debt deduction reflects immediately!
    await refreshTripData();
  };

  const handleUndoSettlement = async (settlementId: string) => {
    await api.undoSettlement(settlementId);
    await refreshTripData();
  };

  const handleSeedBulk = async () => {
    if (!activeTripId) return;
    setIsSeedingBulk(true);
    try {
      await api.seedBulkExpenses(activeTripId, 50);
      await Promise.all([loadExpenses(), refreshTripData(), loadTrips()]);
    } finally {
      setIsSeedingBulk(false);
    }
  };

  const handleUpdateTripName = async (name: string) => {
    if (!activeTripId) return;
    await api.updateTripName(activeTripId, name);
    await loadTrips();
  };

  const handleCreateTrip = async (name: string, creatorName?: string, promptPay?: string) => {
    const res = await api.createTrip(name, creatorName, promptPay);
    await loadTrips();
    setActiveTripId(res.trip.id);
    if (res.defaultMemberId) {
      setCurrentUserId(res.defaultMemberId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-emerald-500 selection:text-white antialiased font-sans">
      {/* Mobile-first centered frame with tablet/desktop expansion */}
      <div className="w-full max-w-2xl bg-slate-950 min-h-screen flex flex-col relative shadow-2xl pb-24 border-x border-slate-800/80">
        {/* Header */}
        <Header
          currentTrip={currentTrip}
          members={members}
          currentUserId={currentUserId}
          authUser={authUser}
          onUserChange={setCurrentUserId}
          onUpdateTripName={handleUpdateTripName}
          onOpenTripSwitcher={() => setShowTripSwitcher(true)}
          onOpenShareModal={() => setShowShareModal(true)}
          onOpenAddExpense={() => setShowAddModal(true)}
          onOpenLogin={() => setShowLoginModal(true)}
        />

        {/* Current User Balance Banner */}
        <BalanceCard
          currentUser={currentUser}
          currentUserBalance={currentUserBalance}
          totalGroupExpense={totalGroupExpense}
          expenseCount={pagination.totalItems}
          memberCount={members.length}
          transactions={transactions}
          onNavigateToSettle={() => setActiveTab('settle')}
        />

        {/* Navigation Tabs */}
        <NavigationTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          expenseCount={pagination.totalItems}
          transactionCount={transactions.length}
          memberCount={members.length}
        />

        {/* Tab Contents */}
        <main className="flex-1">
          {activeTab === 'summary' && (
            <SummaryTab
              members={members}
              balances={balances}
              transactions={transactions}
              logs={logs}
              currentUserId={currentUserId}
              onNavigateToSettle={() => setActiveTab('settle')}
              onOpenAddExpense={() => setShowAddModal(true)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseList
              tripName={currentTrip?.name || 'ทริป'}
              expenses={expenses}
              members={members}
              balances={balances}
              pagination={pagination}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedPayer={selectedPayer}
              sortBy={sortBy}
              order={order}
              onSearchChange={q => {
                setSearchQuery(q);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              onCategoryChange={cat => {
                setSelectedCategory(cat);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              onPayerChange={p => {
                setSelectedPayer(p);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              onSortChange={(sb, ord) => {
                setSortBy(sb);
                setOrder(ord);
              }}
              onPageChange={page => setPagination(prev => ({ ...prev, page }))}
              onDeleteExpense={handleDeleteExpense}
              onOpenNewModal={() => setShowAddModal(true)}
              onOpenReceiptViewer={(url, title) => setShowReceiptViewer({ url, title })}
              onSeedBulk={handleSeedBulk}
              isSeedingBulk={isSeedingBulk}
            />
          )}

          {activeTab === 'settle' && (
            <SettleTab
              transactions={transactions}
              settlements={settlements}
              currentUserId={currentUserId}
              onOpenQR={tx => setShowQrModal(tx)}
              onUndoSettlement={handleUndoSettlement}
            />
          )}

          {activeTab === 'members' && (
            <MembersTab
              members={members}
              balances={balances}
              onAddMember={handleAddMember}
            />
          )}
        </main>

        {/* Modals */}
        {showAddModal && (
          <ExpenseModal
            members={members}
            currentUserId={currentUserId}
            onClose={() => setShowAddModal(false)}
            onSave={handleSaveExpense}
          />
        )}

        {showQrModal && (
          <PromptPayQRModal
            transaction={showQrModal}
            onClose={() => setShowQrModal(null)}
            onConfirmPaid={handleConfirmPaidQR}
          />
        )}

        {showReceiptViewer && (
          <ReceiptViewerModal
            imageUrl={showReceiptViewer.url}
            title={showReceiptViewer.title}
            onClose={() => setShowReceiptViewer(null)}
          />
        )}

        {showTripSwitcher && (
          <TripSwitcherModal
            trips={trips}
            currentTripId={activeTripId}
            onSelectTrip={id => setActiveTripId(id)}
            onCreateTrip={handleCreateTrip}
            onClose={() => setShowTripSwitcher(false)}
          />
        )}

        {showShareModal && (
          <ShareModal
            trip={currentTrip}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {showLoginModal && (
          <LoginModal
            currentUser={authUser}
            googleClientId={googleClientId}
            onLoginSuccess={user => {
              setAuthUser(user);
              localStorage.setItem('hg_auth_user', JSON.stringify(user));
            }}
            onLogout={() => {
              setAuthUser(null);
              localStorage.removeItem('hg_auth_user');
            }}
            onClose={() => setShowLoginModal(false)}
          />
        )}

        {/* Floating Action Button (FAB) - Always prominently visible */}
        <div className="fixed bottom-6 right-6 sm:right-8 z-40">
          <button
            onClick={() => setShowAddModal(true)}
            className="group bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-emerald-500/50 flex items-center gap-2 transition-all transform active:scale-95 hover:scale-105 border border-emerald-300/40"
            title="เพิ่มรายการบิลใหม่"
          >
            <Plus className="w-5 h-5 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
            <span className="text-xs sm:text-sm font-bold tracking-wide">เพิ่มรายการบิล</span>
          </button>
        </div>
      </div>
    </div>
  );
}
