import { config as dotenvConfig } from 'dotenv';

await dotenvConfig({ export: true, allowEmptyValues: true });

export interface GEEConfig {
  clientEmail: string;
  privateKey: string;
  projectId: string;
  keyFilePath?: string;
  privateKeyId?: string;
}

export interface AppConfig {
  env: 'development' | 'staging' | 'production';
  port: number;
  host: string;
  gee: GEEConfig;
  googleMapsApiKey: string;
  rateLimit: { requests: number; windowMs: number };
}

class Configuration {
  private static instance: Configuration;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): Configuration {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration();
    }
    return Configuration.instance;
  }

  private loadConfig(): AppConfig {
    const env = (Deno.env.get('DENO_ENV') || 'development') as 'development' | 'staging' | 'production';
    
    let geeConfig: GEEConfig;
    const geeKeyFilePath = Deno.env.get('GEE_KEY_FILE_PATH');
    
    if (geeKeyFilePath) {
      try {
        const keyFile = JSON.parse(Deno.readTextFileSync(geeKeyFilePath));
        geeConfig = {
          clientEmail: keyFile.client_email,
          privateKey: keyFile.private_key,
          projectId: keyFile.project_id,
          keyFilePath: geeKeyFilePath,
          privateKeyId: keyFile.private_key_id
        };
      } catch (error) {
        console.error('Failed to load GEE key file:', error);
        geeConfig = {
          clientEmail: Deno.env.get('GEE_CLIENT_EMAIL') || '',
          privateKey: Deno.env.get('GEE_PRIVATE_KEY') || '',
          projectId: Deno.env.get('GEE_PROJECT_ID') || ''
        };
      }
    } else {
      geeConfig = {
        clientEmail: Deno.env.get('GEE_CLIENT_EMAIL') || '',
        privateKey: Deno.env.get('GEE_PRIVATE_KEY') || '',
        projectId: Deno.env.get('GEE_PROJECT_ID') || ''
      };
    }

    return {
      env,
      port: parseInt(Deno.env.get('PORT') || '8000'),
      host: Deno.env.get('HOST') || '0.0.0.0',
      gee: geeConfig,
      googleMapsApiKey: Deno.env.get('GOOGLE_MAPS_API_KEY') || '',
      rateLimit: {
        requests: parseInt(Deno.env.get('RATE_LIMIT_REQUESTS') || '100'),
        windowMs: parseInt(Deno.env.get('RATE_LIMIT_WINDOW_MS') || '60000')
      }
    };
  }

  get(): AppConfig {
    return this.config;
  }

  isProduction(): boolean {
    return this.config.env === 'production';
  }
}

export const config = Configuration.getInstance();