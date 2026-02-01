import * as THREE from 'three';

export class Background {
    constructor(scene) {
        this.scene = scene;
        this.backgroundSphere = null;
        this.stars = null;
        this.dustClouds = null;
        this.twinkleStars = null;
        this.starTime = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
    }

    init() {
        this.createNebula();
        this.createColoredStars();
        this.createDustClouds();
        this.createTwinklingStars();
        this.createLights();
    }

    createNebula() {
        const sphereGeo = new THREE.SphereGeometry(800, 60, 40);
        sphereGeo.scale(-1, 1, 1);

        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width
        );

        gradient.addColorStop(0.0, "#02040a");
        gradient.addColorStop(0.4, "#050b18");
        gradient.addColorStop(0.8, "#0a0510");
        gradient.addColorStop(1.0, "#000000");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 15000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const alpha = Math.random() * 0.15;
            ctx.fillStyle = `rgba(180, 200, 255, ${alpha})`;
            ctx.fillRect(x, y, 0.8, 0.8);
        }

        const bgTexture = new THREE.CanvasTexture(canvas);
        this.backgroundSphere = new THREE.Mesh(
            sphereGeo,
            new THREE.MeshBasicMaterial({ map: bgTexture, side: THREE.BackSide })
        );
        this.scene.add(this.backgroundSphere);
    }


    createColoredStars() {
        const isMobile = window.innerWidth < 768;
        const count = isMobile ? 100 : 6000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const colorPalette = [
            new THREE.Color(0xffffff),
            new THREE.Color(0x88ccff),
            new THREE.Color(0xffccaa),
            new THREE.Color(0xcc99ff)
        ];

        for (let i = 0; i < count; i++) {
            const r = 300 + Math.random() * 500;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 2.0;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 1.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.stars = new THREE.Points(geo, mat);
        this.scene.add(this.stars);
    }

    createDustClouds() {
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 100 : 800;
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            const r = 150 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = r * Math.cos(phi);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        const pointTexture = new THREE.CanvasTexture(canvas);

        const mat = new THREE.PointsMaterial({
            size: 4,
            map: pointTexture,
            color: 0x4466aa,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.dustClouds = new THREE.Points(geo, mat);
        this.scene.add(this.dustClouds);
    }

    createTwinklingStars() {
        const isMobile = window.innerWidth < 768;
        const count = isMobile ? 50 : 200;
        const positions = new Float32Array(count * 3);
        const twinkleData = new Float32Array(count * 2);

        for (let i = 0; i < count; i++) {
            const r = 350 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            twinkleData[i * 2] = Math.random() * Math.PI * 2;
            twinkleData[i * 2 + 1] = 0.5 + Math.random();
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('twinkleData', new THREE.BufferAttribute(twinkleData, 2));

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseSize: { value: 10.0 }
            },
            vertexShader: `
                uniform float time;
                uniform float baseSize;
                attribute vec2 twinkleData;
                varying float vAlpha;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    float twinkle = sin(time * twinkleData.y + twinkleData.x);
                    vAlpha = 0.4 + 0.6 * twinkle; 
                    gl_PointSize = baseSize * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    if(dist > 0.5) discard;
                    float glow = pow(1.0 - dist * 2.0, 2.0);
                    gl_FragColor = vec4(0.95, 0.98, 1.0, vAlpha * glow); 
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.twinkleStars = new THREE.Points(geo, mat);
        this.scene.add(this.twinkleStars);
    }



    createLights() {
        const ambientLight = new THREE.AmbientLight(0x050510, 0.4);
        this.scene.add(ambientLight);

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');

        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.15, 'rgba(200, 240, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(0, 100, 255, 0.4)');
        gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);

        const sunTexture = new THREE.CanvasTexture(canvas);

        const sunMaterial = new THREE.SpriteMaterial({
            map: sunTexture,
            color: 0xffffff,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        this.sunMesh = new THREE.Sprite(sunMaterial);
        this.sunMesh.scale.set(18, 18, 1);
        this.sunMesh.position.set(0, 15, -12);
        this.scene.add(this.sunMesh);

        const dirLight = new THREE.DirectionalLight(0xffffff, 4.5);
        dirLight.position.copy(this.sunMesh.position);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        this.laserLight = new THREE.SpotLight(0x00ffff, 0, 200, 0.2, 1, 0.5);
        this.laserLight.position.copy(this.sunMesh.position);
        this.scene.add(this.laserLight);
    }

    updateMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }

    update(deltaTime) {
        this.starTime += deltaTime;

        if (this.backgroundSphere) {
            this.backgroundSphere.rotation.y += 0.00015;
            this.backgroundSphere.rotation.z += 0.00005;
        }

        if (this.stars) {
            this.stars.rotation.y += 0.0003;
            this.stars.rotation.x += 0.0001;

            const autoX = Math.sin(this.starTime * 0.2) * 2.0;
            const autoY = Math.cos(this.starTime * 0.15) * 1.5;

            const targetX = autoX + (this.mouseX * 12.0);
            const targetY = autoY + (-this.mouseY * 12.0);

            this.stars.position.x += (targetX - this.stars.position.x) * 0.05;
            this.stars.position.y += (targetY - this.stars.position.y) * 0.05;
        }

        if (this.dustClouds) {
            this.dustClouds.rotation.y += 0.0002;
            this.dustClouds.rotation.z -= 0.0001;

            const autoX = Math.cos(this.starTime * 0.1) * 3.0;
            const targetX = autoX + (this.mouseX * 4.0);
            const targetY = (-this.mouseY * 4.0);

            this.dustClouds.position.x += (targetX - this.dustClouds.position.x) * 0.05;
        }

        if (this.twinkleStars) {
            this.twinkleStars.material.uniforms.time.value = this.starTime;
            this.twinkleStars.rotation.y += 0.0005;
            this.twinkleStars.rotation.z -= 0.0002;

            const targetX = (this.mouseX * 8.0);
            const targetY = (-this.mouseY * 8.0);

            this.twinkleStars.position.x += (targetX - this.twinkleStars.position.x) * 0.05;
            this.twinkleStars.position.y += (targetY - this.twinkleStars.position.y) * 0.05;
        }
    }
}