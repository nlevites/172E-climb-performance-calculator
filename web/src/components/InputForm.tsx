import React, { useMemo } from 'react';
import { Plane, Thermometer, Scale, Mountain, AlertTriangle } from 'lucide-react';
import { validateFlightParameters } from '../utils/validation';

interface InputFormProps {
  startAltitude: number;
  endAltitude: number;
  weight: number;
  temperature: number;
  onStartAltitudeChange: (value: number) => void;
  onEndAltitudeChange: (value: number) => void;
  onWeightChange: (value: number) => void;
  onTemperatureChange: (value: number) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  startAltitude,
  endAltitude,
  weight,
  temperature,
  onStartAltitudeChange,
  onEndAltitudeChange,
  onWeightChange,
  onTemperatureChange,
  onCalculate,
  isCalculating,
}) => {
  const validation = useMemo(() => {
    return validateFlightParameters(startAltitude, endAltitude, weight, temperature);
  }, [startAltitude, endAltitude, weight, temperature]);

  const getFieldError = (fieldName: string) => {
    return validation.errors.find(error => error.field === fieldName);
  };

  const getInputClassName = (fieldName: string) => {
    const error = getFieldError(fieldName);
    return `form-input ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`;
  };
  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <Plane className="h-6 w-6 text-aviation-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-900">Flight Parameters</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Altitude */}
        <div>
          <label className="form-label">
            <Mountain className="inline h-4 w-4 mr-2" />
            Start Altitude (ft)
          </label>
          <input
            type="number"
            className={getInputClassName('startAltitude')}
            value={startAltitude}
            onChange={(e) => onStartAltitudeChange(Number(e.target.value))}
            min="0"
            max="15000"
            step="100"
            placeholder="e.g., 2000"
          />
          {getFieldError('startAltitude') ? (
            <p className="text-xs text-red-600 mt-1">{getFieldError('startAltitude')?.message}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Range: 0 - 15,000 ft</p>
          )}
        </div>

        {/* End Altitude */}
        <div>
          <label className="form-label">
            <Mountain className="inline h-4 w-4 mr-2" />
            Target Altitude (ft)
          </label>
          <input
            type="number"
            className={getInputClassName('endAltitude')}
            value={endAltitude}
            onChange={(e) => onEndAltitudeChange(Number(e.target.value))}
            min="0"
            max="15000"
            step="100"
            placeholder="e.g., 8000"
          />
          {getFieldError('endAltitude') ? (
            <p className="text-xs text-red-600 mt-1">{getFieldError('endAltitude')?.message}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Range: 0 - 15,000 ft</p>
          )}
        </div>

        {/* Aircraft Weight */}
        <div>
          <label className="form-label">
            <Scale className="inline h-4 w-4 mr-2" />
            Gross Weight (lbs)
          </label>
          <input
            type="number"
            className={getInputClassName('weight')}
            value={weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            min="1700"
            max="2300"
            step="25"
            placeholder="e.g., 2000"
          />
          {getFieldError('weight') ? (
            <p className="text-xs text-red-600 mt-1">{getFieldError('weight')?.message}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Range: 1,700 - 2,300 lbs</p>
          )}
        </div>

        {/* Temperature */}
        <div>
          <label className="form-label">
            <Thermometer className="inline h-4 w-4 mr-2" />
            Temperature at Start Altitude (°C)
          </label>
          <input
            type="number"
            className={getInputClassName('temperature')}
            value={temperature}
            onChange={(e) => onTemperatureChange(Number(e.target.value))}
            min="-40"
            max="50"
            step="1"
            placeholder="e.g., 15"
          />
          {getFieldError('temperature') ? (
            <p className="text-xs text-red-600 mt-1">{getFieldError('temperature')?.message}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Standard decreases 2°C per 1000 ft
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        {/* Validation Summary */}
        {!validation.isValid && validation.errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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
              : 'btn-primary'
          } py-3 text-lg font-semibold transition-all duration-200`}
        >
          {isCalculating ? 'Calculating...' : 'Calculate Performance'}
        </button>
      </div>
    </div>
  );
};
