const API_BASE = '/api';

const API = {
    async getFloodData() {
        const response = await fetch(`${API_BASE}/flood/current`);
        const data = await response.json();
        return data.data;
    },
    
    async getRiskZones() {
        const response = await fetch(`${API_BASE}/flood/zones`);
        const data = await response.json();
        return data.data;
    },
    
    async getActiveAlerts() {
        const response = await fetch(`${API_BASE}/alerts/active`);
        const data = await response.json();
        return data.data;
    },
    
    async getEvacuationCenters() {
        const response = await fetch(`${API_BASE}/evacuation-centers`);
        const data = await response.json();
        return data.data;
    },
    
    async getWeatherForecast() {
        const response = await fetch(`${API_BASE}/weather/forecast`);
        const data = await response.json();
        return data.data;
    },
    
    async getRiverLevels() {
        const response = await fetch(`${API_BASE}/river-levels`);
        const data = await response.json();
        return data.data;
    },
    
    async getRoadClosures() {
        const response = await fetch(`${API_BASE}/roads/closures`);
        const data = await response.json();
        return data.data;
    },
    
    async getPrices() {
        const response = await fetch(`${API_BASE}/prices`);
        const data = await response.json();
        return data.data;
    },
    
    async submitReport(report) {
        const response = await fetch(`${API_BASE}/reports/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
        });
        return response.json();
    },
    
    async subscribe(contact) {
        const response = await fetch(`${API_BASE}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contact)
        });
        return response.json();
    },
    
    async postHelpRequest(request) {
        const response = await fetch(`${API_BASE}/help/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
        return response.json();
    }
};