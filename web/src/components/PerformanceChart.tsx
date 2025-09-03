import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AircraftPerformance } from '../lib/aircraftPerformance';
import { BarChart3 } from 'lucide-react';

interface PerformanceChartProps {
  weight: number;
  temperature: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ weight, temperature }) => {
  const calc = new AircraftPerformance();

  const chartData = useMemo(() => {
    const altitudes = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000];
    
    return altitudes.map(altitude => {
      const perf = calc.getPerformanceWithTemperature(altitude, weight, temperature);
      const standardPerf = calc.getPerformanceStandard(altitude, weight);
      
      return {
        altitude,
        roc: perf ? perf.roc_fpm : null,
        roc_standard: standardPerf ? standardPerf[1] : null,
        ias: perf ? perf.ias_mph : null,
        densityAltitude: perf ? perf.density_altitude_ft : null,
      };
    }).filter(data => data.roc !== null);
  }, [weight, temperature, calc]);

  const rocData = chartData.map(d => ({
    altitude: d.altitude,
    'Rate of Climb (Current)': d.roc,
    'Rate of Climb (ISA)': d.roc_standard,
  }));

  const iasData = chartData.map(d => ({
    altitude: d.altitude,
    'Indicated Airspeed': d.ias,
  }));

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <BarChart3 className="h-6 w-6 text-aviation-600 mr-3" />
        <h3 className="text-xl font-bold text-gray-900">Performance Curves</h3>
      </div>

      <div className="space-y-8">
        {/* Rate of Climb Chart */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Rate of Climb vs Altitude
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="altitude" 
                  label={{ value: 'Altitude (ft)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Rate of Climb (fpm)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value} fpm`,
                    name
                  ]}
                  labelFormatter={(altitude: number) => `${altitude.toLocaleString()} ft`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Rate of Climb (Current)" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Rate of Climb (ISA)" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#94a3b8', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Solid line shows performance at {temperature}°C, dashed line shows ISA standard conditions.
          </p>
        </div>

        {/* IAS Chart */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Indicated Airspeed vs Altitude
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={iasData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="altitude" 
                  label={{ value: 'Altitude (ft)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'IAS (mph)', angle: -90, position: 'insideLeft' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} mph`, 'Indicated Airspeed']}
                  labelFormatter={(altitude: number) => `${altitude.toLocaleString()} ft`}
                />
                <Line 
                  type="monotone" 
                  dataKey="Indicated Airspeed" 
                  stroke="#059669" 
                  strokeWidth={2}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Best rate of climb airspeed decreases with altitude for optimal performance.
          </p>
        </div>
      </div>
    </div>
  );
};
