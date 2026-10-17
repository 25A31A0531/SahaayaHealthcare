/**
 * Visit Planner and Priority Scheduler
 * Computes scheduled visits from household register and ranks them:
 * Priority 1: High risk / Danger warning (Urgent)
 * Priority 2: Overdue immunisation / ANC
 * Priority 3: Due soon / Routine follow-up
 */

export function computeDailyStats(households) {
  if (!households || households.length === 0) {
    return {
      scheduledVisits: 0,
      followupsDue: 0,
      immunisationsDue: 0,
      urgentAlerts: 0
    };
  }

  let scheduledVisits = 0;
  let followupsDue = 0;
  let immunisationsDue = 0;
  let urgentAlerts = 0;

  households.forEach(h => {
    const p = h.patient;
    if (!p) return;

    scheduledVisits++;

    if (p.priority === 1) {
      urgentAlerts++;
    }

    if (p.category === 'Child') {
      immunisationsDue++;
    }

    if (p.category === 'NCD' || (p.status && p.status.includes('Follow-up'))) {
      followupsDue++;
    }
  });

  return {
    scheduledVisits,
    followupsDue,
    immunisationsDue,
    urgentAlerts
  };
}

export function getRankedVisits(households, filter = 'all') {
  if (!households) return [];

  let list = households.filter(h => h.patient);

  if (filter === 'anc') {
    list = list.filter(h => h.patient.category === 'Pregnant');
  } else if (filter === 'imm') {
    list = list.filter(h => h.patient.category === 'Child');
  } else if (filter === 'ncd') {
    list = list.filter(h => h.patient.category === 'NCD');
  }

  // Priority sort: Priority 1 first, then 2, then 3, then by distance
  return [...list].sort((a, b) => {
    const pA = a.patient.priority || 3;
    const pB = b.patient.priority || 3;

    if (pA !== pB) {
      return pA - pB;
    }

    return (a.distance_km || 0) - (b.distance_km || 0);
  });
}
