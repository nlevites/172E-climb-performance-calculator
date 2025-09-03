#!/usr/bin/env python3
"""
Unit tests for aircraft_performance module

Tests the interpolation functions against hardcoded performance data
to ensure accuracy and prevent regression.
"""

import unittest
from aircraft_performance import (
    AircraftPerformance, 
    PerformanceData, 
    ClimbSegment, 
    DataBounds,
    IAS_DATA,
    ROC_DATA, 
    FUEL_DATA,
    ALTITUDES,
    WEIGHTS
)


class TestAircraftPerformance(unittest.TestCase):
    """Test suite for AircraftPerformance class"""
    
    def setUp(self):
        """Set up test fixture"""
        self.calc = AircraftPerformance()
    
    def test_exact_grid_points_standard_conditions(self):
        """Test that interpolation at exact grid points returns exact hardcoded values"""
        print("\n=== Testing Exact Grid Points (Standard Conditions) ===")
        
        for altitude in ALTITUDES:
            for weight in WEIGHTS:
                with self.subTest(altitude=altitude, weight=weight):
                    # Get standard performance (no temperature correction)
                    ias, roc, fuel = self.calc.get_performance_standard(altitude, weight)
                    
                    # Expected values from hardcoded data
                    expected_ias = IAS_DATA[(altitude, weight)]
                    expected_roc = ROC_DATA[(altitude, weight)]
                    expected_fuel = FUEL_DATA[(altitude, weight)]
                    
                    # Assert exact matches (allowing small floating point errors)
                    self.assertAlmostEqual(ias, expected_ias, places=1,
                        msg=f"IAS mismatch at {altitude}ft, {weight}lbs: got {ias}, expected {expected_ias}")
                    self.assertAlmostEqual(roc, expected_roc, places=1,
                        msg=f"ROC mismatch at {altitude}ft, {weight}lbs: got {roc}, expected {expected_roc}")
                    self.assertAlmostEqual(fuel, expected_fuel, places=2,
                        msg=f"Fuel mismatch at {altitude}ft, {weight}lbs: got {fuel}, expected {expected_fuel}")
                    
                    print(f"✓ {altitude:5d}ft, {weight}lbs: IAS={ias}, ROC={roc}, Fuel={fuel}")
    
    def test_interpolation_between_grid_points(self):
        """Test bilinear interpolation between known grid points"""
        print("\n=== Testing Interpolation Between Grid Points ===")
        
        # Test cases: (altitude, weight, expected_approximate_values)
        test_cases = [
            # Midpoint between four corners at sea level/5000ft and 1700/2000 lbs
            (2500, 1850, {"ias_range": (73, 77), "roc_range": (800, 1000), "fuel_range": (1.0, 2.0)}),
            
            # Midpoint altitude, exact weight
            (7500, 2000, {"ias_range": (74, 76), "roc_range": (380, 610), "fuel_range": (2.2, 3.6)}),
            
            # Exact altitude, midpoint weight  
            (10000, 2150, {"ias_range": (74, 77), "roc_range": (230, 380), "fuel_range": (3.6, 4.8)}),
        ]
        
        for altitude, weight, expected_ranges in test_cases:
            with self.subTest(altitude=altitude, weight=weight):
                ias, roc, fuel = self.calc.get_performance_standard(altitude, weight)
                
                # Check that interpolated values are within expected ranges
                ias_range = expected_ranges["ias_range"]
                roc_range = expected_ranges["roc_range"] 
                fuel_range = expected_ranges["fuel_range"]
                
                self.assertGreaterEqual(ias, ias_range[0], f"IAS {ias} below expected range {ias_range}")
                self.assertLessEqual(ias, ias_range[1], f"IAS {ias} above expected range {ias_range}")
                
                self.assertGreaterEqual(roc, roc_range[0], f"ROC {roc} below expected range {roc_range}")
                self.assertLessEqual(roc, roc_range[1], f"ROC {roc} above expected range {roc_range}")
                
                self.assertGreaterEqual(fuel, fuel_range[0], f"Fuel {fuel} below expected range {fuel_range}")
                self.assertLessEqual(fuel, fuel_range[1], f"Fuel {fuel} above expected range {fuel_range}")
                
                print(f"✓ {altitude}ft, {weight}lbs: IAS={ias}, ROC={roc}, Fuel={fuel}")
    
    def test_temperature_correction_isa_conditions(self):
        """Test temperature correction at ISA standard conditions"""
        print("\n=== Testing Temperature Correction (ISA) ===")
        
        # At ISA conditions, density altitude should equal pressure altitude
        test_cases = [
            (0, 15),      # Sea level ISA: 15°C
            (5000, 5),    # 5000ft ISA: 5°C  
            (10000, -5),  # 10000ft ISA: -5°C
            (15000, -15), # 15000ft ISA: -15°C
        ]
        
        for altitude, isa_temp in test_cases:
            with self.subTest(altitude=altitude, temperature=isa_temp):
                perf = self.calc.get_performance_with_temperature(altitude, 2000, isa_temp)
                self.assertIsNotNone(perf, f"Failed to get performance at {altitude}ft, {isa_temp}°C")
                
                # At ISA conditions, density altitude should equal pressure altitude
                self.assertAlmostEqual(perf.density_altitude_ft, altitude, places=0,
                    msg=f"Density altitude should equal pressure altitude at ISA conditions")
                self.assertAlmostEqual(perf.isa_deviation_c, 0, places=1,
                    msg=f"ISA deviation should be zero at ISA conditions")
                self.assertAlmostEqual(perf.performance_factor, 1.0, places=2,
                    msg=f"Performance factor should be 1.0 at ISA conditions")
                
                print(f"✓ {altitude}ft, {isa_temp}°C: DA={perf.density_altitude_ft}ft, deviation={perf.isa_deviation_c}°C")
    
    def test_temperature_effects_hot_cold(self):
        """Test temperature effects on performance"""
        print("\n=== Testing Temperature Effects ===")
        
        altitude = 5000
        weight = 2000
        
        # Test hot day (ISA +20°C)
        hot_temp = 25  # ISA at 5000ft is 5°C, so this is +20°C
        hot_perf = self.calc.get_performance_with_temperature(altitude, weight, hot_temp)
        
        # Test cold day (ISA -10°C)
        cold_temp = -5  # ISA at 5000ft is 5°C, so this is -10°C  
        cold_perf = self.calc.get_performance_with_temperature(altitude, weight, cold_temp)
        
        self.assertIsNotNone(hot_perf, "Failed to get hot day performance")
        self.assertIsNotNone(cold_perf, "Failed to get cold day performance")
        
        # Hot day should have worse performance (lower ROC)
        self.assertLess(hot_perf.roc_fpm, cold_perf.roc_fpm,
            "Hot day should have lower rate of climb than cold day")
        
        # Hot day should have higher density altitude
        self.assertGreater(hot_perf.density_altitude_ft, cold_perf.density_altitude_ft,
            "Hot day should have higher density altitude than cold day")
        
        # Performance factors should reflect temperature impact
        self.assertLess(hot_perf.performance_factor, 1.0, "Hot day should reduce performance")
        self.assertGreater(cold_perf.performance_factor, 1.0, "Cold day should improve performance")
        
        print(f"✓ Hot day ({hot_temp}°C): ROC={hot_perf.roc_fpm}fpm, DA={hot_perf.density_altitude_ft}ft")
        print(f"✓ Cold day ({cold_temp}°C): ROC={cold_perf.roc_fpm}fpm, DA={cold_perf.density_altitude_ft}ft")
    
    def test_climb_segment_with_lapse_rate(self):
        """Test climb segment calculation with proper temperature lapse rate"""
        print("\n=== Testing Climb Segment with Lapse Rate ===")
        
        # Test sea level to 10000ft climb
        segment = self.calc.get_climb_segment_performance(0, 10000, 2000, 15)
        self.assertIsNotNone(segment, "Failed to calculate climb segment")
        
        # Verify segment properties
        self.assertEqual(segment.altitude_gain_ft, 10000)
        self.assertEqual(segment.start_altitude_ft, 0)
        self.assertEqual(segment.end_altitude_ft, 10000)
        self.assertGreater(segment.avg_roc_fpm, 0, "Average ROC should be positive")
        self.assertGreater(segment.segment_fuel_gal, 0, "Segment fuel should be positive")
        self.assertGreater(segment.climb_time_min, 0, "Climb time should be positive")
        
        # Start IAS should be higher than end IAS (performance degrades with altitude)
        self.assertGreater(segment.start_ias_mph, segment.end_ias_mph,
            "IAS should decrease with altitude")
        
        print(f"✓ Segment 0→10000ft: ROC={segment.avg_roc_fpm}fpm, Time={segment.climb_time_min}min, Fuel={segment.segment_fuel_gal}gal")
        
        # Test that segment fuel matches the difference between start and end fuel
        start_perf = self.calc.get_performance_with_temperature(0, 2000, 15)
        end_perf = self.calc.get_performance_with_temperature(10000, 2000, -5)  # 15°C - 20°C = -5°C at 10000ft
        
        expected_segment_fuel = end_perf.fuel_gal - start_perf.fuel_gal
        self.assertAlmostEqual(segment.segment_fuel_gal, expected_segment_fuel, places=1,
            msg=f"Segment fuel should equal difference: got {segment.segment_fuel_gal}, expected {expected_segment_fuel}")
    
    def test_density_altitude_calculation(self):
        """Test density altitude calculations"""
        print("\n=== Testing Density Altitude Calculation ===")
        
        test_cases = [
            # (pressure_alt, temp, expected_approx_density_alt)
            (0, 15, 0),        # ISA at sea level
            (0, 25, 1200),     # Hot day at sea level (ISA +10°C)
            (0, 5, -1200),     # Cold day at sea level (ISA -10°C)  
            (5000, 5, 5000),   # ISA at 5000ft
            (5000, 25, 7400),  # Hot day at 5000ft (ISA +20°C)
        ]
        
        for pressure_alt, temp, expected_da in test_cases:
            with self.subTest(pressure_alt=pressure_alt, temp=temp):
                da = self.calc.calculate_density_altitude(pressure_alt, temp)
                
                # Allow 10% tolerance for approximation formula
                tolerance = abs(expected_da * 0.1) if expected_da != 0 else 200
                self.assertAlmostEqual(da, expected_da, delta=tolerance,
                    msg=f"Density altitude mismatch: got {da}, expected ~{expected_da}")
                
                print(f"✓ {pressure_alt}ft, {temp}°C → DA={da:.0f}ft (expected ~{expected_da})")
    
    def test_boundary_conditions(self):
        """Test boundary conditions and error handling"""
        print("\n=== Testing Boundary Conditions ===")
        
        # Test at exact data boundaries - should work
        boundary_cases = [
            (0, 1700), (0, 2300),           # Min/max weight at min altitude
            (15000, 1700), (15000, 2300),   # Min/max weight at max altitude
        ]
        
        for alt, weight in boundary_cases:
            with self.subTest(altitude=alt, weight=weight):
                ias, roc, fuel = self.calc.get_performance_standard(alt, weight)
                self.assertGreater(ias, 0, "IAS should be positive")
                self.assertGreater(roc, 0, "ROC should be positive")
                self.assertGreater(fuel, 0, "Fuel should be positive")
                print(f"✓ Boundary case {alt}ft, {weight}lbs: IAS={ias}, ROC={roc}, Fuel={fuel}")
        
        # Test outside data bounds - should return None
        out_of_bounds_cases = [
            (-1000, 2000),  # Below altitude range
            (20000, 2000),  # Above altitude range  
            (5000, 1500),   # Below weight range
            (5000, 2500),   # Above weight range
        ]
        
        for alt, weight in out_of_bounds_cases:
            with self.subTest(altitude=alt, weight=weight):
                try:
                    ias, roc, fuel = self.calc.get_performance_standard(alt, weight)
                    self.fail(f"Expected ValueError for out-of-bounds case {alt}ft, {weight}lbs")
                except ValueError:
                    print(f"✓ Correctly rejected out-of-bounds case {alt}ft, {weight}lbs")
    
    def test_data_bounds_object(self):
        """Test DataBounds object"""
        print("\n=== Testing Data Bounds ===")
        
        bounds = self.calc.get_data_bounds()
        self.assertIsInstance(bounds, DataBounds)
        self.assertEqual(bounds.altitude_range_ft, (0, 15000))
        self.assertEqual(bounds.weight_range_lbs, (1700, 2300))
        print(f"✓ Data bounds: Alt={bounds.altitude_range_ft}, Weight={bounds.weight_range_lbs}")
    
    def test_performance_data_object(self):
        """Test PerformanceData object structure"""
        print("\n=== Testing PerformanceData Object ===")
        
        perf = self.calc.get_performance_with_temperature(5000, 2000, 20)
        self.assertIsInstance(perf, PerformanceData)
        
        # Check all required attributes exist and have reasonable values
        self.assertGreater(perf.ias_mph, 0)
        self.assertGreater(perf.roc_fpm, 0)
        self.assertGreater(perf.fuel_gal, 0)
        self.assertEqual(perf.pressure_altitude_ft, 5000)
        self.assertIsInstance(perf.density_altitude_ft, float)
        self.assertEqual(perf.temperature_c, 20)
        self.assertIsInstance(perf.isa_temp_c, float)
        self.assertIsInstance(perf.isa_deviation_c, float)
        self.assertIsInstance(perf.performance_factor, float)
        
        print(f"✓ PerformanceData object: IAS={perf.ias_mph}, ROC={perf.roc_fpm}, Fuel={perf.fuel_gal}")
        
    def test_climb_segment_object(self):
        """Test ClimbSegment object structure"""
        print("\n=== Testing ClimbSegment Object ===")
        
        segment = self.calc.get_climb_segment_performance(2000, 8000, 2100, 18)
        self.assertIsInstance(segment, ClimbSegment)
        
        # Check all required attributes
        self.assertEqual(segment.start_altitude_ft, 2000)
        self.assertEqual(segment.end_altitude_ft, 8000)
        self.assertEqual(segment.altitude_gain_ft, 6000)
        self.assertGreater(segment.avg_roc_fpm, 0)
        self.assertGreater(segment.segment_fuel_gal, 0)
        self.assertGreater(segment.climb_time_min, 0)
        self.assertGreater(segment.start_ias_mph, 0)
        self.assertGreater(segment.end_ias_mph, 0)
        
        print(f"✓ ClimbSegment object: {segment.start_altitude_ft}→{segment.end_altitude_ft}ft, ROC={segment.avg_roc_fpm}fpm")


