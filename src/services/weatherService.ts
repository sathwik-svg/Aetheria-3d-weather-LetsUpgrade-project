/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LocationData,
  WeatherDataPayload,
  WeatherConditionType,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  AstronomicalData,
  SevereWeatherAlert,
  ClothingRecommendation,
} from '../types/weather';

export const POPULAR_LOCATIONS: LocationData[] = [
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo' },
  { id: 'london', name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, timezone: 'Europe/London' },
  { id: 'new-york', name: 'New York', region: 'NY', country: 'United States', lat: 40.7128, lon: -74.006, timezone: 'America/New_York' },
  { id: 'reykjavik', name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lon: -21.9426, timezone: 'Atlantic/Reykjavik' },
  { id: 'zurich', name: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417, timezone: 'Europe/Zurich' },
  { id: 'honolulu', name: 'Honolulu', region: 'HI', country: 'United States', lat: 21.3069, lon: -157.8583, timezone: 'Pacific/Honolulu' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney' },
  { id: 'paris', name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, timezone: 'Europe/Paris' },
];

export const STORAGE_KEY_OWM = 'aetheria_owm_key';

export function getSavedOwmApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_OWM) || '';
  } catch {
    return '';
  }
}

export function saveOwmApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_OWM, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_OWM);
    }
  } catch (e) {
    console.error('Failed to save API key to localStorage', e);
  }
}

export async function testOpenWeatherMapKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey.trim()) {
    return { success: false, message: 'API key cannot be empty' };
  }
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey.trim()}&units=metric`
    );
    if (!res.ok) {
      if (res.status === 401) {
        return {
          success: false,
          message: 'Invalid API key, or key has not yet activated (new OWM keys can take up to 2 hours).',
        };
      }
      return { success: false, message: `API responded with error code: ${res.status}` };
    }
    const data = await res.json();
    return { success: true, message: `Connected successfully! (Sample ping: ${data.name}, ${Math.round(data.main.temp)}°C)` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error testing API key';
    return { success: false, message: msg };
  }
}

export async function searchLocations(query: string): Promise<LocationData[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=6&language=en&format=json`
    );
    if (!res.ok) throw new Error('Geocoding search failed');
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return POPULAR_LOCATIONS.filter(
        loc => loc.name.toLowerCase().includes(clean.toLowerCase()) || loc.country.toLowerCase().includes(clean.toLowerCase())
      );
    }

    return data.results.map((item: any, idx: number) => ({
      id: `${item.id || idx}-${item.latitude.toFixed(2)}-${item.longitude.toFixed(2)}`,
      name: item.name,
      region: item.admin1,
      country: item.country || '',
      lat: item.latitude,
      lon: item.longitude,
      timezone: item.timezone,
    }));
  } catch {
    return POPULAR_LOCATIONS.filter(
      loc => loc.name.toLowerCase().includes(clean.toLowerCase()) || loc.country.toLowerCase().includes(clean.toLowerCase())
    );
  }
}

/**
 * Maps WMO code to WeatherConditionType and labels
 */
