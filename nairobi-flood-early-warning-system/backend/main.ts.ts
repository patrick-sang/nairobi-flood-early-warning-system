import { Application, Router, send, oakCors, config } from './deps.ts';
import { GEEService } from './services/gee-service.ts';
import { FloodData, Alert, UserReport, RoadClosure, HelpRequest } from './types/index.ts';

await config({ export: true, allowEmptyValues: true });

const app = new Application();
const router = new Router();
const geeService = GEEService.getInstance();

// Middleware
app.use(oakCors());
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set('X-Response-Time', `${ms}ms`);
});

// Health check
router.get('/api/health', (ctx) => {
  ctx.response.body = { 
    status: 'ok', 
    timestamp: new Date(),
    version: '2.0.0'
  };
});

// Get current flood data
router.get('/api/flood/current', async (ctx) => {
  const floodData = await geeService.getFloodRiskZones();
  ctx.response.body = { success: true, data: floodData, timestamp: new Date() };
});

// Get flood risk zones
router.get('/api/flood/zones', async (ctx) => {
  const zones = await geeService.getFloodRiskZones();
  ctx.response.body = { success: true, data: zones };
});

// Get active alerts
router.get('/api/alerts/active', (ctx) => {
  const alerts: Alert[] = [
    {
      id: 1,
      severity: 'RED',
      zone: 'Mathare Valley',
      message: 'IMMEDIATE EVACUATION: Water levels rising rapidly. Move to Kasarani Stadium immediately.',
      timestamp: new Date(),
      actions: ['evacuate', 'call-help']
    },
    {
      id: 2,
      severity: 'ORANGE',
      zone: 'Kibera',
      message: 'Prepare for evacuation. Water levels approaching warning threshold.',
      timestamp: new Date(Date.now() - 30 * 60000),
      actions: ['prepare']
    }
  ];
  ctx.response.body = { success: true, data: alerts };
});

// Get evacuation centers
router.get('/api/evacuation-centers', (ctx) => {
  const centers = [
    { name: "Kasarani Stadium", lat: -1.2267, lng: 36.8969, capacity: 60000, currentOccupancy: 12340, contact: "0700123456", status: "open", resources: ["water", "food", "medical"] },
    { name: "Nyayo Stadium", lat: -1.3081, lng: 36.8225, capacity: 30000, currentOccupancy: 8900, contact: "0700123457", status: "open", resources: ["water", "food"] },
    { name: "Moi International Sports Centre", lat: -1.2272, lng: 36.8964, capacity: 80000, currentOccupancy: 5600, contact: "0700123458", status: "open", resources: ["water", "food", "medical"] },
    { name: "City Stadium", lat: -1.2851, lng: 36.8251, capacity: 15000, currentOccupancy: 3200, contact: "0700123459", status: "open", resources: ["water"] }
  ];
  ctx.response.body = { success: true, data: centers };
});

// Get weather forecast
router.get('/api/weather/forecast', async (ctx) => {
  const forecast = await geeService.getWeatherForecast();
  ctx.response.body = { success: true, data: forecast };
});

// Get river levels
router.get('/api/river-levels', async (ctx) => {
  const levels = await geeService.getRiverLevels();
  ctx.response.body = { success: true, data: levels };
});

// Submit flood report
router.post('/api/reports/submit', async (ctx) => {
  const body = await ctx.request.body().value;
  const report: UserReport = {
    id: crypto.randomUUID(),
    location: body.location,
    lat: body.lat,
    lng: body.lng,
    waterLevel: body.waterLevel,
    description: body.description,
    phone: body.phone,
    timestamp: new Date(),
    verified: false
  };
  console.log('New report:', report);
  ctx.response.body = { success: true, data: report };
});

// Get road closures
router.get('/api/roads/closures', (ctx) => {
  const closures: RoadClosure[] = [
    {
      id: "1",
      road: "Waiyaki Way near Westlands",
      lat: -1.2675, lng: 36.8038,
      status: "closed",
      waterDepth: "waist deep",
      reportedBy: "Traffic police",
      time: new Date(),
      verified: true
    },
    {
      id: "2",
      road: "Mombasa Road near General Motors",
      lat: -1.3192, lng: 36.8589,
      status: "caution",
      waterDepth: "ankle deep",
      reportedBy: "Community report",
      time: new Date(Date.now() - 2 * 3600000),
      verified: false
    }
  ];
  ctx.response.body = { success: true, data: closures };
});

// Post help request
router.post('/api/help/request', async (ctx) => {
  const body = await ctx.request.body().value;
  const request: HelpRequest = {
    id: Date.now(),
    type: body.type,
    location: body.location,
    description: body.description,
    status: 'open'
  };
  ctx.response.body = { success: true, data: request };
});

// Get price reports
router.get('/api/prices', (ctx) => {
  const prices = [
    { item: "Water (20L)", currentPrice: 50, normalPrice: 40, location: "Mathare", reported: true },
    { item: "Unga (2kg)", currentPrice: 180, normalPrice: 150, location: "Kibera", reported: true },
    { item: "Matatu fare", currentPrice: 150, normalPrice: 50, location: "Eastlands", reported: true }
  ];
  ctx.response.body = { success: true, data: prices };
});

// Subscribe to alerts
router.post('/api/subscribe', async (ctx) => {
  const body = await ctx.request.body().value;
  console.log('New subscriber:', body.phone || body.email);
  ctx.response.body = { success: true, message: "Subscribed to alerts successfully" };
});

// Serve static files
router.get('/(.*)', async (ctx) => {
  const filePath = ctx.request.url.pathname;
  try {
    await send(ctx, filePath, {
      root: `${Deno.cwd()}/frontend`,
      index: 'index.html',
    });
  } catch {
    await send(ctx, '/index.html', {
      root: `${Deno.cwd()}/frontend`,
    });
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = parseInt(Deno.env.get('PORT') || '8000');
console.log(`🚀 Nairobi Flood Early Warning System running on http://localhost:${port}`);
console.log(`📡 GEE Service Account: ${Deno.env.get('GEE_CLIENT_EMAIL')}`);

await app.listen({ port });