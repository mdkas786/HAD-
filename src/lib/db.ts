import { supabase, isRealSupabase } from './supabase';
import { User, Investment, Transaction, SponsorIncome, Notification, TradingAsset, Wallet, AppConfig, AuditLog } from '../types';
import { getPlan } from './utils';

// Helper to seed localStorage with sample data matching the screenshots
const SEED_USERS: User[] = [
  { id: '1', had_id: 'HAD06546', name: 'bitcoin', mobile: '9026363366', city: 'goa', email: 'bitcoin@had.com', upi_id: 'bitcoin@upi', trc20_wallet: null, bep20_wallet: null, referred_by: null, referral_code: 'HAD06546', status: 'active', created_at: '2026-06-06T14:29:00Z' },
  { id: '2', had_id: 'HAD95750', name: 'Mohd Gafir Ansari', mobile: '9026363366', city: 'Moradabad', email: 'gafir@had.com', upi_id: 'Kashifans91-1@okhdfcbank', trc20_wallet: null, bep20_wallet: null, referred_by: 'HAD82944', referral_code: 'HAD95750', status: 'active', created_at: '2026-06-05T14:29:00Z' },
  { id: '3', had_id: 'HAD93942', name: 'Mohd Tabish Ansari', mobile: '9580932017', city: 'Shahjahanpur', email: 'tabish@had.com', upi_id: null, trc20_wallet: null, bep20_wallet: null, referred_by: null, referral_code: 'HAD93942', status: 'active', created_at: '2026-06-05T04:42:00Z' },
  { id: '4', had_id: 'HAD82944', name: 'Daniyal', mobile: '09140166335', city: 'Shahjahanpur', email: 'daniyal@had.com', upi_id: null, trc20_wallet: null, bep20_wallet: null, referred_by: null, referral_code: 'HAD82944', status: 'active', created_at: '2026-06-05T04:40:00Z' },
  { id: '5', had_id: 'HAD96501', name: 'Hussain', mobile: '09140166335', city: 'Shahjahanpur', email: null, upi_id: null, trc20_wallet: null, bep20_wallet: null, referred_by: null, referral_code: 'HAD96501', status: 'active', created_at: '2026-06-05T04:41:00Z' },
  { id: '6', had_id: 'HAD21573', name: 'Faizan Khan', mobile: '7985253605', city: 'Spn', email: null, upi_id: null, trc20_wallet: null, bep20_wallet: null, referred_by: null, referral_code: 'HAD21573', status: 'active', created_at: '2026-06-05T04:41:00Z' },
  { id: '7', had_id: 'HAD59138', name: 'Mohd Farhan', mobile: '9026363366', city: 'Bareilly', email: null, upi_id: null, trc20_wallet: null, bep20_wallet: null, referred_by: 'HAD96926', referral_code: 'HAD59138', status: 'active', created_at: '2026-06-05T02:05:00Z' },
  { id: '8', had_id: 'HAD48730', name: 'Mohd Kashif Ansari', mobile: '9026363366', city: 'Shahjahanpur', email: null, upi_id: null, trc20_wallet: null, bep20_wallet: null, referred_by: null, referral_code: 'HAD48730', status: 'active', created_at: '2026-06-05T02:00:00Z' },
  { id: '9', had_id: 'HAD96926', name: 'Faizan', mobile: '9026363366', city: 'Shahjahanpur', email: null, upi_id: null, trc20_wallet: null, bep20_wallet: null, referred_by: null, referral_code: 'HAD96926', status: 'active', created_at: '2026-06-05T01:50:00Z' },
  { id: '10', had_id: 'HAD70579', name: 'Kashif', mobile: '9026363366', city: 'delhi', email: 'kashif@had.com', upi_id: null, trc20_wallet: null, bep20_wallet: null, referred_by: null, referral_code: 'HAD70579', status: 'active', created_at: '2026-06-04T12:00:00Z' }
];

const SEED_INVESTMENTS: Investment[] = [
  { id: 'i1', had_id: 'HAD95750', plan_name: 'STARTER', plan_rate: 5, amount_invested: 19000, amount_received: 0, total_income_received: 0, status: 'active', start_date: '2026-06-06', created_at: '2026-06-06T14:29:32Z' }
];

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 't1', had_id: 'HAD95750', type: 'investment', amount: 19000, payment_method: 'UPI', utr_number: '123102374126', screenshot_url: null, plan_name: 'STARTER', status: 'verified', created_at: '2026-06-06T14:29:06Z' }
];

