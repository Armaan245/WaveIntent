const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Also serve root directory

// Known aliases / address book for Sepolia testnet demo
const KNOWN_ADDRESSES = {
  'vitalik': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  'vitalik.eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  'alice': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  'alice.eth': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  'bob': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  'bob.eth': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  'treasury': '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  'treasury.eth': '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  'sephio': '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  'developer': '0x2546BcD3c84621e976D8185a91A922aE77ECEc30'
};

// Word-to-number mapping for spoken phrases
const NUMBER_WORDS = {
  'zero': 0, 'oh': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'half': 0.5, 'quarter': 0.25, 'a': 1, 'an': 1
};

/**
 * Advanced extraction engine for voice transcripts
 * Handles spoken forms like:
 * - "Send 0.05 Sepolia ETH to 0x71C66332e9a37793d5d44322840515c325672325"
 * - "Transfer zero point one ETH to vitalik.eth"
 * - "Send half an eth to 0x2546BcD3c84621e976D8185a91A922aE77ECEc30 on sephio tenet"
 * - "Execute payment of point zero five to Alice"
 */
function extractCryptoIntent(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return {
      success: false,
      error: 'Transcript text is required'
    };
  }

  const cleanText = transcript.trim();
  const lower = cleanText.toLowerCase();

  // 1. Extract Amount
  let amount = null;
  let amountMatch = null;

  // Pattern A: standard digits (e.g. 0.05, .05, 1.25, 2)
  amountMatch = cleanText.match(/(?:send|transfer|pay|give|dispatch|execute)?\s*([0-9]*\.?[0-9]+)\s*(?:eth|ether|sepolia|sep|sephio)?/i);
  if (amountMatch && amountMatch[1] && !isNaN(parseFloat(amountMatch[1]))) {
    amount = parseFloat(amountMatch[1]);
  }

  // Pattern B: spoken words like "zero point zero five", "point one", "half", "one point five"
  if (amount === null) {
    if (lower.includes('half')) {
      amount = 0.5;
    } else if (lower.includes('quarter')) {
      amount = 0.25;
    } else {
      const pointMatch = lower.match(/(?:zero|one|two|three|four|five|six|seven|eight|nine|oh)?\s*(?:point|dot)\s*([a-z\s]+)/);
      if (pointMatch) {
        const words = pointMatch[1].trim().split(/\s+/);
        let decimalStr = '0.';
        for (const w of words) {
          if (NUMBER_WORDS[w] !== undefined) {
            decimalStr += NUMBER_WORDS[w];
          } else {
            break;
          }
        }
        if (decimalStr.length > 2) {
          amount = parseFloat(decimalStr);
        }
      }
    }
  }

  // Fallback default demo amount if voice command simply said "transfer to ..."
  if (amount === null || isNaN(amount) || amount <= 0) {
    amount = 0.01; // sensible Sepolia micro-transfer default
  }

  // 2. Extract Recipient Address or ENS
  let recipient = null;
  let recipientLabel = null;

  // Check for raw 0x Ethereum address (40 hex chars after 0x)
  const ethAddressMatch = cleanText.match(/0x[a-fA-F0-9]{40}/);
  if (ethAddressMatch) {
    recipient = ethAddressMatch[0];
    recipientLabel = `${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)}`;
  }

  // Check for ENS domain (e.g. vitalik.eth)
  if (!recipient) {
    const ensMatch = lower.match(/([a-z0-9_-]+\.eth)/);
    if (ensMatch) {
      const ensName = ensMatch[1];
      if (KNOWN_ADDRESSES[ensName]) {
        recipient = KNOWN_ADDRESSES[ensName];
        recipientLabel = ensName;
      } else {
        // Mock fallback ENS resolution
        recipient = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        recipientLabel = ensName;
      }
    }
  }

  // Check for contact names or spoken aliases
  if (!recipient) {
    for (const [name, addr] of Object.entries(KNOWN_ADDRESSES)) {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(lower)) {
        recipient = addr;
        recipientLabel = `${name.toUpperCase()} (${addr.substring(0, 6)}...${addr.substring(addr.length - 4)})`;
        break;
      }
    }
  }

  // Fallback: Default testnet recipient if none detected
  if (!recipient) {
    recipient = '0x71C66332e9a37793d5d44322840515c325672325';
    recipientLabel = 'Sepolia Vault (0x71C6...2325)';
  }

  // 3. Network detection
  let network = 'Sepolia Testnet';
  if (lower.includes('sephio') || lower.includes('sepolia') || lower.includes('tenet') || lower.includes('testnet')) {
    network = 'Sepolia Testnet (11155111)';
  }

  const confidence = (ethAddressMatch ? 0.99 : 0.94);

  return {
    success: true,
    rawTranscript: cleanText,
    extracted: {
      amount: amount,
      currency: 'Sepolia ETH',
      symbol: 'ETH',
      network: network,
      chainId: 11155111,
      chainHex: '0xaa36a7',
      recipient: recipient,
      recipientLabel: recipientLabel || recipient,
      gasEstimateGwei: '1.5',
      estimatedValueUsd: (amount * 3200).toFixed(2)
    },
    confidence: confidence,
    timestamp: new Date().toISOString()
  };
}

// API Route: Extract amount and recipient address from spoken form
app.post('/api/extract-intent', (req, res) => {
  const { transcript, speech } = req.body;
  const input = transcript || speech || '';

  if (!input || input.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Spoken transcript is required in request body.'
    });
  }

  const result = extractCryptoIntent(input);
  return res.json(result);
});

// Quick config / flag status endpoint
app.get('/api/config', (req, res) => {
  res.json({
    app: 'WebIntent',
    targetNetwork: 'Sepolia Testnet',
    chainId: 11155111,
    chainHex: '0xaa36a7',
    flags: {
      metaMaskWalletConnection: true,
      voiceZeroUiActive: true,
      disneyTransitionReady: true
    },
    version: '1.0.0'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[WebIntent Server] Listening on http://localhost:${PORT}`);
  console.log(`[WebIntent API] Intent parser route ready at http://localhost:${PORT}/api/extract-intent`);
});
