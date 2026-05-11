export interface FloodData {
  id: string;
  zone: string;
  lat: number;
  lng: number;
  waterLevel: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  rainfall24h: number;
  riverLevel: number;
  population: number;
  affected: number;
  ndwi?: number;
}

export interface Alert {
  id: number;
  severity: 'RED' | 'ORANGE' | 'YELLOW';
  zone: string;
  message: string;
  timestamp: Date;
  actions?: string[];
}

export interface EvacuationCenter {
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  contact: string;
  status: 'open' | 'full' | 'closed';
  resources: string[];
}

export interface WeatherForecast {
  date: string;
  temp: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}

export interface UserReport {
  id: string;
  location: string;
  lat?: number;
  lng?: number;
  waterLevel: string;
  description: string;
  imageUrl?: string;
  phone?: string;
  timestamp: Date;
  verified: boolean;
}

export interface RoadClosure {
  id: string;
  road: string;
  lat: number;
  lng: number;
  status: 'closed' | 'caution' | 'open';
  waterDepth: string;
  reportedBy: string;
  time: Date;
  verified: boolean;
}

export interface HelpRequest {
  id: number;
  type: string;
  location: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  responder?: string;
}

export interface PriceReport {
  id: string;
  item: string;
  price: number;
  location: string;
  reportedBy: string;
  timestamp: Date;
  verified: boolean;
}