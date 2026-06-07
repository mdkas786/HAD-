import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Compass, CreditCard, Share2, Wallet as WalletIcon, User as UserIcon, LogOut, Shield, 
  Coins, UserCheck, CheckCircle2, AlertTriangle, ArrowRight, Clipboard, ChevronRight, Copy, Check 
} from 'lucide-react';
import { db } from '../lib/db';
import { formatINR, formatDate, getPlan } from '../lib/utils';
import { User, Investment, Transaction, SponsorIncome } from '../types';
import NotificationsDropdown from '../components/NotificationsDropdown';

interface Props {
  user: User;
  onLogout: () => void;
  config: any;
}

type UserTab = 'dashboard' | 'markets' | 'pay' | 'referral' | 'income' | 'profile';

export default function UserDashboard({ user: initialUser, onLogout, config }: Props) {
  const [user, setUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState<UserTab>('dashboard');
  
  // Data State
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sponsorIncomes, setSponsorIncomes] = useState<SponsorIncome[]>([]);
  const [companyAssets, setCompanyAssets] = useState<any[]>([]);
  const [allMarkets, setAllMarkets] = useState<any[]>([]);
  const [companyWallets, setCompanyWallets] = useState<any[]>([]);
  
  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketSearch, setMarketSearch] = useState('');
  const [marketTab, setMarketTab] = useState<'top20' | 'all' | 'gainers' | 'losers'>('top20');
  
  // Forms states
  const [payAmount, setPayAmount] = useState<number>(50000);
  const [payMethod, setPayMethod] = useState('UPI');
  const [payUtr, setPayUtr] = useState('');
  const [payScreenshot, setPayScreenshot] = useState<string | null>(null);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');
  const [payErrorMsg, setPayErrorMsg] = useState('');

  const [profileMobile, setProfileMobile] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileUpi, setProfileUpi] = useState('');
  const [profileTrc25, setProfileTrc25] = useState('');
  const [profileBep25, setProfileBep25] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Load user details
  const refreshAllData = async () => {
    try {
      // Reload User object (to track if blocked/updated)
      const u = await db.users.get(user.had_id);
      if (u) {
        setUser(u);
        setProfileMobile(u.mobile || '');
        setProfileCity(u.city || '');
        setProfileUpi(u.upi_id || '');
        setProfileTrc25(u.trc20_wallet || '');
        setProfileBep25(u.bep20_wallet || '');
        
        if (u.status === 'blocked') {
          onLogout();
          alert('🚫 Aapka account block ho gaya hai. Contact support.');
          return;
        }
      }

      // Reload investments
      const inv = await db.investments.get(user.had_id);
      setInvestment(inv);

      // Reload transactions
      const txs = await db.transactions.getAll();
      setTransactions(txs.filter(t => t.had_id === user.had_id));

      // Reload incomes
      const ins = await db.sponsorIncome.getAll();
      setSponsorIncomes(ins.filter(s => s.earner_had_id === user.had_id));

      // Reload trading assets
      const assets = await db.tradingAssets.getAll();
      setCompanyAssets(assets.filter(a => a.status === 'active'));

      // Reload wallets
      const wals = await db.wallets.getAll();
      setCompanyWallets(wals.filter(w => w.is_active));

    } catch (e) {
      console.error('Data reload err:', e);
    }
  };

  // Fetch Public CoinCap market data
  const fetchMarketData = async () => {
    try {
      const res = await fetch('https://api.coincap.io/v2/assets?limit=55');
      const json = await res.json();
      if (json && json.data) {
        setAllMarkets(json.data);
      }
    } catch (e) {
      console.error('Market fetch failed:', e);
    }
  };

  useEffect(() => {
    refreshAllData();
    fetchMarketData();

    // 15 seconds polling backup sync
    const timer = setInterval(() => {
      refreshAllData();
    }, 15000);

    const mTimer = setInterval(() => {
      fetchMarketData();
    }, 45000);

    return () => {
      clearInterval(timer);
      clearInterval(mTimer);
    };
  }, [user.had_id]);

  // Handle Copy Trigger
  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submitting pay proof details
  const handlePaymentProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaySuccessMsg('');
    setPayErrorMsg('');
    
    if (!payAmount || payAmount < 1000) {
      setPayErrorMsg('Sahi transfer investment enter karein (greater than ₹1,000)');
      return;
    }
    if (!payUtr) {
      setPayErrorMsg('UTR/UPI Reference ID enter karna mandatory hai.');
      return;
    }

    setLoading(true);
    try {
      // Process submit
      await db.transactions.submit(
        user.had_id, 
        payAmount, 
        payMethod, 
        payUtr, 
        payScreenshot || `https://api.qrserver.com/v1/create-qr-code/?size=250&data=${payUtr}` // placeholder image
      );
      setPaySuccessMsg('Payment proof submits properly! Verified within 4-12 hours.');
      setPayUtr('');
      setPayScreenshot(null);
      refreshAllData();
    } catch (e) {
      setPayErrorMsg('Transaction submit failure. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update Profile fields
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setLoading(true);
    try {
      await db.users.update(user.had_id, {
        mobile: profileMobile,
        city: profileCity,
        upi_id: profileUpi,
        trc20_wallet: profileTrc25,
        bep20_wallet: profileBep25
      });
      setProfileSuccessMsg('Profile and receiving wallets saved!');
      refreshAllData();
    } catch (e) {
      alert('Profile update failure.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalReceived = investment ? Number(investment.total_income_received) : 0;
  const maxCapTarget = investment ? Number(investment.amount_invested) * 2 : 0;
  const remainingTarget = Math.max(0, maxCapTarget - totalReceived);
  const targetCompletedPercent = maxCapTarget > 0 ? (totalReceived / maxCapTarget) * 100 : 0;

  // Referral counts
  const directsCount = localStorage.getItem('had_users') 
    ? (JSON.parse(localStorage.getItem('had_users')!) as User[]).filter(u => u.referred_by === user.had_id).length
    : 0;
    
  // Verified refer directs
  const verifiedRefsCount = localStorage.getItem('had_users') 
    ? (JSON.parse(localStorage.getItem('had_users')!) as User[]).filter(u => u.referred_by === user.had_id).filter(u => {
        const invs = localStorage.getItem('had_investments') ? JSON.parse(localStorage.getItem('had_investments')!) as Investment[] : [];
        return invs.some(i => i.had_id === u.had_id && i.amount_invested > 0);
      }).length
    : 0;

  return (
    <div className="bg-navy-dark min-h-screen pb-16 relative">
      {/* HEADER BAR */}
      <header className="bg-navy-card border-b border-white/5 sticky top-0 z-20 shadow-lg px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => setActiveTab('dashboard')}>
            <Shield className="text-gold-primary shrink-0" size={24} />
            <span className="text-sm font-black tracking-widest text-white uppercase hidden xs:block">H.A.D. Asset</span>
          </div>

          {/* Real-time Crypto Scrolling marquee */}
          <div className="flex-1 max-w-xl mx-4 overflow-hidden h-8 flex items-center bg-navy-dark/40 border border-white/5 rounded-lg px-2 text-xs font-mono select-none">
            <div className="flex animate-ticker whitespace-nowrap gap-6 text-[10px]">
              {allMarkets.slice(0, 8).map((c, i) => {
                const change = parseFloat(c.changePercent24Hr || '0');
                return (
                  <span key={i} className="inline-flex items-center gap-1">
                    <span className="text-white font-medium">{c.symbol}</span>
                    <span className="text-white/60">${parseFloat(c.priceUsd).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                    <span className={change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                    <span className="text-white/10 ml-2">|</span>
                  </span>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationsDropdown hadId={user.had_id} onRefreshTrigger={refreshAllData} />
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/system-check');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="px-2.5 py-1 text-[10px] font-mono border border-gold-primary/20 bg-gold-primary/5 hover:bg-gold-primary/10 text-gold-primary rounded-lg transition uppercase font-semibold"
              title="System Connection Diagnostics"
            >
              Audit ⚡
            </button>
            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-xs font-mono font-bold text-gold-light tracking-wide uppercase">
              {user.had_id}
            </span>
            <button 
              onClick={onLogout}
              className="p-1.5 rounded-lg text-white/60 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* TOP USER NAVIGATION ROUTERS */}
      <div className="bg-navy-card/50 border-b border-white/5 py-1">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto flex items-center gap-1 scrollbar-none text-xs font-mono scroll-smooth">
          {([
            { id: 'dashboard', name: 'Dashboard', icon: <Compass size={14} /> },
            { id: 'markets', name: 'Markets', icon: <TrendingUp size={14} /> },
            { id: 'pay', name: 'Pay Portfolio', icon: <CreditCard size={14} /> },
            { id: 'referral', name: 'Refer & Earn', icon: <Share2 size={14} /> },
            { id: 'income', name: 'My Income', icon: <WalletIcon size={14} /> },
            { id: 'profile', name: 'My Profile', icon: <UserIcon size={14} /> }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-lg flex items-center gap-2 uppercase tracking-wider shrink-0 transition ${activeTab === tab.id ? 'text-gold-primary bg-white/5 border-b-2 border-gold-primary font-bold' : 'text-white/60 hover:text-white hover:bg-white/[0.02]'}`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* BODY CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* VIEW 1: USER DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* WELCOME BANNER */}
            <div className="bg-gradient-to-r from-navy-card to-navy-sub border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Hello {user.name} 👋
                </h2>
                <p className="text-xs text-white/50 font-mono mt-1">
                  ID CODE: <span className="text-gold-primary font-bold font-mono">{user.had_id}</span> · Joined: {formatDate(user.created_at)}
                </p>
              </div>
              <div className="bg-gold-primary/10 border border-gold-primary/20 px-4 py-2 rounded-xl text-xs font-mono font-medium text-gold-light w-fit">
                ⏱️ Next Monthly ROI Dividend: 10th Month
              </div>
            </div>

            {/* MAIN INVESTMENT slab CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* PRIMARY CARD TARGET PAYOFF PROFILES */}
              <div className="lg:col-span-8 bg-navy-card border-2 border-gold-primary/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-40 w-40 bg-gold-primary/5 rounded-full blur-3xl" />
                
                <h3 className="text-xs font-bold text-gold-primary uppercase tracking-wider font-mono">Investment Package Tracker</h3>
                
                {investment ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 border-b border-white/5 pb-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/40 tracking-wider">TOTAL INVESTED</span>
                      <span className="text-2xl font-extrabold font-mono text-white">{formatINR(investment.amount_invested)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/40 tracking-wider">SLAB PACKAGE RATE</span>
                      <span className="text-2xl font-extrabold font-mono text-gold-light">
                        {investment.plan_name} ({investment.plan_rate}%/mo)
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/40 tracking-wider">EST. MONTHLY ROI</span>
                      <span className="text-2xl font-extrabold font-mono text-white">
                        {formatINR(Number(investment.amount_invested) * (Number(investment.plan_rate) / 100))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 border-b border-white/5 text-center text-white/50 text-xs">
                    ⚠️ Active investment slab empty. Transfer funds at Pay page.
                  </div>
                )}

                {/* 2X PROGRESS MATRIX BAR */}
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/40 uppercase">Total Received</span>
                      <span className="text-sm font-bold text-white mt-0.5">{formatINR(totalReceived)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gold-primary uppercase font-bold">2X Limit Target</span>
                      <span className="text-sm font-bold text-white mt-0.5">{formatINR(maxCapTarget)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-white/40 uppercase">Remaining payoff</span>
                      <span className="text-sm font-bold text-gold-light mt-0.5">{formatINR(remainingTarget)}</span>
                    </div>
                  </div>

                  {/* Progressive track layout */}
                  <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div 
                      className="bg-gradient-to-r from-gold-primary to-gold-light h-full rounded-full rounded-r shadow-inner transition-all duration-1000"
                      style={{ width: `${Math.min(100, targetCompletedPercent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/35 font-mono">
                    <span>2X Progression Status</span>
                    <span>{targetCompletedPercent.toFixed(1)}% Completed</span>
                  </div>
                </div>
              </div>

              {/* QUICK STATUS BOXES */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* PENDING APPROVAL CAP BOX */}
                <div className="bg-navy-card border border-amber-500/25 p-5 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">Pending Approvals</h4>
                    <span className="text-xl font-bold font-mono text-white block mt-1">
                      {formatINR(transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + Number(t.amount), 0))}
                    </span>
                    <p className="text-[10px] text-white/40 mt-1">
                      {transactions.filter(t => t.status === 'pending').length} verified proof logs pending admin approve.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-full text-amber-400 shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                </div>

                {/* EARNINGS SUMMARY STATS */}
                <div className="bg-navy-card border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-full">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">Affiliation Paid Bonuses</span>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <span className="text-[9px] text-white/40 font-mono">Sponsor (5%)</span>
                      <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">
                        {formatINR(sponsorIncomes.filter(s => s.type === 'referral' && s.status === 'paid').reduce((sum, s) => sum + Number(s.income_amount), 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 font-mono">Partner (10%)</span>
                      <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">
                        {formatINR(sponsorIncomes.filter(s => s.type === 'level' && s.status === 'paid').reduce((sum, s) => sum + Number(s.income_amount), 0))}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-3 mt-3 text-[10px] text-white/40 font-mono leading-relaxed">
                    Referral + level partner earnings are automatically adjusted into your individual 2X principal target speed!
                  </div>
                </div>
              </div>
            </div>

            {/* PORTFOLIO ASSETS DEPLOYED FEED */}
            <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">H.A.D. Live Portfolio Asset Allocations</h3>
                  <p className="text-xs text-white/40 mt-0.5">Track precisely where corporate investments are allocated dynamically</p>
                </div>
                <button onClick={() => setActiveTab('markets')} className="text-xs text-gold-light hover:underline font-mono flex items-center gap-1.5 shrink-0">
                  Browse Markets <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {companyAssets.map((asset) => {
                  return (
                    <div key={asset.id} className="bg-navy-dark border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">{asset.asset_name}</span>
                          <span className="text-[10px] font-mono text-white/40 uppercase">{asset.symbol}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 rounded-full bg-emerald-500/10 text-emerald-400">
                          Deploy Active
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-white/40">Launch entry price:</span>
                        <span className="text-white font-medium">${parseFloat(asset.entry_price || '0').toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-white/40">Current index rate:</span>
                        <span className="text-gold-light font-bold">${parseFloat(asset.current_price || '0').toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* USER QUICK ACTIONS CARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
              <div onClick={() => setActiveTab('pay')} className="bg-navy-card hover:bg-white/[0.01] border border-white/5 hover:border-gold-primary/30 p-5 rounded-2xl shadow-lg cursor-pointer transition flex flex-col gap-2">
                <div className="p-2 bg-gold-primary/10 rounded-xl text-gold-primary w-fit"><CreditCard size={18} /></div>
                <h4 className="text-xs font-bold text-white tracking-wide uppercase mt-2">Make Payment</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">Deposit investment slabs using UPI QR codes or TRC20 transfer modes.</p>
              </div>

              <div onClick={() => setActiveTab('income')} className="bg-navy-card hover:bg-white/[0.01] border border-white/5 hover:border-gold-primary/30 p-5 rounded-2xl shadow-lg cursor-pointer transition flex flex-col gap-2">
                <div className="p-2 bg-gold-primary/10 rounded-xl text-gold-primary w-fit"><WalletIcon size={18} /></div>
                <h4 className="text-xs font-bold text-white tracking-wide uppercase mt-2">My Bonuses Log</h4>
                <p className="text-[11px] text-white/50 leading-relaxed font-sans">Track historical ROI pay checks, Sponsor referral income verification dates.</p>
              </div>

              <div onClick={() => setActiveTab('referral')} className="bg-navy-card hover:bg-white/[0.01] border border-white/5 hover:border-gold-primary/30 p-5 rounded-2xl shadow-lg cursor-pointer transition flex flex-col gap-2">
                <div className="p-2 bg-gold-primary/10 rounded-xl text-gold-primary w-fit"><Share2 size={18} /></div>
                <h4 className="text-xs font-bold text-white tracking-wide uppercase mt-2">Referrals Map</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">Fetch direct invite links, promotional layouts and track partner statuses.</p>
              </div>

              <div onClick={() => setActiveTab('profile')} className="bg-navy-card hover:bg-white/[0.01] border border-white/5 hover:border-gold-primary/30 p-5 rounded-2xl shadow-lg cursor-pointer transition flex flex-col gap-2">
                <div className="p-2 bg-gold-primary/10 rounded-xl text-gold-primary w-fit"><UserIcon size={18} /></div>
                <h4 className="text-xs font-bold text-white tracking-wide uppercase mt-2">Payout Welcoming Setup</h4>
                <p className="text-[11px] text-white/50 leading-relaxed font-sans">Set customized UPI details, crypto folders to receive return payouts directly.</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MARKETS GRID FOR TOKEN COIN CAPS */}
        {activeTab === 'markets' && (
          <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">CoinCap Global Indices Grid</h3>
                <p className="text-xs text-white/40 mt-1">Converted instantly into INR at standard fixed calculation rate: ₹95 / $</p>
              </div>
              
              {/* Filter inputs search */}
              <input 
                type="text"
                placeholder="Search Bitcoin, Ethereum, etc..."
                value={marketSearch}
                onChange={(e) => setMarketSearch(e.target.value)}
                className="bg-navy-dark border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-gold-primary w-full sm:w-64"
              />
            </div>

            {/* Markets lists tables */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 font-mono text-[10px] uppercase">
                    <th className="py-3 px-4"># RANK</th>
                    <th className="py-3 px-4">NAME</th>
                    <th className="py-3 px-4 text-right">PRICE (USD)</th>
                    <th className="py-3 px-4 text-right">PRICE (INR @ ₹95)</th>
                    <th className="py-3 px-4 text-right">24H CHANGE</th>
                    <th className="py-3 px-4 text-right">MARKET CAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {allMarkets
                    .filter(c => c.name.toLowerCase().includes(marketSearch.toLowerCase()) || c.symbol.toLowerCase().includes(marketSearch.toLowerCase()))
                    .map((coin, index) => {
                      const change = parseFloat(coin.changePercent24Hr || '0');
                      const inrRate = parseFloat(coin.priceUsd) * 95;
                      const cap = parseFloat(coin.marketCapUsd || '0');
                      
                      return (
                        <tr key={index} className="hover:bg-white/[0.01]">
                          <td className="py-3.5 px-4 text-white/50">#{coin.rank}</td>
                          <td className="py-3.5 px-4 flex items-center gap-2">
                            <span className="text-white font-bold">{coin.name}</span>
                            <span className="text-[10px] text-white/40 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-medium uppercase">{coin.symbol}</span>
                            {companyAssets.some(a => a.symbol.toUpperCase() === coin.symbol.toUpperCase()) && (
                              <span className="text-[8px] tracking-wide font-sans bg-gold-primary/10 text-gold-primary bordered border-gold-primary/20 px-1.5 py-0.5 rounded font-semibold uppercase">Holding</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-white">${parseFloat(coin.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3.5 px-4 text-right text-gold-light font-bold">
                            ₹{(inrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-bold ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                          </td>
                          <td className="py-3.5 px-4 text-right text-white/50">${(cap / 1e9).toFixed(2)}B</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: DYNAMIC PAYING SECTION */}
        {activeTab === 'pay' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* INPUT DETAILS CORES */}
            <div className="lg:col-span-7 bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
                Transfers Payment Proof Inputs
              </h3>

              <form onSubmit={handlePaymentProofSubmit} className="flex flex-col gap-5 mt-6">
                {/* AMOUNT INPUT BOX */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">INVESTMENT DEPOSIT AMOUNT (₹)</label>
                  <input 
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Math.max(0, Number(e.target.value)))}
                    className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold font-mono text-white focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary"
                    placeholder="Enter amount (e.g. 50000)"
                    min={100}
                    required
                  />
                  
                  {/* SLAB AUTOMATED ASSIGNMENT PREVIEW */}
                  <div className="bg-gold-primary/5 border border-gold-primary/20 rounded-xl p-3.5 text-xs text-gold-light font-mono flex items-center justify-between gap-2 mt-1">
                    <span>Target Slab Assignment Match:</span>
                    <span className="font-bold underline">{getPlan(payAmount).name} Plan ({getPlan(payAmount).rate}% monthly roi payouts)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Payment Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-mono focus:outline-none focus:border-gold-primary"
                    >
                      <option value="UPI">UPI Transfer ID</option>
                      <option value="USDT TRC20">USDT (TRC20 Network)</option>
                      <option value="USDT BEP20">USDT (BEP20 / BSC)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">UTR / Transaction Reference Code</label>
                    <input 
                      type="text"
                      value={payUtr}
                      onChange={(e) => setPayUtr(e.target.value)}
                      className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3.5 text-xs font-mono text-white focus:outline-none focus:border-gold-primary"
                      placeholder="12 transaction digit sequence"
                      required
                    />
                  </div>
                </div>

                {/* Screenshot auto generate mockup */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Upload Screenshot Receipts proof</label>
                  <div className="border border-dashed border-white/10 rounded-xl p-6 text-center text-xs text-white/50 flex flex-col items-center justify-center gap-2 bg-navy-dark/30 hover:border-white/20 cursor-pointer transition">
                    <span>📸 Tap to snap camera receipt details or drag files</span>
                    <span className="text-[9px] text-white/20 uppercase font-mono">Standard JPG, PNG accepted (Auto verifies on submittals)</span>
                  </div>
                </div>

                {paySuccessMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 p-4 rounded-xl text-center">
                    {paySuccessMsg}
                  </div>
                )}
                {payErrorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 p-4 rounded-xl text-center">
                    {payErrorMsg}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-bold text-xs uppercase tracking-wider shadow-lg transition hover:scale-[1.01] flex items-center justify-center"
                >
                  {loading ? 'Processing verified proofs...' : 'Submit Verification Ledger'}
                </button>
              </form>
            </div>

            {/* COMPANY DEPOSIT GATEWAYS DIRECTORY */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* UPI HOLDINGS */}
              <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl">
                <span className="text-[9px] font-mono font-bold bg-gold-primary/10 text-gold-primary px-2 py-0.5 rounded-full uppercase">Instant Auto UPI QR</span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-2">Active UPI core Receiving ID</h4>
                
                {companyWallets.filter(w => w.type === 'UPI').map((wallet) => {
                  const payLink = `upi://pay?pa=${wallet.address}&pn=HAD+Asset+Management&cu=INR&am=${payAmount}`;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payLink)}`;
                  
                  return (
                    <div key={wallet.id} className="mt-4 bg-navy-dark border border-white/5 p-4 rounded-xl flex flex-col items-center gap-4 text-center">
                      <div className="bg-white p-2.5 rounded-lg shadow-inner">
                        <img src={qrUrl} alt="UPI QR" className="h-40 w-40 object-contain" />
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <span className="text-[9px] text-white/30 font-mono tracking-wider">UPI ADDRESS CODES</span>
                        <div className="flex items-center justify-between gap-2 bg-navy-card border border-white/10 px-3 py-2 rounded-lg font-mono text-xs text-white">
                          <code className="text-gold-light select-all">{wallet.address}</code>
                          <button 
                            onClick={() => triggerCopy(wallet.address, wallet.id)}
                            className="p-1 rounded text-white/50 hover:text-white hover:bg-white/5"
                          >
                            {copiedId === wallet.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full text-[10px] font-mono">
                        <a href={`tez://upi/pay?pa=${wallet.address}&pn=HAD&am=${payAmount}&cu=INR`} className="py-2 rounded bg-white/5 border border-white/5 text-white block hover:bg-white/10">Google Pay</a>
                        <a href={`phonepe://pay?pa=${wallet.address}&pn=HAD&am=${payAmount}&cu=INR`} className="py-2 rounded bg-white/5 border border-white/5 text-white block hover:bg-white/10">PhonePe</a>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* CRYPTO PORTFOLIO CHIP GATEWAYS */}
              <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">USDT Transfer Ledger Codes</h4>
                
                {companyWallets.filter(w => w.type === 'TRC20' || w.type === 'BEP20').map((wallet) => {
                  return (
                    <div key={wallet.id} className="bg-navy-dark border border-white/5 p-3.5 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold text-gold-light">{wallet.type} NETWORK</span>
                        <span className="text-[9px] text-white/30 font-mono italic">USDT only</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-navy-card border border-white/10 px-3 py-2 rounded-lg font-mono text-[10px] text-white">
                        <code className="break-all cursor-all">{wallet.address}</code>
                        <button 
                          onClick={() => triggerCopy(wallet.address, wallet.id)}
                          className="p-1 rounded text-white/50 hover:text-white hover:bg-white/5 shrink-0"
                        >
                          {copiedId === wallet.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: REFERRALS AND AFFILIATES CODE LOGS */}
        {activeTab === 'referral' && (
          <div className="flex flex-col gap-6">
            <div className="bg-navy-card border border-gold-primary/20 rounded-2xl p-6 shadow-xl text-center max-w-2xl mx-auto w-full flex flex-col items-center gap-6">
              <span className="text-xs text-gold-primary font-bold tracking-widest uppercase font-mono">Personal Sponsor Code</span>
              <div className="tracking-[0.4em] font-mono text-3xl sm:text-4xl font-extrabold text-white bg-white/[0.02] border border-white/10 py-4 px-8 rounded-2xl w-fit">
                {user.had_id.split('').join(' ')}
              </div>
              
              <div className="flex flex-col gap-1 w-full text-left">
                <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider ml-1">Unique Invite Referral URL</span>
                <div className="flex items-center justify-between gap-3 bg-navy-dark border border-white/10 p-3 rounded-xl font-mono text-xs text-white">
                  <code className="text-gold-light select-all truncate">{`${window.location.origin}/register?ref=${user.had_id}`}</code>
                  <button 
                    onClick={() => triggerCopy(`${window.location.origin}/register?ref=${user.had_id}`, 'invite_url')}
                    className="p-2 rounded bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition flex gap-1.5 items-center shrink-0"
                  >
                    {copiedId === 'invite_url' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedId === 'invite_url' ? 'Copied' : 'Copy link'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-2 text-left">
                <div className="bg-navy-dark border border-white/5 p-4 rounded-xl font-mono text-center">
                  <span className="text-[9px] text-white/40 block">TOTAL DIRECT USERS</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{directsCount}</span>
                </div>
                <div className="bg-navy-dark border border-white/5 p-4 rounded-xl font-mono text-center">
                  <span className="text-[9px] text-white/40 block">SPONSOR EARNINGS</span>
                  <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                    {formatINR(sponsorIncomes.filter(s => s.type === 'referral' && s.status === 'paid').reduce((sum, s) => sum + Number(s.income_amount), 0))}
                  </span>
                </div>
                <div className="bg-navy-dark border border-white/5 p-4 rounded-xl font-mono text-center">
                  <span className="text-[9px] text-white/40 block">VERIFIED INVITES</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{verifiedRefsCount} / {directsCount}</span>
                </div>
              </div>

              {/* Partner check eligibility */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-left w-full flex items-center justify-between gap-4 font-sans text-xs">
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">Partner Level Income Eligibility</h4>
                  <p className="text-white/50 leading-relaxed">
                    2 directs are verified with investments to receive the extra 10% on direct payouts.
                  </p>
                </div>
                {verifiedRefsCount >= 2 ? (
                  <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono text-[10px] font-bold tracking-wider shrink-0 uppercase flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Active ✅
                  </div>
                ) : (
                  <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-mono text-[10px] font-bold tracking-wider shrink-0 uppercase">
                    Need {2 - verifiedRefsCount} More
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: INCOME BONUS TABLES AND TABS */}
        {activeTab === 'income' && (
          <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Earnings Balance LEDGERS</h3>
              <p className="text-xs text-white/40 mt-1">Sponsor bonuses, ROI payouts, and partner commission distributions</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-navy-dark border border-white/5 p-4 rounded-xl">
                <span className="text-[9px] text-white/40">ROI YIELD PAID</span>
                <span className="text-xl font-bold text-white block mt-1">
                  {formatINR(sponsorIncomes.filter(s => s.type === 'roi' && s.status === 'paid').reduce((sum, s) => sum + Number(s.income_amount), 0))}
                </span>
              </div>
              <div className="bg-navy-dark border border-white/5 p-4 rounded-xl">
                <span className="text-[9px] text-white/40">SPONSOR INTERNET (5%)</span>
                <span className="text-xl font-bold text-white block mt-1">
                  {formatINR(sponsorIncomes.filter(s => s.type === 'referral' && s.status === 'paid').reduce((sum, s) => sum + Number(s.income_amount), 0))}
                </span>
              </div>
              <div className="bg-navy-dark border border-white/5 p-4 rounded-xl">
                <span className="text-[9px] text-white/40">LEVEL PARTNER (10%)</span>
                <span className="text-xl font-bold text-white block mt-1">
                  {formatINR(sponsorIncomes.filter(s => s.type === 'level' && s.status === 'paid').reduce((sum, s) => sum + Number(s.income_amount), 0))}
                </span>
              </div>
              <div className="bg-gold-primary/10 border border-gold-primary/20 p-4 rounded-xl">
                <span className="text-[9px] text-gold-light">CUMULATIVE EARNED</span>
                <span className="text-xl font-black text-white block mt-1">
                  {formatINR(sponsorIncomes.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.income_amount), 0))}
                </span>
              </div>
            </div>

            {/* Income rows ledger tables */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 font-mono text-[10px] uppercase">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">BONUS TYPE</th>
                    <th className="py-3 px-4">BASE CALC VALUE</th>
                    <th className="py-3 px-4 text-right">INCOME EARNED</th>
                    <th className="py-3 px-4 text-right">DISTRIBUTION OUTCOME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {sponsorIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/40">
                        📭 Income bonuses list empty.
                      </td>
                    </tr>
                  ) : (
                    sponsorIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 px-4 text-white/50">{formatDate(inc.created_at)}</td>
                        <td className="py-3 px-4 uppercase font-bold">
                          {inc.type === 'roi' ? (
                            <span className="text-gold-light">Plan ROI Yield</span>
                          ) : inc.type === 'referral' ? (
                            <span className="text-emerald-400">Invite Static Sponsor</span>
                          ) : (
                            <span className="text-indigo-400">Partner Direct ROI Bonus</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-white/60">
                          {formatINR(inc.base_amount)} ({inc.percentage}%) {inc.source_had_id && `from ${inc.source_had_id}`}
                        </td>
                        <td className="py-3 px-4 text-right text-white font-bold">{formatINR(inc.income_amount)}</td>
                        <td className="py-3 px-4 text-right">
                          {inc.status === 'paid' ? (
                            <span className="text-emerald-400 font-bold">Paid Out ✅</span>
                          ) : (
                            <span className="text-amber-400 font-bold">Pending Verify ⏱️</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 6: MEMBERS SECTION AND PROFILES */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* EDITABLE PROFILE PREFS */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
                  Profile contact welcoming details
                </h3>

                <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4 mt-6 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-white/40 uppercase text-[9px]">Mobile Number</label>
                      <input 
                        type="text"
                        value={profileMobile}
                        onChange={(e) => setProfileMobile(e.target.value)}
                        className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white"
                        placeholder="10 digit number"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-white/40 uppercase text-[9px]">Current City</label>
                      <input 
                        type="text"
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white"
                        placeholder="State / City name"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-white/40 uppercase text-[9px] text-gold-light font-bold">MERA UPI ADDRESS (Receive Returns)</label>
                    <input 
                      type="text"
                      value={profileUpi}
                      onChange={(e) => setProfileUpi(e.target.value)}
                      className="bg-navy-dark border border-gold-primary/25 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-primary"
                      placeholder="e.g. kashifans@upi"
                    />
                    <span className="text-[9px] text-white/30 italic">Verify carefully. Return payouts are automatically routed to this address.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-white/40 uppercase text-[9px] text-indigo-300">TRC20 Wallet Destination</label>
                      <input 
                        type="text"
                        value={profileTrc25}
                        onChange={(e) => setProfileTrc25(e.target.value)}
                        className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white"
                        placeholder="T... TRC25 address node"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-white/40 uppercase text-[9px] text-indigo-300">BEP20 BSC Wallet address</label>
                      <input 
                        type="text"
                        value={profileBep25}
                        onChange={(e) => setProfileBep25(e.target.value)}
                        className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white"
                        placeholder="0x... BSC network"
                      />
                    </div>
                  </div>

                  {profileSuccessMsg && (
                    <div className="bg-emerald-500/15 border border-emerald-505/20 text-emerald-400 p-3.5 rounded-xl text-center mt-2">
                      {profileSuccessMsg}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-bold hover:shadow-lg transition mt-4"
                  >
                    Save accounts changes
                  </button>
                </form>
              </div>
            </div>

            {/* PAYMENT VERIFICATION STATUSES HISTORICAL LOGS */}
            <div className="lg:col-span-6 bg-navy-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
                Transfers Receipt Logs History
              </h3>

              <div className="overflow-x-auto text-[11px] font-mono">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-white/30 text-[9px] uppercase">
                      <th className="py-2.5">DATE</th>
                      <th className="py-2.5">UTR / REF</th>
                      <th className="py-2.5 text-right">AMOUNT</th>
                      <th className="py-2.5 text-right">FEEDBACK STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-white/35">
                          📭 Transactions history empty.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tr) => (
                        <tr key={tr.id}>
                          <td className="py-3 text-white/50">{formatDate(tr.created_at)}</td>
                          <td className="py-3 text-white/80">{tr.utr_number || 'N/A'}</td>
                          <td className="py-3 text-right text-white font-bold">{formatINR(tr.amount)}</td>
                          <td className="py-3 text-right">
                            {tr.status === 'verified' ? (
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px]">Verified ✅</span>
                            ) : tr.status === 'rejected' ? (
                              <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full text-[9px]">Rejected ❌</span>
                            ) : (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full text-[9px]">Pending ⏱️</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