const SEED_SPONSOR_INCOME: SponsorIncome[] = [
  { id: 'si1', earner_had_id: 'HAD82944', source_had_id: 'HAD95750', investment_id: 'i1', type: 'referral', percentage: 5, base_amount: 19000, income_amount: 950, month: '2026-06', status: 'pending', paid_at: null, created_at: '2026-06-06T14:29:34Z' }
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', had_id: 'HAD82944', title: 'Sponsor Income Earned 🎉', body: 'Aapke referral HAD95750 ne ₹19,000 invest kiya. Aapko ₹950 (5%) sponsor income mila.', type: 'success', is_read: false, created_at: '2026-06-06T14:29:34Z' },
  { id: 'n2', had_id: 'HAD95750', title: 'Payment Verified ✅', body: '₹19,000 aapke portfolio mein add ho gayi. Plan: STARTER @ 5% monthly.', type: 'success', is_read: false, created_at: '2026-06-06T14:29:32Z' },
  { id: 'n3', had_id: 'HAD82944', title: 'Partner Bonus Earned 🎁', body: '2026-06: ₹190 partner bonus (10% of ₹1,900 combined ROI).', type: 'success', is_read: true, created_at: '2026-06-05T04:43:49Z' },
  { id: 'n4', had_id: 'HAD82944', title: 'Sponsor Income Earned 🎉', body: 'Aapke referral HAD95750 ne ₹19,000 invest kiya. Aapko ₹950 (5%) sponsor income mila.', type: 'success', is_read: true, created_at: '2026-06-05T04:42:33Z' },
  { id: 'n5', had_id: 'HAD82944', title: 'Sponsor Income Earned 🎉', body: 'Aapke referral HAD93942 ne ₹19,000 invest kiya. Aapko ₹950 (5%) sponsor income mila.', type: 'success', is_read: true, created_at: '2026-06-05T04:42:32Z' },
  { id: 'n6', had_id: 'HAD95750', title: 'Payment Verified ✅', body: '₹19,000 aapke portfolio mein add ho gayi. Plan: STARTER @ 5% monthly.', type: 'success', is_read: true, created_at: '2026-06-05T04:42:32Z' },
  { id: 'n7', had_id: 'HAD93942', title: 'Payment Verified ✅', body: '₹19,000 aapke portfolio mein add ho gayi. Plan: STARTER @ 5% monthly.', type: 'success', is_read: true, created_at: '2026-06-05T04:42:31Z' },
  { id: 'n8', had_id: 'HAD96926', title: 'Sponsor Income Earned 🎉', body: 'Aapke referral HAD59138 ne ₹19,000 invest kiya. Aapko ₹950 (5%) sponsor income mila.', type: 'success', is_read: true, created_at: '2026-06-05T14:05:12Z' },
  { id: 'n9', had_id: 'HAD59138', title: 'Payment Verified ✅', body: '₹19,000 aapke portfolio mein add ho gayi. Plan: STARTER @ 5% monthly.', type: 'success', is_read: true, created_at: '2026-06-05T14:05:11Z' }
];

const SEED_TRADING_ASSETS: TradingAsset[] = [
  { id: 'a1', asset_name: 'Ethereum', symbol: 'ETH', asset_type: 'crypto', coincap_id: 'ethereum', entry_price: 1669.88, current_price: 1669.88, allocation_percent: 0, target_percent: 10, risk_level: 'medium', status: 'active', created_at: '2026-06-05T00:00:00Z' },
  { id: 'a2', asset_name: 'Defi App', symbol: 'HOME', asset_type: 'crypto', coincap_id: null, entry_price: 0.048, current_price: 0.048, allocation_percent: 0, target_percent: 10, risk_level: 'medium', status: 'active', created_at: '2026-06-05T00:00:00Z' },
  { id: 'a3', asset_name: 'Bitcoin', symbol: 'BTC', asset_type: 'crypto', coincap_id: 'bitcoin', entry_price: 62419.60, current_price: 62419.60, allocation_percent: 0, target_percent: 10, risk_level: 'medium', status: 'active', created_at: '2026-06-05T00:00:00Z' }
];

const SEED_WALLETS: Wallet[] = [
  { id: 'w1', type: 'UPI', address: 'hadasset@ybl', label: 'H.A.D. Core Wallet', is_active: true, created_at: '2026-06-04T12:00:00Z' },
  { id: 'w2', type: 'TRC20', address: 'TY3p6KzSshzZgN8p8Wymv7ePqSshG8888', label: 'H.A.D. USDT TRC20', is_active: true, created_at: '2026-06-04T12:00:00Z' },
  { id: 'w3', type: 'BEP20', address: '0x32A4B85b4d1b8c2F5C5dE8bC2db4CbFF99999999', label: 'H.A.D. USDT BEP20', is_active: true, created_at: '2026-06-04T12:00:00Z' }
];

