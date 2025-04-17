// Create this as a file named optimized-solar-system.js
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.animation-container');
    if (!container) return;
    
    // Performance check - if the device is likely too slow, don't run the animation
    function isLowPerformanceDevice() {
      // Check for mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      // Check for low memory (if available)
      const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
      
      return isMobile || lowMemory;
    }
    
    if (isLowPerformanceDevice()) {
      // Don't run animation on potentially slow devices
      container.style.display = 'none';
      return;
    }
    
    // Scene, camera, and renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disable antialiasing for performance
      alpha: true,
      precision: 'mediump' // Use medium precision for better performance
    });
    
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
    const sunGeometry = new THREE.SphereGeometry(5, 16, 16); // Reduced segments
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.9
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Sun glow effect
    const sunGlowGeometry = new THREE.SphereGeometry(6, 16, 16); // Reduced segments
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
    
    // Reduced number of planets
    const planetSizes = [0.8, 1.5, 3, 2.5];
    const planetDistances = [10, 18, 28, 38];
    const planetSpeeds = [0.003, 0.002, 0.001, 0.0005];
    
    // Create orbit rings
    const createOrbitRing = (radius) => {
      const orbitGeometry = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 64); // Reduced segments
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
    for (let i = 0; i < 4; i++) { // Reduced from 6 to 4 planets
      createOrbitRing(planetDistances[i]);
      
      const planetGeometry = new THREE.SphereGeometry(planetSizes[i], 16, 16); // Reduced segments
      const planetMaterial = new THREE.MeshBasicMaterial({ // Changed from MeshLambertMaterial for performance
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
      if (i === 3) {
        const ringGeometry = new THREE.RingGeometry(3, 5, 24); // Reduced segments
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
    
    // Add fewer stars
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true
    });
    
    const starVertices = [];
    for (let i = 0; i < 500; i++) { // Reduced from 1000 to 500 stars
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Mouse interaction variables with throttling
    const mouse = new THREE.Vector2();
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    const windowHalfX = container.clientWidth / 2;
    const windowHalfY = container.clientHeight / 2;
    
    // Throttle the mouse move event
    let lastMouseMoveTime = 0;
    
    // Mouse move event handler
    function onMouseMove(event) {
      // Throttle the event to improve performance
      const now = Date.now();
      if (now - lastMouseMoveTime < 50) return; // Only process every 50ms
      lastMouseMoveTime = now;
      
      // Calculate mouse position relative to the container
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      mouse.x = (x / container.clientWidth) * 2 - 1;
      mouse.y = -(y / container.clientHeight) * 2 + 1;
      
      // Track mouse position for camera movement
      targetMouseX = (x - windowHalfX) * 0.002; // Reduced sensitivity
      targetMouseY = (y - windowHalfY) * 0.002; // Reduced sensitivity
    }
    
    // Track mouse movement over the container with passive listener for better performance
    container.addEventListener('mousemove', onMouseMove, { passive: true });
    
    // For better performance, use a fixed timestep for animations
    const timeStep = 1000 / 30; // Target 30fps
    let lastTime = 0;
    let deltaTime = 0;
    
    // Animation loop
    const animate = (currentTime) => {
      requestAnimationFrame(animate);
      
      // Calculate delta time to ensure smooth animation even on slower devices
      if (!lastTime) lastTime = currentTime;
      deltaTime += currentTime - lastTime;
      lastTime = currentTime;
      
      // Only update if enough time has passed (fixed timestep)
      if (deltaTime < timeStep) return;
      
      // Update based on fixed timestep
      while (deltaTime >= timeStep) {
        // Smoothly move camera based on mouse position (reduced effect)
        mouseX += (targetMouseX - mouseX) * 0.03;
        mouseY += (targetMouseY - mouseY) * 0.03;
        
        camera.position.x += (mouseX - camera.position.x) * 0.03;
        camera.position.y += (-mouseY - camera.position.y) * 0.03;
        
        // Rotate the sun (SLOWER rotation)
        sun.rotation.y += 0.0002;
        sunGlow.rotation.y -= 0.0001;
        
        // Update planets
        planets.forEach(planet => {
          const userData = planet.userData;
          userData.angle += userData.speed;
          
          // Calculate new position
          planet.position.x = Math.cos(userData.angle) * userData.distance;
          planet.position.z = Math.sin(userData.angle) * userData.distance;
          
          // Rotate planet
          planet.rotation.y += userData.speed * 2;
        });
        
        // Slowly rotate stars
        stars.rotation.y += 0.00002;
        
        deltaTime -= timeStep;
      }
      
      // Look at scene center
      camera.lookAt(scene.position);
      
      // Render scene
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      // Debounce resize events
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }, 250);
    });
    
    // Handle visibility changes for performance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Stop rendering when tab is not visible
        renderer.setAnimationLoop(null);
      } else {
        // Resume rendering
        renderer.setAnimationLoop(animate);
      }
    });
    
    // Add mobile detection (hide on mobile)
    function checkMobileView() {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        container.style.display = 'none';
      } else {
        container.style.display = 'block';
      }
    }
    
    window.addEventListener('resize', checkMobileView);
    checkMobileView();
  });