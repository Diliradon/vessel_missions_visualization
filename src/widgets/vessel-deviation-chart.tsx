import { useEffect, useMemo, useState } from 'react';

import {
  calculateDeviationFromPPBaseline,
  getDeviationSummary,
} from '@/shared/lib';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Mock data types - replace with your actual data fetching
type VesselWithDWT = {
  id: string;
  Name: string;
  IMONo: number;
  VesselType: number;
  DWT: number;
};

type EmissionRecord = {
  id: string;
  EID: number;
  VesselID: number;
  LOGID: bigint;
  FromUTC: Date;
  TOUTC: Date;
  MET2WCO2: number;
  AET2WCO2: number;
  BOT2WCO2: number;
  VRT2WCO2: number;
  TotT2WCO2: number;
  MEW2WCO2e: number;
  AEW2WCO2e: number;
  BOW2WCO2e: number;
  VRW2WCO2e: number;
  ToTW2WCO2: number;
  MESox: number;
  AESox: number;
  BOSox: number;
  VRSox: number;
  TotSOx: number;
  MENOx: number;
  AENOx: number;
  TotNOx: number;
  MEPM10: number;
  AEPM10: number;
  TotPM10: number;
  AERCO2T2W: number;
  AERCO2eW2W: number;
  EEOICO2eW2W: number;
  CreatedAt: Date;
  UpdatedAt: Date;
};

type PPReferenceRecord = {
  id: string;
  RowID: number;
  Category: string;
  VesselTypeID: number;
  Size: string;
  Traj: string;
  a: number;
  b: number;
  c: number;
  d: number;
  // eslint-disable-next-line id-denylist
  e: number;
  createdAt: Date;
  updatedAt: Date;
};

interface VesselDeviationChartProps {
  vessels: VesselWithDWT[];
  emissions: EmissionRecord[];
  ppReferences: PPReferenceRecord[];
  title?: string;
  height?: number;
}

const VesselDeviationChart: React.FC<VesselDeviationChartProps> = ({
  vessels,
  emissions,
  ppReferences,
  title = 'Vessel Deviation from Poseidon Principles Baseline',
  height = 500,
}) => {
  const [loading, setLoading] = useState(true);

  // Calculate deviation data
  const deviationData = useMemo(() => {
    if (
      vessels.length === 0 ||
      emissions.length === 0 ||
      ppReferences.length === 0
    ) {
      return [];
    }

    try {
      return calculateDeviationFromPPBaseline(vessels, emissions, ppReferences);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error calculating deviations:', error);

      return [];
    }
  }, [vessels, emissions, ppReferences]);

  // Get summary statistics
  const summary = useMemo(() => {
    return getDeviationSummary(deviationData);
  }, [deviationData]);

  // Prepare chart options
  const chartOptions = useMemo(() => {
    if (deviationData.length === 0) {
      return null;
    }

    // Create categories (quarters)
    const allQuarters = new Set<string>();

    deviationData.forEach(vessel => {
      vessel.quarterlyData.forEach(quarter => {
        allQuarters.add(`${quarter.year} Q${quarter.quarter}`);
      });
    });

    const categories = Array.from(allQuarters).sort();

    // Create series data for each vessel
    const series = deviationData.map(vessel => {
      const data = categories.map(category => {
        const [year, quarterStr] = category.split(' Q');
        const quarter = parseInt(quarterStr, 10);
        const yearNum = parseInt(year, 10);

        const quarterData = vessel.quarterlyData.find(
          q => q.year === yearNum && q.quarter === quarter,
        );

        return quarterData
          ? // eslint-disable-next-line no-magic-numbers
            parseFloat(quarterData.deviation.toFixed(2))
          : null;
      });

      return {
        name: vessel.vesselName,
        data,
        type: 'line',
        marker: {
          enabled: true,
          radius: 4,
        },
        lineWidth: 2,
      };
    });

    const options: Highcharts.Options = {
      title: {
        text: title,
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
        },
      },
      subtitle: {
        // eslint-disable-next-line no-magic-numbers
        text: `Average Deviation: ${summary.average.toFixed(2)}% | Vessels: ${vessels.length} | Data Points: ${summary.count}`,
      },
      xAxis: {
        categories,
        title: {
          text: 'Quarter',
        },
        labels: {
          rotation: -45,
          style: {
            fontSize: '12px',
          },
        },
      },
      yAxis: {
        title: {
          text: 'Deviation from PP Baseline (%)',
        },
        plotLines: [
          {
            value: 0,
            color: '#FF0000',
            dashStyle: 'Dash',
            width: 2,
            label: {
              text: 'PP Baseline (0%)',
              align: 'right',
              style: {
                color: '#FF0000',
                fontWeight: 'bold',
              },
            },
          },
        ],
        labels: {
          formatter() {
            // eslint-disable-next-line react/no-this-in-sfc
            return `${this.value}%`;
          },
        },
      },
      tooltip: {
        shared: true,
        formatter() {
          // eslint-disable-next-line react/no-this-in-sfc
          let tooltip = `<b>${this.x}</b><br/>`;

          // eslint-disable-next-line react/no-this-in-sfc
          this.points?.forEach(point => {
            const { color } = point.series;

            const value = point.y ? `${point.y}%` : 'No data';

            tooltip += `<span style="color:${color}">●</span> ${point.series.name}: <b>${value}</b><br/>`;
          });

          return tooltip;
        },
      },
      legend: {
        enabled: true,
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: {
          fontSize: '12px',
        },
      },
      series: series as Highcharts.SeriesOptionsType[],
      chart: {
        height,
        backgroundColor: '#FFFFFF',
        style: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
        },
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        series: {
          connectNulls: false,
          marker: {
            enabled: true,
          },
        },
        line: {
          dataLabels: {
            enabled: false,
          },
        },
      },
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 768,
            },
            chartOptions: {
              legend: {
                layout: 'vertical',
                align: 'center',
                verticalAlign: 'bottom',
              },
              xAxis: {
                labels: {
                  rotation: -90,
                },
              },
            },
          },
        ],
      },
    };

    return options;
  }, [deviationData, title, height, summary, vessels.length]);

  useEffect(() => {
    setLoading(false);
  }, [deviationData]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-lg text-gray-600">Loading chart data...</div>
      </div>
    );
  }

  if (!chartOptions || deviationData.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">
            No deviation data available
          </div>
          <div className="text-sm text-gray-500">
            Please ensure vessels have DWT data and emission records are
            available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {summary.count}
          </div>
          <div className="text-sm text-gray-600">Data Points</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {summary.average.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Avg Deviation</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {summary.max.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Worst</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {summary.min.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Best</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {/* eslint-disable-next-line no-magic-numbers */}
            {((summary.positiveDeviations / summary.count) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Above Baseline</div>
        </div>
      </div>
    </div>
  );
};

export default VesselDeviationChart;
