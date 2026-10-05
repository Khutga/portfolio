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

    static isLiteMode() {
        try {
            if (window.innerWidth < 768) return true;
            const conn = navigator.connection || navigator.webkitConnection;
            if (conn && conn.saveData) return true;
            // Truly weak devices only (e.g. 2GB RAM / 2 cores).
            // An i3 + MX130 + 12GB must get the full scene.
            if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true;
            if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true;
        } catch (e) { /* ignore */ }
        return false;
    }

    init() {
        const isMobile = window.innerWidth < 768;
        this.isLite = SceneManager.isLiteMode();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, this.isLite ? 1.25 : 2);

        this.renderer = new THREE.WebGLRenderer({
            antialias: !this.isLite && !isMobile,
            alpha: false,
            powerPreference: this.isLite ? "low-power" : "high-performance",
            stencil: false
        });

        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000005, 1);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.6;
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.touchAction = 'none';
        this.renderer.domElement.style.userSelect = 'none';
        this.renderer.domElement.style.webkitUserSelect = 'none';
        this.renderer.domElement.style.outline = 'none';
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.z = isMobile ? 4.5 : 2.5;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableZoom = false;
        // Right-click must do nothing in the cosmos: no pan, no rotate, no zoom.
        this.controls.enablePan = false;
        this.controls.rotateSpeed = 0.4;
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: -1,
            RIGHT: -1
        };
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_ROTATE
        };

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
