const text="19th January 2005";
const dateEl=document.getElementById("date");
const music = document.getElementById("music");
let birthdayTimeout;
let thunderAudioCtx, thunderAnalyser, thunderSrc;
let dreamyParticlesRAF = null;
let dreamyMouse = { x: null, y: null };

// Store original letter content
const letterContentMap = new Map();

function stopAndResetMedia() {
  const music = document.getElementById('music');
  let otherMediaWasPlaying = false;

  // Stop page-specific audio and check if any were playing
  document.querySelectorAll('audio').forEach(audio => {
    if (audio.id !== 'music' && !audio.paused) {
      otherMediaWasPlaying = true;
      audio.pause();
      audio.currentTime = 0;
    }
  });

  // Stop all video elements and check if any were playing
  document.querySelectorAll('video').forEach(video => {
    if (!video.paused) {
      otherMediaWasPlaying = true;
      video.pause();
      video.currentTime = 0;
    }
  });

  // If other media was playing (and is now stopped), and main music is paused, resume it.
  if (otherMediaWasPlaying && music && music.paused) {
    music.play().catch(()=>{});
  }

  // Reset UI states for play buttons (s5b)
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.innerText = '▶';
  });
  
  // Reset progress bars
  document.querySelectorAll('.progress-fill').forEach(fill => {
    fill.style.width = '0%';
  });

  // Reset custom play buttons if any
  document.querySelectorAll('.custom-play-btn').forEach(btn => {
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    btn.classList.remove('playing');
  });

  // Reset visualizers
  document.querySelectorAll('.v-bar').forEach(bar => {
    bar.style.animationPlayState = 'paused';
  });

  // Reset beat indicators
  document.querySelectorAll('.mini-beats').forEach(mb => mb.classList.remove('active'));

  // Reset time stamps
  document.querySelectorAll('.curr').forEach(el => el.innerText = '0:00');
}

function show(n){
  // Enforce strict page isolation: Stop and reset all media from previous page
  stopAndResetMedia();

  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const screen = document.getElementById('s'+n);
  screen.classList.add('active');

  // Pause main background music on specific pages
  const music = document.getElementById('music');
  if (music) {
    if (n === '5b' || n === 6 || n === 7 || n === 8 || n === 9) {
      music.pause();
    }
  }
  
  // Toggle 3D Background for Song Dedication
  const songBg = document.getElementById('song-bg-layer');
  if (n === 6) {
    songBg.classList.add('active');
    songBg.classList.add('video-mode');
    initVideoParticles();
  } else {
    songBg.classList.remove('active');
    songBg.classList.remove('video-mode');
    // Clear music particles when leaving song screens
    const particleContainer = document.getElementById('spotify-inspired-container');
    if (particleContainer) particleContainer.innerHTML = '';
    stopVideoParticles();
  }

  // Toggle About Background
  const aboutBg = document.getElementById('about-bg-layer');
  if (n === 5) {
    aboutBg.classList.add('active');
    initRefinedParticles();
  } else {
    aboutBg.classList.remove('active');
  }

  // Toggle Date Background
  const dateBg = document.getElementById('date-bg-layer');
  const thunderSfx = document.getElementById('thunder-sfx');
  if (n === 2 || n === 3 || n === '3b' || n === '3c') {
    dateBg.classList.add('active');
    document.body.classList.add('thunder-mode');
    initRain();
    if(thunderSfx) {
      thunderSfx.play().catch(()=>{});
      initThunderVisualizer();
    }
  } else {
    dateBg.classList.remove('active');
    document.body.classList.remove('thunder-mode');
    stopRain();
    if(thunderSfx) { thunderSfx.pause(); thunderSfx.currentTime = 0; }
  }

  // Toggle Final Background
  const finalBg = document.getElementById('final-bg-layer');
  if (n === 7) {
    finalBg.classList.add('active');
    initFinalBokeh();
    const friendMusic = document.getElementById('friend-music');
    if(friendMusic) friendMusic.play().catch(()=>{});
  } else {
    finalBg.classList.remove('active');
  }

  // Toggle Birthday Background
  if (n === 4) {
    playBirthdayScene();
  } else {
    clearTimeout(birthdayTimeout);
    stopDreamyParticles();
    stopBirthdayBgParticles();
  }

  // Toggle Music Dedication Background (New)
  const musicDedicationBg = document.getElementById('music-dedication-bg');
  if (n === '5b') {
    if(musicDedicationBg) musicDedicationBg.classList.add('active');
    initCuteParticles();
  } else {
    if(musicDedicationBg) musicDedicationBg.classList.remove('active');
    stopCuteParticles();
  }

  // Toggle Once Again Background
  const onceAgainBg = document.getElementById('once-again-bg-layer');
  if (n === 9) {
    if(onceAgainBg) onceAgainBg.classList.add('active');
    playCinematicSequence();
    initOnceAgainHearts();
    const onceAgainMusic = document.getElementById('once-again-music');
    if(onceAgainMusic) onceAgainMusic.play().catch(()=>{});
  } else {
    if(onceAgainBg) onceAgainBg.classList.remove('active');
  }

  // Toggle Sorry Background
  const sorryBg = document.getElementById('sorry-bg-layer');
  if (n === 8) {
    sorryBg.classList.add('active');
    initSorryParticles();
    const sorryMusic = document.getElementById('sorry-music');
    if(sorryMusic) sorryMusic.play().catch(()=>{});
  } else {
    sorryBg.classList.remove('active');
  }

  // Handle Letter Animation
  const content = screen.querySelector('.content');
  if(content) {
    content.style.animation = 'none';
    content.offsetHeight; /* trigger reflow */
    content.style.animation = 'openLetter 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
    content.addEventListener('animationend', () => {
      content.style.animation = 'glowPulse 6s infinite ease-in-out';
    }, { once: true });
  }

  // Handle Typewriter Effect
  const letter = screen.querySelector('.letter');
  if(letter) {
    if(!letterContentMap.has(letter)) {
      letterContentMap.set(letter, letter.innerHTML);
    }

    if (n === 7 || n === 5) {
      letter.innerHTML = '<div style="text-align:center; margin-top:30px; cursor:pointer; animation:pulse 2s infinite; color:#d4af37">📩 Tap to read message</div>';
      letter.onclick = () => {
        letter.onclick = null;
        fadeInText(letter, letterContentMap.get(letter));
      };
    } else {
      fadeInText(letter, letterContentMap.get(letter));
    }
  }
}

