import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const TRAIL_LENGTH = 90;
const JET_TARGET_SIZE = 11; // bigger background aircraft
const JET_LOOP_DURATION = 42;

export class Background {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.backgroundSphere = null;
        this.stars = null;
        this.dustClouds = null;
        this.twinkleStars = null;
        this.starTime = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMobile = window.innerWidth < 768;

        this.jet = null;
        this.jetCurve = null;
        this.jetProgress = Math.random();
        this.jetBank = 0;
        this.jetNoseOffset = 0;
        this.jetTrails = [];
        this.engineGlow = null;
        this.engineFlicker = 0;

        // Reusable temps (avoid per-frame allocation)
        this._tmpPos = new THREE.Vector3();
        this._tmpTan = new THREE.Vector3();
        this._tmpLook = new THREE.Vector3();
        this._tmpEmit = new THREE.Vector3();
        this._prevTangent = new THREE.Vector3(1, 0, 0);

        this.init();
    }

    init() {
        this.createNebula();
        this.createColoredStars();
        this.createDustClouds();
        this.createTwinklingStars();
        this.createLights();
        this.createJet();
    }

    createJet() {
        if (this.isMobile) return; // keep the background lean on phones

        const loader = new GLTFLoader(this.loadingManager);

        // jetoptimized.glb is Draco-compressed — wire up the WASM decoder
        const draco = new DRACOLoader(this.loadingManager);
        draco.setDecoderPath('https://unpkg.com/three@0.172.0/examples/jsm/libs/draco/');
        loader.setDRACOLoader(draco);

        loader.load('./assets/jetoptimized.glb', (gltf) => {
            const model = gltf.scene;

            // Normalize scale so the jet reads clearly at background distance.
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = JET_TARGET_SIZE / maxDim;

            const center = new THREE.Vector3();
            box.getCenter(center);
            model.position.sub(center);
            model.scale.setScalar(scale);

            // Much darker stealth finish: kill bright paint, keep silhouette.
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                    const mat = child.material;
                    if (mat) {
                        if ('color' in mat && mat.color) mat.color.multiplyScalar(0.16);
                        if ('emissive' in mat && mat.emissive) mat.emissive.setRGB(0, 0, 0);
                        if ('metalness' in mat) mat.metalness = 0.85;
                        if ('roughness' in mat) mat.roughness = 0.55;
                        if ('envMapIntensity' in mat) mat.envMapIntensity = 0.25;
                        mat.toneMapped = true;
                    }
                }
            });

            this.jet = new THREE.Group();
            this.jet.add(model);
            this.jet.frustumCulled = false;

            this.createEngineGlow();
            this.createJetTrails();

            this.jetCurve = this.createJetPath();
            const startPoint = this.jetCurve.getPointAt(this.jetProgress);
            this.jet.position.copy(startPoint);

            this.scene.add(this.jet);
        });
    }

    createEngineGlow() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(160,240,255,1)');
        grad.addColorStop(0.25, 'rgba(0,200,255,0.8)');
        grad.addColorStop(1, 'rgba(0,80,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        const mat = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        });
        this.engineGlow = new THREE.Sprite(mat);
        const s = JET_TARGET_SIZE * 0.28;
        this.engineGlow.scale.set(s, s, 1);
        // Rear of the craft (jet faces +Z after lookAt)
        this.engineGlow.position.set(0, 0.1, -JET_TARGET_SIZE * 0.55);
        this.jet.add(this.engineGlow);
    }

    createJetTrails() {
        const s = JET_TARGET_SIZE;
        // Wingtips + engine: offsets in jet-local space
        const emitters = [
            new THREE.Vector3(0, 0.1, -s * 0.55)
        ];

        this.jetTrails = emitters.map((offset) => {
            const positions = new Float32Array(TRAIL_LENGTH * 3);
            const colors = new Float32Array(TRAIL_LENGTH * 3);
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            const mat = new THREE.LineBasicMaterial({
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.6,
                depthWrite: false
            });
            const line = new THREE.Line(geo, mat);
            line.frustumCulled = false;
            this.scene.add(line);
            return { offset, line, positions, colors, seeded: false };
        });
    }

    pushTrail(trail, worldPos) {
        const { positions, colors } = trail;
        // Shift history back, append new point at the end (head)
        positions.copyWithin(0, 3);
        colors.copyWithin(0, 3);
        const h = (TRAIL_LENGTH - 1) * 3;
        positions[h] = worldPos.x;
        positions[h + 1] = worldPos.y;
        positions[h + 2] = worldPos.z;
        // Rebuild fade: tail (black/invisible) -> head (bright cyan)
        for (let i = 0; i < TRAIL_LENGTH; i++) {
            const t = i / (TRAIL_LENGTH - 1);
            const b = t * t;
            colors[i * 3] = 0.25 * b;
            colors[i * 3 + 1] = 0.85 * b;
            colors[i * 3 + 2] = 1.0 * b;
        }
        trail.line.geometry.attributes.position.needsUpdate = true;
        trail.line.geometry.attributes.color.needsUpdate = true;
    }

    seedTrail(trail, worldPos) {
        for (let i = 0; i < TRAIL_LENGTH; i++) {
            trail.positions[i * 3] = worldPos.x;
            trail.positions[i * 3 + 1] = worldPos.y;
            trail.positions[i * 3 + 2] = worldPos.z;
        }
        trail.line.geometry.attributes.position.needsUpdate = true;
        trail.seeded = true;
    }

    createJetPath() {
        // Slow sweeping loop behind/around the crystal so the jet
        // drifts through the starfield without ever blocking the UI.
        const points = [
            new THREE.Vector3(-44, 11, -34),
            new THREE.Vector3(-12, 22, -58),
            new THREE.Vector3(30, 13, -44),
            new THREE.Vector3(46, -4, -26),
            new THREE.Vector3(8, -15, -28),
            new THREE.Vector3(-30, -10, -52)
        ];
        return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
    }

    createNebula() {
        const sphereGeo = new THREE.SphereGeometry(800, 48, 32);
        sphereGeo.scale(-1, 1, 1);

        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
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

        for (let i = 0; i < 6000; i++) {
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
        const count = this.isMobile ? 100 : 6000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const palette = [
            [1, 1, 1],
            [0.53, 0.8, 1],
            [1, 0.8, 0.67],
            [0.8, 0.6, 1]
        ];

        for (let i = 0; i < count; i++) {
            const r = 300 + Math.random() * 500;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const c = palette[(Math.random() * palette.length) | 0];
            colors[i * 3] = c[0];
            colors[i * 3 + 1] = c[1];
            colors[i * 3 + 2] = c[2];
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
            sizeAttenuation: true,
            depthWrite: false
        });

        this.stars = new THREE.Points(geo, mat);
        this.scene.add(this.stars);
    }

    createDustClouds() {
        const particleCount = this.isMobile ? 100 : 800;
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
        const count = this.isMobile ? 50 : 200;
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
            transparent: true,
            depthWrite: false
        });

        this.sunMesh = new THREE.Sprite(sunMaterial);
        this.sunMesh.scale.set(18, 18, 1);
        this.sunMesh.position.set(0, 15, -12);
        this.scene.add(this.sunMesh);

        const dirLight = new THREE.DirectionalLight(0xffffff, 4.5);
        dirLight.position.copy(this.sunMesh.position);
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

            const targetX = Math.sin(this.starTime * 0.2) * 2.0 + this.mouseX * 12.0;
            const targetY = Math.cos(this.starTime * 0.15) * 1.5 - this.mouseY * 12.0;

            this.stars.position.x += (targetX - this.stars.position.x) * 0.05;
            this.stars.position.y += (targetY - this.stars.position.y) * 0.05;
        }

        if (this.dustClouds) {
            this.dustClouds.rotation.y += 0.0002;
            this.dustClouds.rotation.z -= 0.0001;

            const targetX = Math.cos(this.starTime * 0.1) * 3.0 + this.mouseX * 4.0;
            this.dustClouds.position.x += (targetX - this.dustClouds.position.x) * 0.05;
        }

        if (this.twinkleStars) {
            this.twinkleStars.material.uniforms.time.value = this.starTime;
            this.twinkleStars.rotation.y += 0.0005;
            this.twinkleStars.rotation.z -= 0.0002;

            const targetX = this.mouseX * 8.0;
            const targetY = -this.mouseY * 8.0;

            this.twinkleStars.position.x += (targetX - this.twinkleStars.position.x) * 0.05;
            this.twinkleStars.position.y += (targetY - this.twinkleStars.position.y) * 0.05;
        }

        this.updateJet(deltaTime);
    }

    updateJet(deltaTime) {
        if (!this.jet || !this.jetCurve) return;

        this.jetProgress += deltaTime / JET_LOOP_DURATION;
        if (this.jetProgress > 1) this.jetProgress -= 1;

        const position = this.jetCurve.getPointAt(this.jetProgress, this._tmpPos);
        const tangent = this.jetCurve.getTangentAt(this.jetProgress, this._tmpTan).normalize();

        this.jet.position.copy(position);
        this.jet.up.set(0, 1, 0);
        this._tmpLook.copy(position).add(tangent);
        this.jet.lookAt(this._tmpLook);
        if (this.jetNoseOffset) this.jet.rotateY(this.jetNoseOffset);

        // Bank into curves using turn rate vs previous frame (1 tangent lookup instead of 2)
        const turnRate = this._prevTangent.x * tangent.z - this._prevTangent.z * tangent.x;
        const targetBank = THREE.MathUtils.clamp(turnRate * 60, -0.5, 0.5);
        this.jetBank += (targetBank - this.jetBank) * 0.03;
        this.jet.rotateZ(this.jetBank);
        this._prevTangent.copy(tangent);

        // Trails + engine flicker
        this.jet.updateMatrixWorld();
        for (const trail of this.jetTrails) {
            this._tmpEmit.copy(trail.offset).applyMatrix4(this.jet.matrixWorld);
            if (!trail.seeded) this.seedTrail(trail, this._tmpEmit);
            else this.pushTrail(trail, this._tmpEmit);
        }
        if (this.engineGlow) {
            this.engineFlicker += deltaTime * 20;
            const f = 0.75 + Math.sin(this.engineFlicker) * 0.15;
            this.engineGlow.material.opacity = f;
        }
    }
}
