let currentSection = 'dashboard';
let isMuted = false;
let updateInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Nairobi Flood EWS');
    
    setTimeout(() => {
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.classList.add('hide');
    }, 1500);
    
    await loadDashboardData();
    await loadAlerts();
    await loadEvacuationCenters();
    await loadWeatherForecast();
    
    setupEventListeners();
    startRealTimeUpdates();
    await requestPermissions();
    
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    
    console.log('✅ System ready');
});

function setupEventListeners() {
    document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });
    
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.querySelector('.nav-menu')?.classList.toggle('active');
    });
    
    document.getElementById('muteAlertsBtn')?.addEventListener('click', () => {
        isMuted = !isMuted;
        const btn = document.getElementById('muteAlertsBtn');
        btn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i> Unmute' : '<i class="fas fa-volume-up"></i> Mute';
        showToast(`Alerts ${isMuted ? 'muted' : 'unmuted'}`, 'info');
    });
    
    document.getElementById('floodReportForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const report = {
            location: document.getElementById('reportLocation').value,
            waterLevel: document.getElementById('reportWaterLevel').value,
            description: document.getElementById('reportDesc').value,
            phone: document.getElementById('reportPhone').value
        };
        
        try {
            await API.submitReport(report);
            showToast('Report submitted successfully!', 'success');
            e.target.reset();
        } catch (error) {
            showToast('Failed to submit report', 'error');
        }
    });
}

function switchSection(section) {
    currentSection = section;
    document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });
    document.querySelectorAll('.section').forEach(sect => {
        sect.classList.toggle('active', sect.id === `${section}Section`);
    });
}

async function loadDashboardData() {
    try {
        const floodData = await API.getFloodData();
        const zones = await API.getRiskZones();
        
        if (floodData.length > 0) {
            const avgRisk = calculateOverallRisk(floodData);
            document.getElementById('riskLevel').textContent = avgRisk.toUpperCase();
            document.getElementById('riskLevel').className = `stat-value risk-${avgRisk}`;
            
            const totalRainfall = floodData.reduce((sum, z) => sum + z.rainfall24h, 0) / floodData.length;
            document.getElementById('rainfall').textContent = `${totalRainfall.toFixed(1)} mm`;
            
            const avgRiverLevel = floodData.reduce((sum, z) => sum + z.riverLevel, 0) / floodData.length;
            document.getElementById('riverLevel').textContent = `${avgRiverLevel.toFixed(1)} m`;
            
            const totalAffected = floodData.reduce((sum, z) => sum + z.affected, 0);
            document.getElementById('affected').textContent = totalAffected.toLocaleString();
        }
        
        renderRiskZones(zones);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function calculateOverallRisk(floodData) {
    const riskScores = floodData.map(z => {
        if (z.riskLevel === 'critical') return 4;
        if (z.riskLevel === 'high') return 3;
        if (z.riskLevel === 'medium') return 2;
        return 1;
    });
    const avgScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    if (avgScore >= 3.5) return 'critical';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
}

function renderRiskZones(zones) {
    const container = document.getElementById('riskZonesList');
    if (!container) return;
    
    container.innerHTML = zones.map(zone => `
        <div class="zone-card ${zone.riskLevel}" onclick="window.mapControls?.focusZone(${zone.lat}, ${zone.lng})">
            <h3><i class="fas fa-map-marker-alt"></i> ${zone.zone}</h3>
            <div>Risk: ${zone.riskLevel.toUpperCase()}</div>
            <div>Population: ${zone.population.toLocaleString()}</div>
            <div>Water level: ${zone.waterLevel.toFixed(1)}m</div>
            <div>Affected: ${zone.affected.toLocaleString()}</div>
        </div>
    `).join('');
}

async function loadAlerts() {
    try {
        const alerts = await API.getActiveAlerts();
        renderAlerts(alerts);
        
        const criticalAlerts = alerts.filter(a => a.severity === 'RED');
        if (criticalAlerts.length > 0 && !isMuted) {
            showToast(criticalAlerts[0].message, 'error');
            if (Notification.permission === 'granted') {
                new Notification('🚨 FLOOD EMERGENCY', { body: criticalAlerts[0].message });
            }
        }
    } catch (error) {
        console.error('Failed to load alerts:', error);
    }
}

function renderAlerts(alerts) {
    const container = document.getElementById('alertsList');
    if (!container) return;
    
    if (alerts.length === 0) {
        container.innerHTML = '<div class="no-alerts"><i class="fas fa-check-circle"></i><p>No active alerts. Stay safe!</p></div>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="alert alert-${alert.severity.toLowerCase()}">
            <div class="alert-header">
                <span class="alert-severity"><i class="fas ${getSeverityIcon(alert.severity)}"></i> ${alert.severity} ALERT</span>
                <span class="alert-time">${formatTime(alert.timestamp)}</span>
            </div>
            <div class="alert-content">
                <strong>📍 ${alert.zone}</strong>
                <p>${alert.message}</p>
                ${alert.severity === 'RED' ? `
                    <div class="alert-actions">
                        <button class="alert-btn" onclick="window.mapControls?.evacuationRoute('${alert.zone}')">
                            <i class="fas fa-route"></i> Evacuation Route
                        </button>
                        <button class="alert-btn emergency" onclick="window.callEmergency()">
                            <i class="fas fa-phone"></i> Call for Help
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function loadEvacuationCenters() {
    try {
        const centers = await API.getEvacuationCenters();
        const container = document.getElementById('evacCentersList');
        if (container) {
            container.innerHTML = centers.map(center => `
                <div class="center-card" onclick="window.mapControls?.centerLocation(${center.lat}, ${center.lng})">
                    <h3><i class="fas fa-building"></i> ${center.name}</h3>
                    <div>Capacity: ${center.capacity.toLocaleString()}</div>
                    <div>Occupancy: ${center.currentOccupancy.toLocaleString()}</div>
                    <div>Contact: ${center.contact}</div>
                    <div>Status: ${center.status.toUpperCase()}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load evacuation centers:', error);
    }
}

async function loadWeatherForecast() {
    try {
        const forecast = await API.getWeatherForecast();
        const container = document.getElementById('weatherList');
        if (container) {
            container.innerHTML = forecast.map(day => `
                <div class="forecast-card">
                    <div class="forecast-date">${new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</div>
                    <i class="fas ${getWeatherIcon(day.condition)}"></i>
                    <div>${day.temp.toFixed(0)}°C</div>
                    <div><i class="fas fa-tint"></i> ${day.rainfall.toFixed(0)}%</div>
                    <div><i class="fas fa-wind"></i> ${day.humidity.toFixed(0)}%</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load weather forecast:', error);
    }
}

async function requestPermissions() {
    if ('Notification' in window) await Notification.requestPermission();
}

function startRealTimeUpdates() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(async () => {
        console.log('🔄 Refreshing data...');
        await loadDashboardData();
        await loadAlerts();
        await loadWeatherForecast();
    }, 300000);
}