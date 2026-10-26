/**
 * Web3 Provider & Sepolia Testnet Wallet Handler
 * Integrates directly with window.ethereum (MetaMask) when FLAG_ENABLE_METAMASK is active,
 * or runs in high-fidelity Sepolia simulation sandbox mode.
 */

class Web3WalletProvider {
  constructor() {
    this.account = null;
    this.chainId = null;
    this.balance = '2.500'; // Default sandbox balance
    this.isMetaMaskAvailable = typeof window.ethereum !== 'undefined';
    this.sepoliaChainIdHex = window.CONFIG?.SEPOLIA?.chainIdHex || '0xaa36a7';
    this.sepoliaParams = window.CONFIG?.SEPOLIA || {
      chainId: '0xaa36a7',
      chainName: 'Sepolia Testnet',
      nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
      rpcUrls: ['https://rpc.sepolia.org'],
      blockExplorerUrls: ['https://sepolia.etherscan.io']
    };

    this.initListeners();
  }

  isFlagActive() {
    return window.CONFIG?.FLAG_ENABLE_METAMASK === true;
  }

  initListeners() {
    if (this.isMetaMaskAvailable && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          this.account = accounts[0];
          this.updateBalance();
        } else {
          this.account = null;
        }
        window.dispatchEvent(new CustomEvent('walletStateChanged', { detail: { account: this.account } }));
      });

      window.ethereum.on('chainChanged', (chainId) => {
        this.chainId = chainId;
        window.dispatchEvent(new CustomEvent('walletStateChanged', { detail: { chainId } }));
      });
    }
  }

  /**
   * Connect to wallet based on the MetaMask Flag
   */
  async connect() {
    if (this.isFlagActive()) {
      if (!this.isMetaMaskAvailable) {
        throw new Error('MetaMask is not installed. Please install the MetaMask extension or disable the MetaMask flag for sandbox mode.');
      }

      // Request MetaMask Accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.account = accounts[0];

      // Ensure connected to Sepolia Testnet
      await this.ensureSepoliaNetwork();
      await this.updateBalance();

      return {
        mode: 'METAMASK_LIVE',
        account: this.account,
        balance: this.balance,
        network: 'Sepolia Testnet (0xaa36a7)'
      };
    } else {
      // Mock Sandbox Mode
      this.account = '0x2546BcD3c84621e976D8185a91A922aE77ECEc30';
      return {
        mode: 'SIMULATION_SANDBOX',
        account: this.account,
        balance: this.balance,
        network: 'Sepolia Sandbox (0xaa36a7)'
      };
    }
  }

  /**
   * Switch or Add Sepolia Testnet to MetaMask
   */
  async ensureSepoliaNetwork() {
    if (!this.isMetaMaskAvailable) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.sepoliaChainIdHex }]
      });
    } catch (switchError) {
      // 4902: Chain not added yet
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [this.sepoliaParams]
        });
      } else {
        console.warn('[Web3] Network switch warning:', switchError);
      }
    }
  }

  /**
   * Fetch current balance
   */
  async updateBalance() {
    if (this.isFlagActive() && this.isMetaMaskAvailable && this.account) {
      try {
        const balanceHex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [this.account, 'latest']
        });
        const wei = BigInt(balanceHex);
        this.balance = (Number(wei) / 1e18).toFixed(4);
      } catch (err) {
        console.warn('[Web3] Balance fetch error:', err);
      }
    }
    return this.balance;
  }

  /**
   * Execute Crypto Transfer on Sepolia Testnet
   * @param {string} recipientAddress
   * @param {number} amountEth
   */
  async executeTransfer(recipientAddress, amountEth) {
    if (this.isFlagActive() && this.isMetaMaskAvailable && this.account) {
      // Convert ETH to hex Wei string
      const weiAmount = BigInt(Math.floor(amountEth * 1e18));
      const hexValue = '0x' + weiAmount.toString(16);

      // Trigger real MetaMask transaction on Sepolia
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this.account,
          to: recipientAddress,
          value: hexValue,
          chainId: this.sepoliaChainIdHex
        }]
      });

      return {
        success: true,
        txHash: txHash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
        mode: 'METAMASK_LIVE',
        amount: amountEth,
        recipient: recipientAddress
      };
    } else {
      // High-fidelity Sepolia Simulation Mode
      await new Promise(resolve => setTimeout(resolve, 1800)); // Simulate testnet confirmation
      const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const txHash = '0x' + randomHex;

      const currentNum = parseFloat(this.balance);
      this.balance = Math.max(0, currentNum - amountEth).toFixed(4);

      return {
        success: true,
        txHash: txHash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
        mode: 'SIMULATION_SANDBOX',
        amount: amountEth,
        recipient: recipientAddress
      };
    }
  }
}

window.Web3WalletProvider = Web3WalletProvider;
