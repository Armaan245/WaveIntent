/**
 * Voice Recognition & Audio Feedback Module
 * Uses the Web Speech API (webkitSpeechRecognition) with live audio wave animation
 * and robust interim speech event handling.
 */

class VoiceRecognition {
  constructor(options = {}) {
    this.onResult = options.onResult || (() => {});
    this.onInterim = options.onInterim || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onError = options.onError || (() => {});

    this.isListening = false;
    this.recognition = null;
    this.hasSpeechApi = ('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window);

    this.initRecognition();
  }

  initRecognition() {
    if (!this.hasSpeechApi) {
      console.warn('[Voice] SpeechRecognition API is not supported in this browser. Fallback phrase inputs enabled.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStateChange('listening');
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (interimTranscript) {
        this.onInterim(interimTranscript);
      }

      if (finalTranscript) {
        this.onResult(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[Voice] Speech error:', event.error);
      this.isListening = false;
      this.onStateChange('idle');
      this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStateChange('idle');
    };
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (!this.hasSpeechApi || !this.recognition) {
      this.onError('Web Speech API is not supported in this browser environment. Click any sample phrase below to simulate voice!');
      return;
    }

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[Voice] Start error:', e);
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('[Voice] Stop error:', e);
      }
    }
    this.isListening = false;
    this.onStateChange('idle');
  }

  /**
   * Simulate speaking a phrase (useful for quick testing or environments without mic)
   */
  simulatePhrase(phrase) {
    this.onStateChange('listening');
    this.onInterim('Listening: "' + phrase.substring(0, 15) + '..."');

    setTimeout(() => {
      this.onInterim(phrase);
      setTimeout(() => {
        this.onStateChange('idle');
        this.onResult(phrase);
      }, 400);
    }, 500);
  }
}

window.VoiceRecognition = VoiceRecognition;
