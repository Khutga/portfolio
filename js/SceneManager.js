import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.controls = null;
        this.contentScreen = null;
        this.pmremGenerator = null;
        
        this.init();
    }

    init() {
        // Renderer ayarları
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        document.body.appendChild(this.renderer.domElement);

        // Kamera pozisyonu
        this.camera.position.z = 5;

        // Kontroller
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableZoom = false;
        this.controls.rotateSpeed = 0.4;

        // PMREM Generator
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        const environment = new RoomEnvironment();
        this.scene.environment = this.pmremGenerator.fromScene(environment).texture;

        // İçerik ekranı
        this.createContentScreen();

        // Pencere boyutu değişikliği
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createContentScreen() {
        const screenGeometry = new THREE.PlaneGeometry(1, 1);
        const screenMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });
        
        this.contentScreen = new THREE.Mesh(screenGeometry, screenMaterial);
        this.scene.add(this.contentScreen);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    getRaycaster(mouseX, mouseY) {
        const mouse = new THREE.Vector2(
            (mouseX / window.innerWidth) * 2 - 1,
            -(mouseY / window.innerHeight) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        return raycaster;
    }
}