import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Coins, AlertCircle, Info, Gift, Check } from 'lucide-react';
import { db } from '../lib/db';
import { Notification } from '../types';

interface Props {
  hadId: string;
  onRefreshTrigger?: () => void;
}

export default function NotificationsDropdown({ hadId, onRefreshTrigger }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    const list = await db.notifications.getForUser(hadId);
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.is_read).length);
  };

  useEffect(() => {
    loadNotifications();
    
    // Set up rapid polling since user requested real-time UI feel
    const timer = setInterval(loadNotifications, 8000);
    return () => clearInterval(timer);
  }, [hadId]);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await db.notifications.markAllRead(hadId);
    await loadNotifications();
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleItemClick = async (notifId: string) => {
    // Local Update
    const list = [...notifications];
    const item = list.find(n => n.id === notifId);
    if (item && !item.is_read) {
      item.is_read = true;
      setNotifications(list);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update DB
      if (db.notifications.markAllRead) {
        // Simple update trigger in db script
        const allLocal = localStorage.getItem('had_notifications');
        if (allLocal) {
          const parsed = JSON.parse(allLocal) as Notification[];
          const idx = parsed.findIndex(n => n.id === notifId);
          if (idx !== -1) {
            parsed[idx].is_read = true;
            localStorage.setItem('had_notifications', JSON.stringify(parsed));
          }
        }
      }
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="p-1.5 bg-emerald-500/15 rounded-full text-emerald-400"><Coins size={14} /></div>;
      case 'error':
        return <div className="p-1.5 bg-rose-500/15 rounded-full text-rose-400"><AlertCircle size={14} /></div>;
      case 'warning':
        return <div className="p-1.5 bg-amber-500/15 rounded-full text-amber-400"><AlertCircle size={14} /></div>;
      default:
        return <div className="p-1.5 bg-sky-500/15 rounded-full text-sky-400"><Info size={14} /></div>;
    }
  };

  return (
    <div className="relative">
      <button 
        id="notif_bell_btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/5 transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span 
            id="notif_count_badge"
            className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-navy-dark animate-pulse"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
          
          <div 
            id="notif_dropdown_panel" 
            className="absolute right-0 mt-2 w-80 max-h-[480px] bg-navy-card border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/5 bg-white/[0.02]">
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-medium">
                    {unreadCount} New
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-gold-light hover:text-white flex items-center gap-1 hover:underline transition"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto max-h-[350px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-xs">
                  📭 General notification list empty.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.slice(0, 10).map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleItemClick(notif.id)}
                      className={`p-3 flex gap-3 text-left transition hover:bg-white/[0.01] cursor-pointer ${!notif.is_read ? 'bg-white/[0.02]' : ''}`}
                    >
                      {getNotifIcon(notif.type)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold ${!notif.is_read ? 'text-white' : 'text-white/80'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-gold-primary mt-1.5 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                          {notif.body}
                        </p>
                        <span className="text-[9px] text-white/30 block mt-1">
                          {new Date(notif.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/5 bg-white/[0.02] text-center">
              <span className="text-[10px] text-white/45">H.A.D. Core Security Sync Active</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
