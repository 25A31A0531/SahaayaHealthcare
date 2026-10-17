import { describe, it, expect } from 'vitest';
import { getRankedVisits, computeDailyStats } from '../lib/visitPlanner';
import sampleHouseholds from '../data/households.json';

describe('Visit Planner & Scheduler Logic', () => {
  it('must place Priority 1 (Urgent/Danger) visits at the top of the schedule', () => {
    const ranked = getRankedVisits(sampleHouseholds, 'all');
    expect(ranked.length).toBeGreaterThan(0);
    
    // The top ranked items must be Priority 1
    expect(ranked[0].patient.priority).toBe(1);
    expect(ranked[1].patient.priority).toBe(1);

    // Verify ordering: no lower priority item should precede a higher priority item
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].patient.priority).toBeLessThanOrEqual(ranked[i + 1].patient.priority);
    }
  });

  it('correctly filters visits by category', () => {
    const ancList = getRankedVisits(sampleHouseholds, 'anc');
    expect(ancList.every(h => h.patient.category === 'Pregnant')).toBe(true);

    const immList = getRankedVisits(sampleHouseholds, 'imm');
    expect(immList.every(h => h.patient.category === 'Child')).toBe(true);

    const ncdList = getRankedVisits(sampleHouseholds, 'ncd');
    expect(ncdList.every(h => h.patient.category === 'NCD')).toBe(true);
  });

  it('correctly computes daily statistics', () => {
    const stats = computeDailyStats(sampleHouseholds);
    expect(stats.scheduledVisits).toBe(30);
    expect(stats.urgentAlerts).toBeGreaterThan(0);
    expect(stats.immunisationsDue).toBeGreaterThan(0);
    expect(stats.followupsDue).toBeGreaterThan(0);
  });
});