const DEFAULT_CONFIG: AppConfig = {
  starter_rate: 5,
  growth_rate: 6,
  fortune_rate: 7,
  starter_min: 50000,
  starter_max: 1000000,
  growth_min: 1100000,
  growth_max: 3000000,
  fortune_min: 3100000,
  fortune_max: 5000000,
  referral_percent: 5,
  level_percent: 10,
  payout_day: 10,
  maintenance_mode: false,
  maintenance_message: 'H.A.D. Asset management is upgrading servers.',
  announcement_banner: '📢 Live payout of June Month ROI on 10th of this month! Keep tracking.',
  support_email: 'support@hadinvestment.com',
  support_whatsapp: '+919026363366',
  min_investment: 50000
};

// Initialize localized storage if missing
const getLocalData = <T>(key: string, seed: T[]): T[] => {
  const store = localStorage.getItem('had_' + key);
  if (!store) {
    localStorage.setItem('had_' + key, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(store);
};

const setLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem('had_' + key, JSON.stringify(data));
};

const getLocalConfig = (): AppConfig => {
  const store = localStorage.getItem('had_config');
  if (!store) {
    localStorage.setItem('had_config', JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }
  return JSON.parse(store);
};

const setLocalConfig = (config: AppConfig) => {
  localStorage.setItem('had_config', JSON.stringify(config));
};

export const db = {
  // CONFIG
  config: {
    get: async (): Promise<AppConfig> => {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('config').select('*');
        if (!error && data && data.length > 0) {
          const cfg: any = {};
          data.forEach(item => {
            let val: any = item.value;
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else if (!isNaN(Number(val))) val = Number(val);
            cfg[item.key] = val;
          });
          return { ...DEFAULT_CONFIG, ...cfg };
        }
      }
      return getLocalConfig();
    },
    update: async (config: AppConfig): Promise<AppConfig> => {
      if (isRealSupabase && supabase) {
        const promises = Object.entries(config).map(([key, value]) => {
          return supabase.from('config').upsert({ key, value: String(value) });
        });
        await Promise.all(promises);
      }
      setLocalConfig(config);
      return config;
    }
  },

  // USERS
  users: {
    getAll: async (): Promise<User[]> => {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (!error && data) return data as User[];
      }
      return getLocalData<User>('users', SEED_USERS);
    },
    get: async (hadId: string): Promise<User | null> => {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('users').select('*').eq('had_id', hadId).maybeSingle();
        if (!error && data) return data as User;
      }
      const users = getLocalData<User>('users', SEED_USERS);
      return users.find(u => u.had_id.toUpperCase() === hadId.toUpperCase()) || null;
    },
    register: async (name: string, mobile: string, city: string, email: string, referralCode?: string): Promise<User> => {
      const users = getLocalData<User>('users', SEED_USERS);
      
      // Generate HAD ID
      let hadId = '';
      let isUnique = false;
      while (!isUnique) {
        const rand = Math.floor(10000 + Math.random() * 90000); // 5 digits
        hadId = `HAD${rand}`;
        isUnique = !users.some(u => u.had_id === hadId);
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        had_id: hadId,
        name,
        mobile: mobile || null,
        city: city || null,
        email: email || null,
        upi_id: null,
        trc20_wallet: null,
        bep20_wallet: null,
        referred_by: referralCode ? referralCode.toUpperCase() : null,
        referral_code: hadId,
        status: 'active',
        created_at: new Date().toISOString()
      };

      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('users').insert(newUser).select().single();
        if (!error && data) {
          return data as User;
        }
      }

      users.unshift(newUser);
      setLocalData('users', users);
      
      // Send automated registration notification
      await db.notifications.send(hadId, 'Welcome to H.A.D. Asset 🏆', `Aapka registry account confirm ho gaya chain link ke sath. HAD ID: ${hadId}. Ise login ke liye secure rakhein.`, 'success');
      
      return newUser;
    },
    update: async (hadId: string, updates: Partial<User>): Promise<User | null> => {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('users').update(updates).eq('had_id', hadId).select().single();
        if (!error && data) return data as User;
      }
      const users = getLocalData<User>('users', SEED_USERS);
      const index = users.findIndex(u => u.had_id === hadId);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        setLocalData('users', users);
        return users[index];
      }
      return null;
    },
    toggleBlock: async (hadId: string): Promise<User | null> => {
      const user = await db.users.get(hadId);
      if (!user) return null;
      const newStatus = user.status === 'active' ? 'blocked' : 'active';
      return db.users.update(hadId, { status: newStatus });
    },
    delete: async (hadId: string, adminId: string): Promise<boolean> => {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.rpc('admin_delete_user', { target_had_id: hadId, admin_id: adminId });
        if (!error) return true;
      }

      // Offline deletion cascade
      const users = getLocalData<User>('users', SEED_USERS);
      const filtered = users.filter(u => u.had_id !== hadId);
      setLocalData('users', filtered);

      // Cascade deletes
      const investments = getLocalData<Investment>('investments', SEED_INVESTMENTS).filter(i => i.had_id !== hadId);
      setLocalData('investments', investments);

      const transactions = getLocalData<Transaction>('transactions', SEED_TRANSACTIONS).filter(t => t.had_id !== hadId);
      setLocalData('transactions', transactions);

      const incomes = getLocalData<SponsorIncome>('sponsor_income', SEED_SPONSOR_INCOME).filter(s => s.earner_had_id !== hadId && s.source_had_id !== hadId);
      setLocalData('sponsor_income', incomes);

      const notifications = getLocalData<Notification>('notifications', SEED_NOTIFICATIONS).filter(n => n.had_id !== hadId);
      setLocalData('notifications', notifications);

      // Audit log
      const audit = getLocalData<AuditLog>('audit_logs', []);
      audit.push({
        id: Math.random().toString(),
        action: 'user_deleted',
        target_had_id: hadId,
        performed_by: adminId,
        data_summary: { had_id: hadId },
        created_at: new Date().toISOString()
      });
      setLocalData('audit_logs', audit);

      return true;
    }
  },

  // INVESTMENTS
  investments: {
    getAll: async (): Promise<Investment[]> => {
      const investments = getLocalData<Investment>('investments', SEED_INVESTMENTS);
      const users = getLocalData<User>('users', SEED_USERS);
      
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('investments').select('*, user:users(*)');
        if (!error && data) return data as Investment[];
      }
      
      return investments.map(i => ({
        ...i,
        user: users.find(u => u.had_id === i.had_id)
      }));
    },
    get: async (hadId: string): Promise<Investment | null> => {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('investments').select('*').eq('had_id', hadId).maybeSingle();
        if (!error && data) return data as Investment;
      }
      const investments = getLocalData<Investment>('investments', SEED_INVESTMENTS);
      return investments.find(i => i.had_id === hadId) || null;
    },
    upsert: async (hadId: string, amount: number): Promise<Investment> => {
      const investments = getLocalData<Investment>('investments', SEED_INVESTMENTS);
      const existing = investments.find(i => i.had_id === hadId);
      
      const config = getLocalConfig();
      const currentInvested = existing ? Number(existing.amount_invested) : 0;
      const newTotal = currentInvested + amount;
      
      const plan = getPlan(newTotal);
      
      let updated: Investment;
      if (existing) {
        updated = {
          ...existing,
          amount_invested: newTotal,
          plan_name: plan.name,
          plan_rate: plan.rate,
          status: 'active'
        };
        const idx = investments.findIndex(i => i.had_id === hadId);
        investments[idx] = updated;
      } else {
        updated = {
          id: Math.random().toString(36).substr(2, 9),
          had_id: hadId,
          plan_name: plan.name,
          plan_rate: plan.rate,
          amount_invested: amount,
          amount_received: 0,
          total_income_received: 0,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };
        investments.push(updated);
      }

      if (isRealSupabase && supabase) {
        // Upsert Database directly
        const { error } = await supabase.from('investments').upsert({
          had_id: hadId,
          plan_name: updated.plan_name,
          plan_rate: updated.plan_rate,
          amount_invested: updated.amount_invested,
          amount_received: updated.amount_received,
          total_income_received: updated.total_income_received,
          status: updated.status,
          start_date: updated.start_date
        });
      }

      setLocalData('investments', investments);
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('investments').delete().eq('id', id);
        if (!error) return true;
      }
      const investments = getLocalData<Investment>('investments', SEED_INVESTMENTS);
      const idx = investments.findIndex(i => i.id === id);
      if (idx !== -1) {
        investments.splice(idx, 1);
        setLocalData('investments', investments);
        return true;
      }
      return false;
    }
  },

  // TRANSACTIONS (SUBMITTED PAYMENT PROOFS)
  transactions: {
    getAll: async (): Promise<Transaction[]> => {
      const list = getLocalData<Transaction>('transactions', SEED_TRANSACTIONS);
      const users = getLocalData<User>('users', SEED_USERS);

      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('transactions').select('*, user:users(*)').order('created_at', { ascending: false });
        if (!error && data) return data as Transaction[];
      }

      return list.map(t => ({
        ...t,
        user: users.find(u => u.had_id === t.had_id)
      })).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    submit: async (hadId: string, amount: number, paymentMethod: string, utrNumber: string, screenshotUrl: string | null): Promise<Transaction> => {
      const plan = getPlan(amount);
      const tx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        had_id: hadId,
        type: 'investment',
        amount,
        payment_method: paymentMethod,
        utr_number: utrNumber || null,
        screenshot_url: screenshotUrl || null,
        plan_name: plan.name,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('transactions').insert(tx).select().single();
        if (!error && data) return data as Transaction;
      }

      const list = getLocalData<Transaction>('transactions', SEED_TRANSACTIONS);
      list.unshift(tx);
      setLocalData('transactions', list);
      return tx;
    },
    approve: async (id: string): Promise<boolean> => {
      const transactions = getLocalData<Transaction>('transactions', SEED_TRANSACTIONS);
      const txn = transactions.find(t => t.id === id);
      if (!txn) return false;

      txn.status = 'verified';
      setLocalData('transactions', transactions);

      if (isRealSupabase && supabase) {
        await supabase.from('transactions').update({ status: 'verified' }).eq('id', id);
      }

      // Add to user investments
      const investment = await db.investments.upsert(txn.had_id, txn.amount);

      // Retrieve User Details for Referral System
      const user = await db.users.get(txn.had_id);
      if (user && user.referred_by) {
        const sponsorId = user.referred_by;
        const sponsorUser = await db.users.get(sponsorId);
        if (sponsorUser) {
          // Referral bonus (5% of investment)
          const config = getLocalConfig();
          const baseReferralRate = config.referral_percent || 5;
          const referralIncome = txn.amount * (baseReferralRate / 100);

          // Get Sponsor's investment structure for checking caps
          const sponsorInvestment = await db.investments.get(sponsorId);
          if (sponsorInvestment && sponsorInvestment.status === 'active') {
            const cap = sponsorInvestment.amount_invested * 2;
            const remaining = cap - Number(sponsorInvestment.total_income_received);
            
            if (remaining > 0) {
              const actualAward = Math.min(referralIncome, remaining);
              
              // Create Sponsor Income
              const sponsorInc: SponsorIncome = {
                id: Math.random().toString(36).substr(2, 9),
                earner_had_id: sponsorId,
                source_had_id: txn.had_id,
                investment_id: sponsorInvestment.id,
                type: 'referral',
                percentage: baseReferralRate,
                base_amount: txn.amount,
                income_amount: actualAward,
                month: new Date().toISOString().substring(0, 7),
                status: 'pending',
                paid_at: null,
                created_at: new Date().toISOString()
              };

              const sponsorList = getLocalData<SponsorIncome>('sponsor_income', SEED_SPONSOR_INCOME);
              sponsorList.unshift(sponsorInc);
              setLocalData('sponsor_income', sponsorList);

              if (isRealSupabase && supabase) {
                await supabase.from('sponsor_income').insert({
                  earner_had_id: sponsorInc.earner_had_id,
                  source_had_id: sponsorInc.source_had_id,
                  investment_id: sponsorInc.investment_id,
                  type: sponsorInc.type,
                  percentage: sponsorInc.percentage,
                  base_amount: sponsorInc.base_amount,
                  income_amount: sponsorInc.income_amount,
                  month: sponsorInc.month,
                  status: sponsorInc.status
                });
              }

              // Notify sponsor
              await db.notifications.send(
                sponsorId, 
                'Sponsor Income Earned 🎉', 
                `Aapke referral ${user.name} (HAD ID: ${txn.had_id}) ne ₹${txn.amount.toLocaleString('en-IN')} invest kiya. Aapko ₹${actualAward.toLocaleString('en-IN')} sponsor income mila.`, 
                'success'
              );
            }
          }
        }
      }

      // Notify User
      await db.notifications.send(
        txn.had_id,
        'Payment Verified ✅',
        `₹${txn.amount.toLocaleString('en-IN')} portfolio mein crediting ho chuki hai. Plan: ${investment.plan_name} @ ${investment.plan_rate}% monthly.`,
        'success'
      );

      return true;
    },
    reject: async (id: string, reason: string): Promise<boolean> => {
      const transactions = getLocalData<Transaction>('transactions', SEED_TRANSACTIONS);
      const txn = transactions.find(t => t.id === id);
      if (!txn) return false;

      txn.status = 'rejected';
      setLocalData('transactions', transactions);

      if (isRealSupabase && supabase) {
        await supabase.from('transactions').update({ status: 'rejected' }).eq('id', id);
      }

      // Notify User
      await db.notifications.send(
        txn.had_id,
        'Payment Rejected ❌',
        `Aapka Payment support rejection mila. Reason: ${reason}. Please verified details submit karein.`,
        'error'
      );

      return true;
    },
    delete: async (id: string): Promise<boolean> => {
      if (isRealSupabase && supabase) {
        await supabase.from('transactions').delete().eq('id', id);
      }
      const transactions = getLocalData<Transaction>('transactions', SEED_TRANSACTIONS);
      const idx = transactions.findIndex(t => t.id === id);
      if (idx !== -1) {
        transactions.splice(idx, 1);
        setLocalData('transactions', transactions);
        return true;
      }
      return false;
    }
  },

  // SPONSOR INCOME
  sponsorIncome: {
    getAll: async (): Promise<SponsorIncome[]> => {
      const list = getLocalData<SponsorIncome>('sponsor_income', SEED_SPONSOR_INCOME);
      const users = getLocalData<User>('users', SEED_USERS);

      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('sponsor_income').select('*, earner:users!earner_had_id(*), source:users!source_had_id(*)');
        if (!error && data) return data as SponsorIncome[];
      }

      return list.map(s => ({
        ...s,
        earner: users.find(u => u.had_id === s.earner_had_id),
        source: s.source_had_id ? users.find(u => u.had_id === s.source_had_id) : undefined
      }));
    },
    pay: async (id: string): Promise<boolean> => {
      const list = getLocalData<SponsorIncome>('sponsor_income', SEED_SPONSOR_INCOME);
      const item = list.find(s => s.id === id);
      if (!item) return false;

      item.status = 'paid';
      item.paid_at = new Date().toISOString();
      setLocalData('sponsor_income', list);

      if (isRealSupabase && supabase) {
        await supabase.from('sponsor_income').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
      }

      // Cumulate to investment total_received & total_income_received of earner
      const investments = getLocalData<Investment>('investments', SEED_INVESTMENTS);
      const earnerInvestment = investments.find(i => i.had_id === item.earner_had_id);
      
      if (earnerInvestment) {
        const currentSum = Number(earnerInvestment.total_income_received) + item.income_amount;
        const maxCap = earnerInvestment.amount_invested * 2;
        
        earnerInvestment.total_income_received = currentSum;
        earnerInvestment.amount_received = currentSum; // matching display
        
        if (currentSum >= maxCap) {
          earnerInvestment.status = 'completed';
        }
        
        setLocalData('investments', investments);

        if (isRealSupabase && supabase) {
          await supabase.from('investments').update({
            total_income_received: earnerInvestment.total_income_received,
            amount_received: earnerInvestment.amount_received,
            status: earnerInvestment.status
          }).eq('id', earnerInvestment.id);
        }
      }

      // Notify Earner
      const label = item.type === 'referral' ? 'Sponsor Income' : item.type === 'level' ? 'Partner Level Income' : 'ROI Income';
      await db.notifications.send(
        item.earner_had_id,
        `${label} Received 💰`,
        `₹${item.income_amount.toLocaleString('en-IN')} aapke core UPI/Wallet mein send kardiye gaye hain. Enjoy H.A.D.!`,
        'success'
      );

      return true;
    },
    triggerRoiPayout: async (investmentId: string, payoutAmount: number, notes?: string): Promise<boolean> => {
      const investments = getLocalData<Investment>('investments', SEED_INVESTMENTS);
      const inv = investments.find(i => i.id === investmentId);
      if (!inv || inv.status !== 'active') return false;

      // 1. Create check for 2X bounds
      const cap = inv.amount_invested * 2;
      const remaining = cap - Number(inv.total_income_received);
      if (remaining <= 0) return false;

      const actPayout = Math.min(payoutAmount, remaining);

      // Create 'roi' sponsor_income record
      const roiInc: SponsorIncome = {
        id: Math.random().toString(36).substr(2, 9),
        earner_had_id: inv.had_id,
        source_had_id: null,
        investment_id: inv.id,
        type: 'roi',
        percentage: inv.plan_rate,
        base_amount: inv.amount_invested,
        income_amount: actPayout,
        month: new Date().toISOString().substring(0, 7),
        status: 'paid', // ROI of current user can be directly marked paid on payout modal
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const incomes = getLocalData<SponsorIncome>('sponsor_income', SEED_SPONSOR_INCOME);
      incomes.unshift(roiInc);
      setLocalData('sponsor_income', incomes);

      if (isRealSupabase && supabase) {
        await supabase.from('sponsor_income').insert({
          earner_had_id: roiInc.earner_had_id,
          source_had_id: roiInc.source_had_id,
          investment_id: roiInc.investment_id,
          type: roiInc.type,
          percentage: roiInc.percentage,
          base_amount: roiInc.base_amount,
          income_amount: roiInc.income_amount,
          month: roiInc.month,
          status: roiInc.status,
          paid_at: roiInc.paid_at
        });
      }

      // Update investment
      inv.total_income_received += actPayout;
      inv.amount_received += actPayout;
      if (inv.total_income_received >= cap) {
        inv.status = 'completed';
      }
      setLocalData('investments', investments);

      if (isRealSupabase && supabase) {
        await supabase.from('investments').update({
          total_income_received: inv.total_income_received,
          amount_received: inv.amount_received,
          status: inv.status
        }).eq('id', inv.id);
      }

      // Notify User
      await db.notifications.send(
        inv.had_id,
        'Return Received 💰',
        `Aapka target plan Monthly ROI ₹${actPayout.toLocaleString('en-IN')} credit/UPI successfully complete ho gaya hai.`,
        'success'
      );

      // 2. CHECK REFERRER LEVEL INCOME / Partner Income (ROI ka ROI)
      // Qualification: the ROI receiver's referrer must have 2+ direct referrals who have each made verified investments
      const receiverUser = await db.users.get(inv.had_id);
      if (receiverUser && receiverUser.referred_by) {
        const referrerId = receiverUser.referred_by;
        
        // Count verified directs of referrer
        const allUsers = getLocalData<User>('users', SEED_USERS);
        const refs = allUsers.filter(u => u.referred_by === referrerId);
        
        const verifiedDirects: string[] = [];
        for (const r of refs) {
          const invs = getLocalData<Investment>('investments', SEED_INVESTMENTS);
          const hasInv = invs.some(i => i.had_id === r.had_id && i.amount_invested > 0);
          if (hasInv) {
            verifiedDirects.push(r.had_id);
          }
        }

        if (verifiedDirects.length >= 2) {
          // Sponsor earns 10% of Paid ROI amount
          const config = getLocalConfig();
          const baseLevelRate = config.level_percent || 10;
          const levelIncomeAmount = actPayout * (baseLevelRate / 100);

          const referrerInv = await db.investments.get(referrerId);
          if (referrerInv && referrerInv.status === 'active') {
            const rCap = referrerInv.amount_invested * 2;
            const rRemaining = rCap - Number(referrerInv.total_income_received);
            
            if (rRemaining > 0) {
              const actLevelIncome = Math.min(levelIncomeAmount, rRemaining);

              const levelInc: SponsorIncome = {
                id: Math.random().toString(36).substr(2, 9),
                earner_had_id: referrerId,
                source_had_id: inv.had_id,
                investment_id: referrerInv.id,
                type: 'level',
                percentage: baseLevelRate,
                base_amount: actPayout,
                income_amount: actLevelIncome,
                month: new Date().toISOString().substring(0, 7),
                status: 'pending', // Level income is distributed under verification / payout control
                paid_at: null,
                created_at: new Date().toISOString()
              };

              incomes.unshift(levelInc);
              setLocalData('sponsor_income', incomes);

              if (isRealSupabase && supabase) {
                await supabase.from('sponsor_income').insert({
                  earner_had_id: levelInc.earner_had_id,
                  source_had_id: levelInc.source_had_id,
                  investment_id: levelInc.investment_id,
                  type: levelInc.type,
                  percentage: levelInc.percentage,
                  base_amount: levelInc.base_amount,
                  income_amount: levelInc.income_amount,
                  month: levelInc.month,
                  status: levelInc.status
                });
              }

              // Notify Referrer
              await db.notifications.send(
                referrerId,
                'Partner Bonus Earned 🎁',
                `Aapko referral ${receiverUser.name} ke monthly ROI payouts ki wajah se ₹${actLevelIncome.toLocaleString('en-IN')} (10% Partner level ROI) balance reward ho gaya ya pending hai.`,
                'success'
              );
            }
          }
        }
      }

      return true;
    },
    delete: async (id: string): Promise<boolean> => {
      if (isRealSupabase && supabase) {
        await supabase.from('sponsor_income').delete().eq('id', id);
      }
      const list = getLocalData<SponsorIncome>('sponsor_income', SEED_SPONSOR_INCOME);
      const idx = list.findIndex(s => s.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        setLocalData('sponsor_income', list);
        return true;
      }
      return false;
    }
  },

  // NOTIFICATIONS
  notifications: {
    getForUser: async (hadId: string): Promise<Notification[]> => {
      const list = getLocalData<Notification>('notifications', SEED_NOTIFICATIONS);
      
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('notifications').select('*').eq('had_id', hadId).order('created_at', { ascending: false });
        if (!error && data) return data as Notification[];
      }

      return list.filter(n => n.had_id.toUpperCase() === hadId.toUpperCase()).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    send: async (hadId: string, title: string, body: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<Notification> => {
      const item: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        had_id: hadId.toUpperCase(),
        title,
        body,
        type,
        is_read: false,
        created_at: new Date().toISOString()
      };

      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('notifications').insert(item).select().single();
        if (!error && data) return data as Notification;
      }

      const list = getLocalData<Notification>('notifications', SEED_NOTIFICATIONS);
      list.unshift(item);
      setLocalData('notifications', list);
      return item;
    },
    broadcast: async (target: string, title: string, body: string, type: 'info' | 'success' | 'warning' | 'error'): Promise<number> => {
      const users = getLocalData<User>('users', SEED_USERS);
      let count = 0;
      
      const targetHadIds = target.toUpperCase() === 'ALL'
        ? users.map(u => u.had_id)
        : target.split(',').map(s => s.trim().toUpperCase());

      for (const id of targetHadIds) {
        const exist = users.some(u => u.had_id === id);
        if (exist || target.toUpperCase() === 'ALL') {
          await db.notifications.send(id, title, body, type);
          count++;
        }
      }
      return count;
    },
    markAllRead: async (hadId: string): Promise<boolean> => {
      const list = getLocalData<Notification>('notifications', SEED_NOTIFICATIONS);
      let updated = false;
      list.forEach(n => {
        if (n.had_id.toUpperCase() === hadId.toUpperCase() && !n.is_read) {
          n.is_read = true;
          updated = true;
        }
      });
      if (updated) {
        setLocalData('notifications', list);
        if (isRealSupabase && supabase) {
          await supabase.from('notifications').update({ is_read: true }).eq('had_id', hadId);
        }
      }
      return true;
    }
  },

  // TRADING ASSETS (COMPANY LIVE PORTFOLIO)
  tradingAssets: {
    getAll: async (): Promise<TradingAsset[]> => {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('trading_assets').select('*');
        if (!error && data) return data as TradingAsset[];
      }
      return getLocalData<TradingAsset>('trading_assets', SEED_TRADING_ASSETS);
    },
    upsert: async (asset: Omit<TradingAsset, 'id' | 'created_at'> & { id?: string }): Promise<TradingAsset> => {
      const list = getLocalData<TradingAsset>('trading_assets', SEED_TRADING_ASSETS);
      
      const item: TradingAsset = {
        id: asset.id || Math.random().toString(36).substr(2, 9),
        asset_name: asset.asset_name,
        symbol: asset.symbol,
        asset_type: asset.asset_type,
        coincap_id: asset.coincap_id,
        entry_price: asset.entry_price,
        current_price: asset.current_price,
        allocation_percent: asset.allocation_percent,
        target_percent: asset.target_percent,
        risk_level: asset.risk_level,
        status: asset.status,
        created_at: new Date().toISOString()
      };

      if (isRealSupabase && supabase) {
        await supabase.from('trading_assets').upsert(item);
      }

      const idx = list.findIndex(a => a.id === item.id);
      if (idx !== -1) {
        list[idx] = item;
      } else {
        list.push(item);
      }
      
      setLocalData('trading_assets', list);
      return item;
    },
    delete: async (id: string): Promise<boolean> => {
      if (isRealSupabase && supabase) {
        await supabase.from('trading_assets').delete().eq('id', id);
      }
      const list = getLocalData<TradingAsset>('trading_assets', SEED_TRADING_ASSETS);
      const filtered = list.filter(a => a.id !== id);
      setLocalData('trading_assets', filtered);
      return true;
    },
    updateLivePrices: async (prices: Record<string, number>) => {
      const list = getLocalData<TradingAsset>('trading_assets', SEED_TRADING_ASSETS);
      let changed = false;
      list.forEach(a => {
        if (a.coincap_id && prices[a.coincap_id]) {
          a.current_price = prices[a.coincap_id];
          changed = true;
        }
      });
      if (changed) {
        setLocalData('trading_assets', list);
        if (isRealSupabase && supabase) {
          // Bulk updates are tricky in simple setups without server endpoints, so we update client-side or single items
          for (const a of list) {
            await supabase.from('trading_assets').update({ current_price: a.current_price }).eq('id', a.id);
          }
        }
      }
    }
  },

  // COMPANY WALLETS
  wallets: {
    getAll: async (): Promise<Wallet[]> => {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('wallets').select('*');
        if (!error && data) return data as Wallet[];
      }
      return getLocalData<Wallet>('wallets', SEED_WALLETS);
    },
    saveAll: async (wallets: Wallet[]): Promise<Wallet[]> => {
      if (isRealSupabase && supabase) {
        const promises = wallets.map(w => supabase.from('wallets').upsert(w));
        await Promise.all(promises);
      }
      setLocalData('wallets', wallets);
      return wallets;
    }
  }
};
