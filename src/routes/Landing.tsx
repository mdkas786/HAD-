import React from 'react';
import { Shield, ArrowRight, CheckCircle2, TrendingUp, Users, Smartphone, Globe } from 'lucide-react';
import { formatINR } from '../lib/utils';

interface Props {
  onNavigate: (path: string) => void;
  config: any;
}

export default function Landing({ onNavigate, config }: Props) {
  const starterMin = config?.starter_min || 50000;
  const starterMax = config?.starter_max || 1000000;
  const growthMin = config?.growth_min || 1100000;
  const growthMax = config?.growth_max || 3000000;
  const fortuneMin = config?.fortune_min || 3100000;
  const fortuneMax = config?.fortune_max || 5000000;

  return (
    <div className="bg-navy-dark min-h-screen font-sans overflow-x-hidden selection:bg-gold-primary selection:text-navy-dark">
      {/* Dynamic Announcement Banner */}
      {config?.announcement_banner && (
        <div className="bg-gradient-to-r from-amber-500/20 via-gold-primary/20 to-amber-500/20 border-b border-gold-primary/25 text-center py-2 px-4">
          <p className="text-xs sm:text-sm font-medium text-gold-light tracking-wide animate-pulse">
            {config.announcement_banner}
          </p>
        </div>
      )}

      {/* HEADER NAVIGATION */}
      <header className="border-b border-white/5 bg-navy-dark/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
            {/* Custom Shield Logo Emblem (Shield + Arrow + Flame) */}
            <div className="relative flex items-center justify-center h-11 w-11 rounded-lg bg-white/5 border border-gold-primary/30 text-gold-primary shadow-[0_0_15px_rgba(201,168,76,0.15)]">
              <Shield className="absolute inset-0 m-auto text-gold-primary" size={24} />
              <TrendingUp className="text-gold-light mt-0.5 shrink-0" size={12} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-widest uppercase leading-none">H.A.D.</h1>
              <p className="text-[9px] text-gold-primary font-semibold tracking-wider uppercase mt-1">Asset Management</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wider uppercase text-white/70">
            <a href="#plans" className="hover:text-gold-primary transition">Slabs & Plans</a>
            <a href="#how" className="hover:text-gold-primary transition">How it Works</a>
            <a href="#referral" className="hover:text-gold-primary transition">Sponsor Income</a>
            <a href="#about" className="hover:text-gold-primary transition">Live Portfolios</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 text-xs font-semibold tracking-wider uppercase text-white hover:text-gold-primary transition"
            >
              Sign In
            </button>
            <button 
              onClick={() => onNavigate('/register')}
              className="px-5 py-2.5 rounded-lg bg-gold-primary relative overflow-hidden group text-navy-dark font-semibold text-xs tracking-wider uppercase shadow-[0_4px_16px_rgba(201,168,76,0.3)] hover:shadow-[0_4px_24px_rgba(201,168,76,0.45)] transition"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition duration-300" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 bg-gold-primary/10 border border-gold-primary/20 rounded-full px-3 py-1 text-[11px] text-gold-primary font-semibold tracking-wide w-fit font-mono">
              ⚡ LIVE MULTI-ASSET CRYPTO & REAL ESTATE BLEND
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
              Paison ko sirf bachao mat, <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-gold-primary to-gold-light font-extrabold block mt-2">unhein kaam par lagao.</span>
            </h2>

            <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl">
              H.A.D. Asset Management runs a completely transparent multi-asset portfolio deployed dynamically across cryptocurrency indices, NFT allocations, and premium real estate nodes. We track, buy, and report every transaction in real-time, delivering clean structured target-yields automatically up to a secure 2X hard payout cap!
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <button 
                onClick={() => onNavigate('/register')}
                className="px-6 py-3.5 rounded-lg bg-gold-primary text-navy-dark font-bold text-xs tracking-wider uppercase shadow-[0_4px_20px_rgba(201,168,76,0.35)] flex items-center gap-2 group hover:scale-[1.02] transition"
              >
                Open Account 
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </button>
              <a 
                href="#plans"
                className="px-6 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-xs tracking-wider uppercase hover:bg-white/10 transition"
              >
                View Plans
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 border-t border-white/5 pt-6 text-xs text-white/50 font-mono">
              <div className="flex items-center gap-2"><CheckCircle2 className="text-gold-primary shrink-0" size={14} /> 2X principal target payoff rule</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="text-gold-primary shrink-0" size={14} /> Realtime holding asset trackers</div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-video sm:aspect-square bg-navy-card border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-dark to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=600&auto=format&fit=crop" 
                alt="HAD Wall Art"
                className="w-full h-full object-cover rounded-xl border border-white/5 opacity-80 group-hover:scale-105 transition duration-700"
              />
              <div className="absolute top-8 left-8 bg-navy-dark/90 backdrop-blur border border-gold-primary/20 px-4 py-2.5 rounded-xl z-20 flex items-center gap-2 text-[10px] font-mono tracking-widest text-gold-light">
                <span>ESTABLISHED 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE INVESTMENT PLANS SECTION */}
      <section id="plans" className="bg-navy-sub border-y border-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-xs text-gold-primary font-bold tracking-widest uppercase font-mono">Select Slab Tier</span>
            <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Three tiers. Two times the principal.</h3>
            <p className="text-xs sm:text-sm text-white/50 max-w-xl mx-auto">
              Our target rate represents the static monthly portfolio payout goal. Your subscription terminates as soon as you touch the strict 2X total payout target threshold.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* STARTER CARD */}
            <div className="bg-navy-card border border-gold-primary/20 rounded-2xl p-6 text-left flex flex-col justify-between hover:border-gold-primary/30 transition shadow-lg relative group">
              <div className="font-mono text-xs text-gold-primary font-bold">SLAB 01</div>
              <div className="flex items-baseline justify-between mt-4">
                <h4 className="text-lg font-bold text-white">STARTER</h4>
                <div className="text-3xl font-extrabold text-gold-primary font-mono">{config?.starter_rate || 5}%<span className="text-xs font-normal text-white/40">/mo</span></div>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white/90">
                {formatINR(starterMin)} – {formatINR(starterMax)}
              </div>
              <ul className="mt-6 flex flex-col gap-3 text-xs text-white/70 flex-1">
                <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gold-primary shrink-0" /> Target monthly ROI yields</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gold-primary shrink-0" /> Dynamic 2X progression bar tracker</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gold-primary shrink-0" /> Native fast UPI and USDT payouts</li>
              </ul>
              <button 
                onClick={() => onNavigate('/register')}
                className="mt-8 w-full py-3 rounded-xl bg-gold-primary/10 border border-gold-primary/20 text-gold-light hover:bg-gold-primary hover:text-navy-dark text-xs font-bold tracking-wider uppercase font-mono transition"
              >
                Choose Starter
              </button>
            </div>

            {/* GROWTH CARD */}
            <div className="bg-gradient-to-b from-navy-card via-navy-card to-gold-primary/5 border-2 border-gold-primary rounded-2xl p-6 text-left flex flex-col justify-between transition shadow-[0_10px_30px_rgba(201,168,76,0.1)] relative">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-gold-primary px-3 py-1 rounded-full text-[10px] font-bold text-navy-dark font-mono uppercase tracking-wide">
                RECOMMENDED
              </div>
              <div className="font-mono text-xs text-gold-primary font-bold">SLAB 02</div>
              <div className="flex items-baseline justify-between mt-4">
                <h4 className="text-lg font-bold text-white">GROWTH</h4>
                <div className="text-3xl font-extrabold text-gold-primary font-mono">{config?.growth_rate || 6}%<span className="text-xs font-normal text-white/40">/mo</span></div>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white/90">
                {formatINR(growthMin)} – {formatINR(growthMax)}
              </div>
              <ul className="mt-6 flex flex-col gap-3 text-xs text-white/70 flex-1">
                <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gold-primary shrink-0" /> Accelerated monthly ROI target payouts</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gold-primary shrink-0" /> Priority admin payment verification</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gold-primary shrink-0" /> Active dashboard analytics graphs</li>
              </ul>
              <button 
                onClick={() => onNavigate('/register')}
                className="mt-8 w-full py-4 rounded-xl bg-gold-primary text-navy-dark hover:shadow-[0_4px_20px_rgba(201,168,76,0.3)] text-xs font-bold tracking-wider uppercase font-mono transition"
              >
                Choose Growth
              </button>
            </div>

            {/* FORTUNE CARD */}
            <div className="bg-navy-card border border-white/10 rounded-2xl p-6 text-left flex flex-col justify-between hover:border-gold-primary/20 transition shadow-lg relative">
              <div className="font-mono text-xs text-white/40">SLAB 03</div>
              <div className="flex items-baseline justify-between mt-4">
                <h4 className="text-lg font-bold text-white">FORTUNE</h4>
                <div className="text-3xl font-extrabold text-gold-primary font-mono">{config?.fortune_rate || 7}%<span className="text-xs font-normal text-white/40">/mo</span></div>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white/90">
                {formatINR(fortuneMin)}+
              </div>
              <ul className="mt-6 flex flex-col gap-3 text-xs text-white/70 flex-1">
                <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gold-primary shrink-0" /> Premium highest payout yields limit</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gold-primary shrink-0" /> Concierge fast-lane instant withdrawals</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gold-primary shrink-0" /> Professional custom portfolio insights</li>
              </ul>
              <button 
                onClick={() => onNavigate('/register')}
                className="mt-8 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-xs font-bold tracking-wider uppercase font-mono transition"
              >
                Choose Fortune
              </button>
            </div>
          </div>
          
          <p className="text-[10px] text-white/30 italic font-mono max-w-xl mx-auto leading-relaxed mt-4">
            * Disclaimers: Yield distribution rates are aligned with the dynamic performances of our capital allocations. Previous yield tracking results are not indicators of automatic static future expectations.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <span className="text-xs text-gold-primary font-bold tracking-widest uppercase font-mono">Process Flow</span>
          <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">From signup to 2X — clean and visible.</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="bg-navy-card border border-white/5 rounded-xl p-5 flex flex-col gap-4">
            <span className="font-mono text-4xl text-white/10 font-black">01</span>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Register</h4>
            <p className="text-xs text-white/50 leading-relaxed">
              Create an account instantly. Save your secure unique HAD Login ID and credential keys. No password required for initial profile logging.
            </p>
          </div>

          <div className="bg-navy-card border border-white/5 rounded-xl p-5 flex flex-col gap-4">
            <span className="font-mono text-4xl text-white/10 font-black">02</span>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Transfer Payout</h4>
            <p className="text-xs text-white/50 leading-relaxed">
              Send your desired funds using secure native UPI transfer QR links, or transfer BEP20/TRC20 assets directly, uploading verification receipts.
            </p>
          </div>

          <div className="bg-navy-card border border-white/5 rounded-xl p-5 flex flex-col gap-4">
            <span className="font-mono text-4xl text-white/10 font-black">03</span>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">System Approval</h4>
            <p className="text-xs text-white/50 leading-relaxed">
              Admin verifies transaction signatures. Once approved, your plan automatically assigns, and starts accumulating real-time earnings indexes.
            </p>
          </div>

          <div className="bg-navy-card border border-white/5 rounded-xl p-5 flex flex-col gap-4">
            <span className="font-mono text-4xl text-white/10 font-black">04</span>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">ROI & Rewards</h4>
            <p className="text-xs text-white/50 leading-relaxed">
              Earnings calculations are paid on the 10th of every month. Your account remains active until you hit the maximum 2X limits cap.
            </p>
          </div>
        </div>
      </section>

      {/* REFERRAL REWARDS SECTION */}
      <section id="referral" className="bg-navy-sub py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <span className="text-xs text-gold-primary font-bold tracking-widest uppercase font-mono">Affiliation Rewards</span>
            <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Earn premium commissions while referring.
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Our growth engine is fueled by local networks. We distribute two-way benefits down to sponsors who introduce capital to H.A.D:
            </p>
            
            <div className="flex flex-col gap-4 text-xs font-mono">
              <div className="bg-navy-card border border-white/5 rounded-xl p-4 flex gap-4">
                <div className="p-2.5 bg-gold-primary/10 rounded-lg text-gold-primary h-fit">
                  <Users size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">Sponsor Referral (5% Static)</h4>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Earn instantly 5% on every verified investment made by your direct invites. E.g. invest ₹1,00,000 → you earn ₹5,000 credited on the 10th.
                  </p>
                </div>
              </div>

              <div className="bg-navy-card border border-white/5 rounded-xl p-4 flex gap-4">
                <div className="p-2.5 bg-gold-primary/10 rounded-lg text-gold-primary h-fit">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">Partner Level Income (10% on Direct ROI)</h4>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Qualify by introducing 2 direct verified investors. Get an extra 10% bonus calculated on their monthly paid ROI! E.g. direct investor gets ₹10,000 ROI → you get ₹1,000 extra yield.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-white/40 italic">
              * Note: All external affiliation rewards aggregate and count directly towards your individual investment package 2X threshold.
            </p>
          </div>

          <div className="lg:col-span-6 bg-navy-card border border-gold-primary/20 rounded-2xl p-6 shadow-2xl flex flex-col justify-between max-w-md mx-auto w-full">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
              Rewards Payout Forecast
            </h4>
            
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60">Invite Investment:</span>
                <span className="text-white font-bold">₹10,00,000</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                <span>Immediate 5% Sponsor Bonus:</span>
                <span className="font-bold">+₹50,000</span>
              </div>
              <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs font-mono">
                <span className="text-white/60">Their Monthly ROI (6%):</span>
                <span className="text-white font-bold">₹60,000/mo</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 pb-4 border-b border-white/5">
                <span>Your 10% Level ROI Bonus:</span>
                <span className="font-bold">+₹6,000/mo</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-gold-light">
                <span>Estimated Target Speed Increase:</span>
                <span className="font-bold font-mono">Up to 345% Faster 2X</span>
              </div>
            </div>

            <button 
              onClick={() => onNavigate('/register')}
              className="mt-8 w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-bold text-xs uppercase tracking-wider transition hover:shadow-[0_4px_16px_rgba(201,168,76,0.3)]"
            >
              Construct Referral Network
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-navy-dark py-12 text-center text-xs text-white/45">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="text-gold-primary" size={16} />
            <span className="font-bold text-white tracking-widest">H.A.D. ASSET MANAGEMENT</span>
          </div>
          
          <div className="flex flex-wrap gap-4 text-[11px]">
            <button onClick={() => onNavigate('/')} className="hover:text-gold-primary transition">Home</button>
            <button onClick={() => onNavigate('/login')} className="hover:text-gold-primary transition">Login</button>
            <button onClick={() => onNavigate('/register')} className="hover:text-gold-primary transition">Register</button>
            <button onClick={() => onNavigate('/admin/login')} className="hover:text-gold-primary transition">Staff Login</button>
          </div>

          <p className="font-mono text-[10px]">
            © {new Date().getFullYear()} H.A.D. Asset Management · UTC Sync Active
          </p>
        </div>
      </footer>
    </div>
  );
}
