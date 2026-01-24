import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';


export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.controls = null;
        this.contentScreen = null; // YENİ EKRAN NESNESİ
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.6;
        document.body.appendChild(this.renderer.domElement);

        // Kamera mesafesi
        this.camera.position.z = 2.5;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableZoom = false;
        this.controls.rotateSpeed = 0.4;

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        const environment = new RoomEnvironment();
        this.scene.environment = pmremGenerator.fromScene(environment).texture;

        this.createContentScreen(); // Ekranı oluştur

        window.addEventListener('resize', () => this.onWindowResize());
    }

    createContentScreen() {
        // Bu, yazının görüneceği "Kağıt". Başlangıçta görünmez.
        const geometry = new THREE.PlaneGeometry(1, 1); 
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthTest: false, // DİKKAT: Bu ayar yazının elmasın içine girmesini engeller, hep üstte durur.
            blending: THREE.NormalBlending
        });
        
        this.contentScreen = new THREE.Mesh(geometry, material);
        this.contentScreen.renderOrder = 999; // En önde çizilmesini sağlar
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
}