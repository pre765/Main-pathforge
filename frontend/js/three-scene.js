/* Three.js 3D Scene - Gaming theme: starfield + neon shapes */
(function() {
    const container = document.getElementById('canvas-3d');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030014, 0);
    container.appendChild(renderer.domElement);

    /* Starfield particles */
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 100;
        starPositions[i + 1] = (Math.random() - 0.5) * 100;
        starPositions[i + 2] = (Math.random() - 0.5) * 80 - 20;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMaterial);
    scene.add(stars);

    /* Neon wireframe shapes - gaming palette */
    const geometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1, 0),
        new THREE.TorusGeometry(0.7, 0.3, 8, 16),
        new THREE.BoxGeometry(1, 1, 1),
    ];

    const neonColors = [
        0x00ff88, /* arcade green */
        0x00d4ff, /* electric blue */
        0xff00aa, /* hot pink */
        0xbf5fff, /* neon purple */
        0x00ffff, /* cyan */
    ];

    const shapes = [];
    const count = 14;

    for (let i = 0; i < count; i++) {
        const geo = geometries[i % geometries.length].clone();
        const material = new THREE.MeshBasicMaterial({
            color: neonColors[i % neonColors.length],
            wireframe: true,
            transparent: true,
            opacity: 0.25 + Math.random() * 0.2,
        });

        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(
            (Math.random() - 0.5) * 18,
            (Math.random() - 0.5) * 18,
            (Math.random() - 0.5) * 12 - 4
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        mesh.userData = {
            speedX: (Math.random() - 0.5) * 0.004,
            speedY: (Math.random() - 0.5) * 0.004,
            speedZ: (Math.random() - 0.5) * 0.002,
        };
        scene.add(mesh);
        shapes.push(mesh);
    }

    /* Horizontal grid plane (Tron-style) */
    const gridHelper = new THREE.GridHelper(40, 30, 0x00ff8822, 0x00ff8811);
    gridHelper.position.z = -8;
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);

        shapes.forEach((mesh) => {
            mesh.rotation.x += mesh.userData.speedX;
            mesh.rotation.y += mesh.userData.speedY;
            mesh.rotation.z += mesh.userData.speedZ;
        });

        renderer.render(scene, camera);
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize);
    animate();
})();