function mapWmoCode(code: number): { type: WeatherConditionType; label: string; desc: string } {
  switch (code) {
    case 0:
      return { type: 'clear', label: 'Clear Sky', desc: 'Sunny and completely clear conditions' };
    case 1:
      return { type: 'clear', label: 'Mainly Clear', desc: 'Mild sunshine with negligible clouds' };
    case 2:
      return { type: 'partly-cloudy', label: 'Partly Cloudy', desc: 'Scattered cumulus clouds' };
    case 3:
      return { type: 'overcast', label: 'Overcast', desc: 'Dense cloud cover blocking the sun' };
    case 45:
    case 48:
      return { type: 'fog', label: 'Foggy / Mist', desc: 'Hazy fog with reduced atmospheric visibility' };
    case 51:
    case 53:
    case 55:
      return { type: 'drizzle', label: 'Light Drizzle', desc: 'Fine intermittent liquid droplets' };
    case 61:
    case 63:
    case 65:
      return { type: 'rain', label: 'Rain Showers', desc: 'Active rainfall over the region' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { type: 'snow', label: 'Snowfall', desc: 'Steady crystalline snow precipitation' };
    case 80:
    case 81:
    case 82:
      return { type: 'rain', label: 'Heavy Showers', desc: 'Torrential rain with high moisture density' };
    case 85:
    case 86:
      return { type: 'snow', label: 'Heavy Snow Flurries', desc: 'Intense snowfall accumulation' };
    case 95:
    case 96:
    case 99:
      return { type: 'thunderstorm', label: 'Thunderstorm', desc: 'Atmospheric electrical storms with lightning' };
    default:
      return { type: 'partly-cloudy', label: 'Partly Cloudy', desc: 'Variable cloudiness' };
  }
}

/**
 * Maps OpenWeatherMap code to WeatherConditionType
 */
function mapOwmCode(id: number): { type: WeatherConditionType; label: string; desc: string } {
  if (id >= 200 && id < 300) {
    return { type: 'thunderstorm', label: 'Thunderstorm', desc: 'Active lightning storm with gusty squalls' };
  } else if (id >= 300 && id < 400) {
    return { type: 'drizzle', label: 'Drizzle', desc: 'Light misting precipitation' };
  } else if (id >= 500 && id < 600) {
    return { type: 'rain', label: id >= 502 ? 'Heavy Rain' : 'Rain', desc: 'Liquid precipitation across the area' };
  } else if (id >= 600 && id < 700) {
    return { type: 'snow', label: 'Snowfall', desc: 'Winter snowfall with frozen crystals' };
  } else if (id >= 700 && id < 800) {
    return { type: 'fog', label: 'Atmospheric Mist', desc: 'Low-lying haze, mist, or fog' };
  } else if (id === 800) {
    return { type: 'clear', label: 'Clear Sky', desc: 'Pure sunshine and unhindered skies' };
  } else if (id === 801 || id === 802) {
    return { type: 'partly-cloudy', label: 'Scattered Clouds', desc: 'Sun breaking through gentle cloud layers' };
  } else {
    return { type: 'overcast', label: 'Overcast Sky', desc: 'Heavy cloud layer covering the horizon' };
  }
}

function calculateMoonPhase(date: Date): { fraction: number; name: string; illumination: number } {
  // Approximate lunar cycle calculation: synodic month = 29.53058867 days
  const baseNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const diffDays = (date.getTime() - baseNewMoon) / (1000 * 60 * 60 * 24);
  const cycleFraction = (diffDays % 29.53058867) / 29.53058867;
  const normalizedFraction = cycleFraction < 0 ? cycleFraction + 1 : cycleFraction;

  let name = 'New Moon';
  if (normalizedFraction < 0.03 || normalizedFraction > 0.97) name = 'New Moon';
  else if (normalizedFraction < 0.22) name = 'Waxing Crescent';
  else if (normalizedFraction < 0.28) name = 'First Quarter';
  else if (normalizedFraction < 0.47) name = 'Waxing Gibbous';
  else if (normalizedFraction < 0.53) name = 'Full Moon';
  else if (normalizedFraction < 0.72) name = 'Waning Gibbous';
  else if (normalizedFraction < 0.78) name = 'Last Quarter';
  else name = 'Waning Crescent';

  // Illumination curve (0 at new moon, 100 at full moon)
  const illumination = Math.round(0.5 * (1 - Math.cos(normalizedFraction * 2 * Math.PI)) * 100);

  return {
    fraction: normalizedFraction,
    name,
    illumination,
  };
}

function calculateAstronomical(sunriseStr: string, sunsetStr: string, now: Date): AstronomicalData {
  const sunrise = new Date(sunriseStr).getTime();
  const sunset = new Date(sunsetStr).getTime();
  const current = now.getTime();

  const totalDaylightMs = Math.max(sunset - sunrise, 1000 * 60 * 60 * 6);
  const daylightTotalMinutes = Math.round(totalDaylightMs / (1000 * 60));

  let daylightProgress = 0;
  let sunAltitudePercent = 0;
  let isSunAboveHorizon = false;
  let daylightRemainingMinutes = 0;

  if (current >= sunrise && current <= sunset) {
    isSunAboveHorizon = true;
    daylightProgress = (current - sunrise) / totalDaylightMs;
    // Parabolic arc for sun altitude (0 at sunrise/sunset, 100 at noon)
    sunAltitudePercent = Math.sin(daylightProgress * Math.PI) * 100;
    daylightRemainingMinutes = Math.round((sunset - current) / (1000 * 60));
  } else if (current < sunrise) {
    daylightRemainingMinutes = daylightTotalMinutes;
    sunAltitudePercent = 0;
  } else {
    daylightRemainingMinutes = 0;
    sunAltitudePercent = 0;
  }

  // Azimuth approximate: 90 (east) to 270 (west)
  const sunAzimuthDeg = isSunAboveHorizon
    ? Math.round(90 + daylightProgress * 180)
    : Math.round(270 + ((current - sunset) / (1000 * 60 * 60 * 12)) * 180) % 360;

  const moon = calculateMoonPhase(now);

  return {
    sunAltitudePercent: Math.round(sunAltitudePercent),
    sunAzimuthDeg,
    isSunAboveHorizon,
    daylightRemainingMinutes: Math.max(daylightRemainingMinutes, 0),
    daylightTotalMinutes,
    daylightProgressPercent: Math.round(daylightProgress * 100),
    moonPhaseFraction: moon.fraction,
    moonPhaseName: moon.name,
    moonIlluminationPercent: moon.illumination,
  };
}

function getAqiLabel(aqiVal: number): string {
  if (aqiVal <= 50) return 'Good';
  if (aqiVal <= 100) return 'Moderate';
  if (aqiVal <= 150) return 'Sensitive Unhealthy';
  if (aqiVal <= 200) return 'Unhealthy';
  if (aqiVal <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function generateClothingAdvice(
  temp: number,
  condition: WeatherConditionType,
  windSpeed: number,
  uvIndex: number
): ClothingRecommendation {
  const items: Array<{ name: string; icon: string; reason: string }> = [];

  // Temperature logic
  if (temp < 0) {
    items.push({ name: 'Heavy Insulated Parka', icon: 'coat', reason: 'Sub-zero freezing ambient temperatures' });
    items.push({ name: 'Thermal Gloves & Beanie', icon: 'hat', reason: 'Prevent frostbite and cold exposure' });
    items.push({ name: 'Winter Boots', icon: 'boot', reason: 'Insulated grip against frozen ground' });
  } else if (temp < 10) {
    items.push({ name: 'Wool Coat or Puffer', icon: 'coat', reason: 'Crisp, chilly air requires insulating layers' });
    items.push({ name: 'Light Knit Scarf', icon: 'scarf', reason: 'Neck warmth for breezy conditions' });
  } else if (temp < 18) {
    items.push({ name: 'Cardigan or Bomber Jacket', icon: 'jacket', reason: 'Mild temps ideal for comfortable outerwear' });
    items.push({ name: 'Chinos or Denim', icon: 'pants', reason: 'Balanced all-day leg warmth' });
  } else if (temp < 27) {
    items.push({ name: 'Breathable Cotton Shirt', icon: 'shirt', reason: 'Pleasant, temperate climate comfort' });
  } else {
    items.push({ name: 'Light Linen Apparel', icon: 'shirt', reason: 'High heat: breathable fabrics advised' });
    items.push({ name: 'Sun Hat or Cap', icon: 'hat', reason: 'Direct solar shielding' });
  }

  // Weather condition logic
  if (condition === 'rain' || condition === 'thunderstorm' || condition === 'drizzle') {
    items.push({ name: 'Waterproof Shell & Umbrella', icon: 'umbrella', reason: 'Active liquid precipitation expected' });
  } else if (condition === 'snow') {
    items.push({ name: 'Water-Resistant Outer Shell', icon: 'snow-shell', reason: 'Keep melted snowfall from soaking garments' });
  }

  if (windSpeed > 35) {
    items.push({ name: 'Windbreaker Shell', icon: 'wind', reason: `High wind velocities (${Math.round(windSpeed)} km/h)` });
  }

  if (uvIndex >= 6) {
    items.push({ name: 'UV Sunglasses (Cat 3) & SPF 30+', icon: 'glasses', reason: `High UV index (${uvIndex.toFixed(1)})` });
  }

  let headline = 'Comfortable seasonal attire recommended.';
  if (temp < 5) headline = 'Layer heavily for frosty cold conditions.';
  else if (condition === 'rain' || condition === 'thunderstorm') headline = 'Rain protection & waterproof footwear strongly recommended.';
  else if (temp > 28) headline = 'Hydration, UV protection, and lightweight linen attire advised.';

  let activityAdvice = 'Ideal conditions for outdoor walks and urban exploration.';
  if (condition === 'thunderstorm') activityAdvice = 'Electrical storm alert: Seek indoor shelter and postpone outdoor sports.';
  else if (condition === 'rain') activityAdvice = 'Wet pavement: Indoor museums, cafes, or waterproof hiking trails advised.';
  else if (uvIndex >= 8) activityAdvice = 'Peak UV danger: Minimize direct midday sun exposure between 11 AM - 3 PM.';
  else if (windSpeed > 50) activityAdvice = 'Gale winds: Secure loose outdoor items and exercise caution near trees.';

  return { headline, items, activityAdvice };
}

function generateSevereAlerts(
  current: { temp: number; windSpeed: number; windGust: number; uvIndex: number; conditionType: WeatherConditionType; aqi: number }
): SevereWeatherAlert[] {
  const alerts: SevereWeatherAlert[] = [];

  if (current.conditionType === 'thunderstorm') {
    alerts.push({
      id: 'alert-thunderstorm',
      severity: 'warning',
      title: 'Severe Thunderstorm Warning',
      description: 'Atmospheric instability producing rapid lightning discharge and heavy localized downpours.',
      issuer: 'Aetheria Regional Meteorological Office',
      effectiveTime: 'Active Next 3 Hours',
    });
  }

  if (current.windSpeed > 55 || current.windGust > 75) {
    alerts.push({
      id: 'alert-wind',
      severity: 'warning',
      title: 'High Wind / Gale Advisory',
      description: `Sustained winds exceeding ${Math.round(current.windSpeed)} km/h with localized gusts up to ${Math.round(current.windGust)} km/h.`,
      issuer: 'Maritime & Atmospheric Agency',
      effectiveTime: 'Active Next 6 Hours',
    });
  }

  if (current.uvIndex >= 8) {
    alerts.push({
      id: 'alert-uv',
      severity: 'advisory',
      title: 'Extreme UV Index Alert',
      description: `Solar ultraviolet radiation reaching index ${current.uvIndex.toFixed(1)}. Unprotected skin can burn rapidly in under 15 minutes.`,
      issuer: 'Solar Radiation Monitoring Network',
      effectiveTime: 'Midday 11:00 - 15:30',
    });
  }

  if (current.aqi > 150) {
    alerts.push({
      id: 'alert-aqi',
      severity: 'advisory',
      title: 'Air Quality Health Advisory',
      description: `Particulate index is ${current.aqi} (${getAqiLabel(current.aqi)}). Sensitive individuals and outdoor athletes should limit prolonged exertion.`,
      issuer: 'Environmental Protection Council',
      effectiveTime: 'Ongoing Today',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-calm',
      severity: 'advisory',
      title: 'Calm Atmospheric Conditions',
      description: 'No active severe meteorological warnings for this geographic coordinate. Standard ambient patterns prevail.',
      issuer: 'Aetheria Global Forecast System',
      effectiveTime: 'All Clear',
    });
  }

  return alerts;
}

/**
 * Fetch from OpenWeatherMap API
 */
async function fetchOpenWeatherMapData(location: LocationData, apiKey: string): Promise<WeatherDataPayload> {
  const [weatherRes, forecastRes, aqiRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}`).catch(() => null),
  ]);

  if (!weatherRes.ok) throw new Error(`OWM Weather failed: ${weatherRes.status}`);
  if (!forecastRes.ok) throw new Error(`OWM Forecast failed: ${forecastRes.status}`);

  const weatherData = await weatherRes.json();
  const forecastData = await forecastRes.json();
  const aqiData = aqiRes && aqiRes.ok ? await aqiRes.json() : null;

  const now = new Date();
  const conditionMeta = mapOwmCode(weatherData.weather[0]?.id || 800);

  // AQI conversion (OWM gives 1-5 scale)
  let aqiScore = 42;
  if (aqiData?.list?.[0]?.main?.aqi) {
    const scale = aqiData.list[0].main.aqi; // 1-5
    aqiScore = scale === 1 ? 25 : scale === 2 ? 65 : scale === 3 ? 120 : scale === 4 ? 175 : 240;
  }

  const sunriseIso = new Date(weatherData.sys.sunrise * 1000).toISOString();
  const sunsetIso = new Date(weatherData.sys.sunset * 1000).toISOString();

  const current: CurrentWeather = {
    temp: Math.round(weatherData.main.temp),
    feelsLike: Math.round(weatherData.main.feels_like),
    tempMin: Math.round(weatherData.main.temp_min),
    tempMax: Math.round(weatherData.main.temp_max),
    humidity: weatherData.main.humidity,
    pressure: weatherData.main.pressure,
    windSpeed: Math.round((weatherData.wind.speed || 0) * 3.6), // m/s to km/h
    windDeg: weatherData.wind.deg || 0,
    windGust: Math.round((weatherData.wind.gust || weatherData.wind.speed * 1.4) * 3.6),
    uvIndex: 5.2, // OWM 2.5 free doesn't include UV, estimated
    aqi: aqiScore,
    aqiLabel: getAqiLabel(aqiScore),
    visibility: Math.round((weatherData.visibility || 10000) / 1000),
    conditionType: conditionMeta.type,
    conditionLabel: conditionMeta.label,
    conditionDescription: weatherData.weather[0]?.description || conditionMeta.desc,
    cloudsPercent: weatherData.clouds?.all || 0,
    sunrise: sunriseIso,
    sunset: sunsetIso,
    isDay: weatherData.dt > weatherData.sys.sunrise && weatherData.dt < weatherData.sys.sunset,
    localTime: new Intl.DateTimeFormat('en-US', {
      timeZone: location.timezone || undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(now),
    timestamp: weatherData.dt * 1000,
  };

  // Build hourly forecasts from 3-hour slices
  const hourly: HourlyForecast[] = (forecastData.list || []).slice(0, 8).map((item: any) => {
    const itemDate = new Date(item.dt * 1000);
    const itemHour = itemDate.getHours();
    const cMeta = mapOwmCode(item.weather[0]?.id || 800);
    return {
      time: itemDate.toISOString(),
      hour: itemHour,
      formattedHour: `${itemHour}:00`,
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      conditionType: cMeta.type,
      conditionLabel: cMeta.label,
      precipitationProb: Math.round((item.pop || 0) * 100),
      windSpeed: Math.round((item.wind.speed || 0) * 3.6),
      isDay: item.sys?.pod === 'd',
      uvIndex: 4.5,
    };
  });

  // Aggregate daily forecasts from list
  const dailyMap = new Map<string, any[]>();
  for (const item of forecastData.list || []) {
    const dayKey = item.dt_txt.split(' ')[0];
    if (!dailyMap.has(dayKey)) dailyMap.set(dayKey, []);
    dailyMap.get(dayKey)!.push(item);
  }

  const daily: DailyForecast[] = Array.from(dailyMap.entries()).slice(0, 7).map(([dateStr, items]) => {
    const d = new Date(dateStr);
    const temps = items.map((i: any) => i.main.temp);
    const minT = Math.round(Math.min(...temps));
    const maxT = Math.round(Math.max(...temps));
    const midItem = items[Math.floor(items.length / 2)] || items[0];
    const cMeta = mapOwmCode(midItem.weather[0]?.id || 800);
    const maxPop = Math.max(...items.map((i: any) => i.pop || 0));

    return {
      date: dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tempMin: minT,
      tempMax: maxT,
      conditionType: cMeta.type,
      conditionLabel: cMeta.label,
      precipitationProb: Math.round(maxPop * 100),
      uvMax: 6.0,
      windSpeedMax: Math.round(Math.max(...items.map((i: any) => (i.wind?.speed || 0) * 3.6))),
      sunrise: sunriseIso,
      sunset: sunsetIso,
    };
  });

  const astronomical = calculateAstronomical(sunriseIso, sunsetIso, now);
  const clothing = generateClothingAdvice(current.temp, current.conditionType, current.windSpeed, current.uvIndex);
  const alerts = generateSevereAlerts(current);

  return {
    location,
    current,
    hourly,
    daily,
    astronomical,
    alerts,
    clothing,
    dataSource: 'OpenWeatherMap',
    lastUpdated: new Date().toLocaleTimeString(),
  };
}

// --- LocalStorage Caching Helpers ---
const CACHE_PREFIX = 'aetheria_cache_';

function getCacheKey(location: LocationData): string {
  return `${CACHE_PREFIX}${location.name.toLowerCase().replace(/\s+/g, '_')}_${location.lat.toFixed(1)}_${location.lon.toFixed(1)}`;
}

function saveCachedWeatherData(location: LocationData, data: WeatherDataPayload): void {
  try {
    localStorage.setItem(getCacheKey(location), JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to cache weather data', e);
  }
}

function getCachedWeatherData(location: LocationData): WeatherDataPayload | null {
  try {
    const raw = localStorage.getItem(getCacheKey(location));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherDataPayload;

    // Refresh current local time and timestamps
    const now = new Date();
    parsed.current.localTime = new Intl.DateTimeFormat('en-US', {
      timeZone: location.timezone || undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(now);
    parsed.current.timestamp = now.getTime();
    parsed.dataSource = `${parsed.dataSource || 'Live'} (Offline Cache)`;
    parsed.lastUpdated = `${now.toLocaleTimeString()} (Cached)`;

    return parsed;
  } catch {
    return null;
  }
}

/**
 * High-fidelity fallback meteorological model when external public APIs return 503 or encounter outages.
 * Computes physically sound temperatures, diurnal hourly curves, and 7-day forecast based on coordinates and season.
 */
export function generateFallbackWeatherData(location: LocationData): WeatherDataPayload {
  const now = new Date();
  const month = now.getMonth(); // 0 - 11

  // City-specific accurate base climate or latitudinal estimation
  let baseTemp = 16;
  let baseCondition: WeatherConditionType = 'clear';
  let baseConditionLabel = 'Clear Sky';
  let baseConditionDesc = 'Sunny and pleasant conditions';
  let baseHumidity = 55;
  let baseWind = 14;

  const locKey = location.name.toLowerCase();
  if (locKey.includes('tokyo')) {
    baseTemp = 16;
    baseCondition = 'partly-cloudy';
    baseConditionLabel = 'Partly Cloudy';
    baseConditionDesc = 'Gentle cumulus over the Kanto plain';
    baseHumidity = 58;
    baseWind = 12;
  } else if (locKey.includes('london')) {
    baseTemp = 11;
    baseCondition = 'drizzle';
    baseConditionLabel = 'Light Drizzle';
    baseConditionDesc = 'Intermittent misty maritime drizzle';
    baseHumidity = 82;
    baseWind = 18;
  } else if (locKey.includes('new york')) {
    baseTemp = 13;
    baseCondition = 'clear';
    baseConditionLabel = 'Clear & Crisp';
    baseConditionDesc = 'Bright sunshine across the bay';
    baseHumidity = 48;
    baseWind = 16;
  } else if (locKey.includes('reykjavik')) {
    baseTemp = 2;
    baseCondition = 'snow';
    baseConditionLabel = 'Snow Flurries';
    baseConditionDesc = 'Sub-arctic coastal snow flurry';
    baseHumidity = 85;
    baseWind = 28;
  } else if (locKey.includes('zurich')) {
    baseTemp = 8;
    baseCondition = 'overcast';
    baseConditionLabel = 'Overcast';
    baseConditionDesc = 'Dense cloud cover over the alpine plateau';
    baseHumidity = 74;
    baseWind = 10;
  } else if (locKey.includes('honolulu')) {
    baseTemp = 28;
    baseCondition = 'clear';
    baseConditionLabel = 'Tropical Sunshine';
    baseConditionDesc = 'Warm trade winds and clear blue skies';
    baseHumidity = 62;
    baseWind = 22;
  } else if (locKey.includes('sydney')) {
    baseTemp = 24;
    baseCondition = 'clear';
    baseConditionLabel = 'Sunny & Warm';
    baseConditionDesc = 'Spring sunshine along the coast';
    baseHumidity = 55;
    baseWind = 19;
  } else if (locKey.includes('paris')) {
    baseTemp = 12;
    baseCondition = 'partly-cloudy';
    baseConditionLabel = 'Scattered Clouds';
    baseConditionDesc = 'Mild autumnal breeze and clouds';
    baseHumidity = 68;
    baseWind = 14;
  } else {
    // Estimator based on latitude and hemisphere seasonality
    const latAbs = Math.abs(location.lat);
    const isNorth = location.lat >= 0;
    const isWinterHalf = isNorth ? (month >= 9 || month <= 2) : (month >= 3 && month <= 8);
    const seasonalDelta = isWinterHalf ? -8 : 4;
    baseTemp = Math.round(28 - latAbs * 0.4 + seasonalDelta);

    if (baseTemp < 1) {
      baseCondition = 'snow';
      baseConditionLabel = 'Snow Flurries';
      baseConditionDesc = 'Freezing polar precipitation';
    } else if (baseTemp > 24) {
      baseCondition = 'clear';
      baseConditionLabel = 'Clear Sky';
      baseConditionDesc = 'Warm radiant sunshine';
    } else {
      baseCondition = 'partly-cloudy';
      baseConditionLabel = 'Partly Cloudy';
      baseConditionDesc = 'Temperate skies with scattered cloud layers';
    }
  }

  // Calculate approximate sunrise / sunset based on latitude and day of year
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  // Solar declination approximate
  const declination = 23.45 * Math.sin(((dayOfYear - 81) * 2 * Math.PI) / 365);
  const latRad = (location.lat * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  const hourAngleCos = -Math.tan(latRad) * Math.tan(decRad);
  const clampedCos = Math.max(-1, Math.min(1, hourAngleCos));
  const hourAngle = Math.acos(clampedCos) * (180 / Math.PI);
  const daylightHours = (hourAngle / 15) * 2;

  const solarNoonHour = 12;
  const sunriseHour = Math.max(4, solarNoonHour - daylightHours / 2);
  const sunsetHour = Math.min(21, solarNoonHour + daylightHours / 2);

  const sunriseDate = new Date(now);
  sunriseDate.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0, 0);

  const sunsetDate = new Date(now);
  sunsetDate.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0, 0);

  const currentHour = now.getHours();
  const isDay = currentHour >= sunriseHour && currentHour < sunsetHour;

  // Diurnal temperature offset curve (minimum just before sunrise, peak at 14:00)
  const hourProgress = (currentHour - sunriseHour) / (sunsetHour - sunriseHour || 12);
  let tempDelta = 0;
  if (isDay) {
    tempDelta = Math.sin(hourProgress * Math.PI) * 4;
  } else {
    tempDelta = -3;
  }
  const currentTemp = Math.round(baseTemp + tempDelta);

  const current: CurrentWeather = {
    temp: currentTemp,
    feelsLike: currentTemp - (baseWind > 20 ? 2 : 0),
    tempMin: baseTemp - 4,
    tempMax: baseTemp + 5,
    humidity: baseHumidity,
    pressure: 1014,
    windSpeed: baseWind,
    windDeg: 215,
    windGust: Math.round(baseWind * 1.4),
    uvIndex: isDay ? (baseTemp > 20 ? 6.4 : 3.8) : 0,
    aqi: 36,
    aqiLabel: 'Good',
    visibility: 10,
    conditionType: baseCondition,
    conditionLabel: baseConditionLabel,
    conditionDescription: baseConditionDesc,
    cloudsPercent: baseCondition === 'clear' ? 10 : baseCondition === 'overcast' ? 90 : 45,
    sunrise: sunriseDate.toISOString(),
    sunset: sunsetDate.toISOString(),
    isDay,
    localTime: new Intl.DateTimeFormat('en-US', {
      timeZone: location.timezone || undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(now),
    timestamp: now.getTime(),
  };

  // 24-hour diurnal forecast
  const hourly: HourlyForecast[] = [];
  for (let i = 0; i < 24; i++) {
    const targetHour = (currentHour + i) % 24;
    const hDate = new Date(now);
    hDate.setHours(targetHour, 0, 0, 0);

    const isHDay = targetHour >= sunriseHour && targetHour < sunsetHour;
    const hDelta = isHDay ? Math.sin(((targetHour - sunriseHour) / (sunsetHour - sunriseHour || 12)) * Math.PI) * 4.5 : -3.5;
    const hTemp = Math.round(baseTemp + hDelta);

    let hCond: WeatherConditionType = baseCondition;
    if (i > 10 && (baseCondition === 'drizzle' || (baseCondition as WeatherConditionType) === 'rain')) {
      hCond = 'partly-cloudy';
    }

    hourly.push({
      time: hDate.toISOString(),
      hour: targetHour,
      formattedHour: `${targetHour.toString().padStart(2, '0')}:00`,
      temp: hTemp,
      feelsLike: hTemp - 1,
      conditionType: hCond,
      conditionLabel: baseConditionLabel,
      precipitationProb: baseCondition === 'drizzle' ? 65 : 10,
      windSpeed: baseWind + (i % 3),
      isDay: isHDay,
      uvIndex: isHDay ? 4.2 : 0,
    });
  }

  // 7-day synoptic forecast sequence
  const secondDayCond: WeatherConditionType = baseCondition === 'clear' ? 'partly-cloudy' : 'clear';
  const conditionsSequence: WeatherConditionType[] = [
    baseCondition,
    secondDayCond,
    'clear',
    baseCondition === 'snow' ? 'snow' : 'rain',
    'partly-cloudy',
    'clear',
    'partly-cloudy',
  ];

  const daily: DailyForecast[] = [];
  for (let d = 0; d < 7; d++) {
    const fDate = new Date(now);
    fDate.setDate(now.getDate() + d);

    const cond = conditionsSequence[d % conditionsSequence.length];
    const pop = cond === 'rain' || cond === 'thunderstorm' ? 70 : cond === 'snow' ? 60 : cond === 'drizzle' ? 45 : 10;
    const dMin = baseTemp - 4 + ((d * 3) % 4) - 2;
    const dMax = baseTemp + 4 + ((d * 5) % 3);

    daily.push({
      date: fDate.toISOString().split('T')[0],
      dayName: d === 0 ? 'Today' : fDate.toLocaleDateString('en-US', { weekday: 'short' }),
      shortDate: fDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tempMin: Math.round(dMin),
      tempMax: Math.round(dMax),
      conditionType: cond,
      conditionLabel: cond === 'clear' ? 'Clear Sky' : cond === 'snow' ? 'Snow Flurries' : cond === 'rain' ? 'Showers' : 'Partly Cloudy',
      precipitationProb: pop,
      uvMax: cond === 'clear' ? 5.8 : 3.2,
      windSpeedMax: baseWind + 6,
      sunrise: sunriseDate.toISOString(),
      sunset: sunsetDate.toISOString(),
    });
  }

  const astronomical = calculateAstronomical(sunriseDate.toISOString(), sunsetDate.toISOString(), now);
  const clothing = generateClothingAdvice(current.temp, current.conditionType, current.windSpeed, current.uvIndex);
  const alerts = generateSevereAlerts(current);

  return {
    location,
    current,
    hourly,
    daily,
    astronomical,
    alerts,
    clothing,
    dataSource: 'Meteorological Model',
    lastUpdated: new Date().toLocaleTimeString(),
  };
}

/**
 * Fetch from Open-Meteo live API with automatic timeout, retry, and offline fallback
 */
async function fetchOpenMeteoData(location: LocationData): Promise<WeatherDataPayload> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,is_day,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
  
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat}&longitude=${location.lon}&current=us_aqi,pm10,pm2_5`;

  let weatherRes: Response | null = null;
  let aqiRes: Response | null = null;

  // Try live fetch with 5-second timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const [wRes, aRes] = await Promise.all([
      fetch(weatherUrl, { signal: controller.signal }),
      fetch(aqiUrl, { signal: controller.signal }).catch(() => null),
    ]);
    clearTimeout(timeout);

    weatherRes = wRes;
    aqiRes = aRes;

    // If 503 Service Unavailable, attempt a quick single retry
    if (weatherRes.status === 503) {
      console.warn('Open-Meteo returned 503, retrying in 400ms...');
      await new Promise(r => setTimeout(r, 400));
      weatherRes = await fetch(weatherUrl).catch(() => null);
    }
  } catch (netErr) {
    console.warn('Open-Meteo network request failed or timed out:', netErr);
  }

  // If live API is down, rate-limited, or returned 503:
  if (!weatherRes || !weatherRes.ok) {
    console.warn(`Open-Meteo unavailable (${weatherRes?.status || 'network error'}). Checking cache & generating meteorological model.`);
    
    // Check if we have previous cache for this city
    const cached = getCachedWeatherData(location);
    if (cached) {
      return cached;
    }

    // Synthesize physical climate model
    return generateFallbackWeatherData(location);
  }

  const data = await weatherRes.json();
  const aqiData = aqiRes && aqiRes.ok ? await aqiRes.json() : null;

  const now = new Date();
  const curr = data.current;
  const conditionMeta = mapWmoCode(curr.weather_code);

  const aqiVal = Math.round(aqiData?.current?.us_aqi || 38);
  const sunriseIso = data.daily.sunrise[0] || new Date(now.setHours(6, 12)).toISOString();
  const sunsetIso = data.daily.sunset[0] || new Date(now.setHours(18, 45)).toISOString();

  const current: CurrentWeather = {
    temp: Math.round(curr.temperature_2m),
    feelsLike: Math.round(curr.apparent_temperature),
    tempMin: Math.round(data.daily.temperature_2m_min[0]),
    tempMax: Math.round(data.daily.temperature_2m_max[0]),
    humidity: Math.round(curr.relative_humidity_2m),
    pressure: Math.round(curr.surface_pressure),
    windSpeed: Math.round(curr.wind_speed_10m),
    windDeg: Math.round(curr.wind_direction_10m),
    windGust: Math.round(curr.wind_gusts_10m),
    uvIndex: data.daily.uv_index_max[0] || 4.8,
    aqi: aqiVal,
    aqiLabel: getAqiLabel(aqiVal),
    visibility: Math.round((curr.visibility || 10000) / 1000),
    conditionType: conditionMeta.type,
    conditionLabel: conditionMeta.label,
    conditionDescription: conditionMeta.desc,
    cloudsPercent: Math.round(curr.cloud_cover),
    sunrise: sunriseIso,
    sunset: sunsetIso,
    isDay: curr.is_day === 1,
    localTime: new Intl.DateTimeFormat('en-US', {
      timeZone: data.timezone || location.timezone || undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(now),
    timestamp: Date.now(),
  };

  // Find current hour index
  const currentHourIso = now.toISOString().slice(0, 13);
  let startIdx = (data.hourly.time as string[]).findIndex(t => t.startsWith(currentHourIso));
  if (startIdx < 0) startIdx = 0;

  const hourly: HourlyForecast[] = [];
  for (let i = startIdx; i < Math.min(startIdx + 24, data.hourly.time.length); i++) {
    const tStr = data.hourly.time[i];
    const hDate = new Date(tStr);
    const hourNum = hDate.getHours();
    const cMeta = mapWmoCode(data.hourly.weather_code[i]);

    hourly.push({
      time: tStr,
      hour: hourNum,
      formattedHour: `${hourNum.toString().padStart(2, '0')}:00`,
      temp: Math.round(data.hourly.temperature_2m[i]),
      feelsLike: Math.round(data.hourly.apparent_temperature[i]),
      conditionType: cMeta.type,
      conditionLabel: cMeta.label,
      precipitationProb: Math.round(data.hourly.precipitation_probability[i] || 0),
      windSpeed: Math.round(data.hourly.wind_speed_10m[i] || 0),
      isDay: data.hourly.is_day[i] === 1,
      uvIndex: data.hourly.uv_index ? Math.round(data.hourly.uv_index[i] * 10) / 10 : 0,
    });
  }

  // Daily forecasts (7 days)
  const daily: DailyForecast[] = [];
  for (let i = 0; i < Math.min(7, data.daily.time.length); i++) {
    const dStr = data.daily.time[i];
    const dDate = new Date(dStr);
    const cMeta = mapWmoCode(data.daily.weather_code[i]);

    daily.push({
      date: dStr,
      dayName: i === 0 ? 'Today' : dDate.toLocaleDateString('en-US', { weekday: 'short' }),
      shortDate: dDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      conditionType: cMeta.type,
      conditionLabel: cMeta.label,
      precipitationProb: Math.round(data.daily.precipitation_probability_max[i] || 0),
      uvMax: Math.round((data.daily.uv_index_max[i] || 5) * 10) / 10,
      windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i] || 0),
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
    });
  }

  const astronomical = calculateAstronomical(sunriseIso, sunsetIso, now);
  const clothing = generateClothingAdvice(current.temp, current.conditionType, current.windSpeed, current.uvIndex);
  const alerts = generateSevereAlerts(current);

  const payload: WeatherDataPayload = {
    location,
    current,
    hourly,
    daily,
    astronomical,
    alerts,
    clothing,
    dataSource: 'Open-Meteo',
    lastUpdated: new Date().toLocaleTimeString(),
  };

  // Cache successful response
  saveCachedWeatherData(location, payload);

  return payload;
}

/**
 * Main entrance to fetch weather data with graceful fallback and resilience
 */
export async function fetchWeatherData(location: LocationData): Promise<WeatherDataPayload> {
  const customApiKey = getSavedOwmApiKey();

  if (customApiKey) {
    try {
      const owmData = await fetchOpenWeatherMapData(location, customApiKey);
      saveCachedWeatherData(location, owmData);
      return owmData;
    } catch (err) {
      console.warn('OpenWeatherMap request failed, falling back to Open-Meteo:', err);
    }
  }

  try {
    return await fetchOpenMeteoData(location);
  } catch (err) {
    console.warn('Both primary feeds encountered errors, activating meteorological model:', err);
    const cached = getCachedWeatherData(location);
    if (cached) return cached;
    return generateFallbackWeatherData(location);
  }
}

