import { PerformanceData, ClimbSegment, DataBounds, PerformanceTable } from '../types/aircraft';

// Performance data tables - exact same data as Python version
const ALTITUDES = [0, 5000, 10000, 15000]; // feet
const WEIGHTS = [1700, 2000, 2300]; // pounds

// Indicated Airspeed (mph) - (altitude, weight) -> IAS
const IAS_DATA: PerformanceTable = {
  '0,1700': 75,   '0,2000': 77,   '0,2300': 80,
  '5000,1700': 73, '5000,2000': 76, '5000,2300': 78,
  '10000,1700': 71, '10000,2000': 74, '10000,2300': 77,
  '15000,1700': 70, '15000,2000': 73, '15000,2300': 76,
};

// Rate of Climb (fpm) - (altitude, weight) -> ROC
const ROC_DATA: PerformanceTable = {
  '0,1700': 1085, '0,2000': 840, '0,2300': 645,
  '5000,1700': 825, '5000,2000': 610, '5000,2300': 435,
  '10000,1700': 570, '10000,2000': 380, '10000,2300': 230,
  '15000,1700': 315, '15000,2000': 155, '15000,2300': 22,
};

// Fuel to reach altitude (gal) - (altitude, weight) -> Fuel
const FUEL_DATA: PerformanceTable = {
  '0,1700': 1.0, '0,2000': 1.0, '0,2300': 1.0,
  '5000,1700': 1.9, '5000,2000': 2.2, '5000,2300': 2.6,
  '10000,1700': 2.9, '10000,2000': 3.6, '10000,2300': 4.8,
  '15000,1700': 4.4, '15000,2000': 6.3, '15000,2300': 11.5,
};

export class AircraftPerformance {
  private altitudes = ALTITUDES;
  private weights = WEIGHTS;
  private iasData = IAS_DATA;
  private rocData = ROC_DATA;
  private fuelData = FUEL_DATA;

  /**
   * Perform bilinear interpolation on a 2D grid
   */
  private bilinearInterpolation(
    x: number,
    y: number,
    gridX: number[],
    gridY: number[],
    values: PerformanceTable
  ): number {
    // Check bounds
    if (!(gridX[0] <= x && x <= gridX[gridX.length - 1] && 
          gridY[0] <= y && y <= gridY[gridY.length - 1])) {
      throw new Error(`Point (${x}, ${y}) is outside the data grid bounds`);
    }

    // Find bounding grid points
    const x0 = Math.max(...gridX.filter(gx => gx <= x));
    const x1 = Math.min(...gridX.filter(gx => gx >= x));
    const y0 = Math.max(...gridY.filter(gy => gy <= y));
    const y1 = Math.min(...gridY.filter(gy => gy >= y));

    // Handle exact grid point case
    if (x0 === x1 && y0 === y1) {
      return values[`${x0},${y0}`];
    }

    // Calculate interpolation weights
    const tx = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
    const ty = y1 === y0 ? 0 : (y - y0) / (y1 - y0);

    // Get corner values
    const v00 = values[`${x0},${y0}`]; // bottom-left
    const v10 = values[`${x1},${y0}`]; // bottom-right
    const v01 = values[`${x0},${y1}`]; // top-left
    const v11 = values[`${x1},${y1}`]; // top-right

    // Bilinear interpolation formula
    const result = (1 - tx) * (1 - ty) * v00 + tx * (1 - ty) * v10 +
                   (1 - tx) * ty * v01 + tx * ty * v11;

    return result;
  }

  /**
   * Get aircraft performance at standard atmospheric conditions
   */
  getPerformanceStandard(altitudeFt: number, weightLbs: number): [number, number, number] {
    const ias = this.bilinearInterpolation(altitudeFt, weightLbs, this.altitudes, this.weights, this.iasData);
    const roc = this.bilinearInterpolation(altitudeFt, weightLbs, this.altitudes, this.weights, this.rocData);
    const fuel = this.bilinearInterpolation(altitudeFt, weightLbs, this.altitudes, this.weights, this.fuelData);

    return [Math.round(ias * 10) / 10, Math.round(roc * 10) / 10, Math.round(fuel * 100) / 100];
  }

  /**
   * Calculate density altitude using standard atmospheric formulas
   */
  calculateDensityAltitude(pressureAltitudeFt: number, temperatureC: number): number {
    // ISA (International Standard Atmosphere) temperature at pressure altitude
    // Sea level: 15°C, lapse rate: 2°C per 1000 ft
    const isaTemp = 15 - (2 * pressureAltitudeFt / 1000);

    // Density altitude approximation
    // For every degree above ISA, density altitude increases ~120 ft
    const densityAltitude = pressureAltitudeFt + (120 * (temperatureC - isaTemp));

    return densityAltitude;
  }

