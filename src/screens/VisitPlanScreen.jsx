import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ShieldAlert, 
  Check
} from 'lucide-react';
import { getRankedVisits } from '../lib/visitPlanner';
import { updateHousehold } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function VisitPlanScreen({ households, onHouseholdUpdated }) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
  const [completedIds, setCompletedIds] = useState(new Set());
  const [updatingId, setUpdatingId] = useState(null);

  const visits = getRankedVisits(households, activeFilter);

  const handleComplete = async (household) => {
    setUpdatingId(household.id);
    const updated = {
      ...household,
      patient: {
        ...household.patient,
        status: 'Completed Today',
        completedAt: new Date().toISOString()
      }
    };

    try {
      await updateHousehold(updated);
      setCompletedIds(prev => new Set(prev).add(household.id));
      if (onHouseholdUpdated) onHouseholdUpdated(updated);
    } catch (err) {
      console.error('Failed to update visit:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            {t('priority_urgent')}
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-700" />
            {t('priority_overdue')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            {t('priority_due_soon')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header Summary */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {t('nav_visits')}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {t('cluster')}
            </p>
          </div>
          <span className="text-sm font-extrabold text-primary bg-primary-light px-3 py-1 rounded-full">
            {visits.length} {t('records_count_suffix')}
          </span>
        </div>

        {/* Filter Tabs - 48px touch targets */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-gray-100">
          {[
            { id: 'all', labelKey: 'filter_all' },
            { id: 'anc', labelKey: 'filter_anc' },
            { id: 'imm', labelKey: 'filter_imm' },
            { id: 'ncd', labelKey: 'filter_ncd' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`min-h-touch py-2 px-2 text-xs font-bold rounded-xl transition-all ${
                activeFilter === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Visit List (Responsive: 1 col on mobile, 2 on tablet, 3 on large screen) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {visits.map((household, index) => {
          const p = household.patient;
          const isDone = completedIds.has(household.id) || p.status === 'Completed Today';
          const localizedReason = t(`reasons.${household.id}`) || p.reason;

          return (
            <div
              key={household.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                isDone 
                  ? 'bg-gray-50 border-gray-200 opacity-75' 
                  : p.priority === 1 
                  ? 'bg-red-50/50 border-red-300 shadow-sm' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div>
                {/* Row 1: Time, Distance, Priority */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {p.scheduled_time || `Slot ${index + 1}`}
                    </span>
                    <span className="text-gray-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {household.distance_km} km
                    </span>
                  </div>
                  {getPriorityBadge(p.priority)}
                </div>

                {/* Row 2: Patient Name & Household */}
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-gray-900">
                      {p.name}
                    </h3>
                    <span className="text-xs font-semibold text-primary font-mono">
                      {household.id}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-0.5">
                    {t('head_of_family_label')}: {household.head_of_family} • <span className="font-medium text-gray-800">{household.village}</span>
                  </p>
                </div>

                {/* Row 3: Clinical Reason (Translated) */}
                <div className="mt-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-800 leading-relaxed font-medium">
                  <span className="font-bold text-primary mr-1">{t('goal_label')}:</span>
                  {localizedReason}
                </div>
              </div>

              {/* Row 4: Action Button */}
              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-gray-500">
                  {t('last_visit_label')}: {p.last_visit || '2026-09'}
                </span>

                <button
                  onClick={() => handleComplete(household)}
                  disabled={isDone || updatingId === household.id}
                  className={`min-h-touch px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-800 cursor-default'
                      : 'bg-primary hover:bg-primary-hover text-white shadow-sm'
                  }`}
                  aria-label={`Mark visit completed for ${p.name}`}
                >
                  {isDone ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>{t('completed')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{t('mark_completed')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
