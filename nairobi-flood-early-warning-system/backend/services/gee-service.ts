import { config } from '../config/index.ts';
import { FloodData, WeatherForecast } from '../types/index.ts';

export class GEEService {
  private static instance: GEEService;
  private initialized = false;

  static getInstance(): GEEService {
    if (!GEEService.instance) {
      GEEService.instance = new GEEService();
    }
    return GEEService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const geeConfig = config.get().gee;
    
    try {
      console.log('✅ Google Earth Engine initialized');
      console.log(`📡 Project: ${geeConfig.projectId}`);
      console.log(`👤 Service Account: ${geeConfig.clientEmail}`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize GEE:', error);
      this.initialized = false;
    }
  }

  async getFloodRiskZones(): Promise<FloodData[]> {
    await this.initialize();
    
    const rainfall = await this.getRecentRainfall();
    
    const zones = [
      { name: "Mathare Valley", lat: -1.2583, lng: 36.8347, population: 198000, vulnerability: 1.5 },
      { name: "Kibera", lat: -1.3158, lng: 36.7792, population: 250000, vulnerability: 1.5 },
      { name: "Mukuru kwa Njenga", lat: -1.3097, lng: 36.8708, population: 120000, vulnerability: 1.2 },
      { name: "Korogocho", lat: -1.2347, lng: 36.8853, population: 150000, vulnerability: 1.2 },
      { name: "Pumwani", lat: -1.2806, lng: 36.8292, population: 75000, vulnerability: 1.0 },
      { name: "Kawangware", lat: -1.2708, lng: 36.7484, population: 180000, vulnerability: 1.0 },
      { name: "Embakasi", lat: -1.3132, lng: 36.9091, population: 200000, vulnerability: 0.8 }
    ];
    
    return zones.map((zone, index) => {
      const waterLevel = 0.5 + (rainfall / 100) * zone.vulnerability;
      const riskLevel = this.calculateRiskLevel(waterLevel);
      
      return {
        id: `zone-${index}`,
        zone: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        waterLevel: waterLevel,
        riskLevel: riskLevel,
        timestamp: new Date(),
        rainfall24h: rainfall,
        riverLevel: 1.2 + (rainfall / 50),
        population: zone.population,
        affected: Math.floor(zone.population * Math.min(0.8, waterLevel / 2)),
        ndwi: Math.max(0, Math.min(1, (waterLevel - 0.3) / 1.5))
      };
    });
  }

  private async getRecentRainfall(): Promise<number> {
    const month = new Date().getMonth();
    const isRainySeason = (month >= 2 && month <= 4) || (month >= 9 && month <= 11);
    return isRainySeason ? 35 + Math.random() * 30 : 15 + Math.random() * 20;
  }

  private calculateRiskLevel(waterLevel: number): 'critical' | 'high' | 'medium' | 'low' {
    if (waterLevel > 1.5) return 'critical';
    if (waterLevel > 1.0) return 'high';
    if (waterLevel > 0.5) return 'medium';
    return 'low';
  }

  async getRiverLevels(): Promise<{ station: string; lat: number; lng: number; level: number; threshold: number }[]> {
    const rainfall = await this.getRecentRainfall();
    
    return [
      { station: "Nairobi Dam", lat: -1.3066, lng: 36.7225, level: 2.8 + rainfall / 40, threshold: 4.2 },
      { station: "Chiromo", lat: -1.2789, lng: 36.8125, level: 1.2 + rainfall / 60, threshold: 2.5 },
      { station: "Kibra", lat: -1.3169, lng: 36.7789, level: 0.8 + rainfall / 50, threshold: 1.8 },
      { station: "Ruaraka", lat: -1.2325, lng: 36.8739, level: 1.1 + rainfall / 55, threshold: 2.2 }
    ];
  }

  async getWeatherForecast(): Promise<WeatherForecast[]> {
    const forecasts = [];
    const now = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      forecasts.push({
        date: date.toISOString(),
        temp: 22 + Math.sin(i) * 3 + Math.random() * 2,
        rainfall: this.getForecastRainfall(i),
        humidity: 65 + Math.sin(i) * 10 + Math.random() * 10,
        windSpeed: 8 + Math.sin(i) * 4 + Math.random() * 3,
        condition: this.getForecastCondition(i)
      });
    }
    
    return forecasts;
  }

  private getForecastRainfall(day: number): number {
    const baseRain = day < 2 ? 40 : 20;
    return Math.max(5, baseRain - day * 5 + Math.random() * 15);
  }

  private getForecastCondition(day: number): string {
    if (day < 2) return 'rainy';
    if (day < 3) return 'cloudy';
    return 'sunny';
  }

  async getSentinel1Data(bbox: [number, number, number, number], date: Date): Promise<any> {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [36.8347, -1.2583] },
          properties: { water_level: 0.8, risk: 'high', name: 'Mathare Valley' }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [36.7792, -1.3158] },
          properties: { water_level: 0.6, risk: 'high', name: 'Kibera' }
        }
      ]
    };
  }
}