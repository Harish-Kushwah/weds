import * as THREE from 'three';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TOTAL_PHOTOS = 16;
const weddingPhotos = Array.from({ length: TOTAL_PHOTOS }, (_, index) => `${index + 1}.jpeg`);

const orbit = document.querySelector('#photo-orbit');
const orbitTrack = document.querySelector('#photo-orbit-track');
const galleryGrid = document.querySelector('#gallery-grid');
const photoCount = document.querySelector('#photo-count');
let activePhoto = 0;

function photoUrl(filename) {
  return `images/${encodeURI(filename)}`;
}

const railCount = window.innerWidth < 700 ? 2 : 4;
const railLists = Array.from({ length: railCount }, () => {
  const rail = document.createElement('div');
  rail.className = 'gallery-rail';
  const track = document.createElement('div');
  track.className = 'gallery-rail-track';
  const list = document.createElement('div');
  list.className = 'gallery-rail-list';
  track.append(list);
  rail.append(track);
  galleryGrid.append(rail);
  return { rail, track, list };
});

function setActivePhoto(index) {
  activePhoto = (index + weddingPhotos.length) % weddingPhotos.length;
  const compactLayout = window.matchMedia('(max-width: 520px)').matches;
  [...orbitTrack.children].forEach((photo, photoIndex) => {
    let distance = photoIndex - activePhoto;
    if (distance > weddingPhotos.length / 2) distance -= weddingPhotos.length;
    if (distance < -weddingPhotos.length / 2) distance += weddingPhotos.length;
    const magnitude = Math.abs(distance);
    if (magnitude > (compactLayout ? 1 : 2)) {
      photo.style.opacity = '0';
      photo.style.visibility = 'hidden';
      photo.style.pointerEvents = 'none';
      return;
    }
    const side = Math.sign(distance);
    const stageWidth = orbit.clientWidth;
    const horizontalOffset = distance * stageWidth * (compactLayout ? 0.32 : 0.34);
    const scale = magnitude === 0 ? 1 : magnitude === 1 ? (compactLayout ? 0.69 : 0.78) : 0.57;
    const depth = magnitude === 0 ? 35 : magnitude === 1 ? -20 : -125;
    const tilt = magnitude === 0 ? 0 : side * (magnitude === 1 ? -43 : -57);
    photo.style.transform = `translateX(calc(-50% + ${horizontalOffset}px)) translateY(-50%) translateZ(${depth}px) rotateY(${tilt}deg) scale(${scale})`;
    photo.style.opacity = magnitude === 0 ? '1' : magnitude === 1 ? '0.88' : '0.52';
    photo.style.visibility = 'visible';
    photo.style.pointerEvents = magnitude === 0 ? 'auto' : 'none';
    photo.style.zIndex = String(10 - magnitude);
  });
  photoCount.textContent = `${String(activePhoto + 1).padStart(2, '0')} / ${String(weddingPhotos.length).padStart(2, '0')}`;
}

weddingPhotos.forEach((filename, index) => {
  const imageUrl = photoUrl(filename);
  const orbitPhoto = document.createElement('div');
  orbitPhoto.className = 'orbit-photo';
  orbitPhoto.dataset.index = String(index);
  const orbitImage = document.createElement('img');
  orbitImage.src = imageUrl;
  orbitImage.alt = `Harish and Kavitha, photo ${index + 1}`;
  orbitImage.loading = index < 4 ? 'eager' : 'lazy';
  orbitImage.decoding = 'async';
  orbitPhoto.append(orbitImage);
  orbitTrack.append(orbitPhoto);

  const galleryButton = document.createElement('button');
  galleryButton.className = 'gallery-item reveal';
  galleryButton.type = 'button';
  galleryButton.dataset.photoIndex = String(index);
  galleryButton.setAttribute('aria-label', `View wedding photo ${index + 1}`);
  const galleryImage = document.createElement('img');
  galleryImage.src = imageUrl;
  galleryImage.alt = `Wedding memory ${index + 1}`;
  galleryImage.loading = 'lazy';
  galleryImage.decoding = 'async';
  const viewHint = document.createElement('span');
  viewHint.textContent = 'View photo ↗';
  galleryButton.append(galleryImage, viewHint);
  railLists[index % railCount].list.append(galleryButton);
});

