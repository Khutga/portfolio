import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = null;
        this.controls = null;

        this.init();
    }

    init() {
        const isMobile = window.innerWidth < 768;
        const pixelRatio = Math.min(window.devicePixelRatio, 2);

        this.renderer = new THREE.WebGLRenderer({
            antialias: !isMobile,
            alpha: false,
            powerPreference: "high-performance",
            stencil: false
        });

        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000005, 1);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.6;
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.z = isMobile ? 4.5 : 2.5;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableZoom = false;
        this.controls.rotateSpeed = 0.4;

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        const environment = new RoomEnvironment();
        this.scene.environment = pmremGenerator.fromScene(environment).texture;
        pmremGenerator.dispose();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        if (window.innerWidth < 768) {
            this.camera.position.z = 4.5;
        } else {
            this.camera.position.z = 2.5;
        }
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
