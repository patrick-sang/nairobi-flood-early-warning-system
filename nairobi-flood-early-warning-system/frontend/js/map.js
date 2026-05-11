let map;
let riskLayers = [];
let heatmapLayer = null;
let userMarker = null;

async function initMap() {
    map = L.map('floodMap').setView([-1.286389, 36.817223], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    await loadFloodZones();
    await loadEvacCenters();
    
    if (window.userLocation) {
        addUserMarker(window.userLocation.lat, window.userLocation.lng);
    }
}

async function loadFloodZones() {
    try {
        const zones = await API.getRiskZones();
        
        zones.forEach(zone => {
            const color = getRiskColor(zone.riskLevel);
            const circle = L.circle([zone.lat, zone.lng], {
                radius: 500,
                color: color,
                fillColor: color,
                fillOpacity: 0.3,
                weight: 2
            }).addTo(map);
            
            circle.bindPopup(`
                <b>${zone.zone}</b><br>
                Risk: ${zone.riskLevel.toUpperCase()}<br>
                Water Level: ${zone.waterLevel.toFixed(1)}m<br>
                Population: ${zone.population.toLocaleString()}<br>
                Affected: ${zone.affected.toLocaleString()}
            `);
            
            riskLayers.push(circle);
        });
    } catch (error) {
        console.error('Failed to load flood zones:', error);
    }
}

async function loadEvacCenters() {
    try {
        const centers = await API.getEvacuationCenters();
        
        centers.forEach(center => {
            const marker = L.marker([center.lat, center.lng]).addTo(map);
            marker.bindPopup(`
                <b>${center.name}</b><br>
                Capacity: ${center.capacity.toLocaleString()}<br>
                Occupancy: ${center.currentOccupancy.toLocaleString()}<br>
                Contact: ${center.contact}<br>
                <button onclick="window.mapControls.centerLocation(${center.lat}, ${center.lng})">Get Directions</button>
            `);
        });
    } catch (error) {
        console.error('Failed to load evacuation centers:', error);
    }
}

function getRiskColor(risk) {
    const colors = { critical: '#d32f2f', high: '#ff9800', medium: '#ffeb3b', low: '#4caf50' };
    return colors[risk] || '#999';
}

function addUserMarker(lat, lng) {
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.marker([lat, lng]).bindPopup('You are here').addTo(map);
}

function locateUser() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                window.userLocation = { lat: latitude, lng: longitude };
                map.setView([latitude, longitude], 14);
                addUserMarker(latitude, longitude);
                showToast('Location found', 'success');
            },
            () => showToast('Unable to get location', 'error')
        );
    }
}

function toggleHeatmap() {
    if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
        heatmapLayer = null;
    } else {
        const heatData = riskLayers.map(layer => {
            const center = layer.getLatLng();
            return [center.lat, center.lng, 0.5];
        });
        heatmapLayer = L.heatLayer(heatData, { radius: 25, blur: 15 }).addTo(map);
    }
}

function resetMap() {
    map.setView([-1.286389, 36.817223], 12);
}

function focusZone(lat, lng) {
    map.setView([lat, lng], 14);
}

function centerLocation(lat, lng) {
    if (window.userLocation) {
        window.open(`https://www.google.com/maps/dir/${window.userLocation.lat},${window.userLocation.lng}/${lat},${lng}`, '_blank');
    } else {
        showToast('Please enable location', 'info');
        locateUser();
    }
}

function evacuationRoute(zone) {
    API.getEvacuationCenters().then(centers => {
        const center = centers[0];
        if (window.userLocation) {
            window.open(`https://www.google.com/maps/dir/${window.userLocation.lat},${window.userLocation.lng}/${center.lat},${center.lng}`, '_blank');
        } else {
            showToast('Please enable location', 'info');
        }
    });
}

window.mapControls = {
    locateMe: locateUser,
    heatmap: toggleHeatmap,
    reset: resetMap,
    focusZone,
    centerLocation,
    evacuationRoute
};

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', initMap);