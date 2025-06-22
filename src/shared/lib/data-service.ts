import type {
  dailyLogEmissions,
  ppReference,
  Vessel,
} from '@/generated/prisma';

// Type for vessel with DWT (required for calculations)
export type VesselWithDWT = Vessel & {
  DWT: number;
};

/**
 * Fetches all vessels from the database
 */
export const fetchVessels = async (): Promise<VesselWithDWT[]> => {
  try {
    const response = await fetch('/api/vessels');

    if (!response.ok) {
      throw new Error(`Failed to fetch vessels: ${response.statusText}`);
    }

    const vessels: Vessel[] = await response.json();

    // Handle DWT field - use database value if available, otherwise use mock values
    return vessels.map((vessel, index) => ({
      ...vessel,
      // eslint-disable-next-line no-magic-numbers
      DWT: vessel.DWT ?? 155000 + index * 1000, // Use database DWT or fallback to mock values
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching vessels:', error);
    throw error;
  }
};

/**
 * Fetches all emission records from the database
 */
export const fetchEmissions = async (): Promise<dailyLogEmissions[]> => {
  try {
    const response = await fetch('/api/emissions');

    if (!response.ok) {
      throw new Error(`Failed to fetch emissions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching emissions:', error);
    throw error;
  }
};

/**
 * Fetches all PP reference data from the database
 */
export const fetchPPReferences = async (): Promise<ppReference[]> => {
  try {
    const response = await fetch('/api/pp-references');

    if (!response.ok) {
      throw new Error(`Failed to fetch PP references: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching PP references:', error);
    throw error;
  }
};

/**
 * Fetches all data needed for the deviation dashboard
 */
export const fetchDashboardData = async () => {
  try {
    const [vessels, emissions, ppReferences] = await Promise.all([
      fetchVessels(),
      fetchEmissions(),
      fetchPPReferences(),
    ]);

    return {
      vessels,
      emissions,
      ppReferences,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};
