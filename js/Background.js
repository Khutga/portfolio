import * as THREE from 'three';

export class Background {
    constructor(scene) {
        this.scene = scene;
        this.backgroundSphere = null;
        this.stars = null;
        this.dustClouds = null;
        this.twinkleStars = null;
        this.starTime = 0;
        
        this.init();
    }

    init() {
        this.createNebula();
        this.createStarSystem();
        this.createDustClouds();
        this.createTwinklingStars();
        this.createLights();
    }

    createNebula() {
        const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
        sphereGeo.scale(-1, 1, 1);

        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Nebula çizimi
        const gradient1 = ctx.createRadialGradient(
            canvas.width * 0.3, canvas.height * 0.7, 0,
            canvas.width * 0.3, canvas.height * 0.7, canvas.width * 0.8
        );
        gradient1.addColorStop(0, "#0a0518");
        gradient1.addColorStop(0.3, "#1a0030");
        gradient1.addColorStop(0.6, "#2d0048");
        gradient1.addColorStop(1, "#000000");
        
        ctx.fillStyle = gradient1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const bgTexture = new THREE.CanvasTexture(canvas);
        bgTexture.minFilter = THREE.LinearFilter;

        this.backgroundSphere = new THREE.Mesh(
            sphereGeo, 
            new THREE.MeshBasicMaterial({ 
                map: bgTexture,
                side: THREE.BackSide
            })
        );
        
        this.scene.add(this.backgroundSphere);
    }

    createStarSystem() {
        const stars = this.createStars(8000);
        this.stars = stars;
        this.scene.add(stars);
    }

    createStars(count = 5000) {
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);
        const alphas = new Float32Array(count);
        
        for(let i = 0; i < count; i++) {
            const radius = 400 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            sizes[i] = 0.5 + Math.random() * 2;
            
            const colorIntensity = 0.7 + Math.random() * 0.3;
            colors[i * 3] = colorIntensity;
            colors[i * 3 + 1] = colorIntensity;
            colors[i * 3 + 2] = 1.0;
            
            alphas[i] = 0.5 + Math.random() * 0.5;
        }
        
        const starsGeo = new THREE.BufferGeometry();
        starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starsGeo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        
        const starMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createStarTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float alpha;
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vColor = color;
                    vAlpha = alpha;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    if(dist > 0.5) discard;
                    
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    float glow = smoothstep(0.5, 0.0, dist);
                    
                    gl_FragColor = vec4(vColor, vAlpha * glow * texColor.a);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        return new THREE.Points(starsGeo, starMat);
    }

    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.6, 'rgba(200, 220, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(150, 180, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        return new THREE.CanvasTexture(canvas);
    }

    createDustClouds() {
        const cloudGeo = new THREE.BufferGeometry();
        const particleCount = 2000;
        const positions = new Float32Array(particleCount * 3);
        
        for(let i = 0; i < particleCount * 3; i += 3) {
            const radius = 200 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
        }
        
        cloudGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const cloudMat = new THREE.PointsMaterial({
            size: 2,
            color: 0x8866aa,
            transparent: true,
            opacity: 0.05,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.dustClouds = new THREE.Points(cloudGeo, cloudMat);
        this.scene.add(this.dustClouds);
    }

    createTwinklingStars() {
        const twinkleGeo = new THREE.BufferGeometry();
        const count = 100;
        const positions = new Float32Array(count * 3);
        const twinkleData = new Float32Array(count * 2);
        
        for(let i = 0; i < count; i++) {
            const radius = 450 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            twinkleData[i * 2] = Math.random() * Math.PI * 2;
            twinkleData[i * 2 + 1] = 0.5 + Math.random() * 2;
        }
        
        twinkleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        twinkleGeo.setAttribute('twinkleData', new THREE.BufferAttribute(twinkleData, 2));
        
        const twinkleMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseSize: { value: 1.5 }
            },
            vertexShader: `
                attribute vec2 twinkleData;
                varying float vIntensity;
                
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    vIntensity = sin(time * twinkleData[1] + twinkleData[0]) * 0.5 + 0.5;
                    gl_PointSize = baseSize * vIntensity * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying float vIntensity;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    if(dist > 0.5) discard;
                    
                    float glow = smoothstep(0.5, 0.0, dist);
                    gl_FragColor = vec4(1.0, 1.0, 1.0, vIntensity * glow);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.twinkleStars = new THREE.Points(twinkleGeo, twinkleMat);
        this.scene.add(this.twinkleStars);
    }

    createLights() {
        // Ambient ışık
        const ambientLight = new THREE.AmbientLight(0x221133, 0.3);
        this.scene.add(ambientLight);

        // Directional ışık
        const directionalLight = new THREE.DirectionalLight(0x4466aa, 0.5);
        directionalLight.position.set(100, 50, 100);
        this.scene.add(directionalLight);

        // Nokta ışıkları
        for(let i = 0; i < 20; i++) {
            const light = new THREE.PointLight(0x88aaff, 0.5 + Math.random() * 0.5, 100);
            light.position.set(
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 400
            );
            this.scene.add(light);
        }

        // Lazer ışığı
        this.laserLight = new THREE.SpotLight(0xa0a0ff, 0, 50, Math.PI / 6, 0.9, 1);
        this.laserLight.penumbra = 0.5;
        this.laserLight.decay = 2;
        this.scene.add(this.laserLight);
    }

    update(deltaTime) {
        this.starTime += deltaTime * 0.001;
        
        if (this.stars && this.stars.material.uniforms.time) {
            this.stars.material.uniforms.time.value = this.starTime;
            this.stars.rotation.y += 0.0001 * deltaTime;
            this.stars.rotation.x += 0.00005 * deltaTime;
        }
        
        if (this.twinkleStars && this.twinkleStars.material.uniforms.time) {
            this.twinkleStars.material.uniforms.time.value += 0.01 * deltaTime;
        }
        
        if (this.backgroundSphere) {
            this.backgroundSphere.rotation.y += 0.0003 * deltaTime;
        }
        
        if (this.dustClouds) {
            this.dustClouds.rotation.y += 0.00005 * deltaTime;
        }
    }
}