function typeText(){
  dateEl.innerHTML="";
  const typeSfx = document.getElementById("typewriter-sfx");
  if(typeof updateStarIntensity === 'function') updateStarIntensity(1);
  
  // Typewriter cursor style
  dateEl.style.borderRight = "3px solid rgba(255,255,255,0.8)";
  dateEl.style.display = "inline-block";
  dateEl.style.paddingRight = "10px";

  let i = 0;
  function nextChar() {
    if (i < text.length) {
      const char = text.charAt(i);
      const s = document.createElement("span");
      s.textContent = char === " " ? "\u00A0" : char;
      s.style.opacity = "1";
      s.style.animation = "none"; // Override CSS animation
      dateEl.appendChild(s);
      
      if(typeSfx) {
        const sound = typeSfx.cloneNode();
        sound.volume = 0.5;
        sound.play().catch(()=>{});
      }
      i++;
      setTimeout(nextChar, 150 + Math.random() * 100);
    } else {
      // Blinking cursor
      setInterval(() => {
        dateEl.style.borderRightColor = dateEl.style.borderRightColor === 'transparent' ? 'rgba(255,255,255,0.8)' : 'transparent';
      }, 500);
      
      // Make stars twinkle intensely
      if(typeof updateStarIntensity === 'function') updateStarIntensity(15);
    }
  }
  nextChar();
}

function fadeInText(el, html) {
  el.innerHTML = '';
  const parts = html.split(/<br\s*\/?>/gi);
  
  parts.forEach((part, index) => {
    if (!part.trim()) {
      el.appendChild(document.createElement('br'));
      return;
    }
    
    const line = document.createElement('div');
    line.innerHTML = part;
    line.style.opacity = '0';
    line.style.transform = 'translateY(10px)';
    line.style.animation = `fadeInUpLine 0.8s ease forwards ${index * 0.4}s`;
    el.appendChild(line);
  });
}

/* THUNDER AUDIO VISUALIZER */
function initThunderVisualizer() {
  const thunderAudio = document.getElementById('thunder-sfx');
  if (!thunderAudio || thunderAudioCtx) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    thunderAudioCtx = new AudioContext();
    thunderAnalyser = thunderAudioCtx.createAnalyser();
    thunderAnalyser.fftSize = 256;
    
    thunderSrc = thunderAudioCtx.createMediaElementSource(thunderAudio);
    thunderSrc.connect(thunderAnalyser);
    thunderAnalyser.connect(thunderAudioCtx.destination);
    
    renderThunder();
  } catch (e) {
    console.log("Thunder AudioContext failed (likely file:// protocol):", e);
  }
}

