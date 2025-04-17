// Create this as a file named interactive-solar-system.js
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.animation-container');
    if (!container) return;
    
    // Scene, camera, and renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Camera positioning
    camera.position.z = 50;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 2, 300);
    scene.add(pointLight);
    
    // Create the sun
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.9
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Sun glow effect
    const sunGlowGeometry = new THREE.SphereGeometry(6, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.2
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    scene.add(sunGlow);
    
    // Create planets
    const planets = [];
    const planetColors = [
      0x00aaff, // Mercury - Blue
      0x00ff00, // Venus - Green
      0x0066ff, // Earth - Blue
      0xff3300, // Mars - Red
      0xffaa00, // Jupiter - Orange
      0xffdd00  // Saturn - Yellow
    ];
    
    const planetSizes = [0.8, 1.4, 1.5, 1.2, 3, 2.5];
    const planetDistances = [8, 12, 16, 22, 30, 38];
    
    // SLOWER orbit speeds
    const planetSpeeds = [0.005, 0.0035, 0.0025, 0.0015, 0.001, 0.0007];
    
    // Create orbit rings
    const createOrbitRing = (radius) => {
      const orbitGeometry = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 128);
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.1
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      scene.add(orbit);
    };
    
    // Add planets with orbits
    for (let i = 0; i < planetColors.length; i++) {
      createOrbitRing(planetDistances[i]);
      
      const planetGeometry = new THREE.SphereGeometry(planetSizes[i], 32, 32);
      const planetMaterial = new THREE.MeshLambertMaterial({
        color: planetColors[i]
      });
      
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      
      // Position at a random angle on the orbit
      const angle = Math.random() * Math.PI * 2;
      planet.position.x = Math.cos(angle) * planetDistances[i];
      planet.position.z = Math.sin(angle) * planetDistances[i];
      
      // Store initial angle and orbit speed
      planet.userData = {
        angle: angle,
        speed: planetSpeeds[i],
        distance: planetDistances[i],
        originalDistance: planetDistances[i]
      };
      
      scene.add(planet);
      planets.push(planet);
      
      // Add Saturn's ring for the last planet
      if (i === 5) {
        const ringGeometry = new THREE.RingGeometry(3, 5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xffcc66,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 3;
        planet.add(ring);
      }
    }
    
    // Add some random stars
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true
    });
    
    const starVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Mouse interaction variables
    const mouse = new THREE.Vector2();
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    const windowHalfX = container.clientWidth / 2;
    const windowHalfY = container.clientHeight / 2;
    
    // Mouse move event handler
    function onMouseMove(event) {
      // Calculate mouse position relative to the container
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      mouse.x = (x / container.clientWidth) * 2 - 1;
      mouse.y = -(y / container.clientHeight) * 2 + 1;
      
      // Track mouse position for camera movement
      targetMouseX = (x - windowHalfX) * 0.003;
      targetMouseY = (y - windowHalfY) * 0.003;
      
      // Create ripple effect - planets move away from cursor
      const vector = new THREE.Vector3(mouse.x, mouse.y, 0);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      
      // Move planets based on mouse cursor
      planets.forEach((planet) => {
        const planetPos = planet.position.clone();
        planetPos.project(camera);
        
        // Calculate 2D distance from mouse to planet
        const dx = planetPos.x - mouse.x;
        const dy = planetPos.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // If mouse is close to planet, push it slightly away
        if (dist < 0.5) {
          // Calculate repulsion factor
          const repulsion = (1 - dist * 2) * 5;
          
          // Move planet along its orbit
          planet.userData.angle += repulsion * 0.01;
          
          // Recalculate planet position
          planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
          planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;
        }
      });
    }
    
    // Track mouse movement over the container
    container.addEventListener('mousemove', onMouseMove, false);
    
    // Animation loop
    const animate = () => {
      // Smoothly move camera based on mouse position
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      
      // Rotate the sun (SLOWER rotation)
      sun.rotation.y += 0.0005;
      sunGlow.rotation.y -= 0.0002;
      
      // Update planets
      planets.forEach(planet => {
        const userData = planet.userData;
        userData.angle += userData.speed;
        
        // Calculate new position
        planet.position.x = Math.cos(userData.angle) * userData.distance;
        planet.position.z = Math.sin(userData.angle) * userData.distance;
        
        // Rotate planet (SLOWER rotation)
        planet.rotation.y += userData.speed * 5; // Reduced from 10 to 5
        
        // Gradually return planet distance to original if it was changed by mouse interaction
        if (userData.distance !== userData.originalDistance) {
          userData.distance += (userData.originalDistance - userData.distance) * 0.05;
        }
      });
      
      // Slowly rotate stars
      stars.rotation.y += 0.00005; // Reduced from 0.0001 to 0.00005
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    
    // Handle visibility changes for performance
    let hidden, visibilityChange;
    
    if (typeof document.hidden !== "undefined") {
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    }
    
    function handleVisibilityChange() {
      if (document[hidden]) {
        // Pause animation when tab/window is not visible
        renderer.setAnimationLoop(null);
      } else {
        // Resume animation
        renderer.setAnimationLoop(animate);
      }
    }
    
    if (typeof document.addEventListener !== "undefined" && hidden !== undefined) {
      document.addEventListener(visibilityChange, handleVisibilityChange, false);
    }
    
    // Add mobile detection (hide on mobile)
    function checkMobileView() {
      const isMobile = window.innerWidth <= 768;
      renderer.domElement.style.display = isMobile ? 'none' : 'block';
    }
    
    window.addEventListener('resize', checkMobileView);
    checkMobileView();
  });