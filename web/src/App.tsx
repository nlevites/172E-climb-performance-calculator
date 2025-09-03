import { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { PerformanceChart } from './components/PerformanceChart';
import { AircraftPerformance } from './lib/aircraftPerformance';
import { ClimbSegment, PerformanceData } from './types/aircraft';
import { Plane, Github, ExternalLink } from 'lucide-react';

function App() {
  // Form state
  const [startAltitude, setStartAltitude] = useState<number>(2000);
  const [endAltitude, setEndAltitude] = useState<number>(8000);
  const [weight, setWeight] = useState<number>(2000);
  const [startTemperature, setStartTemperature] = useState<number>(15);
  const [endTemperature, setEndTemperature] = useState<number>(3); // Standard lapse rate: 15 - (2 * 6000/1000) = 3°C
  const [useStandardLapseRate, setUseStandardLapseRate] = useState<boolean>(true);
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  
  // Results state
  const [climbSegment, setClimbSegment] = useState<ClimbSegment | null>(null);
  const [startPerformance, setStartPerformance] = useState<PerformanceData | null>(null);
  const [endPerformance, setEndPerformance] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Aircraft performance calculator instance
  const calc = new AircraftPerformance();

  // Temperature conversion utilities
  const fahrenheitToCelsius = (fahrenheit: number) => (fahrenheit - 32) * 5/9;
  
  // Helper function to calculate standard temperature at target altitude (always in Celsius)
  const calculateStandardEndTemp = (startTemp: number, startAlt: number, endAlt: number) => {
    return startTemp - (2.0 * (endAlt - startAlt) / 1000);
  };

  // Update end temperature when altitudes change (maintaining standard lapse rate as starting point)
  const handleStartAltitudeChange = (newStartAltitude: number) => {
    setStartAltitude(newStartAltitude);
    const newEndTemp = calculateStandardEndTemp(startTemperature, newStartAltitude, endAltitude);
    setEndTemperature(Math.round(newEndTemp * 10) / 10);
  };

  const handleEndAltitudeChange = (newEndAltitude: number) => {
    setEndAltitude(newEndAltitude);
    const newEndTemp = calculateStandardEndTemp(startTemperature, startAltitude, newEndAltitude);
    setEndTemperature(Math.round(newEndTemp * 10) / 10);
  };

  const handleStartTemperatureChange = (newStartTemp: number) => {
    // Convert to Celsius if input is in Fahrenheit, but store in Celsius
    const tempInCelsius = temperatureUnit === 'F' ? fahrenheitToCelsius(newStartTemp) : newStartTemp;
    setStartTemperature(tempInCelsius);
    const newEndTemp = calculateStandardEndTemp(tempInCelsius, startAltitude, endAltitude);
    setEndTemperature(Math.round(newEndTemp * 10) / 10);
  };

  const handleEndTemperatureChange = (newEndTemp: number) => {
    // Convert to Celsius if input is in Fahrenheit, but store in Celsius
    const tempInCelsius = temperatureUnit === 'F' ? fahrenheitToCelsius(newEndTemp) : newEndTemp;
    setEndTemperature(tempInCelsius);
  };

  const handleTemperatureUnitChange = (newUnit: 'C' | 'F') => {
    if (newUnit !== temperatureUnit) {
      // Don't convert the stored values - they stay in Celsius internally
      // The display will handle the conversion
      setTemperatureUnit(newUnit);
    }
  };

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get climb segment performance - use standard lapse rate if enabled
      const effectiveEndTemp = useStandardLapseRate 
        ? startTemperature - (2.0 * (endAltitude - startAltitude) / 1000)
        : endTemperature;
      const segment = calc.getClimbSegmentPerformance(startAltitude, endAltitude, weight, startTemperature, effectiveEndTemp);
      
      if (!segment) {
        const bounds = calc.getDataBounds();
        let errorMsg = 'Unable to calculate climb performance. ';
        
        // Check density altitude at both ends using effective temperatures
        const effectiveEndTemp = useStandardLapseRate 
          ? startTemperature - (2.0 * (endAltitude - startAltitude) / 1000)
          : endTemperature;
        const startDA = calc.calculateDensityAltitude(startAltitude, startTemperature);
        const endDA = calc.calculateDensityAltitude(endAltitude, effectiveEndTemp);
        
        if (startAltitude >= endAltitude) {
          errorMsg += 'Target altitude must be higher than start altitude.';
        } else if (weight < bounds.weight_range_lbs[0] || weight > bounds.weight_range_lbs[1]) {
          errorMsg += `Weight must be between ${bounds.weight_range_lbs[0]} and ${bounds.weight_range_lbs[1]} lbs.`;
        } else if (startDA < bounds.altitude_range_ft[0] || endDA < bounds.altitude_range_ft[0]) {
          errorMsg += `Cold temperatures (${startTemperature}°C/${effectiveEndTemp.toFixed(1)}°C) create negative density altitude. Try warmer temperatures.`;
        } else if (startDA > bounds.altitude_range_ft[1] || endDA > bounds.altitude_range_ft[1]) {
          errorMsg += `Hot temperatures (${startTemperature}°C/${effectiveEndTemp.toFixed(1)}°C) create density altitude above ${bounds.altitude_range_ft[1]} ft. Try cooler temperatures.`;
        } else {
          errorMsg += 'Check that all parameters are within valid ranges.';
        }
        
        setError(errorMsg);
        setClimbSegment(null);
        setStartPerformance(null);
        setEndPerformance(null);
        return;
      }
      
      // Get detailed performance at start and end altitudes with effective temperatures
      const startPerf = calc.getPerformanceWithTemperature(startAltitude, weight, startTemperature);
      const endPerf = calc.getPerformanceWithTemperature(endAltitude, weight, effectiveEndTemp);
      
      setClimbSegment(segment);
      setStartPerformance(startPerf);
      setEndPerformance(endPerf);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setClimbSegment(null);
      setStartPerformance(null);
      setEndPerformance(null);
    } finally {
      setIsCalculating(false);
    }
  }, [startAltitude, endAltitude, weight, startTemperature, endTemperature, useStandardLapseRate, calc]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-aviation-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-aviation-600 p-2 rounded-lg mr-4">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  1964 Cessna 172E Performance Calculator
                </h1>
                <p className="text-gray-600 text-sm">
                  N7772U • Professional climb performance with temperature correction
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <a
                href="https://github.com/nlevites/172E-climb-performance-calculator"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Github className="h-5 w-5 mr-2" />
                View Source
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Description */}
          <div className="text-center">
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Calculate climb performance for altitude segments with accurate temperature 
              corrections using density altitude. Based on 1964 Cessna 172E (N7772U) POH performance data 
              with coverage from sea level to 15,000 ft and weights from 1,700 to 2,300 lbs.
            </p>
          </div>

          {/* Input Form */}
          <InputForm
            startAltitude={startAltitude}
            endAltitude={endAltitude}
            weight={weight}
            startTemperature={startTemperature}
            endTemperature={endTemperature}
            useStandardLapseRate={useStandardLapseRate}
            temperatureUnit={temperatureUnit}
            onStartAltitudeChange={handleStartAltitudeChange}
            onEndAltitudeChange={handleEndAltitudeChange}
            onWeightChange={setWeight}
            onStartTemperatureChange={handleStartTemperatureChange}
            onEndTemperatureChange={handleEndTemperatureChange}
            onUseStandardLapseRateChange={setUseStandardLapseRate}
            onTemperatureUnitChange={handleTemperatureUnitChange}
            onCalculate={handleCalculate}
            isCalculating={isCalculating}
          />

          {/* Results */}
          {(climbSegment || error) && (
            <ResultsDisplay
              climbSegment={climbSegment}
              startPerformance={startPerformance}
              endPerformance={endPerformance}
              error={error}
              temperatureUnit={temperatureUnit}
            />
          )}

          {/* Performance Charts */}
          {climbSegment && !error && (
            <PerformanceChart weight={weight} temperature={startTemperature} />
          )}



          {/* POH Source Data */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <ExternalLink className="h-5 w-5 mr-2" />
              Original POH Data Source
            </h3>
            <div className="text-center">
              <img 
                src={`${import.meta.env.BASE_URL}rateOfClimbPOHSource.png`}
                alt="1964 Cessna 172E Rate of Climb Data from Pilot's Operating Handbook" 
                className="mx-auto max-w-full h-auto rounded-lg shadow-md border"
              />
              <p className="text-sm text-gray-600 mt-3">
                Maximum Rate-of-Climb Data from 1964 Cessna 172E (N7772U) Pilot's Operating Handbook
              </p>
            </div>
          </div>

          {/* Technical Notes */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Technical Notes</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>Important:</strong> Initial fuel used for warm-up and take-off allowance (1 gal) is not included in fuel calculations (see Fig 5-4 for clarification)</p>
              <p>• Performance data interpolated using bilinear interpolation between tabulated values</p>
              <p>• Temperature effects calculated using density altitude (120 ft per °C deviation from ISA)</p>
              <p>• ISA conditions: 15°C at sea level, decreasing 2°C per 1000 ft (used as default starting point)</p>
              <p>• Fuel consumption and climb time calculated using average rate of climb</p>
              <p>• Based on authentic 1964 Cessna 172E (N7772U) POH performance tables</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p>
              Based on 1964 Cessna 172E (N7772U) POH performance data. For training and planning purposes only.
              Always consult official aircraft documentation and current weather conditions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