function renderThunder() {
  requestAnimationFrame(renderThunder);
  if (!thunderAnalyser) return;

  const bufferLength = thunderAnalyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  thunderAnalyser.getByteFrequencyData(dataArray);

  // Calculate volume
  let sum = 0;
  for(let i=0; i<bufferLength; i++) sum += dataArray[i];
  const average = sum / bufferLength;

  const thunderFlash = document.querySelector('.thunder-flash');
  const activeScreen = document.querySelector('.screen.active');
  
  // Threshold for thunder
  if (average > 30) { 
    const intensity = Math.min((average - 30) / 100, 1);
    
    if(thunderFlash) thunderFlash.style.opacity = intensity * 0.9;
    if(intensity > 0.4) document.body.classList.add('thunder-flash-active');
    else document.body.classList.remove('thunder-flash-active');

    // Scatter dust particles
    const dustWrappers = document.querySelectorAll('.dust-wrapper');
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    
    dustWrappers.forEach(w => {
      const p = w.firstElementChild;
      if(!p) return;
      const rect = w.getBoundingClientRect();
      const dx = rect.left - cx;
      const dy = rect.top - cy;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const force = intensity * 150; 
      const moveX = (dx / dist) * force;
      const moveY = (dy / dist) * force;
      p.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    const intenseScreens = ['s2', 's3', 's3b', 's3c'];
    if(activeScreen && intenseScreens.includes(activeScreen.id)) {
      const textEls = activeScreen.querySelectorAll('.big, .sub');
      textEls.forEach(textEl => {
          const glitchIntensity = Math.min((average - 30) / 70, 1); // Normalize intensity
          
          // Strong shake pulse
          const shake = glitchIntensity * 40;
          const x = (Math.random() - 0.5) * shake;
          const y = (Math.random() - 0.5) * shake;

          // Random glitch effects
          let transform = `translate(${x}px, ${y}px)`;
          let filter = `blur(${glitchIntensity * 2}px)`;
          let textShadow = '';

          if (glitchIntensity > 0.3) {
              // Chromatic Aberration
              const off1 = (Math.random() * 20 - 10) * glitchIntensity;
              const off2 = (Math.random() * 20 - 10) * glitchIntensity;
              textShadow = `${off1}px 0 rgba(255,0,255,0.7), ${off2}px 0 rgba(0,255,255,0.7), 0 0 ${glitchIntensity * 20}px rgba(255,255,255,0.5)`;

              // Vertical stretch
              if (Math.random() > 0.8) {
                  transform += ` scaleY(${1 + glitchIntensity * 2}) skewX(${(Math.random() - 0.5) * 20}deg)`;
              }
              // Jump
              if (Math.random() > 0.9) {
                  transform += ` translateY(${(Math.random() - 0.5) * -50}px)`;
              }
          }

          textEl.style.transform = transform;
          textEl.style.filter = filter;
          textEl.style.textShadow = textShadow;

          // Scatter particles
          if (glitchIntensity > 0.6 && Math.random() > 0.7) {
              createThunderParticles(window.innerWidth / 2, window.innerHeight / 2);
          }
      });
    } else if (activeScreen) { // Original simpler effect for other screens
      const els = activeScreen.querySelectorAll('.big, .sub');
      const shake = intensity * 30;
      els.forEach(el => {
        const x = (Math.random()-0.5)*shake;
        const y = (Math.random()-0.5)*shake;
        const skew = (Math.random()-0.5) * intensity * 30;
        el.style.transform = `translate(${x}px, ${y}px) skewX(${skew}deg)`;
        if(intensity > 0.4) {
          const off1 = (Math.random() * 15 - 7) * intensity;
          const off2 = (Math.random() * 15 - 7) * intensity;
          el.style.textShadow = `${off1}px 0 rgba(255,0,0,0.8), ${off2}px 0 rgba(0,255,255,0.8)`;
        } else {
          el.style.textShadow = '';
        }
      });
    }
  } else {
    if(thunderFlash) thunderFlash.style.opacity = 0;
    document.body.classList.remove('thunder-flash-active');
    document.querySelectorAll('.dust-particle').forEach(p => {
      p.style.transform = 'translate(0, 0)';
    });
    const intenseScreens = ['s2', 's3', 's3b', 's3c'];
    if(activeScreen && intenseScreens.includes(activeScreen.id)) {
        const textEls = activeScreen.querySelectorAll('.big, .sub');
        textEls.forEach(textEl => {
            textEl.style.transform = 'none'; // Let CSS animation take over
            textEl.style.filter = 'blur(0.5px)';
            textEl.style.textShadow = '0 0 15px rgba(255,255,255,0.4), 0 0 5px rgba(255,255,255,0.3)';
        });
    } else if (activeScreen) {
      activeScreen.querySelectorAll('.big, .sub').forEach(el => {
        el.style.transform = 'none';
        el.style.textShadow = '';
      });
    }
  }
}

function createThunderParticles(x, y) {
  const particleCount = 20 + Math.random() * 20;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'thunder-particle';
    document.body.appendChild(p);
    
    const size = Math.random() * 3 + 1;
    p.style.width = size + 'px';
    p.style.height = size + 'px';

    const angle = Math.random() * Math.PI * 2;
    const velocity = 100 + Math.random() * 200;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    
    const anim = p.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
    ], { 
      duration: 800 + Math.random() * 400, 
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
    });
    
    anim.onfinish = () => p.remove();
  }
}

/* INIT RAIN */
function initRain() {
  const container = document.getElementById('rain-container');
  if(!container || container.children.length > 0) return;

  for(let i=0; i<150; i++) {
    const drop = document.createElement('div');
    drop.className = 'drop';
    drop.style.left = Math.random() * 100 + '%';
    drop.style.animationDuration = (0.5 + Math.random() * 0.4) + 's';
    drop.style.animationDelay = (Math.random() * 2) + 's';
    container.appendChild(drop);
  }
}

function stopRain() {
  const container = document.getElementById('rain-container');
  if(container) container.innerHTML = '';
}

function startExperience() {
  show(2);
  music.play().catch(() => console.log("Audio playback was blocked by the browser. A user interaction is required."));
  typeText();
  
  setTimeout(()=>show(3), 6000);
  setTimeout(()=>show('3b'), 11000);
  setTimeout(()=>show('3c'), 18000);
  setTimeout(()=>show(4), 24000);
  
  // Removed auto-transition to s5. User now clicks buttons to navigate.
}

