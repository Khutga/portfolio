import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { Background } from './Background.js';
import { Diamond } from './Diamond.js';
import { UI } from './UI.js';
import { Effects } from './Effects.js';
import gsap from 'https://cdn.skypack.dev/gsap';

class DiamondPortfolio {
    constructor() {
        this.sceneManager = new SceneManager();
        this.background = new Background(this.sceneManager.scene);
        this.diamond = new Diamond(this.sceneManager.scene);
        this.ui = new UI();
        
        this.isZoomed = false;
        this.selectedFaceCenter = null;
        this.hoveredObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        
        this.init();
    }

    init() {
        // UI kapatma callback'i
        this.ui.setCloseCallback(() => this.resetView());
        
        // Event listeners
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        
        // Animasyon başlat
        this.animate();
    }

    onMouseMove(event) {
        if (this.isZoomed) return;
        
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.diamond.getChildren());
        
        // İmleç değişimi
        document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        
        // Hover efekti
        if (intersects.length > 0) {
            if (this.hoveredObject !== intersects[0].object) {
                if (this.hoveredObject) {
                    Effects.hoverEffect(this.hoveredObject, false);
                }
                this.hoveredObject = intersects[0].object;
                Effects.hoverEffect(this.hoveredObject, true);
            }
        } else if (this.hoveredObject) {
            Effects.hoverEffect(this.hoveredObject, false);
            this.hoveredObject = null;
        }
    }

    onClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.diamond.getChildren());
        
        if (intersects.length > 0 && !this.isZoomed) {
            const clickedFaceNormal = intersects[0].face.normal;
            this.handleDiamondClick(intersects[0].object, clickedFaceNormal);
        } else {
            this.resetView();
        }
    }

    handleDiamondClick(object, inputNormal) {
        const name = object.name;
        let content = this.getContentByName(name);
        
        if (!content) return;
        
        this.isZoomed = true;
        this.diamond.isZoomed = true;
        
        // Yüzey merkezini hesapla
        if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
        const centerLocal = new THREE.Vector3();
        object.geometry.boundingBox.getCenter(centerLocal);
        const targetPos = centerLocal.clone().applyMatrix4(object.matrixWorld);
        
        // Dünya normali
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
        const worldNormal = inputNormal.clone().applyMatrix3(normalMatrix).normalize();
        
        // Kamera pozisyonu
        const distance = 0.6;
        const cameraEndPos = targetPos.clone().add(worldNormal.multiplyScalar(distance));
        
        // Ekranı konumlandır
        this.positionContentScreen(targetPos, worldNormal);
        
        // Lazer efekti
        Effects.createLaserEffect(
            this.background.laserLight,
            cameraEndPos,
            targetPos,
            this.sceneManager.contentScreen,
            content.header,
            content.body,
            this.ui
        );
        
        // Kamera hareketi
        gsap.to(this.sceneManager.controls.target, { 
            x: targetPos.x, 
            y: targetPos.y, 
            z: targetPos.z, 
            duration: 1.0, 
            ease: "power2.inOut" 
        });
        
        gsap.to(this.sceneManager.camera.position, {
            x: cameraEndPos.x,
            y: cameraEndPos.y,
            z: cameraEndPos.z,
            duration: 1.0,
            ease: "power2.inOut",
            onUpdate: () => this.sceneManager.camera.lookAt(targetPos)
        });
        
        // UI panel göster
        this.ui.showPanel(content.header, content.body);
        this.selectedFaceCenter = targetPos;
    }

    getContentByName(name) {
        const contentMap = {
            'Face_Projects': {
                header: "PROJELER",
                body: "Hapkap: Stok Takip Uygulaması. TaxyMaxy: Refactoring Projesi. Flutter ile geliştirildi."
            },
            'Face_Experience': {
                header: "DENEYİM",
                body: "5 Yıllık Flutter ve Dart tecrübesi. Freelance ve kurumsal projelerde görev aldım."
            },
            'Face_About': {
                header: "HAKKIMDA",
                body: "Merhaba, ben kodun estetiğine önem veren bir geliştiriciyim."
            },
            'Face_Contact': {
                header: "İLETİŞİM",
                body: "email@ornek.com adresinden veya LinkedIn üzerinden ulaşabilirsiniz."
            }
        };
        
        for (const key in contentMap) {
            if (name.includes(key)) {
                return contentMap[key];
            }
        }
        return null;
    }

    positionContentScreen(targetPos, worldNormal) {
        const contentScreen = this.sceneManager.contentScreen;
        
        contentScreen.position.copy(targetPos);
        contentScreen.lookAt(targetPos.clone().add(worldNormal));
        contentScreen.translateZ(0.02);
        contentScreen.scale.set(0, 0, 0);
        contentScreen.material.opacity = 0;
    }

    resetView() {
        if (!this.isZoomed) return;
        
        this.isZoomed = false;
        this.diamond.isZoomed = false;
        this.hoveredObject = null;
        
        Effects.resetView(
            this.sceneManager.contentScreen,
            this.sceneManager.camera,
            this.sceneManager.controls.target,
            this.diamond.diamondGroup,
            this.ui
        );
        
        this.selectedFaceCenter = null;
    }

    animate() {
        const deltaTime = this.clock.getDelta();
        
        // Arka plan güncelleme
        this.background.update(deltaTime);
        
        // Elmas dönüşü
        this.diamond.rotate();
        
        // UI panel pozisyon güncelleme
        if (this.isZoomed && this.selectedFaceCenter) {
            this.ui.updatePanelPosition(this.selectedFaceCenter, this.sceneManager.camera);
        }
        
        // Render
        this.sceneManager.render();
        
        // Sonraki frame
        requestAnimationFrame(() => this.animate());
    }
}

// Uygulamayı başlat
const app = new DiamondPortfolio();