chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// Function to inject the global variable
function injectGlobalVariable(tabId) {
  chrome.scripting.executeScript({
    target: {tabId: tabId},
    func: () => {
      window.humanextension = true;
      document.documentElement.setAttribute('human-extension-installed', true);
      var isInstalled = document.documentElement.getAttribute('human-extension-installed'); 
      console.log("is installed::", isInstalled);
      console.log("this is setting");
      console.log('Human extension global variable has been set');
    }
  });
}


chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request) {
        if (request.message) {
            if (request.message == "version") {
                sendResponse({version: 1.0});
            }
        }
    }
    return true;
});

// Execute when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  injectGlobalVariable(tab.id);
});

// Optionally, inject into all tabs when they're updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.startsWith('http')) {
    injectGlobalVariable(tabId);
  }
});