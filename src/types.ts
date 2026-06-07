export interface User {
  id: string;
  had_id: string;
  name: string;
  mobile: string | null;
  city: string | null;
  email: string | null;
  upi_id: string | null;
  trc20_wallet: string | null;
  bep20_wallet: string | null;
  referred_by: string | null;
  referral_code: string | null;
  status: 'active' | 'blocked';
  created_at: string;
}

export interface Investment {
  id: string;
  had_id: string;
  plan_name: 'STARTER' | 'GROWTH' | 'FORTUNE';
  plan_rate: number;
  amount_invested: number;
  amount_received: number;
  total_income_received: number;
  status: 'active' | 'completed';
  start_date: string;
  created_at: string;
  user?: User; // joined user details
}

export interface Transaction {
  id: string;
  had_id: string;
  type: string; // 'investment'
  amount: number;
  payment_method: string; // 'UPI' | 'USDT TRC20' | 'USDT BEP20' | 'BTC' | 'ETH'
  utr_number: string | null;
  screenshot_url: string | null;
  plan_name: string | null;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  user?: User;
}

export interface SponsorIncome {
  id: string;
  earner_had_id: string;
  source_had_id: string | null;
  investment_id: string | null;
  type: 'referral' | 'level' | 'roi';
  percentage: number;
  base_amount: number;
  income_amount: number;
  month: string | null; // e.g. '2026-06'
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
  earner?: User;
  source?: User;
}

export interface Notification {
  id: string;
  had_id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface TradingAsset {
  id: string;
  asset_name: string;
  symbol: string;
  asset_type: 'crypto' | 'nft' | 'real_estate';
  coincap_id: string | null;
  entry_price: number;
  current_price: number;
  allocation_percent: number;
  target_percent: number;
  risk_level: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Wallet {
  id: string;
  type: 'UPI' | 'TRC20' | 'BEP20' | 'BTC' | 'ETH';
  address: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  target_had_id: string | null;
  performed_by: string | null;
  data_summary: any | null;
  created_at: string;
}

export interface AppConfig {
  starter_rate: number;
  growth_rate: number;
  fortune_rate: number;
  starter_min: number;
  starter_max: number;
  growth_min: number;
  growth_max: number;
  fortune_min: number;
  fortune_max: number;
  referral_percent: number;
  level_percent: number;
  payout_day: number;
  maintenance_mode: boolean;
  maintenance_message: string;
  announcement_banner: string;
  support_email: string;
  support_whatsapp: string;
  min_investment: number;
}
