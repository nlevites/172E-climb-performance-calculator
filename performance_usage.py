#!/usr/bin/env python3
"""
Aircraft climb segment performance calculator
Calculates accurate climb performance between two specific altitudes
"""

from aircraft_performance import AircraftPerformance

def main():
    calc = AircraftPerformance()
    
    # CLIMB SEGMENT: Accurate performance between specific altitudes
    start_altitude_ft = 7500       # Starting altitude (use 0 for sea level)
    end_altitude_ft = 10000     # Target altitude
    weight_lbs = 2300           # Gross weight in pounds
    temperature_c = 0          # Temperature at starting altitude in Celsius
    
    # Other examples to try:
    # start_altitude_ft, end_altitude_ft, weight_lbs, temperature_c = 2000, 8000, 2000, 25    # Airport to cruise
    # start_altitude_ft, end_altitude_ft, weight_lbs, temperature_c = 0, 5000, 1800, 20       # Quick climb, light weight
    
    print(f"Aircraft Climb Segment Calculator")
    print(f"Segment: {start_altitude_ft} ft → {end_altitude_ft} ft")
    print(f"Weight: {weight_lbs} lbs, Temperature: {temperature_c}°C at {start_altitude_ft} ft")
    print(f"(Temperature decreases 2°C per 1000 ft with altitude)")
    print("-" * 55)
    
    # Get segment performance
    segment = calc.get_climb_segment_performance(start_altitude_ft, end_altitude_ft, weight_lbs, temperature_c)
    
    if segment:
        print(f"Altitude Gain: {segment.altitude_gain_ft:,} ft")
        print(f"Average Rate of Climb: {segment.avg_roc_fpm} fpm")
        print(f"Fuel for Segment: {segment.segment_fuel_gal} gal")
        print(f"Climb Time: {segment.climb_time_min} minutes")
        print(f"IAS: {segment.start_ias_mph} → {segment.end_ias_mph} mph")
        print(f"Density Altitude: {segment.start_density_alt_ft:.0f} → {segment.end_density_alt_ft:.0f} ft")
        

            
    else:
        print("ERROR: Cannot calculate segment")
        bounds = calc.get_data_bounds()
        print(f"Valid altitude range: {bounds.altitude_range_ft[0]} - {bounds.altitude_range_ft[1]} ft")
        print(f"Valid weight range: {bounds.weight_range_lbs[0]} - {bounds.weight_range_lbs[1]} lbs")
        
        # Check for density altitude issues (calculate end temperature using lapse rate)
        end_temperature_c = temperature_c - (2.0 * (end_altitude_ft - start_altitude_ft) / 1000)
        start_da = calc.calculate_density_altitude(start_altitude_ft, temperature_c)
        end_da = calc.calculate_density_altitude(end_altitude_ft, end_temperature_c)
        
        if start_da < bounds.altitude_range_ft[0] or end_da < bounds.altitude_range_ft[0]:
            print(f"\nIssue: Cold temperature ({temperature_c}°C) creates negative density altitude")
            print(f"Start density altitude: {start_da:.0f} ft")
            print(f"End density altitude: {end_da:.0f} ft")
            print(f"Try a warmer temperature (≥10°C) or higher starting altitude")
        elif start_da > bounds.altitude_range_ft[1] or end_da > bounds.altitude_range_ft[1]:
            print(f"\nIssue: Hot temperature ({temperature_c}°C) creates density altitude above data range")  
            print(f"Start density altitude: {start_da:.0f} ft")
            print(f"End density altitude: {end_da:.0f} ft")
            print(f"Try a cooler temperature or break into segments")
        elif not (bounds.weight_range_lbs[0] <= weight_lbs <= bounds.weight_range_lbs[1]):
            print(f"\nIssue: Weight {weight_lbs} lbs is outside valid range")
        else:
            print(f"\nUnable to determine specific issue - check all parameters")

if __name__ == "__main__":
    main()
