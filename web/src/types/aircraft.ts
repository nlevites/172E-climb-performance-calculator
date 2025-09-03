// Aircraft performance data types

export interface PerformanceData {
  ias_mph: number;
  roc_fpm: number;
  fuel_gal: number;
  pressure_altitude_ft: number;
  density_altitude_ft: number;
  temperature_c: number;
  isa_temp_c: number;
  isa_deviation_c: number;
  performance_factor: number;
  roc_loss_fpm: number;
}

export interface ClimbSegment {
  start_altitude_ft: number;
  end_altitude_ft: number;
  altitude_gain_ft: number;
  avg_roc_fpm: number;
  segment_fuel_gal: number;
  climb_time_min: number;
  start_ias_mph: number;
  end_ias_mph: number;
  start_density_alt_ft: number;
  end_density_alt_ft: number;
  start_temperature_c: number;
  end_temperature_c: number;
  actual_lapse_rate: number;
  standard_lapse_rate: number;
  is_standard_atmosphere: boolean;
}

export interface DataBounds {
  altitude_range_ft: [number, number];
  weight_range_lbs: [number, number];
}

export type DataPoint = [number, number]; // [altitude, weight]
export type PerformanceTable = Record<string, number>;
