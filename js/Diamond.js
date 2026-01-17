import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Diamond {
    constructor(scene) {
        this.scene = scene;
        this.diamondGroup = new THREE.Group();
        this.loader = new GLTFLoader();
        this.isZoomed = false;
        this.selectedFaceCenter = null;
        this.hoveredObject = null;
        
        this.init();
    }

    init() {
        this.scene.add(this.diamondGroup);
        this.loadModel();
    }

    loadModel() {
        this.loader.load('./assets/diamond.glb', (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.5, 0.5, 0.5);

            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: 0xffffff,
                        metalness: 0,
                        roughness: 0,
                        transmission: 1,
                        thickness: 1.5,
                        ior: 2.418,
                        envMapIntensity: 1.5,
                        dispersion: 0.2,
                        clearcoat: 1,
                        side: THREE.DoubleSide
                    });
                }
            });
            
            while (model.children.length > 0) {
                this.diamondGroup.add(model.children[0]);
            }
            
            this.diamondGroup.rotation.x = 0.5;
            this.diamondGroup.rotation.y = 0.5;
        });
    }

    getIntersectedObject(raycaster) {
        return raycaster.intersectObjects(this.diamondGroup.children);
    }

    getChildren() {
        return this.diamondGroup.children;
    }

    rotate() {
        if (!this.isZoomed) {
            this.diamondGroup.rotation.y += 0.005;
        }
    }

    resetRotation(animation = false) {
        if (animation) {
            // Animasyonla reset
            this.diamondGroup.rotation.y = 0.5;
        }
    }
}