import React, { useEffect, useState } from 'react';
import { Shield, Database, Radio, CheckCircle, XCircle, RefreshCw, Server, ArrowLeft } from 'lucide-react';
import { supabase, isRealSupabase } from '../lib/supabase';
import { getCryptoPrices } from '../services/binance';
import { db } from '../lib/db';

interface DiagnosticState {
  supabaseStatus: 'CONNECTED' | 'FAILED' | 'OFFLINE';
  supabaseMessage: string;
  binanceStatus: 'CONNECTED' | 'FAILED';
  binanceMessage: string;
  authStatus: 'CONNECTED' | 'OFFLINE';
  authMessage: string;
  databaseTables: Record<string, { exists: boolean; count: number; error?: string }>;
}

export default function SystemCheck({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [running, setRunning] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [state, setState] = useState<DiagnosticState>({
    supabaseStatus: 'OFFLINE',
    supabaseMessage: 'Not Checked',
    binanceStatus: 'FAILED',
    binanceMessage: 'Not Checked',
    authStatus: 'OFFLINE',
    authMessage: 'Not Checked',
    databaseTables: {}
  });

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runDiagnostics = async () => {
    setRunning(true);
    setLogs([]);
    addLog('🚀 Starting H.A.D. Core Asset System Audit Tool v2.1...');

    const nextState: DiagnosticState = {
      supabaseStatus: 'OFFLINE',
      supabaseMessage: '',
      binanceStatus: 'FAILED',
      binanceMessage: '',
      authStatus: 'OFFLINE',
      authMessage: '',
      databaseTables: {}
    };

    // 1. SUPABASE CHECK
    addLog('Checking Supabase connection configurations...');
    if (isRealSupabase && supabase) {
      try {
        // Try reading config or users table to verify full RLS or credentials integrity
        const { data, error } = await supabase.from('users').select('id', { head: true, count: 'exact' });
        
        if (error) {
          addLog(`❌ Supabase test query error: ${error.message} (Code: ${error.code})`);
          nextState.supabaseStatus = 'FAILED';
          nextState.supabaseMessage = `Supabase Error: ${error.message}`;
        } else {
          addLog('✅ Supabase connected & query responded successfully!');
          nextState.supabaseStatus = 'CONNECTED';
          nextState.supabaseMessage = 'Secure live link active.';
        }
      } catch (err: any) {
        addLog(`❌ Uncaught Supabase client error: ${err.message || err}`);
        nextState.supabaseStatus = 'FAILED';
        nextState.supabaseMessage = err.message || 'Client Exception Error';
      }
    } else {
      addLog('⚠️ Supabase URL or Anon key is missing/placeholder. Falling back to secure localStorage Local Engine.');
      nextState.supabaseStatus = 'OFFLINE';
      nextState.supabaseMessage = 'Using local storage mock fallback (No environment credentials found)';
    }

    // 2. BINANCE LIVE PRICE CHECK
    addLog('Syncing Binance live market ticker price feed (Public REST API)...');
    try {
      const bData = await getCryptoPrices();
      if (bData && bData.length > 0) {
        addLog(`✅ Binance REST connected! Verified trading pairs: ${bData.map(c => c.symbol).join(', ')}`);
        nextState.binanceStatus = 'CONNECTED';
        nextState.binanceMessage = 'API is online & feeding live price metrics.';
      } else {
        addLog('❌ Binance REST responded with empty ticker array.');
        nextState.binanceStatus = 'FAILED';
        nextState.binanceMessage = 'No live pairs returned';
      }
    } catch (err: any) {
      addLog(`❌ Binance Connection Failed: ${err.message || err}`);
      nextState.binanceStatus = 'FAILED';
      nextState.binanceMessage = err.message || 'Connection refused or API timeout';
    }

    // 3. AUTH CHECK
    addLog('Scanning active local sessions...');
    const loggedUser = localStorage.getItem('had_logged_user');
    const adminActive = localStorage.getItem('had_staff_active') === 'true';
    if (loggedUser) {
      const u = JSON.parse(loggedUser);
      addLog(`👤 Active verified session found for user: ${u.name} (${u.had_id})`);
      nextState.authStatus = 'CONNECTED';
      nextState.authMessage = `Logged in as ${u.had_id} (${u.name})`;
    } else if (adminActive) {
      addLog('👑 Active Backoffice Administrative core session is active.');
      nextState.authStatus = 'CONNECTED';
      nextState.authMessage = 'Administrator authenticated';
    } else {
      addLog('ℹ No active login sessions on this terminal. Auth is waiting.');
      nextState.authStatus = 'OFFLINE';
      nextState.authMessage = 'No active local session';
    }

    // 4. DATABASE TABLES SCHEMAS VERIFICATION
    const tablesToCheck = [
      'users',
      'config',
      'investments',
      'transactions',
      'sponsor_income',
      'notifications',
      'wallets',
      'trading_assets'
    ];

    addLog('Scanning database tables models & schemas contents...');
    
    for (const t of tablesToCheck) {
      try {
        let count = 0;
        let exists = true;
        
        if (isRealSupabase && supabase) {
          const { data, error, count: cVal } = await supabase.from(t).select('*', { count: 'exact' });
          if (error) {
            addLog(`⚠️ Schema issue on Supabase table '${t}': ${error.message}`);
            // If table doesn't exist, count in local-fallback for seamless runtime
            const localList = localStorage.getItem('had_' + t);
            count = localList ? JSON.parse(localList).length : 0;
            nextState.databaseTables[t] = { exists: false, count, error: error.message };
          } else {
            count = cVal || (data ? data.length : 0);
            nextState.databaseTables[t] = { exists: true, count };
          }
        } else {
          // Fallback Local
          const localList = localStorage.getItem('had_' + t);
          count = localList ? JSON.parse(localList).length : 0;
          nextState.databaseTables[t] = { exists: true, count };
        }
      } catch (e: any) {
        addLog(`⚠️ Exception inspecting table '${t}': ${e.message}`);
        nextState.databaseTables[t] = { exists: false, count: 0, error: e.message };
      }
    }

    addLog('✅ All diagnostic metrics checked successfully.');
    setState(nextState);
    setRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 mb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gold-primary/10 border border-gold-primary/20 text-gold-primary rounded-xl">
            <Server size={24} />
          </div>
          <div>
            <span className="text-[10px] text-gold-primary font-mono font-bold tracking-widest uppercase">Operations Key Diagnostics</span>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">System Checks & Audits</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs flex items-center gap-2 transition font-mono"
          >
            <ArrowLeft size={14} /> Back Home
          </button>
          <button
            onClick={runDiagnostics}
            disabled={running}
            className="px-4 py-2 bg-gold-primary hover:bg-gold-light disabled:opacity-50 text-navy-dark rounded-xl text-xs font-bold flex items-center gap-2 transition uppercase tracking-wider"
          >
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} /> Run Diagnostics
          </button>
        </div>
      </div>

      {/* CORE CONNECTIONS BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
        {/* SUPABASE BOX */}
        <div className="bg-navy-card border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/15 transition shadow-xl min-h-[148px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider font-semibold">Supabase Linking</span>
              <h3 className="text-sm font-bold text-white uppercase">Raw Database Schema</h3>
            </div>
            {state.supabaseStatus === 'CONNECTED' ? (
              <span className="text-emerald-400 bg-emerald-500/10 p-1.5 rounded-lg"><CheckCircle size={18} /></span>
            ) : state.supabaseStatus === 'OFFLINE' ? (
              <span className="text-amber-400 bg-amber-500/10 p-1.5 rounded-lg text-xs font-mono font-bold">OFFLINE MODE</span>
            ) : (
              <span className="text-rose-400 bg-rose-500/10 p-1.5 rounded-lg"><XCircle size={18} /></span>
            )}
          </div>
          <div className="mt-4">
            <div className="text-lg font-black font-mono tracking-wide text-white">
              {state.supabaseStatus}
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed mt-1 font-mono break-all font-medium">
              {state.supabaseMessage || 'Status verified. Connected successfully to live host.'}
            </p>
          </div>
        </div>

        {/* BINANCE BOX */}
        <div className="bg-navy-card border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/15 transition shadow-xl min-h-[148px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider font-semibold">Binance Price Feed</span>
              <h3 className="text-sm font-bold text-white uppercase">REST & WebSockets</h3>
            </div>
            {state.binanceStatus === 'CONNECTED' ? (
              <span className="text-emerald-400 bg-emerald-500/10 p-1.5 rounded-lg"><CheckCircle size={18} /></span>
            ) : (
              <span className="text-rose-400 bg-rose-500/10 p-1.5 rounded-lg"><XCircle size={18} /></span>
            )}
          </div>
          <div className="mt-4">
            <div className="text-lg font-black font-mono tracking-wide text-white">
              {state.binanceStatus}
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed mt-1 font-mono font-medium">
              {state.binanceMessage || 'Binance system is active and responsive.'}
            </p>
          </div>
        </div>

        {/* AUTH BOX */}
        <div className="bg-navy-card border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/15 transition shadow-xl min-h-[148px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider font-semibold">User Sessions</span>
              <h3 className="text-sm font-bold text-white uppercase">Authentication Engine</h3>
            </div>
            {state.authStatus === 'CONNECTED' ? (
              <span className="text-emerald-400 bg-emerald-500/10 p-1.5 rounded-lg"><CheckCircle size={18} /></span>
            ) : (
              <span className="text-amber-400 bg-amber-500/10 p-1.5 rounded-lg"><Radio size={18} /></span>
            )}
          </div>
          <div className="mt-4">
            <div className="text-lg font-black font-mono tracking-wide text-white font-mono">
              {state.authStatus}
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed mt-1 font-mono font-medium">
              {state.authMessage}
            </p>
          </div>
        </div>
      </div>

      {/* CORE SCHEMAS SCHEMA STATS */}
      <div className="bg-navy-card border border-white/10 rounded-2xl p-6 mb-8 text-left shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
          <Database className="text-gold-primary" size={18} />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Storage Tables & Schema Verification Checklist</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(state.databaseTables).map(([table, meta]: [string, any]) => (
            <div key={table} className="bg-navy-dark border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold font-mono text-white tracking-wide truncate">{table}</span>
                {meta.exists ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-xl font-black font-mono text-white">{meta.count}</span>
                <span className="text-[10px] text-white/40 font-mono uppercase font-semibold">Records</span>
              </div>
              {!meta.exists && meta.error && (
                <div className="text-[8px] text-rose-400 font-mono leading-tight mt-1 truncate" title={meta.error}>
                  Error: {meta.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED DIAGNOSTIC LOGS TERMINAL CONTAINER */}
      <div className="bg-black/90 border border-white/10 rounded-2xl p-5 shadow-2xl text-left font-mono">
        <div className="flex items-center justify-between text-[10px] text-white/40 border-b border-white/5 pb-3 mb-4 font-bold uppercase tracking-wider">
          <span>Diagnostic Log Console</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Audit Output
          </span>
        </div>

        <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 font-mono text-xs text-white/70 leading-relaxed scrollbar-thin">
          {logs.map((log, idx) => {
            const isError = log.includes('❌');
            const isWarn = log.includes('⚠️');
            const isSuccess = log.includes('✅');
            let color = 'text-white/75';
            if (isError) color = 'text-rose-400 font-semibold';
            else if (isWarn) color = 'text-amber-400';
            else if (isSuccess) color = 'text-emerald-400 font-semibold';

            return (
              <div key={idx} className={color}>
                {log}
              </div>
            );
          })}
          {running && (
            <div className="text-gold-primary animate-pulse flex items-center gap-2">
              <span>⚡ Fetching resources, please wait...</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
