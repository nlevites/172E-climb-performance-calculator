#!/usr/bin/env python3
"""
Aircraft Performance Calculator with Temperature Correction

Provides interpolated aircraft performance data (IAS, Rate of Climb, Fuel consumption)
with corrections for temperature using density altitude calculations.

Data covers:
- Altitudes: 0 to 15,000 ft
- Weights: 1,700 to 2,300 lbs  
- Performance metrics: IAS (mph), Rate of Climb (fpm), Fuel to altitude (gal)
"""

from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass
class PerformanceData:
    """Aircraft performance data at specific conditions"""
    ias_mph: float
    roc_fpm: float
    fuel_gal: float
    pressure_altitude_ft: float
    density_altitude_ft: float
    temperature_c: float
    isa_temp_c: float
    isa_deviation_c: float
    performance_factor: float
    roc_loss_fpm: float


@dataclass
class ClimbSegment:
    """Climb performance data for an altitude segment"""
    start_altitude_ft: float
    end_altitude_ft: float
    altitude_gain_ft: float
    avg_roc_fpm: float
    segment_fuel_gal: float
    climb_time_min: float
    start_ias_mph: float
    end_ias_mph: float
    start_density_alt_ft: float
    end_density_alt_ft: float
    temperature_c: float


@dataclass
class DataBounds:
    """Valid data bounds for calculations"""
    altitude_range_ft: Tuple[float, float]
    weight_range_lbs: Tuple[float, float]

# Performance data tables
ALTITUDES = [0, 5000, 10000, 15000]  # feet
WEIGHTS = [1700, 2000, 2300]  # pounds

# Indicated Airspeed (mph) - (altitude, weight) -> IAS
IAS_DATA = {
    (0, 1700): 75,  (0, 2000): 77,  (0, 2300): 80,
    (5000, 1700): 73, (5000, 2000): 76, (5000, 2300): 78,
    (10000, 1700): 71, (10000, 2000): 74, (10000, 2300): 77,
    (15000, 1700): 70, (15000, 2000): 73, (15000, 2300): 76,
}

# Rate of Climb (fpm) - (altitude, weight) -> ROC
ROC_DATA = {
    (0, 1700): 1085, (0, 2000): 840, (0, 2300): 645,
    (5000, 1700): 825, (5000, 2000): 610, (5000, 2300): 435,
    (10000, 1700): 570, (10000, 2000): 380, (10000, 2300): 230,
    (15000, 1700): 315, (15000, 2000): 155, (15000, 2300): 22,
}

# Fuel to reach altitude (gal) - (altitude, weight) -> Fuel
FUEL_DATA = {
    (0, 1700): 1.0, (0, 2000): 1.0, (0, 2300): 1.0,
    (5000, 1700): 1.9, (5000, 2000): 2.2, (5000, 2300): 2.6,
    (10000, 1700): 2.9, (10000, 2000): 3.6, (10000, 2300): 4.8,
    (15000, 1700): 4.4, (15000, 2000): 6.3, (15000, 2300): 11.5,
}


