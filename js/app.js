/**
 * Main WebIntent Application Orchestrator
 * Integrates: Zero UI Voice Input, MetaMask Flag, Sepolia Testnet,
 * Evil Dark Cards, Frosted Glass Loader, and the Disney Transition.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Services
  const disney = new DisneyTransition('disneyParticleCanvas');
  const parser = new IntentParser(window.CONFIG?.API_ROUTE || '/api/extract-intent');
  const wallet = new Web3WalletProvider();

  // Current State
  let currentTransferData = {
    amount: 0.05,
    recipient: '0x71C66332e9a37793d5d44322840515c325672325',
    currency: 'Sepolia ETH',
    network: 'Sepolia Testnet (11155111)',
    rawText: 'Send 0.05 Sepolia ETH to 0x71C66332e9a37793d5d44322840515c325672325'
  };

  // DOM Elements
  const phraseBtn = document.getElementById('phraseBtn');
  const spokenDisplay = document.getElementById('spokenDisplay');
  const executeBtn = document.getElementById('executeBtn');
  const metaMaskToggle = document.getElementById('metaMaskToggle');
  const flagStatusIndicator = document.getElementById('flagStatusIndicator');
  const flagStatusText = document.getElementById('flagStatusText');
  const walletConnectBtn = document.getElementById('walletConnectBtn');
  const walletAddressDisplay = document.getElementById('walletAddressDisplay');
  const walletBalanceDisplay = document.getElementById('walletBalanceDisplay');

  // Evil Card Display Fields
  const displayAmount = document.getElementById('displayAmount');
  const displayRecipient = document.getElementById('displayRecipient');
  const displayGas = document.getElementById('displayGas');
  const displayUsd = document.getElementById('displayUsd');

  // Frosted Glass Modal Elements
  const frostedModal = document.getElementById('frostedModal');
  const frostedTitle = document.getElementById('frostedTitle');
  const frostedSubtitle = document.getElementById('frostedSubtitle');
  const frostedCloseBtn = document.getElementById('frostedCloseBtn');
  const stepItems = document.querySelectorAll('.loader-step-item');
  const txSuccessContainer = document.getElementById('txSuccessContainer');
  const txHashLink = document.getElementById('txHashLink');
  const audioBars = document.querySelectorAll('.audio-bar');

  // -------------------------------------------------------------------------
  // 1. MetaMask Flag Initialization & Toggling
  // -------------------------------------------------------------------------
  function syncMetaMaskFlagUI() {
    const isEnabled = window.CONFIG.FLAG_ENABLE_METAMASK;
    if (metaMaskToggle) metaMaskToggle.checked = isEnabled;
    if (flagStatusIndicator) {
      if (isEnabled) {
        flagStatusIndicator.classList.add('active');
        flagStatusText.textContent = 'MetaMask Live Flag: ON';
      } else {
        flagStatusIndicator.classList.remove('active');
        flagStatusText.textContent = 'MetaMask Live Flag: OFF (Sandbox)';
      }
    }
  }

  syncMetaMaskFlagUI();

  if (metaMaskToggle) {
    metaMaskToggle.addEventListener('change', (e) => {
      window.CONFIG.FLAG_ENABLE_METAMASK = e.target.checked;
      try {
        localStorage.setItem('WEBINTENT_METAMASK_ENABLED', e.target.checked);
      } catch (err) {}
      syncMetaMaskFlagUI();
      console.log('[WebIntent] MetaMask Connection Flag toggled:', window.CONFIG.FLAG_ENABLE_METAMASK);
    });
  }

  // -------------------------------------------------------------------------
  // 2. Wallet Connection
  // -------------------------------------------------------------------------
  async function connectWallet() {
    try {
      walletConnectBtn.textContent = 'Connecting...';
      const result = await wallet.connect();
      const addr = result.account;
      const shortAddr = `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
      walletAddressDisplay.textContent = shortAddr;
      walletBalanceDisplay.textContent = `${result.balance} SEP`;
      walletConnectBtn.textContent = 'Connected';
      walletConnectBtn.style.borderColor = 'var(--accent-mint)';
    } catch (err) {
      console.warn('[Wallet Error]:', err);
      alert(err.message || 'Error connecting to MetaMask');
      walletConnectBtn.textContent = 'Connect Wallet';
    }
  }

  if (walletConnectBtn) {
    walletConnectBtn.addEventListener('click', connectWallet);
  }

  // Auto-connect on load in sandbox mode or if accounts available
  setTimeout(() => {
    connectWallet().catch(() => {});
  }, 300);

  // -------------------------------------------------------------------------
  // 3. Voice Recognition & Intent Extraction
  // -------------------------------------------------------------------------
  const voice = new VoiceRecognition({
    onStateChange: (state) => {
      if (state === 'listening') {
        phraseBtn.classList.add('listening');
        audioBars.forEach(b => b.classList.add('active'));
        spokenDisplay.innerHTML = `<em>Listening to your intent...</em>`;
      } else {
        phraseBtn.classList.remove('listening');
        audioBars.forEach(b => b.classList.remove('active'));
      }
    },
    onInterim: (text) => {
      spokenDisplay.innerHTML = `<span>"</span><em>${text}</em><span>"</span>`;
    },
    onResult: async (finalText) => {
      spokenDisplay.innerHTML = `<span>"</span><strong>${finalText}</strong><span>"</span>`;
      await processSpokenIntent(finalText);
    },
    onError: (err) => {
      console.warn('[Voice Notice]', err);
      spokenDisplay.innerHTML = `<span style="color: #f87171">Voice notice: Click a sample preset below or try speaking again.</span>`;
    }
  });

  // Mint Green Phrase Button Click
  if (phraseBtn) {
    phraseBtn.addEventListener('click', () => {
      voice.toggle();
    });
  }

  // Preset phrase chips
  document.querySelectorAll('.phrase-badge').forEach(badge => {
    badge.addEventListener('click', () => {
      const phrase = badge.getAttribute('data-phrase');
      if (phrase) {
        voice.simulatePhrase(phrase);
      }
    });
  });

  /**
   * Process spoken text via the /api/extract-intent route
   */
  async function processSpokenIntent(transcript) {
    try {
      spokenDisplay.innerHTML = `<em>Calling API route to parse intent...</em>`;
      const result = await parser.extract(transcript);

      if (result && result.extracted) {
        const { amount, recipient, recipientLabel, currency, gasEstimateGwei, estimatedValueUsd } = result.extracted;

        currentTransferData = {
          amount: amount,
          recipient: recipient,
          currency: currency || 'Sepolia ETH',
          network: 'Sepolia Testnet (11155111)',
          rawText: transcript
        };

        // Update Evil Dark Card UI
        displayAmount.textContent = `${amount}`;
        displayRecipient.textContent = recipient;
        displayRecipient.setAttribute('title', recipientLabel || recipient);
        displayGas.textContent = `~${gasEstimateGwei || '1.5'} Gwei`;
        displayUsd.textContent = `~$${estimatedValueUsd || (amount * 3200).toFixed(2)} USD`;

        spokenDisplay.innerHTML = `Captured: <strong>${amount} ${currency}</strong> to <em>${recipient.substring(0, 8)}...</em>`;
        console.log('[WebIntent] Updated transfer intent:', currentTransferData);
      }
    } catch (err) {
      console.error('[WebIntent] Intent parsing failed:', err);
      spokenDisplay.textContent = 'Could not parse intent. Try another phrase.';
    }
  }

  // -------------------------------------------------------------------------
  // 4. Solid White Execute Button & Disney Transition
  // -------------------------------------------------------------------------
  if (executeBtn) {
    executeBtn.addEventListener('click', async () => {
      // 1. Send the Disney Transition (Stardust Canvas + Synthetic Glockenspiel Chime!)
      disney.trigger(executeBtn);

      // 2. Open the Frosted Glass Loading Modal
      showFrostedLoader();

      try {
        // Step 1: Voice Intent Verification
        await advanceStep(0, 600);

        // Step 2: Sepolia Network Check
        await advanceStep(1, 700);

        // Step 3: Transaction execution via Web3 / MetaMask or Sandbox
        await advanceStep(2, 600);
        const txResult = await wallet.executeTransfer(
          currentTransferData.recipient,
          currentTransferData.amount
        );

        // Step 4: Confirmed on Sepolia!
        await advanceStep(3, 400);

        // Update Balance
        await wallet.updateBalance();
        walletBalanceDisplay.textContent = `${wallet.balance} SEP`;

        // Display Disney Success State
        showSuccessState(txResult);

        // Second wave of magical Disney stars on confirmation
        disney.trigger(frostedModal);
      } catch (err) {
        console.error('[Execution Error]:', err);
        frostedTitle.textContent = 'Transfer Incomplete';
        frostedSubtitle.textContent = err.message || 'Transaction was rejected or cancelled.';
        frostedCloseBtn.style.display = 'inline-block';
      }
    });
  }

  function showFrostedLoader() {
    frostedModal.classList.add('active');
    frostedTitle.textContent = 'Broadcasting to Sepolia';
    frostedSubtitle.textContent = `Executing transfer of ${currentTransferData.amount} Sepolia ETH with Zero UI Intent.`;
    frostedCloseBtn.style.display = 'none';
    txSuccessContainer.style.display = 'none';

    stepItems.forEach(item => {
      item.classList.remove('active', 'done');
    });
  }

  function advanceStep(stepIndex, delayMs) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (stepItems[stepIndex]) {
          stepItems[stepIndex].classList.add('active');
          if (stepIndex > 0 && stepItems[stepIndex - 1]) {
            stepItems[stepIndex - 1].classList.remove('active');
            stepItems[stepIndex - 1].classList.add('done');
          }
        }
        resolve();
      }, delayMs);
    });
  }

  function showSuccessState(txResult) {
    if (stepItems[stepItems.length - 1]) {
      stepItems[stepItems.length - 1].classList.remove('active');
      stepItems[stepItems.length - 1].classList.add('done');
    }

    frostedTitle.textContent = 'Magic Transfer Complete!';
    frostedSubtitle.textContent = `Successfully transferred ${txResult.amount} Sepolia ETH to ${txResult.recipient.substring(0, 10)}...`;

    txSuccessContainer.style.display = 'block';
    txHashLink.href = txResult.explorerUrl;
    txHashLink.textContent = txResult.txHash;
    frostedCloseBtn.style.display = 'inline-block';
  }

  if (frostedCloseBtn) {
    frostedCloseBtn.addEventListener('click', () => {
      frostedModal.classList.remove('active');
    });
  }

  // Copy recipient address button
  const copyAddressBtn = document.getElementById('copyAddressBtn');
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(currentTransferData.recipient);
      const originalText = copyAddressBtn.textContent;
      copyAddressBtn.textContent = 'Copied!';
      setTimeout(() => copyAddressBtn.textContent = originalText, 1500);
    });
  }
});
