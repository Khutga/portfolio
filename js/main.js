import * as THREE from 'three';
import gsap from 'https://cdn.skypack.dev/gsap';
import { SceneManager } from './SceneManager.js';
import { Background } from './Background.js';
import { Diamond } from './Diamond.js';
import { UI } from './UI.js';
import { Effects } from './Effects.js';
import { Skills } from './Skills.js';

class DiamondPortfolio {
    constructor() {
        this.sceneManager = new SceneManager();
        this.background = new Background(this.sceneManager.scene);
        this.diamond = new Diamond(this.sceneManager.scene);
        this.ui = new UI();

        this.isSplitView = false;
        this.hoveredObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        this.ui.setCloseCallback(() => this.resetView());
        this.ui.setMenuCallback((faceId) => this.handleMenuNavigation(faceId));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        this.animate();
    }

    handleMenuNavigation(faceName) {
        if (this.isSplitView) {
            this.resetView();
            setTimeout(() => this.triggerSection(faceName), 1200);
        } else {
            this.triggerSection(faceName);
        }
    }

    triggerSection(faceName) {
        this.diamond.alignFaceToCamera(faceName, (targetMesh) => {
            if (!targetMesh) return; 
            const hitPoint = new THREE.Vector3();
            targetMesh.getWorldPosition(hitPoint);

            this.handleDiamondClick(targetMesh, hitPoint);
        });
    }

    onMouseMove(event) {
        if (this.isSplitView) {
            document.body.style.cursor = 'default';
            if (this.hoveredObject) {
                Effects.hoverEffect(this.hoveredObject, false);
                this.hoveredObject = null;
            }
            return;
        };

        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;


        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.diamond.getChildren());

        document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';

        if (intersects.length > 0) {
            if (this.hoveredObject !== intersects[0].object) {
                if (this.hoveredObject) Effects.hoverEffect(this.hoveredObject, false);
                this.hoveredObject = intersects[0].object;
                Effects.hoverEffect(this.hoveredObject, true);
            }
        } else if (this.hoveredObject) {
            Effects.hoverEffect(this.hoveredObject, false);
            this.hoveredObject = null;
        }
        const x = (event.clientX / window.innerWidth) - 0.5;
        const y = (event.clientY / window.innerHeight) - 0.5;

        gsap.to(this.diamond.diamondGroup.rotation, {
            x: 0.3 + (y * 0.4), 
            z: (x * 0.4),       
            duration: 0.8,
            ease: "power2.out"
        });
        
        
        
    }

    onClick(event) {
        if (this.isSplitView) return;

        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.diamond.getChildren());

        if (intersects.length > 0) {
            const hitPoint = intersects[0].point;
            this.handleDiamondClick(intersects[0].object, hitPoint);
        }
    }

    handleDiamondClick(object, hitPoint) {
        const name = object.name;
        let content = this.getContentByName(name);
        if (!content) return;

        this.isSplitView = true;

        if (this.hoveredObject) {
            Effects.hoverEffect(this.hoveredObject, false);
            this.hoveredObject = null;
        }

        Effects.enterSplitView(
            this.diamond,
            this.background.laserLight,
            hitPoint,
            this.ui,
            content.header,
            content.body,
            this.background.sunMesh.position,
            this.sceneManager.scene,
            this.sceneManager.camera,   
            this.sceneManager.controls
        );
    }
    resetView() {
        if (!this.isSplitView) return;
        this.isSplitView = false;

        Effects.leaveSplitView(
            this.diamond,
            this.ui,
            this.sceneManager.controls 
        );
    }

    getContentByName(name) {
        const contentMap = {
            'Face_Projects': { header: "PROJECTS", body: "Flutter ve Web tabanlı geliştirdiğim mobil uygulamalar, stok takip sistemleri ve refactoring projelerim." },
            'Face_Experience': Skills,
            'Face_About': { header: "ABOUT", body: "Kod yazmayı bir sanat olarak görüyorum. Estetik ve performansı birleştiren çözümler üretiyorum." },
            'Face_Contact': { header: "CONTACT", body: "Benimle çalışmak veya tanışmak isterseniz LinkedIn üzerinden veya mail yoluyla ulaşabilirsiniz." }
        };
        for (const key in contentMap) {
            if (name.includes(key)) return contentMap[key];
        }
        return null;
    }

    animate() {
        const deltaTime = this.clock.getDelta();
        this.background.update(deltaTime);
        this.diamond.rotate();
        this.sceneManager.render();
        requestAnimationFrame(() => this.animate());

    }
}

const app = new DiamondPortfolio();