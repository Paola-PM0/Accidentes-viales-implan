 // Mostrar/Ocultar Panel
   const toggleBtn = document.getElementById('toggleDashboardBtn');
   const dashboard = document.getElementById('dashboardPanel');

   toggleBtn.addEventListener('click', () => {
   const visible = dashboard.style.display !== 'none';
   dashboard.style.display = visible ? 'none' : 'flex';
   toggleBtn.textContent = visible ? 'Mostrar Panel' : 'Ocultar Panel';
   });


document.addEventListener('DOMContentLoaded', function () {
   const sidebar = document.getElementById('sidebarPanel');
   const main = document.querySelector('main');
   const toggleTab = document.getElementById('sidebarToggleTab');

   toggleTab.addEventListener('click', function () {
      sidebar.classList.toggle('hidden');

      if (sidebar.classList.contains('hidden')) {
         main.style.marginLeft = '0';
         toggleTab.style.left = '0';
      } else {
         main.style.marginLeft = '300px';
         toggleTab.style.left = '280px';
      }
   });
});