function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`;
    return date.toLocaleDateString();
}

function getSeverityIcon(severity) {
    const icons = { RED: 'fa-exclamation-triangle', ORANGE: 'fa-exclamation-circle', YELLOW: 'fa-bell' };
    return icons[severity] || 'fa-info-circle';
}

function getWeatherIcon(condition) {
    const icons = {
        sunny: 'fa-sun',
        cloudy: 'fa-cloud',
        rainy: 'fa-cloud-rain',
        stormy: 'fa-cloud-showers-heavy',
        'partly-cloudy': 'fa-cloud-sun'
    };
    return icons[condition] || 'fa-cloud-sun';
}

window.showSafetyTips = () => {
    alert('🏠 BEFORE FLOOD:\n• Prepare emergency kit\n• Know evacuation routes\n• Keep documents safe\n\n🚨 DURING FLOOD:\n• Move to higher ground\n• Avoid flood water\n• Turn off electricity\n\n✅ AFTER FLOOD:\n• Wait for all-clear\n• Avoid contaminated water\n• Document damage');
};

window.showEvacuationGuide = () => {
    alert('🚶‍♂️ EVACUATION GUIDE:\n\n1. Stay calm\n2. Grab emergency kit\n3. Follow marked routes\n4. Go to nearest center\n5. Help others\n6. Listen to announcements');
};

window.showEmergencyKit = () => {
    alert('🎒 EMERGENCY KIT:\n\n✓ Water (3 days)\n✓ Non-perishable food\n✓ First aid kit\n✓ Flashlight\n✓ Whistle\n✓ Documents\n✓ Cash\n✓ Phone & charger\n✓ Medications\n✓ Blankets');
};

window.callEmergency = () => {
    if (confirm('Emergency services will be contacted. Do you need immediate assistance?')) {
        window.location.href = 'tel:999';
    }
};

window.quickActions = {
    safe: () => showToast('Stay safe! Emergency services notified.', 'success'),
    roadClosure: () => {
        const road = prompt('Enter road name:');
        if (road) showToast(`Road closure reported: ${road}`, 'warning');
    },
    water: () => showToast('Nearest water point: Kasarani Stadium (2.3 km)', 'info'),
    price: () => {
        const item = prompt('What item is overpriced?');
        if (item) showToast(`Price gouging reported for ${item}`, 'warning');
    }
};