class TestDataIntegrity(unittest.TestCase):
    """Test the integrity of hardcoded data"""
    
    def test_data_completeness(self):
        """Test that all data tables have complete coverage"""
        print("\n=== Testing Data Completeness ===")
        
        for altitude in ALTITUDES:
            for weight in WEIGHTS:
                with self.subTest(altitude=altitude, weight=weight):
                    key = (altitude, weight)
                    self.assertIn(key, IAS_DATA, f"Missing IAS data for {key}")
                    self.assertIn(key, ROC_DATA, f"Missing ROC data for {key}")
                    self.assertIn(key, FUEL_DATA, f"Missing Fuel data for {key}")
        
        print(f"✓ Complete data coverage: {len(ALTITUDES)} altitudes × {len(WEIGHTS)} weights = {len(ALTITUDES) * len(WEIGHTS)} data points")
    
    def test_data_consistency(self):
        """Test that data values are reasonable and consistent"""
        print("\n=== Testing Data Consistency ===")
        
        # IAS should generally decrease with altitude (for same weight)
        for weight in WEIGHTS:
            prev_ias = float('inf')
            for altitude in ALTITUDES:
                ias = IAS_DATA[(altitude, weight)]
                self.assertLessEqual(ias, prev_ias + 2, f"IAS should generally decrease with altitude (weight {weight})")
                prev_ias = ias
        
        # ROC should decrease with altitude (for same weight)
        for weight in WEIGHTS:
            prev_roc = float('inf')
            for altitude in ALTITUDES:
                roc = ROC_DATA[(altitude, weight)]
                self.assertLess(roc, prev_roc, f"ROC should decrease with altitude (weight {weight})")
                prev_roc = roc
        
        # Fuel should increase with altitude (for same weight)
        for weight in WEIGHTS:
            prev_fuel = 0
            for altitude in ALTITUDES:
                fuel = FUEL_DATA[(altitude, weight)]
                self.assertGreaterEqual(fuel, prev_fuel, f"Fuel should increase with altitude (weight {weight})")
                prev_fuel = fuel
        
        print("✓ Data consistency checks passed")


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2, buffer=True)

