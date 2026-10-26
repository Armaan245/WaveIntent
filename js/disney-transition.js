/**
 * Disney Transition Engine
 * Creates a magical Disney-style fairy-dust particle explosion, sparkling star trails,
 * and synthesized Web Audio arpeggio chime sound effect upon transfer execution.
 */

class DisneyTransition {
  constructor(canvasId = 'disneyParticleCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = canvasId;
      document.body.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationFrame = null;
    this.audioCtx = null;
    this.initResize();
  }

  initResize() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  /**
   * Synthesize iconic Disney fairy chime / magic wand arpeggio using Web Audio API
   */
  playDisneyChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      // High-pitched magical pentatonic sparkle scale: C6, E6, G6, B6, C7, E7, G7
      const notes = [1046.50, 1318.51, 1567.98, 1975.53, 2093.00, 2637.02, 3135.96];

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);

        // Envelope
        gain.gain.setValueAtTime(0, now + idx * 0.055);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.055 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.7);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.75);
      });
    } catch (err) {
      console.warn('[Disney Audio] Synthetic audio notice:', err);
    }
  }

  /**
   * Launch the Disney Magic Stardust Transition from the execution button
   * @param {HTMLElement} originElement - The solid white execute button
   */
  trigger(originElement) {
    this.playDisneyChime();

    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (originElement) {
      const rect = originElement.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    const colors = window.CONFIG?.DISNEY_EFFECT?.colors || [
      '#FFDF00', '#00FFA3', '#FFFFFF', '#67E8F9', '#F472B6'
    ];

    // Spawn 180 magical stardust and fairy particles
    const particleCount = 180;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 2;
      const size = Math.random() * 4 + 1.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isStar = Math.random() > 0.4;

      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 3 + 1), // Arc upward like fairy dust
        size: size,
        color: color,
        alpha: 1,
        decay: Math.random() * 0.018 + 0.012,
        isStar: isStar,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        gravity: 0.12,
        trail: []
      });
    }

    // Spawn an enchanting swirling arc
    for (let i = 0; i < 40; i++) {
      const arcAngle = (i / 40) * Math.PI;
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(arcAngle) * (i * 0.35 + 4),
        vy: -Math.sin(arcAngle) * (i * 0.35 + 5),
        size: Math.random() * 3 + 2,
        color: '#FFDF00',
        alpha: 1,
        decay: 0.015,
        isStar: true,
        rotation: 0,
        rotSpeed: 0.1,
        gravity: 0.08,
        trail: []
      });
    }

    if (!this.animationFrame) {
      this.animate();
    }
  }

  drawStar(x, y, radius, points, color, alpha, rot) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rot);
    this.ctx.beginPath();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 10;

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius / 2.5;
      const a = (i * Math.PI) / points;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.alpha -= p.decay;
      p.rotation += p.rotSpeed;

      // Draw particle
      if (p.isStar) {
        this.drawStar(p.x, p.y, p.size * 2, 4, p.color, Math.max(p.alpha, 0), p.rotation);
      } else {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(p.alpha, 0);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    } else {
      this.animationFrame = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

window.DisneyTransition = DisneyTransition;
