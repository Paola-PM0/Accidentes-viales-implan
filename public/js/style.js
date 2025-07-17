 // Mostrar/Ocultar Panel
    const toggleBtn = document.getElementById('toggleDashboardBtn');
    const dashboard = document.getElementById('dashboardPanel');

    toggleBtn.addEventListener('click', () => {
    const visible = dashboard.style.display !== 'none';
    dashboard.style.display = visible ? 'none' : 'flex';
    toggleBtn.textContent = visible ? 'Mostrar Panel' : 'Ocultar Panel';
    });
