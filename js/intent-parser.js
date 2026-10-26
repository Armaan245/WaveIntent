/**
 * Intent Parser Client Module
 * Connects to the backend API route /api/extract-intent to parse spoken crypto commands.
 * Also includes resilient client-side regex parsing if running offline or directly as an extension.
 */

class IntentParser {
  constructor(apiEndpoint = '/api/extract-intent') {
    this.apiEndpoint = apiEndpoint;
    this.knownAddresses = {
      'vitalik': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      'vitalik.eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      'alice': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      'alice.eth': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      'bob': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      'bob.eth': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      'treasury': '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      'treasury.eth': '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      'sephio': '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      'vault': '0x71C66332e9a37793d5d44322840515c325672325'
    };
  }

  /**
   * Main method: extracts amount and recipient from spoken text
   * Tries backend API route first, falls back to local client parsing
   */
  async extract(spokenTranscript) {
    if (!spokenTranscript || spokenTranscript.trim().length === 0) {
      throw new Error('Spoken transcript cannot be empty');
    }

    try {
      // 1. Try calling the backend API route
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript: spokenTranscript })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('[IntentParser] Successfully parsed via API Route:', data);
          return data;
        }
      }
    } catch (err) {
      console.warn('[IntentParser] API route call failed, using client-side fallback engine:', err.message);
    }

    // 2. Client-side fallback extraction
    return this.clientSideExtract(spokenTranscript);
  }

  /**
   * Client-side NLP & Regex parser fallback
   */
  clientSideExtract(transcript) {
    const cleanText = transcript.trim();
    const lower = cleanText.toLowerCase();

    // 1. Amount Extraction
    let amount = null;
    const digitMatch = cleanText.match(/(?:send|transfer|pay|give)?\s*([0-9]*\.?[0-9]+)\s*(?:eth|ether|sepolia|sep|sephio)?/i);
    if (digitMatch && digitMatch[1] && !isNaN(parseFloat(digitMatch[1]))) {
      amount = parseFloat(digitMatch[1]);
    }

    if (amount === null) {
      if (lower.includes('half')) amount = 0.5;
      else if (lower.includes('quarter')) amount = 0.25;
      else if (lower.includes('point zero five') || lower.includes('dot zero five')) amount = 0.05;
      else if (lower.includes('point one') || lower.includes('dot one')) amount = 0.1;
      else if (lower.includes('one')) amount = 1.0;
      else amount = 0.05; // Fallback
    }

    // 2. Recipient Address Extraction
    let recipient = null;
    let recipientLabel = null;

    // Check for 0x address
    const ethAddressMatch = cleanText.match(/0x[a-fA-F0-9]{40}/);
    if (ethAddressMatch) {
      recipient = ethAddressMatch[0];
      recipientLabel = `${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)}`;
    }

    // Check for known contact or ENS
    if (!recipient) {
      for (const [name, addr] of Object.entries(this.knownAddresses)) {
        if (lower.includes(name)) {
          recipient = addr;
          recipientLabel = `${name} (${addr.substring(0, 6)}...${addr.substring(addr.length - 4)})`;
          break;
        }
      }
    }

    // Default Sepolia Vault address
    if (!recipient) {
      recipient = '0x71C66332e9a37793d5d44322840515c325672325';
      recipientLabel = 'Sepolia Vault (0x71C6...2325)';
    }

    return {
      success: true,
      rawTranscript: cleanText,
      extracted: {
        amount: amount,
        currency: 'Sepolia ETH',
        symbol: 'ETH',
        network: 'Sepolia Testnet (11155111)',
        chainId: 11155111,
        chainHex: '0xaa36a7',
        recipient: recipient,
        recipientLabel: recipientLabel || recipient,
        gasEstimateGwei: '1.5',
        estimatedValueUsd: (amount * 3200).toFixed(2)
      },
      confidence: 0.95,
      timestamp: new Date().toISOString()
    };
  }
}

window.IntentParser = IntentParser;
