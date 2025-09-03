import React, { useMemo } from 'react';
import { Plane, Thermometer, Scale, Mountain, AlertTriangle } from 'lucide-react';
import { validateFlightParameters } from '../utils/validation';

interface InputFormProps {
  startAltitude: number;
  endAltitude: number;
  weight: number;
  startTemperature: number;
  endTemperature: number;
  useStandardLapseRate: boolean;
  temperatureUnit: 'C' | 'F';
  onStartAltitudeChange: (value: number) => void;
  onEndAltitudeChange: (value: number) => void;
  onWeightChange: (value: number) => void;
  onStartTemperatureChange: (value: number) => void;
  onEndTemperatureChange: (value: number) => void;
  onUseStandardLapseRateChange: (value: boolean) => void;
  onTemperatureUnitChange: (value: 'C' | 'F') => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  startAltitude,
  endAltitude,
  weight,
  startTemperature,
  endTemperature,
  useStandardLapseRate,
  temperatureUnit,
  onStartAltitudeChange,
  onEndAltitudeChange,
  onWeightChange,
  onStartTemperatureChange,
  onEndTemperatureChange,
  onUseStandardLapseRateChange,
  onTemperatureUnitChange,
  onCalculate,
  isCalculating,
}) => {
  // Temperature conversion utilities
  const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5) + 32;
  
  // Get display temperatures (convert from stored Celsius if needed)
  const displayStartTemp = temperatureUnit === 'F' ? celsiusToFahrenheit(startTemperature) : startTemperature;
  const displayEndTemp = temperatureUnit === 'F' ? celsiusToFahrenheit(endTemperature) : endTemperature;
  const validation = useMemo(() => {
    return validateFlightParameters(startAltitude, endAltitude, weight, startTemperature, endTemperature, useStandardLapseRate, temperatureUnit);
  }, [startAltitude, endAltitude, weight, startTemperature, endTemperature, useStandardLapseRate, temperatureUnit]);

  // Calculate standard lapse rate temperature for comparison (in Celsius)
  const standardEndTemp = startTemperature - (2.0 * (endAltitude - startAltitude) / 1000);
  const effectiveEndTemp = useStandardLapseRate ? standardEndTemp : endTemperature;
  
  // Display version of standard temperature
  const displayStandardEndTemp = temperatureUnit === 'F' ? celsiusToFahrenheit(standardEndTemp) : standardEndTemp;
  const actualLapseRate = (endAltitude - startAltitude) > 0 
    ? (startTemperature - effectiveEndTemp) / ((endAltitude - startAltitude) / 1000)
    : 0;
  const lapseRateDeviation = actualLapseRate - 2.0;

  const getFieldError = (fieldName: string) => {
    return validation.errors.find(error => error.field === fieldName);
  };

  const getInputClassName = (fieldName: string) => {
    const error = getFieldError(fieldName);
    return `form-input ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`;
  };
  return (
    <div className="card">
      <div className="flex items-center mb-8">
        <Plane className="h-6 w-6 text-aviation-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-900">Flight Parameters</h2>
      </div>

      {/* Flight Profile Section */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Flight Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Start Altitude */}
          <div>
            <label className="form-label text-base">
              <Mountain className="inline h-5 w-5 mr-2" />
              Start Altitude
            </label>
            <div className="relative">
              <input
                type="number"
                className={`${getInputClassName('startAltitude')} text-lg py-3`}
                value={startAltitude}
                onChange={(e) => onStartAltitudeChange(Number(e.target.value))}
                min="0"
                max="15000"
                step="100"
                placeholder="2000"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">ft</span>
              </div>
            </div>
            {getFieldError('startAltitude') ? (
              <p className="text-xs text-red-600 mt-1">{getFieldError('startAltitude')?.message}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Range: 0 - 15,000 ft</p>
            )}
          </div>

          {/* Target Altitude */}
          <div>
            <label className="form-label text-base">
              <Mountain className="inline h-5 w-5 mr-2" />
              Target Altitude
            </label>
            <div className="relative">
              <input
                type="number"
                className={`${getInputClassName('endAltitude')} text-lg py-3`}
                value={endAltitude}
                onChange={(e) => onEndAltitudeChange(Number(e.target.value))}
                min="0"
                max="15000"
                step="100"
                placeholder="8000"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">ft</span>
              </div>
            </div>
            {getFieldError('endAltitude') ? (
              <p className="text-xs text-red-600 mt-1">{getFieldError('endAltitude')?.message}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Range: 0 - 15,000 ft</p>
            )}
          </div>

          {/* Aircraft Weight */}
          <div>
            <label className="form-label text-base">
              <Scale className="inline h-5 w-5 mr-2" />
              Gross Weight
            </label>
            <div className="relative">
              <input
                type="number"
                className={`${getInputClassName('weight')} text-lg py-3`}
                value={weight}
                onChange={(e) => onWeightChange(Number(e.target.value))}
                min="1700"
                max="2300"
                step="25"
                placeholder="2000"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">lbs</span>
              </div>
            </div>
            {getFieldError('weight') ? (
              <p className="text-xs text-red-600 mt-1">{getFieldError('weight')?.message}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Range: 1,700 - 2,300 lbs</p>
            )}
          </div>
        </div>
      </div>

      {/* Temperature Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Temperature Conditions</h3>
          <div className="flex items-center space-x-4 bg-white border border-gray-300 rounded-lg p-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="tempUnit"
                checked={temperatureUnit === 'C'}
                onChange={() => onTemperatureUnitChange('C')}
                className="h-4 w-4 text-aviation-600 focus:ring-aviation-500 border-gray-300"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">°C</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="tempUnit"
                checked={temperatureUnit === 'F'}
                onChange={() => onTemperatureUnitChange('F')}
                className="h-4 w-4 text-aviation-600 focus:ring-aviation-500 border-gray-300"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">°F</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Temperature */}
          <div>
            <label className="form-label text-base">
              <Thermometer className="inline h-5 w-5 mr-2" />
              Start Temperature
            </label>
            <div className="relative">
              <input
                type="number"
                className={`${getInputClassName('startTemperature')} text-lg py-3`}
                value={Math.round(displayStartTemp * 10) / 10}
                onChange={(e) => onStartTemperatureChange(Number(e.target.value))}
                min={temperatureUnit === 'F' ? "-40" : "-40"}
                max={temperatureUnit === 'F' ? "122" : "50"}
                step={temperatureUnit === 'F' ? "2" : "1"}
                placeholder={temperatureUnit === 'F' ? "59" : "15"}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-12 pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">°{temperatureUnit}</span>
              </div>
            </div>
            {getFieldError('startTemperature') ? (
              <p className="text-xs text-red-600 mt-1">{getFieldError('startTemperature')?.message}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                At {startAltitude.toLocaleString()} ft altitude
              </p>
            )}
          </div>

          {/* End Temperature - Conditional display */}
          {!useStandardLapseRate ? (
            <div>
              <label className="form-label text-base">
                <Thermometer className="inline h-5 w-5 mr-2" />
                Target Temperature
              </label>
              <div className="relative">
                <input
                  type="number"
                  className={`${getInputClassName('endTemperature')} text-lg py-3`}
                  value={Math.round(displayEndTemp * 10) / 10}
                  onChange={(e) => onEndTemperatureChange(Number(e.target.value))}
                  min={temperatureUnit === 'F' ? "-40" : "-40"}
                  max={temperatureUnit === 'F' ? "122" : "50"}
                  step={temperatureUnit === 'F' ? "2" : "1"}
                  placeholder={temperatureUnit === 'F' ? "50" : "10"}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">°{temperatureUnit}</span>
                </div>
              </div>
              {getFieldError('endTemperature') ? (
                <p className="text-xs text-red-600 mt-1">{getFieldError('endTemperature')?.message}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  At {endAltitude.toLocaleString()} ft altitude
                  {Math.abs(standardEndTemp - endTemperature) > 1 && (
                    <span className={`ml-2 font-medium ${
                      endTemperature > standardEndTemp ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      (Standard: {displayStandardEndTemp.toFixed(1)}°{temperatureUnit})
                    </span>
                  )}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="form-label text-base">
                <Thermometer className="inline h-5 w-5 mr-2" />
                Target Temperature
              </label>
              <div className="relative">
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 text-lg">
                  {displayStandardEndTemp.toFixed(1)}°{temperatureUnit}
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400 text-sm">auto</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Calculated using standard lapse rate (2°C per 1000 ft)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Atmospheric Analysis - Only show for non-standard conditions */}
      {!useStandardLapseRate && startAltitude !== endAltitude && Math.abs(lapseRateDeviation) > 0.5 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Atmospheric Analysis</h4>
          <div className="text-sm text-amber-700 space-y-1">
            <p>• Actual lapse rate: {actualLapseRate.toFixed(1)}°C/1000 ft</p>
            <p>• Standard lapse rate: 2.0°C/1000 ft</p>
            <p>• Deviation: {lapseRateDeviation > 0 ? '+' : ''}{lapseRateDeviation.toFixed(1)}°C/1000 ft</p>
            <p className="font-medium">
              • Condition: {
                Math.abs(lapseRateDeviation) < 0.5 ? 'Standard atmosphere' :
                actualLapseRate < 0 ? 'Strong inversion (warmer aloft)' :
                lapseRateDeviation < -0.5 ? 'Weak lapse rate' :
                lapseRateDeviation > 2 ? 'Steep lapse rate' :
                lapseRateDeviation > 0.5 ? 'Above standard lapse rate' :
                'Below standard lapse rate'
              }
            </p>
          </div>
        </div>
      )}

      {/* Advanced Options */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Calculation Method</h3>
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={useStandardLapseRate}
                  onChange={(e) => onUseStandardLapseRateChange(e.target.checked)}
                  className="h-5 w-5 text-aviation-600 focus:ring-aviation-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-base font-medium text-gray-900">Use Standard Lapse Rate</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 ml-8">
                {useStandardLapseRate 
                  ? 'Automatically calculates target temperature using 2°C decrease per 1000 ft'
                  : 'Enter custom temperatures for both altitudes (handles inversions, isothermal layers)'
                }
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {/* Validation Summary */}
        {!validation.isValid && validation.errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h4 className="text-sm font-medium text-red-800">Please correct the following:</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onCalculate}
          disabled={isCalculating || !validation.isValid}
          className={`w-full ${
            !validation.isValid || isCalculating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-aviation-600 to-aviation-700 hover:from-aviation-700 hover:to-aviation-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          } py-4 text-xl font-bold text-white rounded-xl transition-all duration-200 ease-out`}
        >
          {isCalculating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Calculating Performance...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Plane className="h-5 w-5 mr-3" />
              Calculate Performance
            </div>
          )}
        </button>
      </div>
    </div>
  );
};