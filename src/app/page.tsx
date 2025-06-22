'use client';

import { useEffect, useState } from 'react';

import type { dailyLogEmissions, ppReference } from '@/generated/prisma';
import { fetchDashboardData, type VesselWithDWT } from '@/shared/lib';
import VesselDeviationChart from '@/widgets/vessel-deviation-chart';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { queryClient } from 'shared/lib';

const HomePage = () => {
  const [data, setData] = useState<{
    vessels: VesselWithDWT[];
    emissions: dailyLogEmissions[];
    ppReferences: ppReference[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dashboardData = await fetchDashboardData();

        setData(dashboardData);
      } catch (error_) {
        // eslint-disable-next-line no-console
        console.error('Failed to load dashboard data:', error_);
        setError(
          error_ instanceof Error ? error_.message : 'Failed to load data',
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-xl text-red-600">Failed to load data</div>
            <div className="mb-4 text-sm text-gray-600">{error}</div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-xl text-red-600">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Vessel Emissions Deviation Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitoring vessel performance against Poseidon Principles baseline
            targets
          </p>
        </div>

        <div className="space-y-8">
          {/* Main Chart */}
          <VesselDeviationChart
            vessels={data.vessels}
            emissions={data.emissions}
            ppReferences={data.ppReferences}
            title="Quarterly Deviation from PP Baseline (2024)"
            height={600}
          />

          {/* Information Panel */}
          <div className="rounded-lg border border-gray-200 bg-blue-50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-blue-900">
              Understanding the Chart
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium text-blue-800">What it shows:</h3>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>
                    • Percentage deviation from Poseidon Principles minimum
                    baseline
                  </li>
                  <li>• Data points represent the last day of each quarter</li>
                  <li>• Red dashed line shows the 0% baseline target</li>
                  <li>
                    • Each vessel is represented by a different colored line
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-blue-800">How to interpret:</h3>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>
                    • Values above 0% indicate worse performance than baseline
                  </li>
                  <li>
                    • Values below 0% indicate better performance than baseline
                  </li>
                  <li>• Baseline is calculated using vessel DWT and year</li>
                  <li>• EEOICO2eW2W metric is used for comparison</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Information */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Current Data Set
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.vessels.length}
                </div>
                <div className="text-sm text-gray-600">Vessels Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.emissions.length}
                </div>
                <div className="text-sm text-gray-600">Emission Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.ppReferences.length}
                </div>
                <div className="text-sm text-gray-600">
                  PP Reference Factors
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
};

export default HomePage;