/* INTERACTIVE STARS */
let updateStarIntensity;
function initStars() {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  let intensity = 1;
  updateStarIntensity = (val) => { intensity = val; };

  const stars = Array.from({length: 60}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.5,
    alpha: Math.random() * 0.5,
    speed: (Math.random() * 0.005) + 0.002,
    dir: Math.random() > 0.5 ? 1 : -1
  }));

  function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    stars.forEach(star => {
      star.alpha += star.speed * star.dir * intensity;
      if(star.alpha <= 0) { star.alpha = 0; star.dir = 1; }
      if(star.alpha >= 1) { star.alpha = 1; star.dir = -1; }
      
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animateStars);
  }
  animateStars();
}
initStars();

/* INIT COSMIC DUST */
function initDust() {
  const container = document.getElementById('dust-container');
  container.innerHTML = '';
  for(let i=0; i<30; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dust-wrapper';
    wrapper.style.left = Math.random() * 100 + '%';
    wrapper.style.top = Math.random() * 100 + '%';
    wrapper.style.animationDuration = (15 + Math.random() * 20) + 's';
    wrapper.style.animationDelay = (Math.random() * -20) + 's';

    const p = document.createElement('div');
    p.className = 'dust-particle';
    p.style.width = (Math.random() * 2 + 1) + 'px';
    p.style.height = p.style.width;
    
    wrapper.appendChild(p);
    container.appendChild(wrapper);
  }
}
initDust();

/* INIT REFINED PARTICLES FOR ABOUT SECTION */
function initRefinedParticles() {
  const container = document.getElementById('refined-particles-container');
  if(!container || container.children.length > 0) return;

  for(let i=0; i<40; i++) {
    const p = document.createElement('div');
    p.className = 'refined-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.width = (Math.random() * 2 + 1) + 'px';
    p.style.height = p.style.width;
    p.style.animationDuration = (20 + Math.random() * 30) + 's';
    p.style.animationDelay = (Math.random() * -30) + 's';
    container.appendChild(p);
  }
}

function initBirthdayBgParticles() {
  const container = document.getElementById('s4-bg-particles');
  if (!container) return;
  stopBirthdayBgParticles();

  const particleCount = 40;
  const colors = ['#FFC0CB', '#FFB6C1', '#FF69B4', '#FFF0F5', '#E6E6FA'];

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'birthday-bg-particle';
    const size = Math.random() * 12 + 4;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 15 + 10) + 's';
    p.style.animationDelay = (Math.random() * -20) + 's';
    container.appendChild(p);
  }
}

function stopBirthdayBgParticles() {
  const container = document.getElementById('s4-bg-particles');
  if (container) container.innerHTML = '';
}

function playBirthdayScene() {
  const card = document.getElementById('paper-card');
  const watermark = document.getElementById('watermark-21');
  const textEl = document.getElementById('ink-text');
  const butterfly = document.getElementById('ink-butterfly');
  const chibliPhoto = document.getElementById('chibli-photo');
  
  // Reset
  card.classList.remove('slide-up');
  watermark.classList.remove('pop-in');
  textEl.innerHTML = '';
  butterfly.style.opacity = '0';
  butterfly.style.animation = 'none';
  if (chibliPhoto) {
    chibliPhoto.style.opacity = '0';
    chibliPhoto.style.transform = 'scale(0.5) rotate(-10deg)';
    chibliPhoto.style.transition = 'none';
  }
  stopDreamyParticles();
  initBirthdayBgParticles();

  // 1. Start Sequence: Pop "21"
  void watermark.offsetWidth; // trigger reflow
  watermark.classList.add('pop-in');

  // Blast particles
  setTimeout(() => blastConfetti(), 200);

  // Show Chibli Photo
  setTimeout(() => {
    if (chibliPhoto) {
      chibliPhoto.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      chibliPhoto.style.opacity = '1';
      chibliPhoto.style.transform = 'scale(1) rotate(0deg)';
    }
  }, 800);

  // 2. Slide Card Up
  setTimeout(() => {
    card.classList.add('slide-up');
  }, 2000);

  // 3. Card Settles & Particles/Text start
  setTimeout(() => {
    // Initialize new dreamy particles
    
    // Text Fade In
    const message = "ಹುಟ್ಟುಹಬ್ಬದ ಶುಭಾಶಯಗಳು";
    textEl.textContent = message;
    textEl.style.animation = 'none';
    textEl.offsetHeight; /* reflow */
    textEl.style.animation = 'fadeInTextSimple 1.5s ease forwards 0.8s';

    // Butterfly
    butterfly.style.animation = 'butterflySit 1s ease forwards 1.2s';
  }, 3600);
}

function updateDreamyMouse(e) {
    dreamyMouse.x = e.clientX;
    dreamyMouse.y = e.clientY;
}

