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
        // Devasa bir küre oluşturup içine giriyoruz
        const sphereGeo = new THREE.SphereGeometry(800, 60, 40);
        sphereGeo.scale(-1, 1, 1); // İçini görelim diye ters çeviriyoruz

        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Zengin, Derin Uzay Gradyanı
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width
        );
        
        // Renk Paleti: Siyah -> Derin Mor -> Lacivert -> Siyah
        gradient.addColorStop(0.0, "#050011"); // Merkez (Çok koyu mor)
        gradient.addColorStop(0.4, "#0a0022"); // Orta (Mor)
        gradient.addColorStop(0.8, "#000510"); // Dış (Lacivert)
        gradient.addColorStop(1.0, "#000000"); // En dış (Tam Siyah)
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Biraz "Yıldız Tozu" (Noise) ekleyelim ki dümdüz durmasın
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const alpha = Math.random() * 0.3;
            ctx.fillStyle = `rgba(100, 100, 255, ${alpha})`;
            ctx.fillRect(x, y, 2, 2);
        }

        const bgTexture = new THREE.CanvasTexture(canvas);
        bgTexture.minFilter = THREE.LinearFilter;

        this.backgroundSphere = new THREE.Mesh(
            sphereGeo, 
            new THREE.MeshBasicMaterial({ 
                map: bgTexture,
                side: THREE.BackSide,
                fog: false // Sisten etkilenmesin
            })
        );
        
        this.scene.add(this.backgroundSphere);
    }

    createStarSystem() {
        // Uzaktaki sabit yıldızlar
        const stars = this.createStars(4000);
        this.stars = stars;
        this.scene.add(stars);
    }

    createStars(count) {
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for(let i = 0; i < count; i++) {
            const r = 400 + Math.random() * 400; // Yarıçap
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i*3+2] = r * Math.cos(phi);
            
            sizes[i] = 0.5 + Math.random() * 1.5;
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Basit ve performanslı yıldız materyali
        const mat = new THREE.PointsMaterial({
            size: 1,
            sizeAttenuation: true,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            fog: false
        });
        
        return new THREE.Points(geo, mat);
    }

    createDustClouds() {
        // Sahneye derinlik katan hafif toz bulutları
        const particleCount = 500;
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
            size: 4,
            color: 0x442266, // Morumsu toz
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.dustClouds = new THREE.Points(geo, mat);
        this.scene.add(this.dustClouds);
    }

    createTwinklingStars() {
        // HATA DÜZELTİLDİ: Shader kodundaki eksik değişkenler tanımlandı
        const count = 150;
        const positions = new Float32Array(count * 3);
        const twinkleData = new Float32Array(count * 2);
        
        for(let i = 0; i < count; i++) {
            const r = 350 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i*3+2] = r * Math.cos(phi);
            
            twinkleData[i*2] = Math.random() * Math.PI * 2; // Faz
            twinkleData[i*2+1] = 0.5 + Math.random();       // Hız
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('twinkleData', new THREE.BufferAttribute(twinkleData, 2));
        
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseSize: { value: 3.0 }
            },
            vertexShader: `
                uniform float time;      // <-- EKLENDİ
                uniform float baseSize;  // <-- EKLENDİ
                
                attribute vec2 twinkleData; // x: faz, y: hız
                varying float vAlpha;
                
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Yanıp sönme efekti (Sinüs dalgası)
                    float twinkle = sin(time * twinkleData.y + twinkleData.x);
                    vAlpha = 0.5 + 0.5 * twinkle; // 0 ile 1 arasında değişsin
                    
                    gl_PointSize = baseSize * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                
                void main() {
                    // Yuvarlak nokta çizimi
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    if(length(coord) > 0.5) discard;
                    
                    // Merkezden dışa doğru sönükleşen parlama
                    float strength = 1.0 - (length(coord) * 2.0);
                    gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * strength);
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
        // Sahneyi aydınlatan loş ışıklar
        const ambientLight = new THREE.AmbientLight(0x111122, 1.5);
        this.scene.add(ambientLight);

        // Elması parlatan ana ışık
        const dirLight = new THREE.DirectionalLight(0xaaccff, 1.0);
        dirLight.position.set(50, 50, 100);
        this.scene.add(dirLight);

        // Lazer Işığı (Başlangıçta kapalı)
        this.laserLight = new THREE.SpotLight(0x00ffff, 0, 100, 0.1, 0.5, 1);
        this.scene.add(this.laserLight);
    }

    update(deltaTime) {
        this.starTime += deltaTime;

        // Arka planı yavaşça döndür
        if (this.backgroundSphere) this.backgroundSphere.rotation.y += 0.0001;
        
        // Yanıp sönen yıldızları güncelle
        if (this.twinkleStars) {
            this.twinkleStars.material.uniforms.time.value = this.starTime;
        }
    }
}