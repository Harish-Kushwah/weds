import * as THREE from 'three';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.querySelector('#petals');

// Reveal each section as it enters the viewport.
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -35px 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// A restrained Three.js dusting of drifting gold petals.
try {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-innerWidth / 2, innerWidth / 2, innerHeight / 2, -innerHeight / 2, 0.1, 100);
  camera.position.z = 20;
  const count = innerWidth < 700 ? 26 : 52;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * innerWidth;
    positions[i * 3 + 1] = (Math.random() - 0.5) * innerHeight;
    speeds[i] = 0.13 + Math.random() * 0.35;
    phases[i] = Math.random() * Math.PI * 2;
    sizes[i] = 1.5 + Math.random() * 2.2;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute float aPhase; attribute float aSize; uniform float uTime; varying float vAlpha; void main(){vec3 p=position;p.x+=sin(uTime*.35+aPhase)*7.;p.y+=cos(uTime*.3+aPhase)*3.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=aSize;vAlpha=.18+.12*sin(uTime+aPhase);}`,
    fragmentShader: `varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float d=length(vec2(p.x*1.15,p.y));if(d>.5)discard;gl_FragColor=vec4(.66,.60,.44,vAlpha*(1.-smoothstep(.28,.5,d)));}`
  });
  scene.add(new THREE.Points(geometry, material));
  let frameId;
  let lastFrame = 0;
  const draw = (time = 0) => {
    if (document.hidden) return;
    frameId = requestAnimationFrame(draw);
    if (reducedMotion && time - lastFrame < 1200) return;
    lastFrame = time;
    material.uniforms.uTime.value = time * 0.001;
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 1] -= speeds[i];
      positions[i * 3] += Math.sin(time * 0.0003 + phases[i]) * 0.12;
      if (positions[i * 3 + 1] < -innerHeight / 2 - 8) {
        positions[i * 3 + 1] = innerHeight / 2 + 8;
        positions[i * 3] = (Math.random() - 0.5) * innerWidth;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  };
  draw();
  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.left = -innerWidth / 2;
    camera.right = innerWidth / 2;
    camera.top = innerHeight / 2;
    camera.bottom = -innerHeight / 2;
    camera.updateProjectionMatrix();
  });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frameId);
    if (!document.hidden) draw();
  });
} catch (error) {
  canvas.hidden = true;
}

// Gentle card tilt on pointer devices; touch users get the full static design.
const card = document.querySelector('#invitation-card');
if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-3px)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
}

// Countdown to November 21, 2026 at 4:30 PM Pacific time.
const weddingTime = new Date('2026-11-21T16:30:00-08:00').getTime();
const countdownFields = {
  days: document.querySelector('#days'),
  hours: document.querySelector('#hours'),
  minutes: document.querySelector('#minutes')
};
function updateCountdown() {
  const remaining = Math.max(0, weddingTime - Date.now());
  countdownFields.days.textContent = Math.floor(remaining / 86400000).toString().padStart(2, '0');
  countdownFields.hours.textContent = Math.floor((remaining % 86400000) / 3600000).toString().padStart(2, '0');
  countdownFields.minutes.textContent = Math.floor((remaining % 3600000) / 60000).toString().padStart(2, '0');
}
updateCountdown();
window.setInterval(updateCountdown, 60000);

// RSVP is a front-end confirmation template. Connect it to a form or service to collect replies.
const modal = document.querySelector('#rsvp-modal');
const openButton = document.querySelector('#open-rsvp');
const closeButton = document.querySelector('#close-rsvp');
function setModal(open) {
  modal.classList.toggle('open', open);
  modal.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('modal-open', open);
  if (open) closeButton.focus(); else openButton.focus();
}
openButton.addEventListener('click', () => setModal(true));
closeButton.addEventListener('click', () => setModal(false));
modal.addEventListener('click', (event) => { if (event.target === modal) setModal(false); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) setModal(false); });
document.querySelectorAll('.choices button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.choices button').forEach((choice) => choice.classList.remove('selected'));
    button.classList.add('selected');
    document.querySelector('#response').textContent = button.dataset.answer === 'joyfully'
      ? 'Lovely! We can’t wait to celebrate with you.'
      : 'Thank you for letting us know. You’ll be missed.';
  });
});

// Play the supplied wedding music after the visitor presses the music button.
const musicToggle = document.querySelector('#music-toggle');
const weddingMusic = document.querySelector('#wedding-music');
const musicLabel = musicToggle.querySelector('.music-label');

musicToggle.addEventListener('click', async () => {
  if (weddingMusic.paused) {
    try {
      await weddingMusic.play();
      musicToggle.setAttribute('aria-pressed', 'true');
      musicToggle.setAttribute('aria-label', 'Pause wedding music');
      musicLabel.textContent = 'Pause music';
    } catch (error) {
      musicLabel.textContent = 'Could not play';
      musicToggle.setAttribute('aria-label', 'Could not play wedding music');
    }
  } else {
    weddingMusic.pause();
    musicToggle.setAttribute('aria-pressed', 'false');
    musicToggle.setAttribute('aria-label', 'Play wedding music');
    musicLabel.textContent = 'Play music';
  }
});

weddingMusic.addEventListener('ended', () => {
  musicToggle.setAttribute('aria-pressed', 'false');
  musicToggle.setAttribute('aria-label', 'Play wedding music');
  musicLabel.textContent = 'Play music';
});