function initDreamyParticles() {
  const container = document.getElementById('paper-particles');
  if (!container) return;
  stopDreamyParticles(); // Clear any existing

  const particles = [];
  const colors = ['#fce4ec', '#f3e5f5', '#ffffff'];
  const containerRect = container.getBoundingClientRect();

  window.addEventListener('mousemove', updateDreamyMouse);

  for (let i = 0; i < 35; i++) {
    const p = document.createElement('div');
    p.className = 'ambient-dot';
    const size = Math.random() * 2.5 + 1;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.opacity = Math.random() * 0.5 + 0.2;
    container.appendChild(p);

    particles.push({
      element: p,
      x: Math.random() * containerRect.width,
      y: Math.random() * containerRect.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      baseSize: size,
    });
  }

  function animate() {
    particles.forEach(p => {
      // Repel from mouse
      if (dreamyMouse.x !== null) {
        const dx = p.x - (dreamyMouse.x - containerRect.left);
        const dy = p.y - (dreamyMouse.y - containerRect.top);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 100) { // Interaction radius
          const force = (100 - dist) / 100;
          p.vx += (dx / dist) * force * 0.5;
          p.vy += (dy / dist) * force * 0.5;
        }
      }

      // Damping
      p.vx *= 0.97;
      p.vy *= 0.97;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Boundary check (wrap around)
      if (p.x > containerRect.width + p.baseSize) p.x = -p.baseSize;
      if (p.x < -p.baseSize) p.x = containerRect.width + p.baseSize;
      if (p.y > containerRect.height + p.baseSize) p.y = -p.baseSize;
      if (p.y < -p.baseSize) p.y = containerRect.height + p.baseSize;

      p.element.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });

    dreamyParticlesRAF = requestAnimationFrame(animate);
  }

  animate();
}

function stopDreamyParticles() {
  const container = document.getElementById('paper-particles');
  if (container) container.innerHTML = '';
  if (dreamyParticlesRAF) {
    cancelAnimationFrame(dreamyParticlesRAF);
    dreamyParticlesRAF = null;
  }
  window.removeEventListener('mousemove', updateDreamyMouse);
  dreamyMouse = { x: null, y: null };
}

/* INIT SORRY PARTICLES */
function initSorryParticles() {
  const container = document.getElementById('sorry-particles-container');
  if(!container || container.children.length > 0) return;
  // Floating butterflies in background
  for(let i=0; i<3; i++) {
      const b = document.createElement('div');
      b.className = 'sorry-butterfly sb-float';
      b.innerText = '🦋';
      b.style.left = Math.random() * 80 + 10 + '%';
      b.style.top = Math.random() * 80 + 20 + '%';
      b.style.animationDuration = (15 + Math.random() * 10) + 's';
      b.style.animationDelay = (Math.random() * -10) + 's';
      container.appendChild(b);
  }
}

/* INIT ONCE AGAIN HEARTS */
function initOnceAgainHearts() {
  const container = document.getElementById('once-again-particles');
  if(!container || container.children.length > 0) return;
  
  // Blessing particles: Sparkles, Stars, Dust, Bokeh
  const symbols = ['✨', '✦', '★', '•'];
  
  for(let i=0; i<80; i++) {
    const p = document.createElement('div');
    const isSymbol = Math.random() > 0.6;
    
    if (isSymbol) {
        p.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.color = Math.random() > 0.5 ? '#fff' : '#ffe0b2'; // White or soft gold
        p.style.fontSize = (Math.random() * 15 + 8) + 'px';
        p.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.8)';
    } else {
        p.className = 'galaxy-particle';
        p.style.width = (Math.random() * 3 + 1) + 'px';
        p.style.height = p.style.width;
        p.style.background = 'rgba(255, 255, 255, 0.6)';
        p.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.4)';
    }

    p.style.position = 'absolute';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.opacity = Math.random() * 0.5 + 0.2;
    p.style.animation = `floatGalaxyDust ${15 + Math.random() * 25}s linear infinite`;
    p.style.animationDelay = (Math.random() * -20) + 's';
    
    container.appendChild(p);
  }
}

/* CINEMATIC SEQUENCE FOR S9 */
function playCinematicSequence() {
  // Reset
  const photos = document.querySelectorAll('.cine-photo');
  const title = document.querySelector('.cine-title');
  const lines = document.querySelectorAll('.cine-line');
  
  photos.forEach(p => p.classList.remove('state-1', 'state-2', 'state-3', 'state-4', 'state-5', 'state-6'));
  if(title) title.classList.remove('visible');
  lines.forEach(l => l.classList.remove('visible'));

  // Sequence
  const delays = [500, 1200, 1900, 2600, 3300, 4000];
  photos.forEach((p, i) => {
    if(p) setTimeout(() => p.classList.add('state-' + (i+1)), delays[i]);
  });

  setTimeout(() => { if(title) title.classList.add('visible'); }, 5000);
  setTimeout(() => { if(lines[0]) lines[0].classList.add('visible'); }, 6000);
  setTimeout(() => { if(lines[1]) lines[1].classList.add('visible'); }, 7000);
  setTimeout(() => { if(lines[2]) lines[2].classList.add('visible'); }, 8000);
}

