import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Diamond {
    constructor(scene) {
        this.scene = scene;
        this.diamondGroup = new THREE.Group();
        this.loader = new GLTFLoader();
        
        this.rotationSpeed = 0.002; // Dönüş hızı
        
        this.init();
    }

    init() {
        this.scene.add(this.diamondGroup);
        this.loadModel();
    }

    loadModel() {
        this.loader.load('./assets/diamond.glb', (gltf) => {
            const model = gltf.scene;

            // Materyalleri ayarla
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: 0xffffff,
                        metalness: 0.1,
                        roughness: 0,
                        transmission: 1,
                        thickness: 1.5,
                        ior: 2.418,
                        envMapIntensity: 2.5,
                        dispersion: 0.4,
                        clearcoat: 1,
                        side: THREE.DoubleSide
                    });
                }
            });

            // --- MERKEZLEME KODU (BURASI ÇOK ÖNEMLİ) ---
            // Modeli geçici olarak bir kutuya alıp merkezini buluyoruz
            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            box.getCenter(center);

            // Modeli, merkezi (0,0,0) olacak şekilde kaydırıyoruz
            model.position.sub(center);
            // ---------------------------------------------

            this.diamondGroup.add(model);
            
            this.diamondGroup.scale.set(0.5, 0.5, 0.5);
            this.diamondGroup.rotation.x = 0.3; 
        });
    }

    getChildren() {
        let meshes = [];
        this.diamondGroup.traverse(child => { if(child.isMesh) meshes.push(child); });
        return meshes;
    }

    rotate() {
        this.diamondGroup.rotation.y += this.rotationSpeed;
    }
}