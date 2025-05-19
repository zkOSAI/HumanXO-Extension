// content.js
// Inject a script element to set the global variable
const script = document.createElement('script');
script.textContent = `
  window.humanextension = true;
  console.log('Human extension global variable has been set');
`;
(document.head || document.documentElement).appendChild(script);
script.remove(); // Clean up after execution