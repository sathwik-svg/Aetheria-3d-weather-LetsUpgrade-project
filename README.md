# Aetheria 3D Weather

> **An immersive meteorological platform featuring procedural low-poly 3D floating weather islands, real-time OpenWeatherMap data, astronomical tracking, and deep atmospheric telemetry.**

---

## Overview

**Aetheria 3D Weather** reimagines weather forecasting as an interactive, tactile 3D experience. Instead of static tables and flat badges, weather conditions are visualized through procedural low-poly floating islands rendered in **Three.js** with physical PBR lighting, soft contact shadows, and real-time atmospheric particle systems.

Whether checking today's UV index, scrubbing through the 24-hour solar trajectory arc, inspecting 7-day forecast islands, or monitoring simulated Doppler radar sweeps, Aetheria provides accurate meteorological insights framed by high-craft procedural art.

---

## Key Features

### 1. Stylized 3D Floating Weather Islands (Three.js WebGL)
- **Composite Procedural Subjects (`THREE.Group`)**: Each floating island is built from 3–12 coordinated procedural parts:
  - Faceted rock monolith base with geological strata lines.
  - Stepped grassy and snowy plateaus with bevel contours.
  - Multi-tier low-poly pine groves and rock boulder outcroppings.
  - Mountain spring basin that freezes into reflective ice under sub-zero temperatures.
  - Alpine cabin with gabled roof, stone chimney, and warm emissive interior window lighting.
  - Volumetric cloud formations composed of orbiting procedural dodecahedron clusters.
  - Direct contact shadow disc grounding the island in space.
- **Dynamic Particle Systems**:
  - **Rain & Drizzle**: Instanced mesh of falling liquid streaks angled with simulated wind shear.
  - **Snow**: Drifting, oscillating hexagonal crystals with soft Brownian tumble.
  - **Thunderstorms**: Intermittent high-intensity point-light lightning flashes and dark atmospheric cloud density.
- **Physical Studio Lighting**:
  - `ACESFilmicToneMapping` with `RoomEnvironment` PMREM reflections.
  - Dynamic directional key light (Sun/Moon) with soft orthographic PCF shadows.
  - Warm/cool `HemisphereLight` atmospheric fill and horizon-matched exponential fog (`FogExp2`).
  - Damped orbit controls with exponential easing and camera glide animations.

### 2. 7-Day Forecast & Island Morphing
- Inspect min/max temperatures, precipitation likelihood, UV ratings, and wind speeds for the upcoming week.
- **Island Switcher**: Clicking any day card smoothly transforms the 3D diorama to reflect that day's expected atmospheric condition (e.g. Wednesday rainstorm vs. Friday clear alpine sunshine).

### 3. 24-Hour Timeline & Solar Scrubber
- Interactive hour slider (00:00 – 23:00) that recalculates the 3D Sun and Moon orbit angle in real time.
- Smooth ambient color-temperature transitions from golden dawn (`#f59e0b`) to midday azure (`#0284c7`), twilight dusk (`#4338ca`), and starry midnight (`#030712`).

### 4. Astronomical Solar & Lunar Tracker
- **Solar Path Arc**: Visual SVG trajectory displaying real-time solar elevation, current altitude percentage, and daylight countdown.
- **Sunrise & Sunset**: Accurate dawn and dusk times calculated from geographic coordinates.
- **Lunar Phase Cycle**: Synodic moon phase visualizer with illuminated lunar crescent geometry, cycle fraction, and phase identification (Waxing Crescent, Full Moon, etc.).

### 5. Deep Atmospheric Telemetry Gauges
- **UV Index Dial**: Color-coded categorization from Low to Extreme with sunburn prevention guidance.
- **Air Quality Index (AQI)**: Particulate tracking (PM2.5 / PM10) with health advice.
- **360° Wind Compass**: Interactive rotating vector needle displaying bearing degrees, velocity (km/h), and gust peaks.
- **Barometric Pressure & Visibility**: Atmospheric hectopascal (hPa) readings, visibility in kilometers, cloud density, and Magnus dew point.