railLists.forEach(({ track, list }) => {
  const duplicate = list.cloneNode(true);
  duplicate.classList.add('gallery-rail-list-copy');
  duplicate.setAttribute('aria-hidden', 'true');
  duplicate.querySelectorAll('button').forEach((button) => {
    button.tabIndex = -1;
    button.classList.remove('reveal', 'is-visible');
  });
  track.append(duplicate);
});

setActivePhoto(0);
document.querySelector('#photo-prev').addEventListener('click', () => setActivePhoto(activePhoto - 1));
document.querySelector('#photo-next').addEventListener('click', () => setActivePhoto(activePhoto + 1));

let autoRotate;
function startAutoRotate() {
  if (reducedMotion || autoRotate) return;
  autoRotate = window.setInterval(() => setActivePhoto(activePhoto + 1), 3200);
}
function stopAutoRotate() {
  window.clearInterval(autoRotate);
  autoRotate = undefined;
}
startAutoRotate();
orbit.addEventListener('pointerenter', stopAutoRotate);
orbit.addEventListener('pointerleave', startAutoRotate);
orbit.addEventListener('focusin', stopAutoRotate);
orbit.addEventListener('focusout', startAutoRotate);
let pointerStartX = null;
orbit.addEventListener('pointerdown', (event) => { pointerStartX = event.clientX; });
orbit.addEventListener('pointerup', (event) => {
  if (pointerStartX === null) return;
  const difference = event.clientX - pointerStartX;
  if (Math.abs(difference) > 35) setActivePhoto(activePhoto + (difference < 0 ? 1 : -1));
  pointerStartX = null;
});
orbit.addEventListener('pointercancel', () => { pointerStartX = null; });

// Let the 3D photo stack lean gently toward the pointer, then settle back.
if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;
  let tiltFrame = null;
  const easeOrbitTilt = () => {
    currentTiltX += (targetTiltX - currentTiltX) * 0.08;
    currentTiltY += (targetTiltY - currentTiltY) * 0.08;
    orbitTrack.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;
    if (Math.abs(targetTiltX - currentTiltX) > 0.01 || Math.abs(targetTiltY - currentTiltY) > 0.01) {
      tiltFrame = requestAnimationFrame(easeOrbitTilt);
    } else {
      currentTiltX = targetTiltX;
      currentTiltY = targetTiltY;
      tiltFrame = null;
    }
  };
  orbit.addEventListener('pointermove', (event) => {
    const bounds = orbit.getBoundingClientRect();
    targetTiltY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 5;
    targetTiltX = (0.5 - (event.clientY - bounds.top) / bounds.height) * 3;
    if (tiltFrame === null) tiltFrame = requestAnimationFrame(easeOrbitTilt);
  });
  orbit.addEventListener('pointerleave', () => {
    targetTiltX = 0;
    targetTiltY = 0;
    if (tiltFrame === null) tiltFrame = requestAnimationFrame(easeOrbitTilt);
  });
}

