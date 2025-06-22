/* eslint-disable no-magic-numbers */
import Decimal from 'decimal.js';

import type {
  dailyLogEmissions,
  ppReference,
  Vessel,
  // eslint-disable-next-line import/no-relative-packages
} from '../../generated/prisma';
import { calculatePPSCCBaselines } from './calculate-pp-scc-baselines.util';

type VesselWithDWT = Vessel & {
  DWT: number; // Deadweight tonnage - you'll need to add this to your vessel data
};

type EmissionRecord = dailyLogEmissions;
type PPReferenceRecord = ppReference;

type QuarterData = {
  vessel: VesselWithDWT;
  year: number;
  quarter: number;
  lastDayData: EmissionRecord;
  deviation: number; // Percentage deviation from minimum baseline
  baseline: number;
  actualValue: number;
};

type DeviationResult = {
  vesselId: string;
  vesselName: string;
  quarterlyData: QuarterData[];
};

/**
 * Gets the quarter number (1-4) for a given date
 */
const getQuarter = (date: Date): number => {
  const month = date.getMonth() + 1; // getMonth() returns 0-11

  return Math.ceil(month / 3);
};

/**
 * Gets the last day of a quarter for a given year and quarter
 */
const getLastDayOfQuarter = (year: number, quarter: number): Date => {
  const lastMonthOfQuarter = quarter * 3;
  const lastDayOfMonth = new Date(year, lastMonthOfQuarter, 0);

  return lastDayOfMonth;
};

/**
 * Groups emissions by vessel and quarter, returning the record closest to the last day of each quarter
 */
const groupEmissionsByVesselAndQuarter = (
  emissions: EmissionRecord[],
  vessels: VesselWithDWT[],
): Map<string, Map<string, EmissionRecord>> => {
  const vesselMap = new Map(vessels.map(v => [v.IMONo.toString(), v]));
  const grouped = new Map<string, Map<string, EmissionRecord>>();

  emissions.forEach(emission => {
    const vessel = vesselMap.get(emission.VesselID.toString());

    if (!vessel) {
      return;
    }

    const toutcDate = new Date(emission.TOUTC);
    const year = toutcDate.getFullYear();
    const quarter = getQuarter(toutcDate);
    const quarterKey = `${year}-Q${quarter}`;
    const vesselKey = vessel.id;

    if (!grouped.has(vesselKey)) {
      grouped.set(vesselKey, new Map());
    }

    const vesselQuarters = grouped.get(vesselKey)!;
    const lastDayOfQuarter = getLastDayOfQuarter(year, quarter);

    // Keep the emission record closest to the last day of the quarter
    const existing = vesselQuarters.get(quarterKey);

    if (existing) {
      const existingDistance = Math.abs(
        lastDayOfQuarter.getTime() - new Date(existing.TOUTC).getTime(),
      );
      const currentDistance = Math.abs(
        lastDayOfQuarter.getTime() - toutcDate.getTime(),
      );

      if (currentDistance < existingDistance) {
        vesselQuarters.set(quarterKey, emission);
      }
    } else {
      vesselQuarters.set(quarterKey, emission);
    }
  });

  return grouped;
};

/**
 * Calculates percentage deviation from Poseidon Principles minimum baseline
 */
export const calculateDeviationFromPPBaseline = (
  vessels: VesselWithDWT[],
  emissions: EmissionRecord[],
  ppReferences: PPReferenceRecord[],
): DeviationResult[] => {
  const groupedData = groupEmissionsByVesselAndQuarter(emissions, vessels);
  const results: DeviationResult[] = [];

  vessels.forEach(vessel => {
    const vesselQuarters = groupedData.get(vessel.id);

    if (!vesselQuarters) {
      return;
    }

    const quarterlyData: QuarterData[] = [];

    // Get PP reference factors for this vessel type
    const vesselTypeFactors = ppReferences.filter(
      ref => ref.VesselTypeID === vessel.VesselType,
    );

    vesselQuarters.forEach((emission, quarterKey) => {
      const [yearStr, quarterStr] = quarterKey.split('-Q');
      const year = parseInt(yearStr, 10);
      const quarter = parseInt(quarterStr, 10);

      // Calculate baseline using the utility function
      const baselines = calculatePPSCCBaselines({
        factors: vesselTypeFactors.map(factor => ({
          Traj: factor.Traj,
          a: factor.a,
          b: factor.b,
          c: factor.c,
          d: factor.d,
          // eslint-disable-next-line id-denylist
          e: factor.e,
        })),
        year,
        DWT: new Decimal(vessel.DWT),
      });

      const baseline = baselines.min.toNumber();

      // Use EEOICO2eW2W as the actual emission value for comparison
      // This represents the Energy Efficiency Operational Indicator CO2 equivalent Well-to-Wake
      const actualValue = emission.EEOICO2eW2W;

      // Calculate percentage deviation: ((actual - baseline) / baseline) * 100
      const deviation = ((actualValue - baseline) / baseline) * 100;

      quarterlyData.push({
        vessel,
        year,
        quarter,
        lastDayData: emission,
        deviation,
        baseline,
        actualValue,
      });
    });

    // Sort by year and quarter
    quarterlyData.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }

      return a.quarter - b.quarter;
    });

    results.push({
      vesselId: vessel.id,
      vesselName: vessel.Name,
      quarterlyData,
    });
  });

  return results;
};

/**
 * Helper function to get deviation summary statistics
 */
export const getDeviationSummary = (deviationResults: DeviationResult[]) => {
  const allDeviations = deviationResults.flatMap(result =>
    result.quarterlyData.map(quarter => quarter.deviation),
  );

  if (allDeviations.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      positiveDeviations: 0,
      negativeDeviations: 0,
    };
  }

  const average =
    allDeviations.reduce((sum, dev) => sum + dev, 0) / allDeviations.length;
  const min = Math.min(...allDeviations);
  const max = Math.max(...allDeviations);
  const positiveDeviations = allDeviations.filter(dev => dev > 0).length;
  const negativeDeviations = allDeviations.filter(dev => dev < 0).length;

  return {
    count: allDeviations.length,
    average,
    min,
    max,
    positiveDeviations,
    negativeDeviations,
  };
};
