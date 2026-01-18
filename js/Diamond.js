import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'https://cdn.skypack.dev/gsap';

export class Diamond {
    constructor(scene) {
        this.scene = scene;
        this.diamondGroup = new THREE.Group();
        this.loader = new GLTFLoader();
        this.rotationSpeed = 0.002; 
        this.init();
    }
    
    init() {
        this.scene.add(this.diamondGroup);
        this.diamondGroup.position.y = 0;
        this.loadModel();
    }

    loadModel() {
        this.loader.load('./assets/diamond.glb', (gltf) => {
            const model = gltf.scene;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: 0xffffff,
                        metalness: 0.1,
                        roughness: 1.0,
                        transmission: 1.0, 
                        thickness: 1.5,
                        ior: 2.418,
                        envMapIntensity: 0,
                        dispersion: 0.6,
                        clearcoat: 1.0,
                        side: THREE.DoubleSide
                    });

                    this.addLabelToFace(child);
                }
            });

            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            box.getCenter(center);
            model.position.sub(center);

            this.diamondGroup.add(model);
            this.diamondGroup.scale.set(0.5, 0.5, 0.5);
            this.diamondGroup.rotation.x = 0.3; 
        });
    }

    addLabelToFace(mesh) {
        const nameMap = {
            'Face_Projects': 'A',
            'Face_Experience': 'B',
            'Face_About': 'C',
            'Face_Contact': 'D'
        };

        const labelText = nameMap[mesh.name];
        if (!labelText) return;

        // 1. Canvas Oluştur
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const context = canvas.getContext('2d');

        // Arka planı temizle
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Neon Yazı Ayarları
        context.font = "Bold 100px 'Segoe UI', sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        
        // Parlama Efekti (Glow)
        context.shadowColor = "#00ffff";
        context.shadowBlur = 30;
        
        // Yazı Çizimi (Beyaz İç, Mavi Glow)
        context.fillStyle = "rgba(255, 255, 255, 1)";
        context.fillText(labelText, canvas.width / 2, canvas.height / 2);
        
        // Ekstra Okunurluk İçin Kontur
        context.lineWidth = 3;
        context.strokeStyle = "rgba(0, 255, 255, 0.8)";
        context.strokeText(labelText, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // 2. Sprite Materyali (Dikdörtgen sorununu çözer)
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            color: 0xffffff,
            depthTest: false, // Elmasın önünde dursun
            depthWrite: false,
            blending: THREE.AdditiveBlending // Parlak görünüm
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Boyutlandırma
        sprite.scale.set(2, 1, 1); 

        sprite.raycast = () => {};

        // 3. Konumlandırma
        mesh.geometry.computeBoundingSphere();
        const center = mesh.geometry.boundingSphere.center;
        const normal = center.clone().normalize();
        
        // Yüzeyin dışına taşı
        sprite.position.copy(center).add(normal.multiplyScalar(0.15));
        
        mesh.add(sprite);
    }

    getChildren() {
        let meshes = [];
        this.diamondGroup.traverse(child => { if(child.isMesh) meshes.push(child); });
        return meshes;
    }

    alignFaceToCamera(faceName, onComplete) {
        let targetMesh = null;
        this.diamondGroup.traverse(child => {
            if (child.name === faceName) targetMesh = child;
        });

        if (!targetMesh) {
            if (onComplete) onComplete(null);
            return;
        }

        const oldSpeed = this.rotationSpeed;
        this.rotationSpeed = 0;

        const worldPos = new THREE.Vector3();
        targetMesh.getWorldPosition(worldPos);
        const localPos = targetMesh.position.clone();
        const angle = Math.atan2(localPos.x, localPos.z);
        const targetRotationY = -angle; 

        let currentRot = this.diamondGroup.rotation.y % (Math.PI * 2);
        let diff = targetRotationY - currentRot;
        
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;

        gsap.to(this.diamondGroup.rotation, {
            y: currentRot + diff,
            duration: 0.8,
            ease: "back.out(1.2)", 
            onComplete: () => {
                if (onComplete) onComplete(targetMesh);
            }
        });
    }

    resetRotationBehavior() {
        gsap.to(this, {
            rotationSpeed: 0.3, 
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(this, {
                    rotationSpeed: 0.002, 
                    duration: 1.5,
                    ease: "power1.out"
                });
            }
        });
    }

    rotate() {
        this.diamondGroup.rotation.y += this.rotationSpeed;
    }
}