class AircraftPerformance:
    """Aircraft performance calculator with temperature correction capabilities"""
    
    def __init__(self):
        self.altitudes = ALTITUDES
        self.weights = WEIGHTS
        self.ias_data = IAS_DATA
        self.roc_data = ROC_DATA
        self.fuel_data = FUEL_DATA
    
    def _bilinear_interpolation(self, x, y, grid_x, grid_y, values):
        """
        Perform bilinear interpolation on a 2D grid
        
        Args:
            x, y: Point to interpolate at
            grid_x, grid_y: Grid coordinate arrays
            values: Dictionary with (grid_x, grid_y) -> value mapping
        
        Returns:
            Interpolated value
        """
        # Check bounds
        if not (grid_x[0] <= x <= grid_x[-1] and grid_y[0] <= y <= grid_y[-1]):
            raise ValueError(f"Point ({x}, {y}) is outside the data grid bounds")
        
        # Find bounding grid points
        x0 = max([gx for gx in grid_x if gx <= x])
        x1 = min([gx for gx in grid_x if gx >= x])
        y0 = max([gy for gy in grid_y if gy <= y])
        y1 = min([gy for gy in grid_y if gy >= y])
        
        # Handle exact grid point case
        if x0 == x1 and y0 == y1:
            return values[(x0, y0)]
        
        # Calculate interpolation weights
        tx = 0 if x1 == x0 else (x - x0) / (x1 - x0)
        ty = 0 if y1 == y0 else (y - y0) / (y1 - y0)
        
        # Get corner values
        v00 = values[(x0, y0)]  # bottom-left
        v10 = values[(x1, y0)]  # bottom-right
        v01 = values[(x0, y1)]  # top-left
        v11 = values[(x1, y1)]  # top-right
        
        # Bilinear interpolation formula
        result = (1 - tx) * (1 - ty) * v00 + tx * (1 - ty) * v10 + \
                 (1 - tx) * ty * v01 + tx * ty * v11
        
        return result
    
    def get_performance_standard(self, altitude_ft, weight_lbs):
        """
        Get aircraft performance at standard atmospheric conditions
        
        Args:
            altitude_ft: Altitude in feet
            weight_lbs: Gross weight in pounds
            
        Returns:
            tuple: (ias_mph, roc_fpm, fuel_gal)
        """
        ias = self._bilinear_interpolation(altitude_ft, weight_lbs, 
                                         self.altitudes, self.weights, self.ias_data)
        roc = self._bilinear_interpolation(altitude_ft, weight_lbs,
                                         self.altitudes, self.weights, self.roc_data)
        fuel = self._bilinear_interpolation(altitude_ft, weight_lbs,
                                          self.altitudes, self.weights, self.fuel_data)
        
        return round(ias, 1), round(roc, 1), round(fuel, 2)
    
    def calculate_density_altitude(self, pressure_altitude_ft, temperature_c):
        """
        Calculate density altitude using standard atmospheric formulas
        
        Args:
            pressure_altitude_ft: Pressure altitude in feet
            temperature_c: Outside air temperature in Celsius
            
        Returns:
            Density altitude in feet
        """
        # ISA (International Standard Atmosphere) temperature at pressure altitude
        # Sea level: 15°C, lapse rate: 2°C per 1000 ft
        isa_temp_c = 15 - (2 * pressure_altitude_ft / 1000)
        
        # Density altitude approximation
        # For every degree above ISA, density altitude increases ~120 ft
        density_altitude = pressure_altitude_ft + (120 * (temperature_c - isa_temp_c))
        
        return density_altitude
    
    def get_performance_with_temperature(self, pressure_altitude_ft, weight_lbs, temperature_c) -> Optional[PerformanceData]:
        """
        Get aircraft performance corrected for temperature effects
        
        Args:
            pressure_altitude_ft: Pressure altitude in feet
            weight_lbs: Aircraft gross weight in pounds
            temperature_c: Outside air temperature in Celsius
            
        Returns:
            PerformanceData object with temperature correction info, or None if out of bounds
        """
        # Calculate atmospheric conditions
        density_alt = self.calculate_density_altitude(pressure_altitude_ft, temperature_c)
        isa_temp = 15 - (2 * pressure_altitude_ft / 1000)
        isa_deviation = temperature_c - isa_temp
        
        # Check if density altitude is within data bounds
        if not (min(self.altitudes) <= density_alt <= max(self.altitudes)):
            return None
            
        if not (min(self.weights) <= weight_lbs <= max(self.weights)):
            return None
        
        try:
            # Get performance at density altitude (temperature-corrected)
            ias, roc, fuel = self.get_performance_standard(density_alt, weight_lbs)
            
            # For comparison, get standard performance at pressure altitude
            std_ias, std_roc, std_fuel = self.get_performance_standard(pressure_altitude_ft, weight_lbs)
            performance_factor = roc / std_roc if std_roc > 0 else 0
            
            return PerformanceData(
                ias_mph=ias,
                roc_fpm=roc,
                fuel_gal=fuel,
                pressure_altitude_ft=pressure_altitude_ft,
                density_altitude_ft=round(density_alt, 0),
                temperature_c=temperature_c,
                isa_temp_c=round(isa_temp, 1),
                isa_deviation_c=round(isa_deviation, 1),
                performance_factor=round(performance_factor, 3),
                roc_loss_fpm=round(std_roc - roc, 1)
            )
            
        except ValueError:
            return None
    
    def get_data_bounds(self) -> DataBounds:
        """Get the valid data bounds for calculations"""
        return DataBounds(
            altitude_range_ft=(min(self.altitudes), max(self.altitudes)),
            weight_range_lbs=(min(self.weights), max(self.weights))
        )
    
    def get_climb_segment_performance(self, start_altitude_ft, end_altitude_ft, weight_lbs, start_temperature_c) -> Optional[ClimbSegment]:
        """
        Get climb performance for a specific altitude segment
        
        Args:
            start_altitude_ft: Starting altitude in feet
            end_altitude_ft: Ending altitude in feet  
            weight_lbs: Aircraft gross weight in pounds
            start_temperature_c: Temperature at starting altitude in Celsius
            
        Returns:
            ClimbSegment object with segment performance data, or None if out of bounds
            
        Note:
            Temperature varies with altitude using standard lapse rate (2°C/1000ft)
        """
        if start_altitude_ft >= end_altitude_ft:
            return None
            
        # Calculate temperature at end altitude using standard lapse rate (2°C/1000ft)
        altitude_diff_1000ft = (end_altitude_ft - start_altitude_ft) / 1000
        end_temperature_c = start_temperature_c - (2.0 * altitude_diff_1000ft)
            
        # Get performance at start altitude
        start_perf = self.get_performance_with_temperature(start_altitude_ft, weight_lbs, start_temperature_c)
        if not start_perf:
            return None
            
        # Get performance at end altitude with calculated temperature
        end_perf = self.get_performance_with_temperature(end_altitude_ft, weight_lbs, end_temperature_c)
        if not end_perf:
            return None
        
        # Calculate segment metrics
        altitude_gain = end_altitude_ft - start_altitude_ft
        avg_roc = (start_perf.roc_fpm + end_perf.roc_fpm) / 2
        
        # Fuel calculation: difference between fuel-to-altitude values
        segment_fuel = end_perf.fuel_gal - start_perf.fuel_gal
        
        # Time calculation using average ROC
        if avg_roc > 0:
            climb_time_min = altitude_gain / avg_roc
        else:
            climb_time_min = float('inf')  # Cannot climb with zero or negative ROC
            
        return ClimbSegment(
            start_altitude_ft=start_altitude_ft,
            end_altitude_ft=end_altitude_ft,
            altitude_gain_ft=altitude_gain,
            avg_roc_fpm=round(avg_roc, 1),
            segment_fuel_gal=round(segment_fuel, 2),
            climb_time_min=round(climb_time_min, 1),
            start_ias_mph=start_perf.ias_mph,
            end_ias_mph=end_perf.ias_mph,
            start_density_alt_ft=start_perf.density_altitude_ft,
            end_density_alt_ft=end_perf.density_altitude_ft,
            temperature_c=start_temperature_c  # Store the starting temperature
        )
    

