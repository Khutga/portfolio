import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { Background } from './Background.js';
import { Diamond } from './Diamond.js';
import { UI } from './UI.js';
import { Effects } from './Effects.js';

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
        // Eğer zaten açıksa önce kapat, sonra yeni sayfayı aç (veya direkt geçiş efekti yap)
        // Şimdilik temiz olması için resetleyip açıyoruz:
        if (this.isSplitView) {
            this.resetView();
            // Reset animasyonu 1sn sürüyor, bitince yenisini aç
            setTimeout(() => this.triggerSection(faceName), 1200);
        } else {
            this.triggerSection(faceName);
        }
    }

    triggerSection(faceName) {
        // 1. Elması o yüze çevir
        this.diamond.alignFaceToCamera(faceName, (targetMesh) => {
            // 2. Çevirme bitti, şimdi efekti başlat
            if (!targetMesh) return; // Hata kontrolü

            // Hedef noktasını mesh'in dünya koordinatından alalım
            const hitPoint = new THREE.Vector3();
            targetMesh.getWorldPosition(hitPoint);

            // Simüle edilmiş bir "tıklama" gibi davranıyoruz
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

        // --- GÜNCELLENEN KISIM (Tıklama Hatasını Çözer) ---
        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        // --------------------------------------------------

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
    }

    onClick(event) {
        if (this.isSplitView) return;

        // --- GÜNCELLENEN KISIM (Burada da aynı düzeltme şart) ---
        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        // --------------------------------------------------------

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

        // GÜNCELLENDİ: Artık sahne ve güneş pozisyonunu da gönderiyoruz
        Effects.enterSplitView(
            this.diamond,
            this.background.laserLight,
            hitPoint,
            this.ui,
            content.header,
            content.body,
            this.background.sunMesh.position,
            this.sceneManager.scene,
            this.sceneManager.camera,   // <-- YENİ
            this.sceneManager.controls
        );
    }
    resetView() {
        if (!this.isSplitView) return;
        this.isSplitView = false;

        Effects.leaveSplitView(
            this.diamond,
            this.ui,
            this.sceneManager.controls // <-- KRİTİK EKLEME
        );
    }

    getContentByName(name) {
        const contentMap = {
            'Face_Projects': { header: "PROJELER", body: "Flutter ve Web tabanlı geliştirdiğim mobil uygulamalar, stok takip sistemleri ve refactoring projelerim." },
            'Face_Experience': { header: "DENEYİM", body: "5 yılı aşkın süredir sektördeyim. Çeşitli ajanslarda ve freelance olarak kurumsal müşterilere hizmet verdim." },
            'Face_About': { header: "HAKKIMDA", body: "Kod yazmayı bir sanat olarak görüyorum. Estetik ve performansı birleştiren çözümler üretiyorum." },
            'Face_Contact': { header: "İLETİŞİM", body: "Benimle çalışmak veya tanışmak isterseniz LinkedIn üzerinden veya mail yoluyla ulaşabilirsiniz." }
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