import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, UserPlus, Fingerprint, LogIn, AlertCircle, RefreshCw, X, ShieldAlert 
} from 'lucide-react';
import { db } from './lib/db';
import { User, AppConfig } from './types';

// Import our modular sub-routing panels
import Landing from './routes/Landing';
import UserDashboard from './routes/UserDashboard';
import AdminDashboard from './routes/AdminDashboard';
import CryptoTicker from './components/CryptoTicker';

export default function App() {
  // Routing state
  const [currentView, setCurrentView] = useState<string>('landing');
  const [targetPath, setTargetPath] = useState<string>('/');
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // App context configuration constants
  const [config, setConfig] = useState<AppConfig | null>(null);

  // Forms Login
  const [loginHadId, setLoginHadId] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Forms Register
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRefCode, setRegRefCode] = useState('');
  const [regSuccessUser, setRegSuccessUser] = useState<User | null>(null);
  const [regError, setRegError] = useState('');

  // Admin Login Inputs Whitelists checks
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');

  // 10 minutes session timeout states
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(600); // 10 minutes
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  // Sync state URL
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  // Sync URL routing shifts
  useEffect(() => {
    const handleUrl = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      
      // Extract Sponsor referral tokens
      const searchParams = new URLSearchParams(search);
      const pendingRef = searchParams.get('ref');
      if (pendingRef) {
        localStorage.setItem('had_pending_ref', pendingRef);
        setRegRefCode(pendingRef);
      }

      setTargetPath(path);

      if (path.startsWith('/admin')) {
        if (path === '/admin/login') {
          setCurrentView('admin-login');
        } else {
          // Verify staff auth active
          const isStaffSession = localStorage.getItem('had_staff_active') === 'true';
          if (!isStaffSession) {
            navigate('/admin/login');
          } else {
            setIsAdmin(true);
            setCurrentView('admin-dashboard');
          }
        }
      } else {
        if (path === '/') {
          setCurrentView('landing');
        } else if (path === '/login') {
          setCurrentView('login');
        } else if (path === '/register') {
          setCurrentView('register');
        } else if (path === '/dashboard') {
          // Direct users
          const sessionUser = localStorage.getItem('had_logged_user');
          if (!sessionUser) {
            navigate('/login');
          } else {
            setCurrentUser(JSON.parse(sessionUser));
            setCurrentView('dashboard');
          }
        } else if (['/markets', '/pay', '/referral', '/income', '/profile'].includes(path)) {
          const sessionUser = localStorage.getItem('had_logged_user');
          if (!sessionUser) {
            navigate('/login');
          } else {
            setCurrentUser(JSON.parse(sessionUser));
            setCurrentView('dashboard'); // managed via tabs inside UserDashboard
          }
        } else {
          setCurrentView('landing');
        }
      }
    };

    handleUrl();
    window.addEventListener('popstate', handleUrl);
    return () => window.removeEventListener('popstate', handleUrl);
  }, []);

  // Sync Initial Config Constants
  const loadAppConfig = async () => {
    const cf = await db.config.get();
    setConfig(cf);
  };

  useEffect(() => {
    loadAppConfig();
  }, []);

  // 10 minutes Interactive session timers interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // Clear notifications or models on logout
    if (currentUser || isAdmin) {
      interval = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            // Trigger auto logout
            handleLogoutAction();
            setShowTimeoutModal(true);
            return 600;
          }
          if (prev === 61) {
            setShowTimeoutWarning(true);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setSessionTimeLeft(600);
      setShowTimeoutWarning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentUser, isAdmin]);

  const handleLogoutAction = () => {
    localStorage.removeItem('had_logged_user');
    localStorage.removeItem('had_staff_active');
    setCurrentUser(null);
    setIsAdmin(false);
    navigate('/');
  };

  // Submit User Logins
  const handleUserLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginHadId.trim()) return;

    try {
      const exists = await db.users.get(loginHadId.trim().toUpperCase());
      if (!exists) {
        setLoginError('H.A.D. ID Code match aur details register nahi mile.');
        return;
      }
      if (exists.status === 'blocked') {
        setLoginError('🚫 Aapka account block ho gaya hai. Support se sampark karein.');
        return;
      }

      // Successful session login
      localStorage.setItem('had_logged_user', JSON.stringify(exists));
      setCurrentUser(exists);
      setSessionTimeLeft(600); // 10 minutes session reset
      setShowTimeoutWarning(false);
      navigate('/dashboard');
    } catch (err) {
      setLoginError('Login process error. Check system state.');
    }
  };

  // Submit User Registration
  const handleUserRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessUser(null);

    if (!regName.trim() || !regEmail.trim()) {
      setRegError('First name fields aur target contact coordinates enter karein.');
      return;
    }

    try {
      const added = await db.users.register(
        regName.trim(),
        regMobile.trim(),
        regCity.trim(),
        regEmail.trim(),
        regRefCode.trim().toUpperCase() || undefined
      );

      setRegSuccessUser(added);
      setRegName('');
      setRegMobile('');
      setRegEmail('');
      setRegCity('');
      setRegRefCode('');
    } catch (err: any) {
      setRegError(err.message || 'Registration processes error. Codes redundant.');
    }
  };

  // Submit Backoffice Administrator Login
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const u = adminUser.trim();
    const p = adminPass.trim();

    // Whitelist check sequence 1 & 2 matching specifications
    const match1 = (u === 'hadasset2021@gmail.com' && p === 'Khan@8665');
    const match2 = (u === 'admin' && p === 'hadadmin2026');

    if (match1 || match2) {
      localStorage.setItem('had_staff_active', 'true');
      setIsAdmin(true);
      setCurrentView('admin-dashboard');
      navigate('/admin');
    } else {
      setAdminError('Invalid authorization keys configurations.');
    }
  };

  return (
    <div className="bg-navy-dark min-h-screen text-white font-sans flex flex-col justify-between">
      
      {/* GLOBAL BACKGROUND GLOW GRADIENTS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* PUBLIC NAVIGATION CARRIER AND LANDING SHEET */}
        {currentView === 'landing' && (
          <Landing onNavigate={navigate} config={config} />
        )}

        {/* AUTH ENTRIES: USER LOGIN ROW CODE */}
        {currentView === 'login' && (
          <div className="flex-1 flex items-center justify-center p-4 py-16">
            <div className="bg-navy-card border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => navigate('/')} className="absolute top-4 right-4 text-white/40 hover:text-white">
                <X size={18} />
              </button>

              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 bg-white/5 border border-gold-primary/20 rounded-xl text-gold-primary">
                  <Shield size={28} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Sign In to H.A.D.</h2>
                <p className="text-xs text-white/55">Enter your secure unique investor ID to synchronize your dashboard.</p>
              </div>

              <form onSubmit={handleUserLoginSubmit} className="flex flex-col gap-4 mt-6 text-xs font-mono">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">Unique H.A.D ID</label>
                  <div className="relative flex items-center">
                    <LogIn className="absolute left-3.5 text-white/30" size={16} />
                    <input 
                      type="text"
                      className="w-full bg-navy-dark border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-gold-primary w-full tracking-widest"
                      placeholder="e.g. HAD98750"
                      value={loginHadId}
                      onChange={(e) => setLoginHadId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 px-4 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-4 bg-gold-primary relative overflow-hidden group text-navy-dark rounded-xl font-bold uppercase tracking-wider shadow-lg transition hover:scale-[1.01]"
                >
                  Confirm Account login
                </button>
              </form>

              <div className="border-t border-white/5 pt-4 mt-6 text-center text-[11px] text-white/40">
                Aapka ID code nahi hai?{' '}
                <button onClick={() => navigate('/register')} className="text-gold-light hover:underline font-semibold">
                  Register Karein
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AUTH ENTRIES: USER REGISTER SCREEN */}
        {currentView === 'register' && (
          <div className="flex-1 flex items-center justify-center p-4 py-16">
            <div className="bg-navy-card border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button onClick={() => navigate('/')} className="absolute top-4 right-4 text-white/40 hover:text-white">
                <X size={18} />
              </button>

              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 bg-white/5 border border-gold-primary/20 rounded-xl text-gold-primary">
                  <UserPlus size={28} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider"> investor registration</h2>
                <p className="text-xs text-white/55">Create verification codes to login to H.A.D. Asset management systems.</p>
              </div>

              {!regSuccessUser ? (
                <form onSubmit={handleUserRegisterSubmit} className="flex flex-col gap-4 mt-6 text-xs font-mono text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">Full Name</label>
                      <input 
                        type="text"
                        className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-primary"
                        placeholder="Kashif Ansari"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">Mobile Number</label>
                      <input 
                        type="text"
                        className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-primary"
                        placeholder="10 digit number"
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">Email address</label>
                      <input 
                        type="email"
                        className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-primary"
                        placeholder="example@gmail.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">City / State</label>
                      <input 
                        type="text"
                        className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-primary"
                        placeholder="Indore"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Pre-filled Referral option details */}
                  <div className="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-3">
                    <label className="text-[10px] text-gold-primary font-bold uppercase tracking-widest pl-1">Referral / Sponsor ID Code</label>
                    <input 
                      type="text"
                      className="bg-navy-dark border border-gold-primary/25 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-primary uppercase font-bold tracking-widest"
                      placeholder="e.g. HAD76402 (Optional)"
                      value={regRefCode}
                      onChange={(e) => setRegRefCode(e.target.value)}
                    />
                  </div>

                  {regError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 px-4 rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-extrabold shadow-lg transition mt-2 hover:scale-[1.01] uppercase tracking-wider"
                  >
                    Generate my unique HAD ID
                  </button>
                </form>
              ) : (
                <div className="mt-6 text-center flex flex-col items-center gap-6 animate-in zoom-in-95">
                  <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                    <Fingerprint size={48} />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Account Created Successfully</span>
                    <h4 className="text-sm font-bold text-white mt-1">Please note down your Login details:</h4>
                  </div>

                  <div className="bg-navy-dark/95 border-2 border-gold-primary/35 p-6 rounded-2xl w-full flex flex-col items-center gap-3 relative overflow-hidden text-center">
                    <span className="text-[9px] text-white/40 uppercase font-mono">My Secure login credentials:</span>
                    <span className="text-3xl font-black font-mono text-white tracking-[0.3em]">
                      {regSuccessUser.had_id}
                    </span>
                    <p className="text-xs text-gold-light font-mono font-medium mt-1">Sponsor: {regSuccessUser.referred_by || 'NONE (Organic)'}</p>
                    <div className="bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 p-2.5 rounded-lg leading-relaxed mt-2">
                       Take a Screenshot! <br /> Password initialization isn't requested. Keep your HAD ID safe to sign in.
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      // Success redirect
                      setLoginHadId(regSuccessUser.had_id);
                      setRegSuccessUser(null);
                      navigate('/login');
                    }}
                    className="w-full py-4 rounded-xl bg-gold-primary text-navy-dark font-bold uppercase hover:opacity-90 transition"
                  >
                    Go to Sign In
                  </button>
                </div>
              )}

              <div className="border-t border-white/5 pt-4 mt-6 text-center text-[11px] text-white/40">
                Pehle se login ID register hai?{' '}
                <button onClick={() => navigate('/login')} className="text-gold-light hover:underline font-semibold">
                  Sign In Karein
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AUTH ENTRIES: SECURE AUDITOR ADMIN LOGINS */}
        {currentView === 'admin-login' && (
          <div className="flex-1 flex items-center justify-center p-4 py-16">
            <div className="bg-navy-card border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => navigate('/')} className="absolute top-4 right-4 text-white/40 hover:text-white">
                <X size={18} />
              </button>

              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                  <ShieldAlert size={28} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Staff Audit Backoffice</h2>
                <p className="text-xs text-white/55">Enter whitelists coordinate secrets to launch operations keys.</p>
              </div>

              <form onSubmit={handleAdminLoginSubmit} className="flex flex-col gap-4 mt-6 text-xs font-mono text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">Admin User ID</label>
                  <input 
                    type="text"
                    className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3.5 text-white"
                    placeholder="hadasset2021@gmail.com"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">Secret Password</label>
                  <div className="relative flex items-center">
                    <Key className="absolute left-3.5 text-white/30" size={16} />
                    <input 
                      type="password"
                      className="w-full bg-navy-dark border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white"
                      placeholder="••••••••••••"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {adminError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 px-4 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold uppercase transition hover:scale-[1.01]"
                >
                  Verify authorization credentials
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SECURE USER WORKSPACE MODULES */}
        {currentView === 'dashboard' && currentUser && (
          <UserDashboard user={currentUser} onLogout={handleLogoutAction} config={config} />
        )}

        {/* SECURE ADMIN OPERATIONAL AUDITS PANEL */}
        {currentView === 'admin-dashboard' && isAdmin && (
          <AdminDashboard onLogout={handleLogoutAction} config={config} onRefreshConfig={loadAppConfig} />
        )}
      </div>

      {/* SESSION TIMEOUT FLOATING WARNING TOASTS matching section guidelines */}
      {showTimeoutWarning && (currentUser || isAdmin) && (
        <div className="fixed bottom-4 right-4 z-[60] bg-navy-card border-2 border-amber-500 text-white rounded-2xl p-4 shadow-2xl w-80 max-w-sm flex items-start gap-3 animate-bounce">
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 shrink-0 mt-0.5">
            <AlertCircle size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 block tracking-wide uppercase">Session Timeout Warning</span>
            <p className="text-[11px] text-white/60 leading-relaxed mt-0.5">
              Inactivity security protocol is active. Automatically log out in <strong className="text-white font-mono">{sessionTimeLeft}s</strong>. Move cursor, tap tabs, or update preferences to log activity.
            </p>
          </div>
        </div>
      )}

      {/* AUTO LOGOUT TIMEOUT ALERT MODAL */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-navy-card border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center flex flex-col items-center gap-4 relative animate-in zoom-in-95">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400">
              <ShieldAlert size={36} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Session Expired</h3>
              <p className="text-xs text-white/50 leading-relaxed mt-1.5">
                For security reasons, your H.A.D session expired automatically after 10 minutes of inactivity. Please sign in again.
              </p>
            </div>
            <button 
              onClick={() => {
                setShowTimeoutModal(false);
                navigate('/login');
              }}
              className="w-full py-3.5 rounded-xl bg-gold-primary text-navy-dark font-bold text-xs uppercase"
            >
              Sign In Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
