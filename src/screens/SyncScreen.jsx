import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Database, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  HardDrive,
  Clock
} from 'lucide-react';
import { getDatabaseStats, getSyncQueue, clearSyncQueue, getLastSyncTime, setLastSyncTime } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import useConnectionStatus from '../hooks/useConnectionStatus';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function SyncScreen() {
  const { t, language } = useLanguage();
  const { isOnline } = useConnectionStatus();
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [lastSyncTime, setLastSyncTimeState] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncMsg, setLastSyncMsg] = useState(null);

  const loadData = useCallback(async () => {
    const s = await getDatabaseStats();
    const q = await getSyncQueue();
    const lst = await getLastSyncTime();
    setStats(s);
    setQueue(q);
    setLastSyncTimeState(lst);
  }, []);

  useEffect(() => {
    loadData();

    const handleSyncedEvent = () => {
      loadData();
    };

    window.addEventListener('sahaaya_synced', handleSyncedEvent);

    return () => {
      window.removeEventListener('sahaaya_synced', handleSyncedEvent);
    };
  }, [loadData]);

  const handleSyncNow = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    setTimeout(async () => {
      await clearSyncQueue();
      const now = new Date().toISOString();
      await setLastSyncTime(now);
      await loadData();
      setIsSyncing(false);
      setLastSyncMsg(t('sync_completed_toast'));
      setTimeout(() => setLastSyncMsg(null), 4000);
    }, 800);
  };

  const formatLastSync = (iso) => {
    if (!iso) return t('never_synced');
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString(language === 'te' ? 'te-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (_e) {
      return iso;
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Network Status Header */}
      <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${
        isOnline ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-amber-50 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
              <h3 className="text-sm font-bold">
                {isOnline ? t('online_badge') : t('offline_badge')}
              </h3>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {isOnline ? t('online_status_desc') : t('offline_status_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Sync Success Message */}
      {lastSyncMsg && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{lastSyncMsg}</span>
        </div>
      )}

      {/* On-Device Storage Stats */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />
          <span>{t('data_stored_device')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">{t('households_count_label')}</span>
            <span className="text-xl font-bold text-gray-900 mt-1 block">
              {stats?.householdCount || 30} {t('records_count_suffix')}
            </span>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">{t('status_synced')}</span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-500 block">{t('protocols_count_label')}</span>
            <span className="text-xl font-bold text-gray-900 mt-1 block">
              {stats?.protocolCount || 10} {t('sections_count_suffix')}
            </span>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">{t('offline_chip')}</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs">
          <span className="font-semibold text-emerald-950 block">{t('model_algorithm_status')}:</span>
          <p className="text-emerald-800 mt-0.5 font-mono text-[11px]">
            {stats?.modelStatus}
          </p>
        </div>
      </div>

      {/* Pending Sync Queue & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span>{t('sync_queue_title')}</span>
          </h3>
          <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
            {queue.length} {t('pending_badge')}
          </span>
        </div>

        {/* Last Synced Time Display */}
        <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-600 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {t('last_synced_label')}:
          </span>
          <span className="font-bold text-gray-900">
            {formatLastSync(lastSyncTime)}
          </span>
        </div>

        {queue.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">
            {t('status_synced')}
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {queue.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900">{item.action}</span>
                  <span className="text-gray-600 block text-[11px]">
                    {item.householdId} — {item.patientName || item.action}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sync Now Button - 48px touch target */}
        <button
          onClick={handleSyncNow}
          disabled={!isOnline || isSyncing || queue.length === 0}
          className="w-full min-h-touch py-3 px-4 bg-primary hover:bg-primary-hover active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? t('syncing_in_progress') : t('status_sync_now')}</span>
        </button>

        {!isOnline && (
          <p className="text-xs text-amber-800 font-medium text-center mt-2 flex items-center justify-center gap-1.5 bg-amber-50 py-2 px-3 rounded-xl border border-amber-200">
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{t('connect_internet_to_sync')}</span>
          </p>
        )}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
