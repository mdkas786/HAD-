import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, CreditCard, Radio, Settings, Shield, Wallet as WalletIcon, Brain, 
  Trash2, ShieldAlert, Check, X, Megaphone, Terminal, Cpu, Info, Zap, Calculator, Globe
} from 'lucide-react';
import { db } from '../lib/db';
import { formatINR, formatDate, getPlan } from '../lib/utils';
import { User, Investment, Transaction, SponsorIncome, Wallet, TradingAsset } from '../types';
import DeepChart from '../components/DeepChart';
import ProfitChart from '../components/ProfitChart';

interface Props {
  onLogout: () => void;
  config: any;
  onRefreshConfig: () => void;
}

type AdminTab = 'stats' | 'users' | 'investments' | 'payments' | 'trading' | 'notifications' | 'wallets' | 'settings' | 'ai';

export default function AdminDashboard({ onLogout, config, onRefreshConfig }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sponsorIncomes, setSponsorIncomes] = useState<SponsorIncome[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [tradingAssets, setTradingAssets] = useState<TradingAsset[]>([]);

  // Modals & Sub-forms
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // New Wallet Form
  const [newWalletType, setNewWalletType] = useState('UPI');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  
  // Custom Asset Form
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSymbol, setNewAssetSymbol] = useState('');
  const [newAssetEntry, setNewAssetEntry] = useState(1);
  const [newAssetPrice, setNewAssetPrice] = useState(1);

  // Broadcast Message Form
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  // Config Modifiers Form
  const [configAnnouncement, setConfigAnnouncement] = useState(config?.announcement_banner || '');
  const [configStarterRate, setConfigStarterRate] = useState(config?.starter_rate || 5);
  const [configGrowthRate, setConfigGrowthRate] = useState(config?.growth_rate || 6);
  const [configFortuneRate, setConfigFortuneRate] = useState(config?.fortune_rate || 7);
  const [configSuccess, setConfigSuccess] = useState('');

  // AI assistant states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Greeting backoffice administrator! I am your portfolio projection copilot. Ask me questions about today\'s cryptocurrency rebalancing metrics or expected monthly 10th payouts.' }
  ]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [scannerCoin, setScannerCoin] = useState('BTC');

  // Manual ROI Payout Modal states
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutTargetUser, setPayoutTargetUser] = useState<User | null>(null);
  const [payoutTargetInv, setPayoutTargetInv] = useState<Investment | null>(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  const loadAllBackofficeData = async () => {
    try {
      const u = await db.users.getAll();
      setUsers(u);

      const i = await db.investments.getAll();
      setInvestments(i);

      const t = await db.transactions.getAll();
      setTransactions(t.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      const s = await db.sponsorIncome.getAll();
      setSponsorIncomes(s.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      const w = await db.wallets.getAll();
      setWallets(w);

      const a = await db.tradingAssets.getAll();
      setTradingAssets(a);
    } catch (e) {
      console.error('Backoffice payload sync failures:', e);
    }
  };

  useEffect(() => {
    loadAllBackofficeData();
    const interval = setInterval(loadAllBackofficeData, 10000); // 10s backoffice sync
    return () => clearInterval(interval);
  }, []);

  // Update Config Node
  const handleConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccess('');
    try {
      await db.config.update({
        ...config,
        announcement_banner: configAnnouncement,
        starter_rate: Number(configStarterRate),
        growth_rate: Number(configGrowthRate),
        fortune_rate: Number(configFortuneRate)
      } as any);
      setConfigSuccess('App configuration constants updated successfully!');
      onRefreshConfig();
    } catch (err) {
      alert('Config modify failed');
    }
  };

  // Toggle user block restriction status
  const handleToggleBlock = async (userId: string, currentStatus: string) => {
    try {
      await db.users.toggleBlock(userId);
      loadAllBackofficeData();
    } catch (e) {
      alert('Block state switch fail');
    }
  };

  // Hard delete cascade removing user from all databases
  const handleHardDeleteUser = async (userId: string) => {
    if (!window.confirm(`⚠️ WARNING: Are you strictly sure you want to delete user ${userId}? This will remove all their investments, payout receipts, ROI incomes, and notification histories completely!`)) {
      return;
    }
    setLoading(true);
    try {
      await db.users.delete(userId, 'SYSTEM_ADMIN');
      setUsers(prev => prev.filter(u => u.had_id !== userId));
      loadAllBackofficeData();
    } catch (e) {
      alert('User hard-deletion cascade fail');
    } finally {
      setLoading(false);
    }
  };

  // Approve Payment receipt
  const handleApproveTx = async (tx: Transaction) => {
    if (!window.confirm(`Approve payment receipt of ₹${Number(tx.amount).toLocaleString('en-IN')} for ${tx.had_id}?`)) return;
    setLoading(true);
    try {
      await db.transactions.approve(tx.id);
      loadAllBackofficeData();
    } catch (e) {
      alert('Approve verification receipt fail');
    } finally {
      setLoading(false);
    }
  };

  // Open Rejection Form
  const triggerRejectTxPrompt = (tx: Transaction) => {
    setSelectedTx(tx);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Submit Rejection
  const handleSubmitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !rejectReason.trim()) return;
    setLoading(true);
    try {
      await db.transactions.reject(selectedTx.id, rejectReason);
      setShowRejectModal(false);
      setSelectedTx(null);
      loadAllBackofficeData();
    } catch (e) {
      alert('Reject ledger execution failed');
    } finally {
      setLoading(false);
    }
  };

  // Manual ROI Payout distribution
  const handleROIInstantDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutTargetUser || !payoutTargetInv) return;
    setPayoutSuccessMsg('');
    setLoading(true);
    try {
      // Calls db.ts ROI distribution for single participant
      const interestRate = payoutTargetInv.plan_rate || 5;
      const payoutAmount = payoutTargetInv.amount_invested * (interestRate / 100);
      await db.sponsorIncome.triggerRoiPayout(payoutTargetInv.id, payoutAmount, 'Monthly Payout Credit');
      setPayoutSuccessMsg(`Successfully calculated & distributed monthly dividends for ${payoutTargetUser.name}! Referral Level Qualification checked automatically.`);
      loadAllBackofficeData();
    } catch (err: any) {
      alert('Monthly distribution failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create active receiving wallet ID
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletAddress.trim()) return;
    try {
      const activeWallets = await db.wallets.getAll();
      const newW: Wallet = {
        id: Math.random().toString(),
        type: newWalletType as any,
        address: newWalletAddress.trim(),
        label: 'Added Core Wallet',
        is_active: true,
        created_at: new Date().toISOString()
      };
      await db.wallets.saveAll([...activeWallets, newW]);
      setNewWalletAddress('');
      loadAllBackofficeData();
    } catch (e) {
      alert('Wallet entry error');
    }
  };

  // Remove receiving wallet address
  const handleRemoveWallet = async (id: string) => {
    if (!window.confirm('Are you sure you want to disable this receiving account?')) return;
    try {
      const activeWallets = await db.wallets.getAll();
      const filtered = activeWallets.filter(w => w.id !== id);
      await db.wallets.saveAll(filtered);
      loadAllBackofficeData();
    } catch (e) {
      alert('Delete wallet fail');
    }
  };

  // Add customized asset holdings
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName || !newAssetSymbol) return;
    try {
      await db.tradingAssets.upsert({
        asset_name: newAssetName,
        symbol: newAssetSymbol.toUpperCase(),
        asset_type: 'crypto',
        coincap_id: newAssetName.toLowerCase().replace(' ', '-'),
        entry_price: Number(newAssetEntry),
        current_price: Number(newAssetPrice),
        allocation_percent: 0,
        target_percent: 10,
        risk_level: 'medium',
        status: 'active'
      });
      setNewAssetName('');
      setNewAssetSymbol('');
      setNewAssetEntry(1);
      setNewAssetPrice(1);
      loadAllBackofficeData();
    } catch (e) {
      alert('Create asset fail');
    }
  };

  // Set active price value on assets
  const handleUpdateAssetPrice = async (id: string, nextPrice: number) => {
    try {
      const all = await db.tradingAssets.getAll();
      const asset = all.find(a => a.id === id);
      if (asset) {
        asset.current_price = Number(nextPrice);
        await db.tradingAssets.upsert(asset);
      }
      loadAllBackofficeData();
    } catch (e) {
      alert('Update item asset price fail');
    }
  };

  // Clean delete trading asset nodes
  const handleDeleteAsset = async (id: string) => {
    try {
      await db.tradingAssets.delete(id);
      loadAllBackofficeData();
    } catch (e) {
      alert('Delete asset failure');
    }
  };

  // Sending manual message broadcasts
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSuccess('');
    if (!broadcastTitle || !broadcastBody) return;
    setLoading(true);
    try {
      await db.notifications.broadcast(broadcastTarget, broadcastTitle, broadcastBody, 'info');
      setBroadcastSuccess(`Broadcast message sent instantly to ${broadcastTarget === 'all' ? 'all registered' : 'HAD_ID specific'} investors!`);
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch (e) {
      alert('Broadcast fail');
    } finally {
      setLoading(false);
    }
  };

  // Handle backoffice AI chat trigger
  const handleAiChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || aiGenerating) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setAiGenerating(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...chatMessages, { role: 'user', content: msg }] })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setAiGenerating(false);
    }
  };

  // Run technical coin analysis
  const runTechnicalGeminiScan = async () => {
    if (aiGenerating) return;
    setAiGenerating(true);
    setAnalysisResult('Syncing indices state and booting Gemini Flash analytical model scanner...');

    const indicators = {
      basePrice: scannerCoin === 'BTC' ? 95000 : scannerCoin === 'ETH' ? 3400 : 64000,
      support: scannerCoin === 'BTC' ? 92000 : scannerCoin === 'ETH' ? 3200 : 61000,
      resistance: scannerCoin === 'BTC' ? 98000 : scannerCoin === 'ETH' ? 3600 : 66000,
      rsi: (58 + Math.random() * 15).toFixed(1),
      ema: 'widening EMA bull spreads config',
    };

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: scannerCoin, indicators })
      });
      const data = await res.json();
      setAnalysisResult(data.analysis || data.error);
    } catch (err: any) {
      setAnalysisResult(`Failed: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  // Global aggregate summaries
  const totalInvestedVolume = investments.reduce((sum, inv) => sum + Number(inv.amount_invested), 0);
  const totalVerifiedTxCount = transactions.filter(t => t.status === 'verified').length;
  const totalPendingTxCount = transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="bg-navy-dark min-h-screen flex flex-col md:flex-row font-sans">
      
      {/* ADMIN SIDEMENU CONTAINER */}
      <aside className="w-full md:w-64 bg-navy-card border-r border-white/5 flex flex-col justify-between p-6 shrink-0 shadow-2xl relative z-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gold-primary to-orange-500 rounded-lg text-white font-extrabold shadow-md">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-widest text-white uppercase leading-none">H.A.D. Core</h1>
              <p className="text-[9px] text-gold-primary font-bold tracking-wider uppercase mt-1">Audit Operations</p>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs font-mono">
            {([
              { id: 'stats', name: 'Ops Dashboard', icon: <Cpu size={14} /> },
              { id: 'users', name: 'Manage Investors', icon: <Users size={14} /> },
              { id: 'investments', name: 'ROI & Payouts', icon: <TrendingUp size={14} /> },
              { id: 'payments', name: `Verifications (${totalPendingTxCount})`, icon: <CreditCard size={14} /> },
              { id: 'trading', name: 'Trading Ledger', icon: <Globe size={14} /> },
              { id: 'notifications', name: 'Alert Broadcasts', icon: <Megaphone size={14} /> },
              { id: 'wallets', name: 'Receive setups', icon: <WalletIcon size={14} /> },
              { id: 'settings', name: 'App Settings', icon: <Settings size={14} /> },
              { id: 'ai', name: 'AI Expert Copilot', icon: <Brain size={14} /> }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-3 uppercase tracking-wider transition ${activeTab === tab.id ? 'bg-gold-primary text-navy-dark font-extrabold shadow-[0_4px_12px_rgba(201,168,76,0.15)]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8 border-t border-white/5 pt-4">
          <div className="text-[10px] text-white/30 font-mono tracking-wider flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Audit Operator Session</span>
          </div>
          <button 
            onClick={() => {
              window.history.pushState({}, '', '/system-check');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="w-full py-2 bg-gradient-to-r from-gold-primary to-amber-500 text-navy-dark hover:from-gold-light hover:to-amber-400 text-xs font-bold uppercase tracking-wider rounded-lg text-center transition"
          >
            System Audit ⚡
          </button>
          <button 
            onClick={onLogout}
            className="w-full py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-semibold uppercase tracking-wider transition"
          >
            Clear Staff Keys
          </button>
        </div>
      </aside>

      {/* ADMIN INNER SHEETS SCROLL AREA */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 relative">
        
        {/* TAB 1: OPS OVERVIEW STATISTICS */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-2">Backoffice Audit Metrics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-navy-card border border-white/5 p-5 rounded-2xl">
                <span className="text-white/40 font-mono">INVESTORS REGISTERED</span>
                <span className="text-2xl font-black text-white block mt-1">{users.length} Users</span>
              </div>
              <div className="bg-navy-card border border-white/5 p-5 rounded-2xl">
                <span className="text-white/40 font-mono">TOTAL INVESTED CORP CAPITAL</span>
                <span className="text-2xl font-black text-gold-light block mt-1">{formatINR(totalInvestedVolume)}</span>
              </div>
              <div className="bg-navy-card border border-white/5 p-5 rounded-2xl">
                <span className="text-white/40 font-mono">VERIFIED TRANSACTIONS</span>
                <span className="text-2xl font-black text-white block mt-1">{totalVerifiedTxCount} verified</span>
              </div>
              <div className="bg-navy-card border border-amber-500/20 p-5 rounded-2xl bg-amber-500/[0.02]">
                <span className="text-amber-400 font-mono font-bold">PENDING APPROVAL QUEUE</span>
                <span className="text-2xl font-black text-white block mt-1 font-bold">{totalPendingTxCount} queue</span>
              </div>
            </div>

            {/* QUICK AUDIT NOTIFICATIONS BANNER CHIP */}
            {totalPendingTxCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between text-xs font-sans text-amber-400">
                <span className="flex items-center gap-2 font-medium">🛡️ Attention: You have {totalPendingTxCount} verification ledger transactions queued. Detail verification is required.</span>
                <button onClick={() => setActiveTab('payments')} className="text-gold-light underline font-semibold font-mono">View Queue & Approve</button>
              </div>
            )}

            {/* Expected target calculation metric maps */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <ProfitChart />
              </div>
              
              <div className="lg:col-span-4 bg-navy-card border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Platform Announcements</h4>
                  <p className="text-[11px] text-white/50 leading-relaxed">Broadcast marquee banners or customized warning alert lines instantly onto user dashboards.</p>
                </div>
                
                <form onSubmit={handleBroadcastSubmit} className="flex flex-col gap-4 mt-6 text-xs font-mono">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/40 uppercase text-[9px]">Select Payout Target</label>
                    <select 
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                      className="bg-navy-dark border border-white/10 rounded-xl px-3 py-2.5 text-white"
                    >
                      <option value="all">Broadcast Alert to All Users</option>
                      {users.map(u => (
                        <option key={u.id} value={u.had_id}>{u.name} ({u.had_id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/40 uppercase text-[9px]">Subject Header</label>
                    <input 
                      type="text"
                      className="bg-navy-dark border border-white/10 rounded-xl px-3 py-2.5 text-white"
                      placeholder="e.g. Monthly dividends paid out"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/40 uppercase text-[9px]">Message Body core</label>
                    <textarea 
                      className="bg-navy-dark border border-white/10 rounded-xl px-3 py-2.5 text-white h-20 font-sans"
                      placeholder="Type details..."
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      required
                    />
                  </div>

                  {broadcastSuccess && (
                    <span className="text-[11px] text-emerald-400 font-bold">{broadcastSuccess}</span>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gold-primary text-navy-dark font-bold hover:scale-[1.01] transition uppercase tracking-wider text-[10px]"
                  >
                    Send alert now
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE INVESTORS AND BLOCK / DELETE LISTS */}
        {activeTab === 'users' && (
          <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Investors Audit Control Ledger</h3>
              <p className="text-xs text-white/40 mt-1">Review contact states, block users, or permanently delete user databases (with cascade clear!)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-[9px] uppercase">
                    <th className="py-3 px-4">HAD_ID LOGIN</th>
                    <th className="py-3 px-4">FULL NAME</th>
                    <th className="py-3 px-4">CONTACTS</th>
                    <th className="py-3 px-4">CITY</th>
                    <th className="py-3 px-4">REFERRED BY</th>
                    <th className="py-3 px-4 text-center">ACCOUNT STATUS</th>
                    <th className="py-3 px-4 text-right">AUDIT ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.01]">
                      <td className="py-3.5 px-4 font-bold text-gold-light">{row.had_id}</td>
                      <td className="py-3.5 px-4 text-white font-sans">{row.name}</td>
                      <td className="py-3.5 px-4 flex flex-col">
                        <span>{row.email}</span>
                        <span className="text-white/40 text-[10px] mt-0.5">{row.mobile || 'No Mobile'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-white/60 font-sans">{row.city || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-white/40">{row.referred_by || 'Organic Sponsor'}</td>
                      <td className="py-3.5 px-4 text-center">
                        {row.status === 'blocked' ? (
                          <span className="text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-full text-[10px]">Blocked ❌</span>
                        ) : (
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full text-[10px]">Active ✅</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-[10px]">
                          <button 
                            onClick={() => handleToggleBlock(row.had_id, row.status)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold uppercase transition ${row.status === 'blocked' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}
                          >
                            {row.status === 'blocked' ? 'Unblock' : 'Block User'}
                          </button>
                          <button 
                            onClick={() => handleHardDeleteUser(row.had_id)}
                            className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVESTMENTS MATRIX EXPECTED ROI CALCULATORS & MANUAL MONTHLY PAY */}
        {activeTab === 'investments' && (
          <div className="flex flex-col gap-6">
            <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Verified Invested Capital Slab Matrices</h3>
                  <p className="text-xs text-white/40 mt-1">Review active investor package yields. Process manual ROI dividend calculations check.</p>
                </div>
                
                {/* Trigger open payout modal */}
                <button 
                  onClick={() => {
                    setShowPayoutModal(true);
                    setPayoutTargetUser(null);
                    setPayoutTargetInv(null);
                    setPayoutSuccessMsg('');
                  }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider font-mono bg-gold-primary text-navy-dark rounded-xl shadow hover:scale-[1.01] transition"
                >
                  🚀 MANUAL MONTHLY ROI PAY DISTRIBUTOR
                </button>
              </div>

              {/* Table listing investor package logs */}
              <div className="overflow-x-auto font-mono text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-[9px] uppercase">
                      <th className="py-3 px-4">INVESTOR</th>
                      <th className="py-3 px-4 text-right">PRINCIPAL ACTIVE</th>
                      <th className="py-3 px-4">PLAN TIER</th>
                      <th className="py-3 px-4 text-right">MONTHLY TARGET CODES</th>
                      <th className="py-3 px-4 text-right">TOTAL INCOMES PAID</th>
                      <th className="py-3 px-4 text-center">LIMIT COMPLETE PROGRESS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {investments.map((inv) => {
                      const u = users.find(u => u.had_id === inv.had_id);
                      const received = Number(inv.total_income_received);
                      const cap = Number(inv.amount_invested) * 2;
                      const progressPercent = cap > 0 ? (received / cap) * 100 : 0;
                      
                      return (
                        <tr key={inv.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 px-4">
                            <span className="text-white font-bold block font-sans">{u?.name || 'N/A'}</span>
                            <span className="text-gold-light text-[10px]">{inv.had_id}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-white font-bold">{formatINR(inv.amount_invested)}</td>
                          <td className="py-3 px-4 uppercase text-gold-light font-bold">
                            {inv.plan_name} ({inv.plan_rate}%)
                          </td>
                          <td className="py-3 px-4 text-right text-white">
                            {formatINR(Number(inv.amount_invested) * (Number(inv.plan_rate) / 100))}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-bold">{formatINR(inv.total_income_received)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-24 bg-white/5 h-2 rounded-full overflow-hidden p-[1px] border border-white/10 shrink-0">
                                <div className="bg-gold-primary h-full rounded-full" style={{ width: `${Math.min(100, progressPercent)}%` }} />
                              </div>
                              <span className="text-[10px] text-white/50">{progressPercent.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAYOUT DISTRIBUTION MODAL OVERLAY */}
            {showPayoutModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-navy-card border border-gold-primary/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button 
                    onClick={() => setShowPayoutModal(false)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                  
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
                    Calculate & Disburse ROI Dividends
                  </h3>

                  <form onSubmit={handleROIInstantDistribution} className="flex flex-col gap-4 mt-6 text-xs font-mono">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-white/40 uppercase text-[9px]">Select Participant Investor</label>
                      <select 
                        onChange={(e) => {
                          const uid = e.target.value;
                          const uNode = users.find(x => x.had_id === uid);
                          const iNode = investments.find(x => x.had_id === uid);
                          setPayoutTargetUser(uNode || null);
                          setPayoutTargetInv(iNode || null);
                          setPayoutSuccessMsg('');
                        }}
                        className="bg-navy-dark border border-white/10 rounded-xl px-3 py-3 text-white"
                        defaultValue=""
                        required
                      >
                        <option value="" disabled>-- Select Verified Investor Account --</option>
                        {users.map(u => {
                          const i = investments.find(x => x.had_id === u.had_id);
                          if (!i || i.amount_invested <= 0) return null;
                          return (
                            <option key={u.id} value={u.had_id}>{u.name} ({u.had_id}) · Active: ₹{Number(i.amount_invested).toLocaleString()}</option>
                          )
                        })}
                      </select>
                    </div>

                    {payoutTargetInv && payoutTargetUser && (
                      <div className="bg-navy-dark/70 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-white/40">Active investment principal:</span>
                          <span className="text-white font-bold">{formatINR(payoutTargetInv.amount_invested)}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <span className="text-white/40">Slab Match:</span>
                          <span className="text-gold-light font-bold uppercase">{payoutTargetInv.plan_name} ({payoutTargetInv.plan_rate}%)</span>
                        </div>
                        <div className="flex justify-between items-baseline text-white">
                          <span className="text-white/45">MONTHLY RETURN AMOUNT YIELD:</span>
                          <span className="text-gold-light text-sm font-black">
                            {formatINR(Number(payoutTargetInv.amount_invested) * (Number(payoutTargetInv.plan_rate) / 100))}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 bg-white/[0.01] border border-white/10 px-3 py-2.5 rounded-lg text-white/75 mt-1">
                          <span className="text-[9px] text-white/40 tracking-wider uppercase font-bold">Transfer Destination Wallet QR billing details:</span>
                          <span className="text-[10px] text-emerald-400 font-bold block mt-1">UPI Address: {payoutTargetUser.upi_id || 'Not configured ⚠️'}</span>
                          <span className="text-[9px] text-white/40 block mt-0.5">TRC20 Wallet: {payoutTargetUser.trc20_wallet || 'Not configured'}</span>
                        </div>
                      </div>
                    )}

                    {payoutSuccessMsg && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center">
                        {payoutSuccessMsg}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={loading || !payoutTargetInv}
                      className="w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-extrabold uppercase tracking-wider hover:scale-[1.01] transition mt-2 flex items-center justify-center"
                    >
                      {loading ? 'Crediting distributions ledgers...' : 'Confirm Transfer & Distribute Coins'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DEPOSIT VERIFICATION QUEUE & REJECTION SYSTEMS */}
        {activeTab === 'payments' && (
          <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Deposit Verification Ledger Queue</h3>
              <p className="text-xs text-white/40 mt-1">Verify transferred receipts and assign investment slabs dynamically</p>
            </div>

            {transactions.filter(t => t.status === 'pending').length === 0 ? (
              <div className="py-12 text-center text-white/40 text-xs">
                🎉 No pending transfers verification queue is currently empty!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {transactions.filter(t => t.status === 'pending').map((tx) => {
                  const u = users.find(x => x.had_id === tx.had_id);
                  return (
                    <div key={tx.id} className="bg-navy-dark border border-white/5 p-5 rounded-xl flex flex-col justify-between gap-5 relative group overflow-hidden">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">PENDING VERIFY</span>
                          <h4 className="text-sm font-bold text-white mt-2 font-sans">{u?.name || 'N/A'} ({tx.had_id})</h4>
                          <span className="text-[10px] text-white/40 block font-mono mt-0.5">Mobile: {u?.mobile || 'N/A'}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-[10px] text-white/40 block">UTR REFER ID</span>
                          <span className="text-xs text-white font-semibold">{tx.utr_number}</span>
                        </div>
                      </div>

                      <div className="bg-navy-card border border-white/10 p-4 rounded-xl flex items-center justify-between font-mono">
                        <span className="text-xs text-white/40">PROPOSED PRINCIPAL CAPITAL:</span>
                        <span className="text-sm font-black text-white">{formatINR(tx.amount)}</span>
                      </div>

                      {/* Dynamic Screenshot mock representation */}
                      <div className="aspect-video bg-white/[0.02] border border-white/10 p-2.5 rounded-lg text-center flex flex-col items-center justify-center gap-1">
                        <div className="text-[10px] text-gold-light font-mono select-all font-bold">RECEIPT PROOF LEDGER SCREENSHOT</div>
                        <code className="text-[9px] text-white/30 truncate max-w-xs">{tx.proof_image_url}</code>
                        <div className="bg-white/5 px-3 py-1 border border-white/10 rounded-lg text-white/50 text-[10px] mt-2">
                          Method: {tx.payment_method_type}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => handleApproveTx(tx)}
                          disabled={loading}
                          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl flex items-center justify-center gap-1.5 transition"
                        >
                          <Check size={14} /> Approve Verified
                        </button>
                        <button 
                          onClick={() => triggerRejectTxPrompt(tx)}
                          className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-wide rounded-xl flex items-center justify-center transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* REJECTION DIALOG OVERLAY */}
            {showRejectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                <div className="bg-navy-card border border-rose-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                  <button onClick={() => setShowRejectModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
                    <X size={18} />
                  </button>

                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">Reject Transaction Proof</h3>
                  
                  <form onSubmit={handleSubmitRejection} className="flex flex-col gap-4 mt-6 text-xs font-mono">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-white/40 uppercase text-[9px]">Reason for Rejection (Visible to investor)</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="bg-navy-dark border border-white/15 rounded-xl px-4 py-3 text-white h-24 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans"
                        placeholder="e.g. UTR matches another account or screenshot unclear. Please upload again."
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-rose-500 hover:bg-rose-600 font-bold uppercase tracking-wider rounded-xl text-white mt-2"
                    >
                      Confirm Reject Submission
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TRADING ALLOCATIONS AND PORTFOLIO CONTROL */}
        {activeTab === 'trading' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* ASSET CREATION FOR USER INTERFACES */}
              <div className="lg:col-span-4 bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl h-fit">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
                  Define Deployed Portfolio Holdings
                </h3>

                <form onSubmit={handleCreateAsset} className="flex flex-col gap-4 mt-6 text-xs font-mono">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/40 uppercase text-[9px]">Asset Full Name</label>
                    <input 
                      type="text"
                      className="bg-navy-dark border border-white/10 rounded-xl px-3.5 py-3 text-white"
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                      placeholder="e.g. Binance Coin"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/40 uppercase text-[9px]">Symbol Token Code</label>
                    <input 
                      type="text"
                      className="bg-navy-dark border border-white/10 rounded-xl px-3.5 py-3 text-white"
                      value={newAssetSymbol}
                      onChange={(e) => setNewAssetSymbol(e.target.value)}
                      placeholder="e.g. BNB"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-white/40 uppercase text-[9px]">Entry Buy Price ($)</label>
                      <input 
                        type="number"
                        className="bg-navy-dark border border-white/10 rounded-xl px-3.5 py-3 text-white"
                        value={newAssetEntry}
                        onChange={(e) => setNewAssetEntry(Math.max(0, Number(e.target.value)))}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-white/40 uppercase text-[9px]">Current Index value ($)</label>
                      <input 
                        type="number"
                        className="bg-navy-dark border border-white/10 rounded-xl px-3.5 py-3 text-white"
                        value={newAssetPrice}
                        onChange={(e) => setNewAssetPrice(Math.max(0, Number(e.target.value)))}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-extrabold uppercase mt-2 shadow-lg"
                  >
                    Deploy New Asset Holding
                  </button>
                </form>
              </div>

              {/* ACTIVE HOLDING LIST MANAGEMENT */}
              <div className="lg:col-span-8 bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
                  Holding Assets Directory
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {tradingAssets.map((asset) => {
                    return (
                      <div key={asset.id} className="bg-navy-dark border border-white/5 p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">{asset.asset_name}</span>
                            <span className="text-[10px] text-white/40 uppercase">{asset.symbol}/USDT</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <span className="text-white/40">Entry Buy Price:</span>
                          <span className="text-white">${parseFloat(asset.entry_price || '0').toLocaleString()}</span>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-1">
                          <label className="text-white/40 text-[9px] uppercase">Active Index ($):</label>
                          <input 
                            type="number"
                            className="bg-navy-card border border-white/15 rounded-lg px-2 text-gold-light font-bold py-1.5 focus:outline-none focus:border-gold-primary"
                            value={asset.current_price}
                            onChange={(e) => handleUpdateAssetPrice(asset.id, Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: NOTIFICATIONS COMPOSE SESSIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl max-w-xl mx-auto w-full">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4 flex items-center gap-2">
              <Megaphone className="text-gold-primary" size={18} /> ALERT Broadcaster center
            </h3>

            <p className="text-xs text-white/50 leading-relaxed mt-4">
              Submit notifications showing up instantly on client dashboards. Ideal for payout completion alerts or planned mainteance logs.
            </p>

            <form onSubmit={handleBroadcastSubmit} className="flex flex-col gap-4 mt-6 text-xs font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 uppercase text-[9px]">Select Broadcastee</label>
                <select 
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white"
                >
                  <option value="all">Broadcast Alert to All Users</option>
                  {users.map(u => (
                    <option key={u.id} value={u.had_id}>{u.name} ({u.had_id})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 uppercase text-[9px]">Broadcast Header</label>
                <input 
                  type="text"
                  className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white"
                  placeholder="Dividends Verified successfully"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 uppercase text-[9px]">Detailed Announcement Details</label>
                <textarea 
                  className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white h-28 font-sans"
                  placeholder="Kripya check karein, aapka is mahine ka return payout verify karke transfer confirm..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  required
                />
              </div>

              {broadcastSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl text-center">
                  {broadcastSuccess}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-extrabold uppercase mt-2 tracking-wider hover:scale-[1.01] transition"
              >
                Send notification
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: EDITABLE RECEIVING WALLETS UPI OR CRYPTO DESIGN */}
        {activeTab === 'wallets' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl h-fit">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
                Define receive Account details
              </h3>

              <form onSubmit={handleCreateWallet} className="flex flex-col gap-4 mt-6 text-xs font-mono">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/40 uppercase text-[9px]">Address Category Type</label>
                  <select 
                    value={newWalletType}
                    onChange={(e) => setNewWalletType(e.target.value)}
                    className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                  >
                    <option value="UPI">UPI ADDRESS ID</option>
                    <option value="TRC20">USDT NETWORK (TRC20)</option>
                    <option value="BEP20">USDT NETWORK (BEP20 / BSC)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-white/30 uppercase text-[9px]">Receive Key / Address details</label>
                  <input 
                    type="text"
                    className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-primary"
                    placeholder="Enter wallet address or UPI sequence..."
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-bold uppercase mt-2 shadow-lg hover:scale-[1.01] transition"
                >
                  Create payout receive Node
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
                Active core receives Directories List
              </h3>

              <div className="flex flex-col gap-3.5 mt-6">
                {wallets.map((wal) => {
                  return (
                    <div key={wal.id} className="bg-navy-dark border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4 font-mono text-xs">
                      <div>
                        <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded font-bold uppercase text-gold-light">{wal.type} ACCESS</span>
                        <code className="text-white block mt-2 text-xs select-all truncate">{wal.address}</code>
                      </div>
                      <button 
                        onClick={() => handleRemoveWallet(wal.id)}
                        className="p-2 text-white/45 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: CONSTANT CONFIG SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl max-w-xl mx-auto w-full">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
              Platform General App parameters
            </h3>

            <form onSubmit={handleConfigUpdate} className="flex flex-col gap-4 mt-6 text-xs font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 uppercase text-[9px]">Global Announcement Banner text Overlay</label>
                <input 
                  type="text"
                  className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-primary"
                  value={configAnnouncement}
                  onChange={(e) => setConfigAnnouncement(e.target.value)}
                  placeholder="Enter custom warning text banner..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/40 uppercase text-[9px]">Starter Percent Rate (%)</label>
                  <input 
                    type="number"
                    className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                    value={configStarterRate}
                    onChange={(e) => setConfigStarterRate(Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/40 uppercase text-[9px]">Growth Percent Rate (%)</label>
                  <input 
                    type="number"
                    className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                    value={configGrowthRate}
                    onChange={(e) => setConfigGrowthRate(Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/40 uppercase text-[9px]">Fortune Percent Rate (%)</label>
                  <input 
                    type="number"
                    className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                    value={configFortuneRate}
                    onChange={(e) => setConfigFortuneRate(Number(e.target.value))}
                  />
                </div>
              </div>

              {configSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl text-center">
                  {configSuccess}
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-extrabold uppercase mt-4 shadow-lg hover:scale-[1.01] transition"
              >
                Sync platform constants
              </button>
            </form>
          </div>
        )}

        {/* TAB 9: REACTIONARY AI EXPERT SYSTEMS COPILOT */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* REALTIME GEMINI PRO SCANNER INDICES */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Cpu size={18} className="text-gold-primary" /> Gemini Flash Technical Model Analyzer
                    </h3>
                    <p className="text-xs text-white/40 mt-1">Select coin symbol to generate technical momentum advisory recommendations instantly</p>
                  </div>

                  {/* Coin selectors */}
                  <div className="flex items-center gap-3">
                    <select 
                      value={scannerCoin}
                      onChange={(e) => setScannerCoin(e.target.value)}
                      className="bg-navy-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    >
                      <option value="BTC">BTC / Bitcoin</option>
                      <option value="ETH">ETH / Ethereum</option>
                      <option value="SOL">SOL / Solana</option>
                    </select>
                    
                    <button 
                      onClick={runTechnicalGeminiScan}
                      disabled={aiGenerating}
                      className="px-4 py-2 bg-gold-primary text-navy-dark font-extrabold uppercase tracking-wide rounded-xl text-xs shadow hover:scale-[1.01] transition shrink-0"
                    >
                      {aiGenerating ? 'Analyzing...' : 'Scan holding'}
                    </button>
                  </div>
                </div>

                {/* Simulated charts */}
                <DeepChart symbol={scannerCoin} basePrice={scannerCoin === 'BTC' ? 95000 : scannerCoin === 'ETH' ? 3400 : 185} />

                {/* Output analysis result panels */}
                {analysisResult && (
                  <div className="bg-navy-dark/90 border border-gold-primary/20 p-5 rounded-2xl text-xs text-white/90 leading-relaxed font-sans shadow-inner space-y-3 prose prose-invert overflow-auto">
                    <div className="font-mono text-[10px] text-gold-light uppercase tracking-widest border-b border-white/5 pb-2">Technical Analysis Verdict</div>
                    <div className="whitespace-pre-line text-white/80">{analysisResult}</div>
                  </div>
                )}
              </div>
            </div>

            {/* CHAT ADVISOR ASSISTANT COPILED */}
            <div className="lg:col-span-4 bg-navy-card border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[450px] lg:h-auto">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI backoffice Copilot</h3>
                <p className="text-[10px] text-white/40 mt-0.5">Consult Gemini on portfolio projections & H.A.D rules</p>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-3 max-h-[280px]">
                {chatMessages.map((msg, idx) => {
                  const isAss = msg.role === 'assistant';
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${isAss ? 'bg-white/5 text-white/80 border border-white/5 self-start' : 'bg-gold-primary/10 text-gold-light border border-gold-primary/20 self-end'}`}
                    >
                      <span className="font-mono text-[9px] text-white/30 block mb-1 uppercase font-bold">{isAss ? 'Copilot bot' : 'You (Staff)'}</span>
                      <p className="font-sans whitespace-pre-line">{msg.content}</p>
                    </div>
                  )
                })}
                {aiGenerating && (
                  <div className="p-3 bg-white/5 rounded-xl text-[10px] text-white/30 font-mono animate-pulse self-start">
                    🤖 Gemini is processing core algorithms...
                  </div>
                )}
              </div>

              <form onSubmit={handleAiChatSubmit} className="flex gap-2 mt-4 font-mono text-xs">
                <input 
                  type="text"
                  className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-gold-primary"
                  placeholder="Ask advisor..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={aiGenerating}
                  required
                />
                <button 
                  type="submit"
                  disabled={aiGenerating}
                  className="px-4 py-2.5 bg-gold-primary text-navy-dark rounded-xl font-bold uppercase transition hover:opacity-90 shrink-0"
                >
                  Ask
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
