document.addEventListener('DOMContentLoaded', function() {
  const loginBtn = document.getElementById('login-btn');
  const generateKeyBtn = document.getElementById('generate-key-btn');
  const keyContainer = document.getElementById('key-container');
  const privateKeyText = document.getElementById('private-key-text');
  const copyKeyBtn = document.getElementById('copy-key');
  const keyInputPanel = document.getElementById('key-input-panel');
  const privateKeyInput = document.getElementById('private-key-input');
  const submitKeyBtn = document.getElementById('submit-key');
  
  // Always ensure both buttons are visible when opening the extension
  // and hide any previously shown key
  loginBtn.style.display = 'block';
  generateKeyBtn.style.display = 'block';
  keyContainer.style.display = 'none';
  keyInputPanel.style.display = 'none';
  
  // Login button click - Show input panel
  loginBtn.addEventListener('click', function() {
    loginBtn.style.display = 'none';
    keyInputPanel.style.display = 'block';
  });
  
  // Submit key button click
  submitKeyBtn.addEventListener('click', async function() {
    const inputKey = privateKeyInput.value.trim();
    
    if (inputKey === '') {
      // Do nothing if the input is empty (no notification needed)
      return;
    }
    
    try {
      // Check if key exists in database
      const verifyResponse = await verifyKeyInDatabase({ privateKey: inputKey });
      
      if (verifyResponse.success) {
        // If key exists, store it and proceed to main page
        const userInfo = {
          privateKey: inputKey,
          userId: verifyResponse.userId || generateUserId()
        };
        
        await chrome.storage.local.set({ userInfo });
        window.location.href = '../popup/popup.html';
      } else {
        // If key doesn't exist, register it as a new user
        const userInfo = {
          privateKey: inputKey,
          userId: generateUserId()
        };
        
        const registerResponse = await registerKeyInDatabase(userInfo);
        
        if (registerResponse.success) {
          if (registerResponse.userId) {
            userInfo.userId = registerResponse.userId;
          }
          
          await chrome.storage.local.set({ userInfo });
          window.location.href = '../popup/popup.html';
        } else {
          console.error('Registration failed:', registerResponse.message);
          alert('Login failed: ' + (registerResponse.message || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  });
  
  // Generate a new unique key
  generateKeyBtn.addEventListener('click', async function() {
    try {
      const privateKey = generateUniqueKey();
      
      // Hide the generate key button and show the key container in its place
      generateKeyBtn.style.display = 'none';
      keyContainer.style.display = 'block';
      
      // Show the generated key
      privateKeyText.textContent = formatPrivateKey(privateKey);
      
      // Store the key locally (but don't send to DB yet)
      const userInfo = {
        privateKey: privateKey,
        userId: generateUserId()
      };
      
      await chrome.storage.local.set({ userInfo });
      
    } catch (error) {
      console.error('Error generating key:', error);
      alert('Failed to generate key. Please try again.');
    }
  });
  
  // Copy key button functionality
  copyKeyBtn.addEventListener('click', function() {
    chrome.storage.local.get(['userInfo'], function(result) {
      if (result.userInfo && result.userInfo.privateKey) {
        navigator.clipboard.writeText(result.userInfo.privateKey)
          .then(() => {
            const originalImg = copyKeyBtn.querySelector('img');
            copyKeyBtn.innerHTML = '';
            const successImg = document.createElement('img');
            successImg.src = "../images/checkmark-icon.png";
            successImg.width = 15;
            successImg.height = 15;
            successImg.alt = "Copied";
            copyKeyBtn.appendChild(successImg);
            
            setTimeout(() => {
              copyKeyBtn.innerHTML = '';
              copyKeyBtn.appendChild(originalImg);
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy:', err);
          });
      }
    });
  });
  
  // Add Enter key support for the private key input
  privateKeyInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      submitKeyBtn.click();
    }
  });
});

function generateUniqueKey() {
  const keyBytes = new Uint8Array(64);
  crypto.getRandomValues(keyBytes);
  
  return Array.from(keyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 15);
}

function formatPrivateKey(key) {
  if (key.length > 40) {
    return key.substring(0, 13) + '...' + key.substring(key.length - 13);
  }
  return key;
}

async function verifyKeyInDatabase(userInfo) {
  try {
    const response = await fetch('http://localhost:3000/api/users/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        privateKey: userInfo.privateKey
      })
    });
    
    if (response.status === 404) {
      return { success: false, message: 'Key not found' };
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Verification error:', error);
    return { success: false, message: error.message };
  }
}

async function registerKeyInDatabase(userInfo) {
  try {
    const response = await fetch('http://localhost:3000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userInfo.userId,
        privateKey: userInfo.privateKey
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: error.message };
  }
}