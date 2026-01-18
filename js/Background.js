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
        this.createColoredStars(); 
        this.createDustClouds();
        this.createTwinklingStars();
        this.createLights(); 
    }

    createNebula() {
        // Devasa bir küre (Skybox)
        const sphereGeo = new THREE.SphereGeometry(800, 60, 40);
        sphereGeo.scale(-1, 1, 1); 

        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // --- DAHA MODERN VE DERİN BİR UZAY GRADYANI ---   
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width
        );
        
        // Renk Paleti: Siyah -> Gece Mavisi -> Derin Mor -> Siyah
        gradient.addColorStop(0.0, "#0b1026"); // Merkez (Hafif aydınlık lacivert)
        gradient.addColorStop(0.3, "#050714"); // Orta (Koyu)
        gradient.addColorStop(0.7, "#000000"); // Dış (Tam Siyah)
        gradient.addColorStop(1.0, "#000000"); 
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Yıldız Tozu (Noise) - Daha ince taneli
        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const alpha = Math.random() * 0.2; // Çok silik
            ctx.fillStyle = `rgba(150, 180, 255, ${alpha})`; // Mavimsi toz
            ctx.fillRect(x, y, 1, 1);
        }

        const bgTexture = new THREE.CanvasTexture(canvas);
        bgTexture.minFilter = THREE.LinearFilter;

        this.backgroundSphere = new THREE.Mesh(
            sphereGeo, 
            new THREE.MeshBasicMaterial({ 
                map: bgTexture,
                side: THREE.BackSide,
                fog: false
            })
        );
        
        this.scene.add(this.backgroundSphere);
    }

    // --- YENİ: RENKLİ YILDIZLAR SİSTEMİ ---
    createColoredStars() {
        const count = 4000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3); // Renk verisi eklendi
        const sizes = new Float32Array(count);
        
        const colorPalette = [
            new THREE.Color(0xffffff), // Beyaz
            new THREE.Color(0xaaddff), // Mavi-Beyaz (Sıcak)
            new THREE.Color(0xffddaa)  // Sarı-Beyaz (Soğuk)
        ];

        for(let i = 0; i < count; i++) {
            const r = 400 + Math.random() * 400;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i*3+2] = r * Math.cos(phi);
            
            // Rastgele renk seçimi
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i*3] = color.r;
            colors[i*3+1] = color.g;
            colors[i*3+2] = color.b;

            sizes[i] = 0.5 + Math.random() * 1.5;
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Shader için renk
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const mat = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true, // Renkleri aktif et
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            fog: false
        });
        
        this.stars = new THREE.Points(geo, mat);
        this.scene.add(this.stars);
    }

    createDustClouds() {
        const particleCount = 600;
        const positions = new Float32Array(particleCount * 3);
        
        for(let i = 0; i < particleCount * 3; i += 3) {
            const r = 200 + Math.random() * 200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = r * Math.cos(phi);
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const mat = new THREE.PointsMaterial({
            size: 5,
            color: 0x224466, // Daha soğuk, mavi/mor toz
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.dustClouds = new THREE.Points(geo, mat);
        this.scene.add(this.dustClouds);
    }

    createTwinklingStars() {
        const count = 200;
        const positions = new Float32Array(count * 3);
        const twinkleData = new Float32Array(count * 2);
        
        for(let i = 0; i < count; i++) {
            const r = 350 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i*3+2] = r * Math.cos(phi);
            
            twinkleData[i*2] = Math.random() * Math.PI * 2;
            twinkleData[i*2+1] = 0.5 + Math.random();
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('twinkleData', new THREE.BufferAttribute(twinkleData, 2));
        
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseSize: { value: 4.0 } // Biraz daha büyük parıltılar
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
                    if(length(coord) > 0.5) discard;
                    float strength = 1.0 - (length(coord) * 2.0);
                    // Hafif mavimsi beyaz parıltı
                    gl_FragColor = vec4(0.9, 0.95, 1.0, vAlpha * strength); 
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
        // --- 1. ORTAM IŞIĞI (Kısık) ---
        // Uzay karanlıktır. Kontrast için bunu kısıyoruz.
        const ambientLight = new THREE.AmbientLight(0x050510, 0.4); 
        this.scene.add(ambientLight);

        // --- 2. PREMIUM GÜNEŞ (MAVİ/BEYAZ DEV) ---
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Radyal Gradyan: Kör edici beyaz -> Açık Mavi -> Koyu Mavi -> Şeffaf
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');   // Çekirdek (Saf Beyaz)
        gradient.addColorStop(0.15, 'rgba(200, 240, 255, 1)');  // İç Hare (Buz Mavisi)
        gradient.addColorStop(0.4, 'rgba(0, 100, 255, 0.4)');   // Dış Hare (Elektrik Mavisi)
        gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');         // Bitiş
        
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
        // Güneşi biraz daha büyüttük ve konumunu ayarladık
        this.sunMesh.scale.set(18, 18, 1); 
        this.sunMesh.position.set(0, 15, -12); 
        this.scene.add(this.sunMesh);

        // --- 3. ANA IŞIK KAYNAĞI (Güçlü) ---
        // Elmasın parlaması için güçlü bir ışık
        const dirLight = new THREE.DirectionalLight(0xffffff, 4.5);
        dirLight.position.copy(this.sunMesh.position);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // --- 4. LAZER IŞIĞI KAYNAĞI ---
        this.laserLight = new THREE.SpotLight(0x00ffff, 0, 200, 0.2, 1, 0.5);
        this.laserLight.position.copy(this.sunMesh.position);
        this.scene.add(this.laserLight);
    }

    update(deltaTime) {
        this.starTime += deltaTime;
        if (this.backgroundSphere) this.backgroundSphere.rotation.y += 0.00015;
        if (this.twinkleStars) {
            this.twinkleStars.material.uniforms.time.value = this.starTime;
        }
    }
}