/**
 * WebIntent Configuration & Feature Flags
 * Includes the explicit MetaMask Wallet Connection Flag as requested
 */

const CONFIG = {
  // =========================================================================
  // USER FLAG: MetaMask Wallet Connection Flag
  // Set to true to require and interact with live MetaMask on Sepolia testnet.
  // Set to false to run in simulated testnet sandbox mode (ideal for testing/preview).
  // Can also be toggled in real-time from the UI top navigation flag badge.
  // =========================================================================
  FLAG_ENABLE_METAMASK: true,

  // Sepolia (Sephio) Testnet Parameters
  SEPOLIA: {
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18
    },
    rpcUrls: [
      'https://rpc.sepolia.org',
      'https://ethereum-sepolia.publicnode.com',
      'https://sepolia.gateway.tenderly.co'
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  },

  // Backend API route for speech intent extraction
  API_ROUTE: '/api/extract-intent',

  // Fallback default testnet recipient (Sepolia Vault)
  DEFAULT_RECIPIENT: '0x71C66332e9a37793d5d44322840515c325672325',
  DEFAULT_AMOUNT: 0.05,

  // Disney Transition Settings
  DISNEY_EFFECT: {
    particleCount: 160,
    durationMs: 2400,
    audioChimesEnabled: true,
    colors: ['#FFDF00', '#00FFA3', '#FFFFFF', '#67E8F9', '#F472B6']
  }
};

// Check local storage for persistent override of the MetaMask flag if user changed it
try {
  const savedFlag = localStorage.getItem('WEBINTENT_METAMASK_ENABLED');
  if (savedFlag !== null) {
    CONFIG.FLAG_ENABLE_METAMASK = savedFlag === 'true';
  }
} catch (e) {
  console.warn('[Config] Could not access localStorage for flag override:', e);
}

// Expose globally
window.CONFIG = CONFIG;
console.log(`[WebIntent Config] Initialized. MetaMask Flag = ${CONFIG.FLAG_ENABLE_METAMASK}`);
