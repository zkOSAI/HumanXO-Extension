document.addEventListener('DOMContentLoaded', function () {
  const loginBtn = document.getElementById('login-btn');
  const generateKeyBtn = document.getElementById('generate-key-btn');
  const keyContainer = document.getElementById('key-container');
  const privateKeyText = document.getElementById('private-key-text');
  const copyKeyBtn = document.getElementById('copy-key');
  const keyInputPanel = document.getElementById('key-input-panel');
  const privateKeyInput = document.getElementById('private-key-input');
  const submitKeyBtn = document.getElementById('submit-key');


  loginBtn.style.display = 'block';
  generateKeyBtn.style.display = 'block';
  keyContainer.style.display = 'none';
  keyInputPanel.style.display = 'none';

  loginBtn.addEventListener('click', function () {
    loginBtn.style.display = 'none';
    keyInputPanel.style.display = 'block';
  });

  submitKeyBtn.addEventListener('click', async function () {
    const inputKey = privateKeyInput.value.trim();

    if (inputKey === '') {
      return;
    }

    try {
      const verifyResponse = await verifyKeyInDatabase({ privateKey: inputKey });

      if (verifyResponse.success) {
        const userInfo = {
          privateKey: inputKey,
          userId: verifyResponse.userId || generateUserId()
        };

        await chrome.storage.local.set({ userInfo });
        window.location.href = '../popup/popup.html';
      } else {
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

  generateKeyBtn.addEventListener('click', async function () {
    try {
      const privateKey = generateUniqueKey();

      generateKeyBtn.style.display = 'none';
      keyContainer.style.display = 'block';

      privateKeyText.textContent = formatPrivateKey(privateKey);

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

  copyKeyBtn.addEventListener('click', function () {
    chrome.storage.local.get(['userInfo'], function (result) {
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

  privateKeyInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
      submitKeyBtn.click();
    }
  });
});

function generateUniqueKey() {
  // Generate random bytes for the key
  const keyBytes = new Uint8Array(32); // 32 bytes = 256 bits
  crypto.getRandomValues(keyBytes);
  
  // Convert key bytes to hex string
  const keyHex = Array.from(keyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Calculate simple checksum
  const checksum = calculateSimpleChecksum(keyHex);
  
  // Return key with checksum appended
  return keyHex + checksum;
}

function calculateSimpleChecksum(str) {
  // Simple FNV-like hash for demonstration
  let hash = 0x811c9dc5; // FNV offset basis
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  
  // Convert to 8-character hex string
  return (hash >>> 0).toString(16).padStart(8, '0');
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
    const response = await fetch('http://api.zkos.ai/api/users/verify', {
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

    chrome.storage.local.set({ key: userInfo.privateKey }, function () {
      console.log("Data saved");
    });

    return await response.json();
  } catch (error) {
    console.error('Verification error:', error);
    return { success: false, message: error.message };
  }
}

async function registerKeyInDatabase(userInfo) {
  try {
    const response = await fetch('http://api.zkos.ai/api/users/register', {
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