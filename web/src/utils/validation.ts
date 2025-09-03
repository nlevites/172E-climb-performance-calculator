export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateFlightParameters = (
  startAltitude: number,
  endAltitude: number,
  weight: number,
  startTemperature: number,
  endTemperature: number,
  useStandardLapseRate: boolean = false,
  temperatureUnit: 'C' | 'F' = 'C'
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Altitude validation
  if (startAltitude < 0 || startAltitude > 15000) {
    errors.push({
      field: 'startAltitude',
      message: 'Start altitude must be between 0 and 15,000 ft'
    });
  }

  if (endAltitude < 0 || endAltitude > 15000) {
    errors.push({
      field: 'endAltitude',
      message: 'End altitude must be between 0 and 15,000 ft'
    });
  }

  if (startAltitude >= endAltitude) {
    errors.push({
      field: 'endAltitude',
      message: 'End altitude must be higher than start altitude'
    });
  }

  // Weight validation
  if (weight < 1700 || weight > 2300) {
    errors.push({
      field: 'weight',
      message: 'Weight must be between 1,700 and 2,300 lbs'
    });
  }

  // Start Temperature validation (temperatures are stored in Celsius internally)
  const tempRangeMessage = temperatureUnit === 'F' ? '-40°F and 122°F' : '-40°C and 50°C';
  if (startTemperature < -40 || startTemperature > 50) {
    errors.push({
      field: 'startTemperature',
      message: `Start temperature must be between ${tempRangeMessage}`
    });
  }

  // Only validate end temperature if not using standard lapse rate
  if (!useStandardLapseRate) {
    // End Temperature validation
    if (endTemperature < -40 || endTemperature > 50) {
      errors.push({
        field: 'endTemperature',
        message: `End temperature must be between ${tempRangeMessage}`
      });
    }
  }

  // Check for extreme density altitude conditions at start
  if (startTemperature > 35 && startAltitude > 5000) {
    errors.push({
      field: 'startTemperature',
      message: 'High temperature at altitude may result in density altitude outside data range'
    });
  }

  if (startTemperature < -20 && startAltitude < 2000) {
    errors.push({
      field: 'startTemperature',
      message: 'Very cold temperature may result in negative density altitude'
    });
  }

  // Only validate extreme conditions for end temperature if not using standard lapse rate
  if (!useStandardLapseRate) {
    // Check for extreme density altitude conditions at end
    if (endTemperature > 35 && endAltitude > 5000) {
      errors.push({
        field: 'endTemperature',
        message: 'High temperature at altitude may result in density altitude outside data range'
      });
    }

    if (endTemperature < -20 && endAltitude < 2000) {
      errors.push({
        field: 'endTemperature',
        message: 'Very cold temperature may result in negative density altitude'
      });
    }

    // Check for extreme temperature inversions
    const altitudeDiff = endAltitude - startAltitude;
    if (altitudeDiff > 0) {
      const tempDiff = endTemperature - startTemperature;
      if (tempDiff > 15) {
        errors.push({
          field: 'endTemperature',
          message: 'Extreme temperature inversion (>15°C warmer aloft) may be unrealistic'
        });
      }
      
      const lapseRate = -tempDiff / (altitudeDiff / 1000);
      if (lapseRate > 15) {
        errors.push({
          field: 'endTemperature',
          message: 'Extreme cooling rate (>15°C/1000ft) may be unrealistic'
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map(error => error.message).join('; ');
};
