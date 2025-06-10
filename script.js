const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container").appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function addStars(count = 500) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push(
      (Math.random() - 0.5) * 300,
      (Math.random() - 0.5) * 300,
      (Math.random() - 0.5) * 300
    );
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true,
  });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}
addStars();

const sunGeo = new THREE.SphereGeometry(3.5, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

const glowTexture = new THREE.TextureLoader().load("textures/sunglow.png");
const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffff00,
    transparent: true,
    blending: THREE.AdditiveBlending,
  })
);
sunGlow.scale.set(8, 8, 1);
sun.add(sunGlow);

const light = new THREE.PointLight(0xffffff, 4, 200);
light.position.set(0, 0, 0);
scene.add(light);

const textureLoader = new THREE.TextureLoader();
const planetFiles = {
  mercury: "textures/mercury.jpg",
  venus: "textures/venus.jpg",
  earth: "textures/earth.jpeg",
  mars: "textures/mars.jpg",
  jupiter: "textures/jupiter.jpg",
  saturn: "textures/saturn.jpg",
  uranus: "textures/uranus.jpg",
  neptune: "textures/neptune.jpg",
};

const planetData = [
  { name: "mercury", size: 0.5, distance: 4 },
  { name: "venus", size: 0.7, distance: 5.5 },
  { name: "earth", size: 0.75, distance: 7 },
  { name: "mars", size: 0.6, distance: 8.5 },
  { name: "jupiter", size: 1.8, distance: 10.5 },
  { name: "saturn", size: 1.5, distance: 12.5 },
  { name: "uranus", size: 1.1, distance: 14.5 },
  { name: "neptune", size: 1.1, distance: 16.5 },
];

const planetSpeeds = {
  mercury: 0.1,
  venus: 0.08,
  earth: 0.06,
  mars: 0.04,
  jupiter: 0.03,
  saturn: 0.02,
  uranus: 0.01,
  neptune: 0.009,
};

const planets = [];

function addPlanetToScene(p, mat) {
  const geo = new THREE.SphereGeometry(p.size, 32, 32);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.x = p.distance;
  scene.add(mesh);

  const label = document.createElement("div");
  label.className = "planet-label";
  label.textContent = p.name.charAt(0).toUpperCase() + p.name.slice(1);
  document.getElementById("labels").appendChild(label);

  const planetObject = {
    mesh,
    name: p.name,
    distance: p.distance,
    angle: Math.random() * Math.PI * 2,
    label,
  };

  if (p.name === "saturn") {
    const ringTexture = textureLoader.load("textures/saturn_ring.jpg");
    const ringGeo = new THREE.RingGeometry(p.size + 0.3, p.size + 0.9, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    mesh.add(ring);
  }

  planets.push(planetObject);
}

planetData.forEach((p) => {
  const orbitGeo = new THREE.RingGeometry(
    p.distance - 0.01,
    p.distance + 0.01,
    64
  );
  const orbitMat = new THREE.MeshBasicMaterial({
    color: 0x888888,
    side: THREE.DoubleSide,
  });
  const orbit = new THREE.Mesh(orbitGeo, orbitMat);
  orbit.rotation.x = -Math.PI / 2;
  scene.add(orbit);
});

function createPlanet(p) {
  return new Promise((resolve) => {
    if (planetFiles[p.name]) {
      textureLoader.load(planetFiles[p.name], (texture) => {
        const mat = new THREE.MeshStandardMaterial({ map: texture });
        addPlanetToScene(p, mat);
        resolve();
      });
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
      addPlanetToScene(p, mat);
      resolve();
    }
  });
}

Promise.all(planetData.map(createPlanet)).then(() => {
  animate();
});

camera.position.z = 30;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  planets.forEach((p) => {
    p.angle += planetSpeeds[p.name] * delta;
    p.mesh.position.x = Math.cos(p.angle) * p.distance;
    p.mesh.position.z = Math.sin(p.angle) * p.distance;
    p.mesh.rotation.y += 0.01;

    const vector = p.mesh.position.clone().project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    p.label.style.left = `${x}px`;
    p.label.style.top = `${y + 20}px`;
  });

  const time = clock.getElapsedTime();
  const pulse = 1 + Math.sin(time * 2) * 0.1;
  sunGlow.scale.set(9 * pulse, 9 * pulse, 1);

  controls.update();
  renderer.render(scene, camera);
}
Object.keys(planetSpeeds).forEach((name) => {
  const slider = document.getElementById(name + "Speed");
  if (slider) {
    slider.addEventListener("input", (e) => {
      planetSpeeds[name] = parseFloat(e.target.value);
    });
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
