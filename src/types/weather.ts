/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeatherConditionType = 
  | 'clear' 
  | 'partly-cloudy' 
  | 'overcast' 
  | 'rain' 
  | 'drizzle' 
  | 'thunderstorm' 
  | 'snow' 
  | 'fog';

export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface LocationData {
  id: string;
  name: string;
  region?: string;
  country: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number; // km/h
  windDeg: number;
  windGust: number;
  uvIndex: number;
  aqi: number;
  aqiLabel: string;
  visibility: number; // km
  conditionType: WeatherConditionType;
  conditionLabel: string;
  conditionDescription: string;
  cloudsPercent: number;
  sunrise: string;
  sunset: string;
  isDay: boolean;
  localTime: string;
  timestamp: number;
}

export interface HourlyForecast {
  time: string;
  hour: number;
  formattedHour: string;
  temp: number;
  feelsLike: number;
  conditionType: WeatherConditionType;
  conditionLabel: string;
  precipitationProb: number;
  windSpeed: number;
  isDay: boolean;
  uvIndex: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  shortDate: string;
  tempMin: number;
  tempMax: number;
  conditionType: WeatherConditionType;
  conditionLabel: string;
  precipitationProb: number;
  uvMax: number;
  windSpeedMax: number;
  sunrise: string;
  sunset: string;
}

export interface AstronomicalData {
  sunAltitudePercent: number; // 0 (horizon/night) to 100 (zenith)
  sunAzimuthDeg: number;
  isSunAboveHorizon: boolean;
  daylightRemainingMinutes: number;
  daylightTotalMinutes: number;
  daylightProgressPercent: number;
  moonPhaseFraction: number; // 0 = New, 0.25 = First Quarter, 0.5 = Full, 0.75 = Last Quarter
  moonPhaseName: string;
  moonIlluminationPercent: number;
}

export interface SevereWeatherAlert {
  id: string;
  severity: 'advisory' | 'watch' | 'warning';
  title: string;
  description: string;
  issuer: string;
  effectiveTime: string;
}

export interface ClothingRecommendation {
  headline: string;
  items: Array<{ name: string; icon: string; reason: string }>;
  activityAdvice: string;
}

export interface WeatherDataPayload {
  location: LocationData;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  astronomical: AstronomicalData;
  alerts: SevereWeatherAlert[];
  clothing: ClothingRecommendation;
  dataSource: 'OpenWeatherMap' | 'Open-Meteo' | 'Meteorological Model' | string;
  lastUpdated: string;
}
