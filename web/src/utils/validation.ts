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
  temperature: number
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

  // Temperature validation
  if (temperature < -40 || temperature > 50) {
    errors.push({
      field: 'temperature',
      message: 'Temperature must be between -40°C and 50°C'
    });
  }

  // Check for extreme density altitude conditions
  if (temperature > 35 && startAltitude > 5000) {
    errors.push({
      field: 'temperature',
      message: 'High temperature at altitude may result in density altitude outside data range'
    });
  }

  if (temperature < -20 && startAltitude < 2000) {
    errors.push({
      field: 'temperature',
      message: 'Very cold temperature may result in negative density altitude'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map(error => error.message).join('; ');
};
