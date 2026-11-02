# Aetheria 3D Weather

<div align="center">

[![Live Demo](https://img.shields.io/badge/Demo-Live%20App-0ea5e9?style=for-the-badge&logo=google-cloud&logoColor=white)](https://ais-dev-bghmfx7yjq4uvkfxjoakep-981864576343.asia-east1.run.app)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite 8](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>An immersive meteorological platform featuring procedural low-poly 3D floating weather islands, real-time OpenWeatherMap API connectivity, astronomical solar/lunar mechanics, and deep atmospheric telemetry.</strong>
</p>

[**🚀 Explore Live Interactive Application »**](https://ais-dev-bghmfx7yjq4uvkfxjoakep-981864576343.asia-east1.run.app)

</div>

---

## 🌐 Live Web Application

The application is deployed live and immediately accessible at:
- **Live Interactive App**: [https://ais-dev-bghmfx7yjq4uvkfxjoakep-981864576343.asia-east1.run.app](https://ais-dev-bghmfx7yjq4uvkfxjoakep-981864576343.asia-east1.run.app)
- **Shared App Domain**: [https://ais-pre-bghmfx7yjq4uvkfxjoakep-981864576343.asia-east1.run.app](https://ais-pre-bghmfx7yjq4uvkfxjoakep-981864576343.asia-east1.run.app) *(Active once shared/published in AI Studio)*

---

## 📖 Executive Summary

**Aetheria 3D Weather** bridges advanced meteorological telemetry with real-time procedural 3D computer graphics. Rather than confining weather data to static tabular spreadsheets and flat icons, Aetheria translates atmospheric states into dynamic **procedural 3D floating weather islands** built in **Three.js**.

Every meteorological transition—from golden dawn sunshine and crisp snow blizzards to torrential rain showers and nighttime thunderstorms with real-time lightning pulses—is dynamically simulated in WebGL with zero external 3D asset dependencies.

---

## 🚀 Key Architectural Highlights

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TOP BAR & LOCATION BAR                          │
│   [ Aetheria 3D Wordmark ]  ·  [ Worldwide Geocoding Search ]  ·  [ °C/°F ] │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Selected Location & Active Day/Hour
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│               CENTRAL 3D VIEWPORT (Three.js WebGL Engine)              │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  Studio PBR Lighting Rig (ACES Filmic, PMREM RoomEnvironment)  │   │
│   │                                                                │   │
│   │   ☁️ Volumetric Procedural Cloud Formations (Dodecahedrons)     │   │
│   │                                                                │   │
│   │   🏔️ Composite 3–12 Part Procedural Floating Weather Island:    │   │
│   │       ├── Faceted inverted rock monolith with strata lines     │   │
│   │       ├── Stepped terrain plateau with bevel contours          │   │
│   │       ├── Low-poly pine grove (3-tier cone foliage + trunk)    │   │
│   │       ├── Mountain spring basin / frozen reflective ice pool   │   │
│   │       ├── Cozy alpine cabin with warm emissive window light    │   │
│   │       └── Soft radial contact shadow grounding plane           │   │
│   │                                                                │   │
│   │   🌧️ Dynamic Instanced Particle Emitters (Rain / Snow / Fog)   │   │
│   │   ⚡ Thunderstorm Lightning Light Pulse Controller             │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   [ Quick Hero Overlay: Live Temp, Condition, High/Low, Local Time ]  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ User Selection
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│              COLLAPSIBLE BOTTOM DOCK & ANALYTICS DECK                  │
│  [ ▾ Collapse / Expand Zen Mode (Shortcut: 'H') ]                      │
│                                                                        │
│  ├── Tab 1: 7-Day Forecast Carousel (Click to morph 3D island)         │
│  ├── Tab 2: 24h Solar Scrubber & Astronomical Arc (Sun/Moon trajectory)│
│  ├── Tab 3: Deep Atmospheric Telemetry (UV, AQI, 360° Wind, Barometer) │
│  └── Tab 4: Simulated Doppler Radar Sweep & Contextual Gear Advisory   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Core Features Breakdown

### 1. Stylized Procedural 3D Weather Islands (Three.js WebGL)
- **Zero 404 / Purely Procedural Craft**: No unhosted `.gltf` or external image textures. All terrain facets, crags, pine branches, cloud clumps, and water basins are generated through mathematical Three.js geometry.
- **Physical PBR Lighting Pipeline**:
  - `ACESFilmicToneMapping` with exposure balancing.
  - Zero-dependency procedural studio environment reflections via `RoomEnvironment` and `PMREMGenerator`.
  - Orthographic shadow maps (`PCFSoftShadowMap`) paired with soft radial contact shadows.
  - Dynamic `FogExp2` matching the sky hemisphere for seamless distance falloff.
- **Instanced Particle Simulation**:
  - **Rain & Showers**: 350-instance cylinder streaks with simulated wind inclination.
  - **Snow Flurries**: 280-instance drifting dodecahedron crystals with organic Brownian tumble and horizontal wind drift.
  - **Thunderstorms**: Random timed discharge pulses triggering point-light illumination surges across the terrain.
- **Software WebGL Protection**: Detects unaccelerated software renderers (SwiftShader, llvmpipe) via GPU string inspection, pacing render loops and capping pixel ratios to maintain 60fps responsiveness.

### 2. 7-Day Forecast & Interactive Island Morphing
- Displays high/low temperature forecasts, precipitation probability bars, UV maximums, and wind velocity.
- **Interactive Island Switching**: Selecting any forecast card immediately transitions the central 3D diorama to that day's expected condition (e.g. morphing from a clear alpine meadow into a snowy frozen summit).

### 3. 24-Hour Timeline & Solar Scrubber
- Drag the 24-hour scrubber to see hourly conditions and temperatures.
- **Real-Time Celestial Orbit**: Scrubbing dynamically recalculates and animates the 3D Sun and Moon position in the sky dome, shifting the ambient environment from golden dawn (`#f59e0b`) to midday azure (`#0284c7`), dusk twilight (`#4338ca`), and midnight navy (`#030712`).

### 4. Astronomical Solar & Lunar Tracker
- **Solar Path Arc**: Visual SVG trajectory curve plotting real-time solar elevation, current altitude percentage, total daylight hours, and remaining daylight countdown.
- **Exact Sunrise & Sunset**: Computed precisely from geographic coordinates.
- **Synodic Lunar Phase Engine**: Calculates lunar cycle fraction, moon illumination percentage, and renders illuminated moon crescent geometry (New Moon, Waxing Crescent, Full Moon, etc.).

### 5. Deep Environmental Telemetry Deck
- **UV Index Dial**: Color-coded categorization (Low, Moderate, High, Very High, Extreme) with sun safety guidelines.
- **Air Quality Index (AQI)**: Particulate monitoring (PM2.5 / PM10) with health advisories.
- **360° Wind Compass**: Interactive compass rose with rotating vector needle, velocity (km/h), and peak gust monitoring.
- **Atmospheric Barometer & Moisture**: Surface pressure (hPa), visibility (km), cloud density, and calculated Magnus dew point.

### 6. Simulated Doppler Precipitation Radar
- High-performance canvas-based radial sweep simulating radar reflectivity echoes (dBZ) within a 50 km radius of the selected location.
- Includes play/pause controls, sweep azimuth heading, and dBZ intensity color grading (Light green $\to$ Heavy red/purple).

### 7. Smart Wardrobe & Weather Advisories
- Active severe warning alerts (Thunderstorm Warning, Gale Advisory, High UV Alert, or Calm Clear Status).
- Dynamic clothing & gear recommendations (e.g. waterproof shell, thermal layers, UV sunglasses) computed from temperature, wind chill, and precipitation probabilities.

### 8. Fault-Tolerant Multi-Tier Data Pipeline
- **OpenWeatherMap Integration**: Built-in modal to store and test custom OpenWeatherMap API credentials.
- **Open-Meteo High-Resolution Model**: Automatic zero-key live worldwide forecasting and air quality integration.
- **Local Cache & Offline Meteorological Model**: If external third-party APIs experience transient 503 errors, Aetheria serves cached forecasts or activates an internal climate model based on latitude and seasonal diurnal equations, ensuring zero downtime.

---

## 🔬 Mathematical & Simulation Formulations

### Solar Declination & Daylight Arc
Daylight duration and solar path angles are derived using the solar declination formula:
$$\delta = 23.45^\circ \cdot \sin\left(\frac{360^\circ}{365} \cdot (d - 81)\right)$$
$$\cos(\omega_0) = -\tan(\phi) \cdot \tan(\delta)$$
Where $\phi$ represents observer latitude and $d$ represents the day of the year.

### Magnus-Tetens Dew Point Approximation
Ambient moisture saturation temperature is calculated using the Magnus formula:
$$\alpha(T, RH) = \frac{17.27 \cdot T}{237.7 + T} + \ln\left(\frac{RH}{100}\right)$$
$$T_{\text{dew}} = \frac{237.7 \cdot \alpha(T, RH)}{17.27 - \alpha(T, RH)}$$

### Synodic Lunar Illumination
Moon phase cycle fraction ($\mu$) and geometric surface illumination ($I$):
$$\mu = \left(\frac{t - t_0}{29.53058867}\right) \pmod 1$$
$$I = \frac{1 - \cos(2\pi \mu)}{2} \times 100\%$$

---

## ⌨️ Controls & Keyboard Shortcuts

| Control | Shortcut / Input | Description |
| :--- | :--- | :--- |
| **Orbit Camera** | Left-Click + Drag | Freely rotate 360° around the floating 3D weather island |
| **Zoom** | Scroll Wheel / Pinch | Zoom in to inspect cabin details or out for full atmospheric view |
| **Toggle Dock** | <kbd>H</kbd> | Collapse the bottom control dock to maximize 3D viewport |
| **Zen Mode** | <kbd>Z</kbd> | Toggle full-screen unobstructed 3D cinema mode |
| **Auto-Rotate** | Top-Right Button | Toggle continuous 3D island turntable rotation |
| **Reset View** | Top-Right Button | Snap camera back to default isometric presentation angle |

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | React 19 + TypeScript | Component orchestration and state management |
| **3D Rendering** | Three.js (r182+) | Procedural WebGL2 scene, PBR materials, particle loops |
| **Styling** | Tailwind CSS v4 | Responsive layout, dark theme variants, typography |
| **Build System** | Vite 8 + @tailwindcss/vite | Instant HMR development and optimized production bundling |
| **Icons** | Lucide React | Clean, scalable vector iconography |
| **Animation** | Motion / Three.js RAF | Damped camera easing and particle kinematics |

---

## 📂 Project Directory Structure

```
├── README.md                            # Comprehensive project documentation
├── index.html                           # HTML entry point with Google Fonts & meta tags
├── metadata.json                        # Application capabilities configuration
├── package.json                         # Dependencies and build scripts
├── tsconfig.json                        # TypeScript configuration
├── vite.config.ts                       # Vite bundler configuration
├── src/
│   ├── main.tsx                         # React 19 entry point
│   ├── App.tsx                          # Core state orchestration & layout
│   ├── index.css                        # Tailwind v4 custom theme & typography
│   ├── types/
│   │   └── weather.ts                   # Meteorological interfaces & data models
│   ├── services/
│   │   └── weatherService.ts            # OWM/Open-Meteo dual pipeline, cache & model
│   ├── three/
│   │   └── weatherIslandScene.ts        # Three.js procedural island engine & PBR rig
│   └── components/
│       ├── ThreeWeatherScene.tsx        # React Three.js WebGL container
│       ├── TopNav.tsx                   # 3-zone header, city search & unit toggle
│       ├── HeroWeatherCard.tsx          # Real-time temperature & condition display
│       ├── ControlDock.tsx              # Collapsible bottom analytics deck
│       ├── ForecastCarousel.tsx         # 7-day forecast cards & 3D island switcher
│       ├── HourlyTimeline.tsx           # 24-hour timeline & solar position scrubber
│       ├── AstronomicalWidget.tsx       # Solar elevation arc & lunar phase tracker
│       ├── AtmosphericGauges.tsx        # UV, AQI, wind compass & barometrics
│       ├── PrecipitationRadar.tsx       # Animated Doppler radar canvas sweep
│       ├── WeatherAdvisory.tsx          # Severe warnings & clothing recommendations
│       └── ApiKeyModal.tsx              # OpenWeatherMap API key settings & ping test
```

---

## 💻 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm or yarn

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/sathwik-svg/Aetheria-3d-weather-LetsUpgrade-project.git

# 2. Navigate to project root
cd Aetheria-3d-weather-LetsUpgrade-project

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build
```bash
# Compile and bundle for production
npm run build
```

---

## 🔑 OpenWeatherMap API Setup (Optional)

Aetheria runs out of the box with zero configuration required. If you wish to use your own personal OpenWeatherMap quota:
1. Register for an API key at [OpenWeatherMap](https://openweathermap.org/api).
2. Open Aetheria and click the **API Key** button in the top navigation bar.
3. Paste your key, click **Test Key** to verify connection, and click **Save Credentials**.
4. The key is securely stored in your browser's `localStorage`.

---

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Engineered by <strong>Sathwik Ganji</strong> · Built with Three.js, React 19, and Tailwind CSS.</sub>
</div>