/* INIT MUSIC NOTES FOR SONG BG */
function initMusicNotes() {
  const container = document.getElementById('floating-notes');
  if(!container || container.children.length > 0) return;
  
  const notes = ['♪', '♫', '♩', '♬', '✨', '🤍', '🎧'];
  for(let i=0; i<25; i++) {
    const el = document.createElement('div');
    el.classList.add('music-note');
    el.innerText = notes[Math.floor(Math.random() * notes.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.animationDuration = (6 + Math.random() * 8) + 's';
    el.style.animationDelay = (Math.random() * 5) + 's';
    el.style.fontSize = (14 + Math.random() * 24) + 'px';
    container.appendChild(el);
  }
}

/* SPOTIFY-INSPIRED MUSIC SCENE */
function initSpotifyInspiredScene() {
  const container = document.getElementById('song-bg-layer');
  if (!container) return;

  let particleContainer = document.getElementById('spotify-inspired-container');
  if (!particleContainer) {
    particleContainer = document.createElement('div');
    particleContainer.id = 'spotify-inspired-container';
    particleContainer.style.position = 'absolute';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.overflow = 'hidden';
    container.appendChild(particleContainer);
  }
  // Do not clear if elements exist, to avoid re-creating on screen toggle (e.g. video to cards)
  if (particleContainer.children.length > 0) return;

  const W = window.innerWidth;
  const H = window.innerHeight;

  // 1. Abstract Circular Shapes
  const shapes = [
    { color: 'rgba(76, 175, 80, 0.15)', size: W * 0.5 }, // Spotify Green
    { color: 'rgba(33, 150, 243, 0.1)', size: W * 0.4 }, // Blue
    { color: 'rgba(103, 58, 183, 0.1)', size: W * 0.3 }  // Indigo
  ];

  shapes.forEach(s => {
    const shape = document.createElement('div');
    shape.className = 'spotify-shape';
    shape.style.width = `${s.size}px`;
    shape.style.height = `${s.size}px`;
    shape.style.background = s.color;
    
    shape.style.setProperty('--x-start', `${Math.random() * W - s.size/2}px`);
    shape.style.setProperty('--y-start', `${Math.random() * H - s.size/2}px`);
    shape.style.setProperty('--x-end', `${Math.random() * W - s.size/2}px`);
    shape.style.setProperty('--y-end', `${Math.random() * H - s.size/2}px`);
    shape.style.setProperty('--scale-start', `${0.8 + Math.random() * 0.4}`);
    shape.style.setProperty('--scale-end', `${0.8 + Math.random() * 0.4}`);
    shape.style.animationDelay = `-${Math.random() * 50}s`;
    particleContainer.appendChild(shape);
  });

  // 2. Subtle Glowing Particles
  const particleCount = 30;
  for(let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'spotify-particle';
    
    const size = Math.random() * 2 + 1;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.opacity = Math.random() * 0.5 + 0.1;

    p.style.setProperty('--x-start', `${Math.random() * W}px`);
    p.style.setProperty('--y-start', `${Math.random() * H}px`);
    p.style.setProperty('--x-end', `${Math.random() * W}px`);
    p.style.setProperty('--y-end', `${Math.random() * H}px`);
    p.style.setProperty('--scale-start', '1');
    p.style.setProperty('--scale-end', '1');
    p.style.animationDelay = `-${Math.random() * 40}s`;
    particleContainer.appendChild(p);
  }

  // 3. Low-opacity Equalizer Bars
  const eqContainer = document.createElement('div');
  eqContainer.className = 'music-eq-container';
  const barCount = 60;
  for(let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    bar.className = 'eq-bar';
    bar.style.animationDelay = `-${Math.random() * 1.5}s`;
    bar.style.animationDuration = `${0.5 + Math.random() * 2}s`;
    eqContainer.appendChild(bar);
  }
  particleContainer.appendChild(eqContainer);
}

/* CUSTOM MUSIC PLAYER CONTROLS */
function initMusicPlayerControls() {
  const cards = document.querySelectorAll('.music-card');
  cards.forEach(card => {
    // Prevent duplicate initialization
    if (card.querySelector('.custom-play-btn')) return;

    const audio = card.querySelector('audio');
    if (!audio) return;

    // Hide default audio controls
    audio.style.display = 'none';

    // Create Custom Button
    const btn = document.createElement('div');
    btn.className = 'custom-play-btn';
    
    // SVG Icons
    const playIcon = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    const pauseIcon = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    btn.innerHTML = playIcon;

    // Insert button after the image
    const img = card.querySelector('img');
    if (img) img.after(btn);
    else card.prepend(btn);

    // Click Handler
    btn.onclick = () => {
      if (audio.paused) {
        // Pause other audios
        document.querySelectorAll('audio').forEach(a => {
          if(a !== audio) a.pause();
        });
        audio.play();
      } else {
        audio.pause();
      }
    };

    // Sync Button State with Audio Events
    audio.onplay = () => {
      btn.innerHTML = pauseIcon;
      btn.classList.add('playing');
    };
    audio.onpause = () => {
      btn.innerHTML = playIcon;
      btn.classList.remove('playing');
    };
    audio.onended = () => {
      btn.innerHTML = playIcon;
      btn.classList.remove('playing');
    };
  });
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

/* MUSIC DEDICATION PLAYER (S5b) */
function toggleDedicationMusic(btn) {
  const card = btn.closest('.iphone-card');
  const audio = card.querySelector('audio');
  const progressFill = card.querySelector('.progress-fill');
  const visualizers = card.querySelectorAll('.v-bar');
  const currEl = card.querySelector('.curr');
  const durEl = card.querySelector('.dur');
  const miniBeats = card.querySelector('.mini-beats');
  
  if(!audio) return;

  // Pause all other audios
  document.querySelectorAll('audio').forEach(a => {
      if(a !== audio) {
          a.pause();
          const otherCard = a.closest('.iphone-card');
          if (otherCard) {
              const otherBtn = otherCard.querySelector('.play-btn');
              if(otherBtn) otherBtn.innerText = '▶';
              // Stop other visualizers
              otherCard.querySelectorAll('.v-bar').forEach(v => v.style.animationPlayState = 'paused');
              const otherBeats = otherCard.querySelector('.mini-beats');
              if(otherBeats) otherBeats.classList.remove('active');
          }
      }
  });

  if(audio.paused) {
      audio.play().then(() => {
          btn.innerText = '⏸';
          visualizers.forEach(v => v.style.animationPlayState = 'running');
          if(miniBeats) miniBeats.classList.add('active');
      }).catch(e => {
          console.error("Playback failed:", e);
          const src = audio.getAttribute('src');
          alert(`Playback failed. Please ensure the file '${src}' exists.`);
      });
  } else {
      audio.pause();
      btn.innerText = '▶';
      visualizers.forEach(v => v.style.animationPlayState = 'paused');
      if(miniBeats) miniBeats.classList.remove('active');
  }
  
  // Attach events if not already attached
  if (!audio.dataset.eventsAttached) {
      audio.dataset.eventsAttached = "true";
      
      // Set initial duration if available
      if (audio.duration && durEl) durEl.innerText = formatTime(audio.duration);

      audio.addEventListener('loadedmetadata', () => {
          if (durEl) durEl.innerText = formatTime(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
          if (progressFill && audio.duration) {
              const percent = (audio.currentTime / audio.duration) * 100;
              progressFill.style.width = percent + '%';
              if (currEl) currEl.innerText = formatTime(audio.currentTime);
              if (durEl) durEl.innerText = formatTime(audio.duration);
          }
      });
      
      audio.addEventListener('ended', () => {
          btn.innerText = '▶';
          if (progressFill) progressFill.style.width = '0%';
          if (currEl) currEl.innerText = '0:00';
          visualizers.forEach(v => v.style.animationPlayState = 'paused');
          if(miniBeats) miniBeats.classList.remove('active');
      });
  }
}

/* INIT FINAL PAGE BOKEH */
function initFinalBokeh() {
  const container = document.getElementById('final-bokeh-container');
  if(!container || container.children.length > 0) return;
  
  // Lightweight floating dust particles (Warm & Soft)
  for(let i=0; i<40; i++) {
    const b = document.createElement('div');
    b.className = 'final-bokeh';
    b.style.position = 'absolute';
    b.style.left = Math.random() * 100 + '%';
    b.style.top = Math.random() * 100 + '%';
    b.style.width = (Math.random() * 2 + 1) + 'px';
    b.style.height = b.style.width;
    b.style.borderRadius = '50%';
    b.style.background = 'rgba(255, 240, 220, 0.4)'; /* Warm dust */
    b.style.filter = 'blur(' + (Math.random() * 1) + 'px)';
    b.style.animation = `floatBokeh ${30 + Math.random() * 30}s linear infinite`;
    b.style.animationDelay = (Math.random() * -30) + 's';
    container.appendChild(b);
  }
}

/* CUTE PARTICLES FOR MUSIC DEDICATION (Butterflies & Teddies) */
let cuteParticleInterval;
function initCuteParticles() {
  const container = document.getElementById('music-dedication-bg');
  if(!container) return;
  
  let particleContainer = document.getElementById('cute-particle-container');
  if(!particleContainer) {
      particleContainer = document.createElement('div');
      particleContainer.id = 'cute-particle-container';
      particleContainer.style.position = 'absolute';
      particleContainer.style.inset = '0';
      particleContainer.style.pointerEvents = 'none';
      particleContainer.style.overflow = 'hidden';
      container.appendChild(particleContainer);
  }
  
  if(cuteParticleInterval) clearInterval(cuteParticleInterval);
  
  cuteParticleInterval = setInterval(() => {
      const b = document.createElement('div');
      const rand = Math.random();
      b.style.position = 'absolute';
      
      if (rand > 0.66) {
        // Teddies float up slowly
        b.innerHTML = '🧸';
        b.style.left = Math.random() * 90 + 5 + '%';
        b.style.top = '0';
        b.style.fontSize = (Math.random() * 10 + 15) + 'px';
        b.style.opacity = 0;
        b.style.animation = `floatTeddy ${Math.random() * 10 + 15}s linear forwards`;
      } else if (rand > 0.33) {
        // Music Notes float up
        const notes = ['♪', '♫', '♩', '♬'];
        b.innerHTML = notes[Math.floor(Math.random() * notes.length)];
        b.style.left = Math.random() * 100 + '%';
        b.style.top = '0';
        b.style.fontSize = (Math.random() * 15 + 15) + 'px';
        b.style.color = Math.random() > 0.5 ? '#ff80ab' : '#e1bee7';
        b.style.textShadow = '0 0 5px rgba(255,255,255,0.5)';
        b.style.opacity = 0;
        b.style.animation = `floatUp ${Math.random() * 10 + 10}s linear forwards`;
      } else {
        // Butterflies flutter across
        b.innerHTML = '🦋';
        b.style.left = '-50px';
        b.style.top = Math.random() * 80 + 10 + '%';
        b.style.fontSize = (Math.random() * 10 + 12) + 'px';
        b.style.opacity = 0;
        b.style.animation = `flutterAcross ${Math.random() * 10 + 20}s linear forwards`;
      }
      
      particleContainer.appendChild(b);
      
      b.addEventListener('animationend', () => b.remove());
  }, 600);
}

function stopCuteParticles() {
    if(cuteParticleInterval) clearInterval(cuteParticleInterval);
    const container = document.getElementById('cute-particle-container');
    if(container) container.innerHTML = '';
}

/* VIDEO PAGE PARTICLES (Waves, Dust & Grain) */
function initVideoParticles() {
  const container = document.getElementById('song-bg-layer');
  if (!container) return;
  
  // Container for the entire effect
  let effectContainer = document.getElementById('memory-tunnel-container');
  if (!effectContainer) {
      effectContainer = document.createElement('div');
      effectContainer.id = 'memory-tunnel-container';
      effectContainer.style.position = 'absolute';
      effectContainer.style.inset = '0';
      effectContainer.style.pointerEvents = 'none';
      effectContainer.style.zIndex = '0'; // Behind video overlay
      effectContainer.style.overflow = 'hidden';
      container.appendChild(effectContainer);
  }

  // Avoid re-creating elements
  if (effectContainer.children.length > 0) return;

  // 1. Create Tunnel Layers
  for(let i=0; i<4; i++) {
      const layer = document.createElement('div');
      layer.className = 'memory-tunnel-layer';
      effectContainer.appendChild(layer);
  }

  // 2. Create Particles
  const particleCount = 25; // "very minimal and elegant"
  const W = window.innerWidth;
  const H = window.innerHeight;

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'memory-particle';
    
    const isDust = Math.random() > 0.5;
    const size = isDust ? Math.random() * 2 + 1 : Math.random() * 3 + 2; // Dust is smaller
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    
    if (isDust) {
        p.style.background = 'rgba(255, 255, 255, 0.2)';
        p.style.filter = 'blur(1px)';
    } else { // Light particle
        p.style.background = 'rgba(255, 245, 230, 0.6)';
        p.style.boxShadow = '0 0 10px rgba(255, 230, 200, 0.4), 0 0 20px rgba(255, 200, 180, 0.2)'; // Warm bokeh
        p.style.filter = 'blur(0.8px)';
    }

    const duration = 45 + Math.random() * 45; // 45-90 seconds
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `-${Math.random() * duration}s`;

    // Set random positions using CSS variables for the animation
    const xRange = W * 1.2;
    const yRange = H * 1.2;
    p.style.setProperty('--x-start', `${(Math.random() - 0.5) * xRange}px`);
    p.style.setProperty('--y-start', `${(Math.random() - 0.5) * yRange}px`);
    p.style.setProperty('--x-end', `${(Math.random() - 0.5) * xRange}px`);
    p.style.setProperty('--y-end', `${(Math.random() - 0.5) * yRange}px`);
    p.style.setProperty('--opacity-max', `${isDust ? 0.2 + Math.random() * 0.2 : 0.4 + Math.random() * 0.2}`);
    
    effectContainer.appendChild(p);
  }
}

function stopVideoParticles() {
    const tunnelContainer = document.getElementById('memory-tunnel-container');
    if(tunnelContainer) tunnelContainer.remove();
}

// Auto redirect when video ends
const vid = document.getElementById('mem-video');
if(vid) {
  vid.addEventListener('ended', () => {
    show(7);
  });
  vid.addEventListener('play', () => {
    const music = document.getElementById('music');
    if (music) {
      music.pause();
    }
  });
}

/* BLAST CONFETTI FOR BIRTHDAY SCENE */
function blastConfetti() {
  const container = document.getElementById('s4');
  if (!container) return;
  
  const colors = ['#ffeb3b', '#ff4081', '#00bcd4', '#76ff03', '#ffffff'];
  const rect = container.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.style.position = 'absolute';
    p.style.width = (Math.random() * 8 + 4) + 'px';
    p.style.height = (Math.random() * 8 + 4) + 'px';
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    p.style.zIndex = '100';
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = 150 + Math.random() * 250;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    
    p.animate([
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(${Math.random()*360}deg)`, opacity: 0 }
    ], {
      duration: 800 + Math.random() * 600,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }).onfinish = () => p.remove();
    
    container.appendChild(p);
  }
}