const photoLightbox = document.querySelector('#photo-lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
galleryGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.gallery-item');
  if (!button) return;
  const image = button.querySelector('img');
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = `Harish & Kavitha · ${String(Number(button.dataset.photoIndex) + 1).padStart(2, '0')}`;
  photoLightbox.showModal();
});
document.querySelector('#lightbox-close').addEventListener('click', () => photoLightbox.close());
photoLightbox.addEventListener('click', (event) => { if (event.target === photoLightbox) photoLightbox.close(); });

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

  // Randomly scattered, softly lit 3D hearts and stars.
  const makeHeartShape = () => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.62);
    shape.bezierCurveTo(-0.12, -0.4, -0.78, 0.02, -0.78, 0.43);
    shape.bezierCurveTo(-0.78, 0.93, -0.14, 0.98, 0, 0.48);
    shape.bezierCurveTo(0.14, 0.98, 0.78, 0.93, 0.78, 0.43);
    shape.bezierCurveTo(0.78, 0.02, 0.12, -0.4, 0, -0.62);
    return shape;
  };
  const makeStarShape = () => {
    const shape = new THREE.Shape();
    for (let point = 0; point < 10; point += 1) {
      const angle = Math.PI / 2 + point * Math.PI / 5;
      const radius = point % 2 === 0 ? 0.62 : 0.27;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (point === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  };
  const charmGeometry = (shape, depth) => new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelSegments: 2, steps: 1,
    bevelSize: 0.045, bevelThickness: 0.045, curveSegments: 12
  });
  const heartGeometry = charmGeometry(makeHeartShape(), 0.12);
  const starGeometry = charmGeometry(makeStarShape(), 0.12);
  const heartMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9b4050, metalness: 0.12, roughness: 0.38, clearcoat: 0.45, transparent: true, opacity: 0.2 });
  const starMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc0a064, metalness: 0.2, roughness: 0.34, clearcoat: 0.5, transparent: true, opacity: 0.24 });
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const charmLight = new THREE.PointLight(0xffe3c7, 30, 900);
  charmLight.position.set(-innerWidth * 0.22, innerHeight * 0.3, 12);
  scene.add(charmLight);
  const charms = [];
  const charmGroup = new THREE.Group();
  scene.add(charmGroup);
  const pointerTilt = { x: 0, y: 0 };
  let scrollTilt = 0;
  if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      pointerTilt.x = (event.clientX / innerWidth - 0.5) * 0.12;
      pointerTilt.y = (event.clientY / innerHeight - 0.5) * 0.08;
    }, { passive: true });
  }
  if (!reducedMotion) {
    window.addEventListener('scroll', () => {
      const scrollableHeight = document.documentElement.scrollHeight - innerHeight;
      scrollTilt = scrollableHeight > 0 ? (window.scrollY / scrollableHeight - 0.5) * 0.1 : 0;
    }, { passive: true });
  }
  const charmCount = innerWidth < 700 ? 4 : 6;
  const placed = [];
  for (let i = 0; i < charmCount; i += 1) {
    const isHeart = Math.random() < 0.52;
    const mesh = new THREE.Mesh(isHeart ? heartGeometry : starGeometry, isHeart ? heartMaterial : starMaterial);
    const scale = 7 + Math.random() * 5;
    mesh.scale.setScalar(scale);
    let x = 0;
    let y = 0;
    let attempts = 0;
    do {
      x = (Math.random() - 0.5) * 0.88;
      y = (Math.random() - 0.5) * 0.82;
      attempts += 1;
    } while (placed.some((point) => Math.hypot((x - point.x) * innerWidth, (y - point.y) * innerHeight) < 155) && attempts < 80);
    placed.push({ x, y });
    mesh.position.set(x * innerWidth, y * innerHeight, -2 + Math.random() * 2);
    const rotationY = Math.random() * 0.16 - 0.08;
    const rotationZ = Math.random() * 0.22 - 0.11;
    mesh.rotation.set(Math.random() * 0.12 - 0.06, rotationY, rotationZ);
    charmGroup.add(mesh);
    charms.push({ mesh, x, y, phase: Math.random() * Math.PI * 2, drift: 3 + Math.random() * 5, rotationY, rotationZ, rotationSpeed: 0.12 + Math.random() * 0.12 });
  }
  let frameId;
  let lastFrame = 0;
  const draw = (time = 0) => {
    if (document.hidden) return;
    frameId = requestAnimationFrame(draw);
    if (reducedMotion && time - lastFrame < 1200) return;
    lastFrame = time;
    material.uniforms.uTime.value = time * 0.001;
    const pointerX = reducedMotion ? 0 : pointerTilt.x;
    const pointerY = reducedMotion ? 0 : pointerTilt.y;
    charmGroup.rotation.y += (pointerX - charmGroup.rotation.y) * 0.045;
    charmGroup.rotation.x += (pointerY + scrollTilt - charmGroup.rotation.x) * 0.045;
    charms.forEach(({ mesh, x, y, phase, drift, rotationY, rotationZ, rotationSpeed }) => {
      const elapsed = reducedMotion ? 0 : time * 0.001;
      mesh.position.x = x * innerWidth + Math.sin(elapsed * 0.3 + phase) * drift;
      mesh.position.y = y * innerHeight + Math.cos(elapsed * 0.24 + phase) * drift;
      mesh.rotation.y = rotationY + Math.sin(elapsed * rotationSpeed + phase) * 0.18;
      mesh.rotation.z = rotationZ + Math.sin(elapsed * 0.2 + phase) * 0.035;
    });
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
    charms.forEach(({ mesh, x, y }) => mesh.position.set(x * innerWidth, y * innerHeight, mesh.position.z));
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

const downloadCardButton = document.querySelector('#download-card');
const recipientDialog = document.querySelector('#recipient-dialog');
const recipientForm = document.querySelector('#recipient-form');
const recipientInput = document.querySelector('#recipient-name');
const cardRecipient = document.querySelector('#card-recipient');
downloadCardButton.addEventListener('click', () => {
  recipientDialog.showModal();
  recipientInput.focus();
});
document.querySelector('#recipient-dialog-close').addEventListener('click', () => recipientDialog.close());
recipientDialog.addEventListener('click', (event) => {
  if (event.target === recipientDialog) recipientDialog.close();
});

async function downloadInvitationCard(guestName) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fbf9f3';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#ded8cb';
  context.lineWidth = 2;
  context.strokeRect(38, 38, 1124, 1424);
  context.strokeStyle = '#d4c4a5';
  context.lineWidth = 1;
  context.strokeRect(58, 58, 1084, 1384);
  const corner = (x, y, dx, dy) => {
    context.beginPath();
    context.moveTo(x, y + dy * 46);
    context.lineTo(x, y);
    context.lineTo(x + dx * 46, y);
    context.stroke();
  };
  corner(78, 78, 1, 1); corner(1122, 78, -1, 1);
  corner(78, 1422, 1, -1); corner(1122, 1422, -1, -1);
  const centerText = (text, y, font, color, maxWidth = 1000) => {
    context.textAlign = 'center';
    context.fillStyle = color;
    context.font = font;
    context.fillText(text, 600, y, maxWidth);
  };
  centerText('TOGETHER WITH OUR FAMILIES', 190, '600 18px "DM Sans", sans-serif', '#7e8979');
  centerText(`Dear ${guestName},`, 300, 'italic 30px "Playfair Display", Georgia, serif', '#842f3e');
  centerText('✳', 395, '56px Georgia, serif', '#a39170');
  centerText('request the pleasure of your company', 490, 'italic 30px "Playfair Display", Georgia, serif', '#7d7e72');
  centerText('Harish & Kavitha', 600, '48px "Playfair Display", Georgia, serif', '#405c4b');
  centerText('as we begin our forever together', 660, 'italic 27px "Playfair Display", Georgia, serif', '#7d7e72');
  context.strokeStyle = '#ddd4c4';
  context.beginPath(); context.moveTo(300, 735); context.lineTo(550, 735); context.moveTo(650, 735); context.lineTo(900, 735); context.stroke();
  centerText('✦', 743, '20px Georgia, serif', '#ad8b58');
  centerText('SATURDAY · 21 NOVEMBER 2026', 840, '600 18px "DM Sans", sans-serif', '#536351');
  centerText('at half past four', 915, '32px "Playfair Display", Georgia, serif', '#415649');
  centerText('THE GLASSHOUSE GARDENS', 1015, '600 19px "DM Sans", sans-serif', '#4e5c4f');
  centerText('SONOMA VALLEY · CALIFORNIA', 1060, '17px "DM Sans", sans-serif', '#81877a');
  centerText('DINNER, DANCING & ALL OUR FAVOURITE PEOPLE', 1170, '15px "DM Sans", sans-serif', '#aaa28f');
  const slug = guestName.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'guest';
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `wedding-invitation-for-${slug}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

recipientForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const guestName = recipientInput.value.trim();
  if (!guestName) return;
  cardRecipient.textContent = `Dear ${guestName},`;
  cardRecipient.hidden = false;
  recipientDialog.close();
  downloadInvitationCard(guestName);
});

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

window.addEventListener('resize', () => setActivePhoto(activePhoto));

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
