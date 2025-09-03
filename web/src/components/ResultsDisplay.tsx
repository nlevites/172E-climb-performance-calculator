import React from 'react';
import { ClimbSegment, PerformanceData } from '../types/aircraft';
import { 
  TrendingUp, 
  Clock, 
  Fuel, 
  Gauge, 
  Thermometer,
  Mountain,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface ResultsDisplayProps {
  climbSegment: ClimbSegment | null;
  startPerformance: PerformanceData | null;
  endPerformance: PerformanceData | null;
  error: string | null;
  temperatureUnit: 'C' | 'F';
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  climbSegment,
  startPerformance,
  endPerformance,
  error,
  temperatureUnit,
}) => {
  // Temperature conversion utility
  const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5) + 32;
  const formatTemp = (tempC: number) => {
    const displayTemp = temperatureUnit === 'F' ? celsiusToFahrenheit(tempC) : tempC;
    return `${displayTemp.toFixed(1)}°${temperatureUnit}`;
  };
  if (error) {
    return (
      <div className="card animation-fade-in">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
          <h3 className="text-lg font-bold text-red-700">Calculation Error</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <div className="mt-3 text-sm text-red-600">
            <p><strong>Valid ranges:</strong></p>
            <p>• Altitude: 0 - 15,000 ft</p>
            <p>• Weight: 1,700 - 2,300 lbs</p>
            <p>• Consider temperature effects on density altitude</p>
          </div>
        </div>
      </div>
    );
  }

  if (!climbSegment || !startPerformance || !endPerformance) {
    return null;
  }

  const formatTime = (minutes: number): string => {
    if (!isFinite(minutes)) return 'N/A';
    const totalMinutes = Math.floor(minutes);
    const seconds = Math.round((minutes - totalMinutes) * 60);
    return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animation-fade-in">
      {/* Main Climb Segment Results */}
      <div className="card">
        <div className="flex items-center mb-6">
          <CheckCircle2 className="h-6 w-6 text-green-500 mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Climb Segment Performance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Altitude Gain */}
          <div className="text-center">
            <div className="bg-aviation-50 rounded-lg p-4">
              <Mountain className="h-8 w-8 text-aviation-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Altitude Gain</p>
              <p className="text-2xl font-bold text-aviation-900">
                {climbSegment.altitude_gain_ft.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">feet</p>
            </div>
          </div>

          {/* Rate of Climb */}
          <div className="text-center">
            <div className="bg-green-50 rounded-lg p-4">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Avg Rate of Climb</p>
              <p className="text-2xl font-bold text-green-900">
                {climbSegment.avg_roc_fpm}
              </p>
              <p className="text-sm text-gray-500">fpm</p>
            </div>
          </div>

          {/* Climb Time */}
          <div className="text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Climb Time</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatTime(climbSegment.climb_time_min)}
              </p>
              <p className="text-sm text-gray-500">mm:ss</p>
            </div>
          </div>

          {/* Fuel Consumption */}
          <div className="text-center">
            <div className="bg-orange-50 rounded-lg p-4">
              <Fuel className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Fuel for Segment</p>
              <p className="text-2xl font-bold text-orange-900">
                {climbSegment.segment_fuel_gal}
              </p>
              <p className="text-sm text-gray-500">gallons</p>
            </div>
          </div>
        </div>

        {/* IAS Range */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Gauge className="h-5 w-5 text-gray-600 mr-2" />
              <span className="font-medium text-gray-700">Indicated Airspeed</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-gray-900">
                {climbSegment.start_ias_mph} → {climbSegment.end_ias_mph} mph
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Start Altitude Conditions */}
        <div className="card">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center">
            <Mountain className="h-5 w-5 mr-2" />
            Start Conditions ({climbSegment.start_altitude_ft.toLocaleString()} ft)
          </h4>
          <div className="space-y-3">
            <div className="result-row">
              <span className="result-label">Temperature:</span>
              <span className="result-value">{formatTemp(climbSegment.start_temperature_c)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">ISA Temperature:</span>
              <span className="result-value">{formatTemp(startPerformance.isa_temp_c)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">ISA Deviation:</span>
              <span className={`result-value ${
                startPerformance.isa_deviation_c > 0 ? 'text-red-600' : 
                startPerformance.isa_deviation_c < 0 ? 'text-blue-600' : ''
              }`}>
                {startPerformance.isa_deviation_c > 0 ? '+' : ''}{formatTemp(startPerformance.isa_deviation_c)}
              </span>
            </div>
            <div className="result-row">
              <span className="result-label">Density Altitude:</span>
              <span className="result-value">{startPerformance.density_altitude_ft.toLocaleString()} ft</span>
            </div>
            <div className="result-row">
              <span className="result-label">Rate of Climb:</span>
              <span className="result-value">{startPerformance.roc_fpm} fpm</span>
            </div>
          </div>
        </div>

        {/* End Altitude Conditions */}
        <div className="card">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center">
            <Mountain className="h-5 w-5 mr-2" />
            End Conditions ({climbSegment.end_altitude_ft.toLocaleString()} ft)
          </h4>
          <div className="space-y-3">
            <div className="result-row">
              <span className="result-label">Temperature:</span>
              <span className="result-value">{formatTemp(climbSegment.end_temperature_c)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">ISA Temperature:</span>
              <span className="result-value">{formatTemp(endPerformance.isa_temp_c)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">ISA Deviation:</span>
              <span className={`result-value ${
                endPerformance.isa_deviation_c > 0 ? 'text-red-600' : 
                endPerformance.isa_deviation_c < 0 ? 'text-blue-600' : ''
              }`}>
                {endPerformance.isa_deviation_c > 0 ? '+' : ''}{formatTemp(endPerformance.isa_deviation_c)}
              </span>
            </div>
            <div className="result-row">
              <span className="result-label">Density Altitude:</span>
              <span className="result-value">{endPerformance.density_altitude_ft.toLocaleString()} ft</span>
            </div>
            <div className="result-row">
              <span className="result-label">Rate of Climb:</span>
              <span className="result-value">{endPerformance.roc_fpm} fpm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Atmospheric Analysis */}
      {!climbSegment.is_standard_atmosphere && (
        <div className="card">
          <div className="flex items-center mb-4">
            <Thermometer className="h-5 w-5 text-blue-500 mr-2" />
            <h4 className="font-bold text-gray-900">Atmospheric Analysis</h4>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-blue-800 text-sm">
                  <strong>Actual Lapse Rate:</strong> {climbSegment.actual_lapse_rate}°C/1000 ft
                </p>
                <p className="text-blue-800 text-sm">
                  <strong>Standard Lapse Rate:</strong> {climbSegment.standard_lapse_rate}°C/1000 ft
                </p>
                <p className="text-blue-800 text-sm">
                  <strong>Deviation:</strong> {climbSegment.actual_lapse_rate > climbSegment.standard_lapse_rate ? '+' : ''}{(climbSegment.actual_lapse_rate - climbSegment.standard_lapse_rate).toFixed(1)}°C/1000 ft
                </p>
              </div>
              <div>
                <p className="text-blue-800 text-sm font-medium">
                  <strong>Atmospheric Condition:</strong>
                </p>
                <p className="text-blue-800 text-sm">
                  {climbSegment.actual_lapse_rate < 0 ? 'Temperature Inversion (warmer aloft)' :
                   climbSegment.actual_lapse_rate < 1.0 ? 'Weak Lapse Rate' :
                   climbSegment.actual_lapse_rate < 1.5 ? 'Below Standard Lapse Rate' :
                   climbSegment.actual_lapse_rate < 2.5 ? 'Near Standard Lapse Rate' :
                   climbSegment.actual_lapse_rate < 3.5 ? 'Above Standard Lapse Rate' :
                   'Steep Lapse Rate'}
                </p>
                {climbSegment.actual_lapse_rate < 0 && (
                  <p className="text-blue-600 text-xs mt-2">
                    ⚠️ Temperature inversion may result in better than expected performance
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Impact Summary */}
      {(startPerformance.isa_deviation_c !== 0 || endPerformance.isa_deviation_c !== 0) && (
        <div className="card">
          <div className="flex items-center mb-4">
            <Thermometer className="h-5 w-5 text-orange-500 mr-2" />
            <h4 className="font-bold text-gray-900">Temperature Impact</h4>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800 text-sm">
              <strong>Performance Factor:</strong> {startPerformance.performance_factor} 
              {startPerformance.performance_factor < 1 ? ' (Reduced)' : startPerformance.performance_factor > 1 ? ' (Enhanced)' : ' (Standard)'}
            </p>
            {startPerformance.roc_loss_fpm > 0 && (
              <p className="text-orange-800 text-sm mt-1">
                <strong>Performance Loss:</strong> -{startPerformance.roc_loss_fpm} fpm at start altitude due to high temperature
              </p>
            )}
            {startPerformance.roc_loss_fpm < 0 && (
              <p className="text-orange-800 text-sm mt-1">
                <strong>Performance Gain:</strong> +{Math.abs(startPerformance.roc_loss_fpm)} fpm at start altitude due to cold temperature
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