### 6. Simulated Doppler Precipitation Radar
- Canvas-based rotating Doppler radar sweep projecting rain band reflectivity and cloud moisture saturation within a 50 km radius.
- Play/pause radar animation controls, dBZ reflectivity legend, and azimuth heading.

### 7. Meteorological Advisories & Wardrobe Guidance
- Instant weather alert ribbon (Thunderstorm warnings, Gale advisories, Extreme UV notices, or Calm Clear status).
- Contextual clothing suggestions computed dynamically from ambient temperature, rain probability, wind chill, and solar radiation.

### 8. Resilient Dual Data Pipeline & Offline Fallback
- **OpenWeatherMap Integration**: Dedicated settings drawer to connect a personal OpenWeatherMap API key with instant connection ping testing.
- **Open-Meteo Live API**: High-precision worldwide global weather and air quality model without mandatory setup.
- **Offline Cache & Climate Model**: Seamless fallback with `localStorage` caching and a latitude/season-calibrated meteorological engine to guarantee uninterrupted operation during 503 upstream outages.

---

## Keyboard Shortcuts & Ergonomics

| Key | Action |
| :--- | :--- |
| <kbd>H</kbd> | Toggle Bottom Control Dock (Expand / Collapse) |
| <kbd>Z</kbd> | Toggle Zen Mode (Full-screen 3D immersion) |
| **Drag (L-Click)** | Orbit camera around the floating island in 3D |
| **Scroll / Pinch** | Zoom camera in and out |

---

## Tech Stack

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **3D Graphics**: [Three.js (r182+)](https://threejs.org/) (PBR, WebGL2, InstancedMesh, PMREMGenerator)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: Plus Jakarta Sans, Outfit, JetBrains Mono

---

## Project Structure

```
├── index.html                   # HTML entry point with fonts & meta tags
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite & Tailwind CSS plugins
├── src/
│   ├── main.tsx                 # Application mount
│   ├── App.tsx                  # Root state orchestration & layout
│   ├── index.css                # Global Tailwind v4 styling & dark theme
│   ├── types/
│   │   └── weather.ts           # Meteorological and location data models
│   ├── services/
│   │   └── weatherService.ts    # Dual OWM/Open-Meteo API, caching, fallback
│   ├── three/
│   │   └── weatherIslandScene.ts# Three.js procedural island engine & PBR rig
│   └── components/
│       ├── ThreeWeatherScene.tsx    # Stable React WebGL mount & controls
│       ├── TopNav.tsx               # 3-zone Top Bar Contract & city search
│       ├── HeroWeatherCard.tsx      # Current conditions & temperature card
│       ├── ControlDock.tsx          # Collapsible bottom analytics deck
│       ├── ForecastCarousel.tsx     # 7-day forecast & 3D island switcher
│       ├── HourlyTimeline.tsx       # 24-hour timeline & solar scrubber
│       ├── AstronomicalWidget.tsx   # Solar arc & lunar phase visualizer
│       ├── AtmosphericGauges.tsx    # UV, AQI, wind compass & barometrics
│       ├── PrecipitationRadar.tsx   # Canvas Doppler radar simulation
│       ├── WeatherAdvisory.tsx      # Alerts & clothing recommendation
│       └── ApiKeyModal.tsx          # OpenWeatherMap credential settings
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd <your-repo-folder>

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
Open `http://localhost:3000` in your browser.

### Building for Production
```bash
npm run build
```

---

## OpenWeatherMap Configuration (Optional)

1. Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/api).
2. Launch the app and click the **API Key** button in the top navigation bar.
3. Paste your key and click **Test Key** to verify connection, then **Save Credentials**.
4. The key is securely stored in your browser's `localStorage`.

*Note: If no key is entered, Aetheria operates seamlessly using the built-in live meteorological feed.*

---

## License

Apache-2.0 License.
