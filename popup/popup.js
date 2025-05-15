document.addEventListener('DOMContentLoaded', function() {
  const waveContainer = document.querySelector('.wave-container');
  const waveCircle = document.querySelector('.wave-circle');  
  // Create static concentric circles
  const rings = [
    { class: 'ring ring-1' },
    { class: 'ring ring-2' },
    { class: 'ring ring-3' }
  ];
  
  rings.forEach(ring => {
    const element = document.createElement('div');
    element.className = ring.class;
    waveContainer.appendChild(element);
  });
  
  // Create ripple animations
  for (let i = 0; i < 3; i++) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    waveContainer.appendChild(ripple);
  }
  
  // Optional subtle movement based on mouse movement
  waveContainer.addEventListener('mousemove', function(e) {
    const rect = waveContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Apply subtle movement to the center circle
    waveCircle.style.transform = 
      `translate(${x * 0.02}px, ${y * 0.02}px)`;
  });
  
  waveContainer.addEventListener('mouseleave', function() {
    waveCircle.style.transform = 'translate(0, 0)';
  });

  const openDashboardButton = document.getElementById('open-dashboard');
  if (openDashboardButton) {
    openDashboardButton.addEventListener('click', function() {
      window.open('https://www.zkos.ai/', '_blank');
    });
  }
});