  /**
   * Get aircraft performance corrected for temperature effects
   */
  getPerformanceWithTemperature(
    pressureAltitudeFt: number,
    weightLbs: number,
    temperatureC: number
  ): PerformanceData | null {
    // Calculate atmospheric conditions
    const densityAlt = this.calculateDensityAltitude(pressureAltitudeFt, temperatureC);
    const isaTemp = 15 - (2 * pressureAltitudeFt / 1000);
    const isaDeviation = temperatureC - isaTemp;

    // Check if density altitude is within data bounds
    if (!(Math.min(...this.altitudes) <= densityAlt && densityAlt <= Math.max(...this.altitudes))) {
      return null;
    }

    if (!(Math.min(...this.weights) <= weightLbs && weightLbs <= Math.max(...this.weights))) {
      return null;
    }

    try {
      // Get performance at density altitude (temperature-corrected)
      const [ias, roc, fuel] = this.getPerformanceStandard(densityAlt, weightLbs);

      // For comparison, get standard performance at pressure altitude
      const [, stdRoc] = this.getPerformanceStandard(pressureAltitudeFt, weightLbs);
      const performanceFactor = stdRoc > 0 ? roc / stdRoc : 0;

      return {
        ias_mph: ias,
        roc_fpm: roc,
        fuel_gal: fuel,
        pressure_altitude_ft: pressureAltitudeFt,
        density_altitude_ft: Math.round(densityAlt),
        temperature_c: temperatureC,
        isa_temp_c: Math.round(isaTemp * 10) / 10,
        isa_deviation_c: Math.round(isaDeviation * 10) / 10,
        performance_factor: Math.round(performanceFactor * 1000) / 1000,
        roc_loss_fpm: Math.round((stdRoc - roc) * 10) / 10,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the valid data bounds for calculations
   */
  getDataBounds(): DataBounds {
    return {
      altitude_range_ft: [Math.min(...this.altitudes), Math.max(...this.altitudes)],
      weight_range_lbs: [Math.min(...this.weights), Math.max(...this.weights)],
    };
  }

  /**
   * Get climb performance for a specific altitude segment with custom temperature profile
   */
  getClimbSegmentPerformance(
    startAltitudeFt: number,
    endAltitudeFt: number,
    weightLbs: number,
    startTemperatureC: number,
    endTemperatureC?: number
  ): ClimbSegment | null {
    if (startAltitudeFt >= endAltitudeFt) {
      return null;
    }

    // Use provided end temperature, or calculate using standard lapse rate if not provided
    const finalEndTemperatureC = endTemperatureC !== undefined 
      ? endTemperatureC 
      : startTemperatureC - (2.0 * (endAltitudeFt - startAltitudeFt) / 1000);

    // Get performance at start altitude
    const startPerf = this.getPerformanceWithTemperature(startAltitudeFt, weightLbs, startTemperatureC);
    if (!startPerf) {
      return null;
    }

    // Get performance at end altitude with actual temperature
    const endPerf = this.getPerformanceWithTemperature(endAltitudeFt, weightLbs, finalEndTemperatureC);
    if (!endPerf) {
      return null;
    }

    // Calculate segment metrics
    const altitudeGain = endAltitudeFt - startAltitudeFt;
    const avgRoc = (startPerf.roc_fpm + endPerf.roc_fpm) / 2;

    // Fuel calculation: difference between fuel-to-altitude values
    const segmentFuel = endPerf.fuel_gal - startPerf.fuel_gal;

    // Time calculation using average ROC
    const climbTimeMin = avgRoc > 0 ? altitudeGain / avgRoc : Infinity;

    // Calculate lapse rate information
    const actualLapseRate = (startTemperatureC - finalEndTemperatureC) / (altitudeGain / 1000);
    const standardLapseRate = 2.0;
    const isStandardAtmosphere = Math.abs(actualLapseRate - standardLapseRate) < 0.5;

    return {
      start_altitude_ft: startAltitudeFt,
      end_altitude_ft: endAltitudeFt,
      altitude_gain_ft: altitudeGain,
      avg_roc_fpm: Math.round(avgRoc * 10) / 10,
      segment_fuel_gal: Math.round(segmentFuel * 100) / 100,
      climb_time_min: Math.round(climbTimeMin * 10) / 10,
      start_ias_mph: startPerf.ias_mph,
      end_ias_mph: endPerf.ias_mph,
      start_density_alt_ft: startPerf.density_altitude_ft,
      end_density_alt_ft: endPerf.density_altitude_ft,
      start_temperature_c: startTemperatureC,
      end_temperature_c: finalEndTemperatureC,
      actual_lapse_rate: Math.round(actualLapseRate * 10) / 10,
      standard_lapse_rate: standardLapseRate,
      is_standard_atmosphere: isStandardAtmosphere,
    };
  }
}
