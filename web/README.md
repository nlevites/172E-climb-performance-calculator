# Cessna 172E Performance Calculator

A modern web application for calculating Cessna 172E climb performance with temperature correction and density altitude calculations.

## Features

- **Accurate Performance Calculations**: Based on interpolated performance data covering altitudes from sea level to 15,000 ft and weights from 1,700 to 2,300 lbs
- **Temperature Correction**: Accounts for density altitude effects using ISA deviation calculations
- **Climb Segment Analysis**: Calculate performance between any two altitudes with automatic temperature lapse rate
- **Interactive Visualizations**: Real-time performance curves showing rate of climb and airspeed variations
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Professional UI**: Clean, modern interface optimized for aviation professionals

## Technology Stack

- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** for modern, responsive styling
- **Recharts** for interactive performance visualizations
- **Vite** for fast development and optimized builds
- **GitHub Pages** for deployment

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flightplanner.git
cd flightplanner/web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

1. **Enter Flight Parameters**:
   - Start altitude (0 - 15,000 ft)
   - Target altitude (must be higher than start)
   - Aircraft gross weight (1,700 - 2,300 lbs)
   - Temperature at start altitude (-40°C to 50°C)

2. **Calculate Performance**:
   - Click "Calculate Performance" to get detailed results
   - View climb time, fuel consumption, and rate of climb
   - See temperature effects and density altitude calculations

3. **Analyze Results**:
   - Review detailed performance at start and end altitudes
   - Compare current conditions to ISA standard
   - View interactive performance curves

## Performance Data

The calculator uses authentic Cessna 172E performance data with:

- **Altitudes**: 0, 5,000, 10,000, 15,000 ft (interpolated between)
- **Weights**: 1,700, 2,000, 2,300 lbs (interpolated between)
- **Metrics**: Indicated airspeed (mph), rate of climb (fpm), fuel to altitude (gal)

Temperature corrections use standard density altitude formulas:
- ISA conditions: 15°C at sea level, -2°C per 1000 ft
- Density altitude effect: ~120 ft per °C deviation from ISA

## Deployment

The application is automatically deployed to GitHub Pages using GitHub Actions when changes are pushed to the main branch.

To deploy manually:
```bash
npm run build
npm run deploy
```

## Limitations

- Performance data valid for normal category operations only
- For training and planning purposes - always consult official documentation
- Assumes standard atmospheric lapse rates
- Does not account for wind, turbulence, or non-standard atmospheric conditions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is for educational and training purposes. Performance data should not be used for actual flight planning without verification against official aircraft documentation.

## Acknowledgments

- Based on Cessna 172E Pilot's Operating Handbook performance data
- Inspired by the need for accessible aviation performance calculations
- Built with modern web technologies for optimal user experience
