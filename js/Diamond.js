import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';

export class Diamond {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.diamondGroup = new THREE.Group();
        this.loader = new GLTFLoader();
        this.rotationSpeed = 0.002;
        this.energyRing = null;
        this.loader = new GLTFLoader(loadingManager);
        this.loadModel();
        this.init();

    }

    init() {
        this.scene.add(this.diamondGroup);
        this.diamondGroup.position.y = 0;
        this.loadModel();
        this.createEnergyRing();
    }

    loadModel() {
        this.loader.load('./assets/diamond.glb', (gltf) => {
            const model = gltf.scene;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: 0xe0fff0,
                        metalness: 0,
                        roughness: 0.02,
                        transmission: 1.0,
                        thickness: 2.5,
                        ior: 2.417,

                        dispersion: 7.0,

                        attenuationColor: 0x7afbf4,
                        attenuationDistance: 0.5,

                        clearcoat: 1.0,
                        clearcoatRoughness: 0,
                        envMapIntensity: 2.0,
                        transparent: true,
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
            'Face_Projects': 'PROJECTS',
            'Face_Experience': 'SKILLS',
            'Face_About': 'ABOUT',
            'Face_Contact': 'CONTACT'
        };

        const labelText = nameMap[mesh.name];
        if (!labelText) return;

        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const fontSize = 70;
        ctx.font = `900 ${fontSize}px 'Inter', 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.letterSpacing = "8px";

        ctx.shadowColor = "rgba(0, 0, 0, 1)";
        ctx.shadowBlur = 20;
        ctx.lineWidth = 12;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.strokeText(labelText, canvas.width / 2, canvas.height / 2);

        ctx.shadowColor = "rgba(0, 255, 255, 1)";
        ctx.shadowBlur = 50;
        ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
        ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);

        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 255, 255, 1)";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.anisotropy = 16;
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0,
            depthTest: false,
            depthWrite: false,
            blending: THREE.NormalBlending
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2.5, 1.25, 1);
        sprite.raycast = () => { };

        mesh.geometry.computeBoundingSphere();
        const center = mesh.geometry.boundingSphere.center;
        const normal = center.clone().normalize();

        sprite.position.copy(center).add(normal.multiplyScalar(0.25));

        mesh.add(sprite);
    }

    toggleLabels(visible) {
        this.diamondGroup.traverse(child => {
            if (child instanceof THREE.Sprite && child.material.map) {
                gsap.to(child.material, {
                    opacity: visible ? 1 : 0,
                    duration: 0.3,
                    ease: "power2.inOut"
                });
            }
        });
    }

    createEnergyRing() {
        const particleCount = 200;
        const radius = 0.8;
        const positions = new Float32Array(particleCount * 3);
        const randomScales = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;

            const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.05;
            const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.05;
            const y = (Math.random() - 0.5) * 0.05;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'white');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();

        const material = new THREE.PointsMaterial({
            color: 0x00ffcc,
            size: 0.03,
            map: new THREE.CanvasTexture(canvas),
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.energyRing = new THREE.Points(geometry, material);
        this.energyRing.rotation.y = Math.PI / 1.8;
        this.scene.add(this.energyRing);
    }

    getChildren() {
        let meshes = [];
        this.diamondGroup.traverse(child => { if (child.isMesh) meshes.push(child); });
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
        const currentTime = Date.now();
        this.diamondGroup.rotation.y += this.rotationSpeed;

        const floatY = Math.sin(Date.now() * 0.0015) * 0.08;
        this.diamondGroup.position.y = floatY;

        if (this.energyRing) {
            this.energyRing.rotation.y += 0.005;

            this.energyRing.position.copy(this.diamondGroup.position);

            this.energyRing.rotation.z = Math.sin(Date.now() * 0.001) * 0.10;

            if (this.energyRing.material.opacity > 0.01) {
                const breathing = (Math.sin(currentTime * 0.002) * 0.5) + 0.5;
                this.energyRing.material.opacity = 0.15 + (breathing * 0.3);
            }
        }
    }
}