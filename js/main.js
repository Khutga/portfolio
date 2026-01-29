import * as THREE from 'three';
import gsap from 'gsap';
import { SceneManager } from './SceneManager.js';
import { Background } from './Background.js';
import { Diamond } from './Diamond.js';
import { UI } from './UI.js';
import { Effects } from './Effects.js';
import { Skills } from './Skills.js';
import { Contact } from './Contact.js';
import { Projects } from './Projects.js';
import { About } from './About.js';

class DiamondPortfolio {
    constructor() {
        this.sceneManager = new SceneManager();
        const loadingManager = this.setupLoadingManager();
        this.background = new Background(this.sceneManager.scene, loadingManager);
        this.diamond = new Diamond(this.sceneManager.scene, loadingManager);
        this.ui = new UI();

        this.isSplitView = false;
        this.hoveredObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();

        this.init();

        /*Iron Dome*/
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        }, false);

        window.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                return false;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 's') ||
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault();
                return false;
            }
        });
        setInterval(() => {
            const stil = 'background: #000; color: #00ffff; font-size: 20px; padding: 10px; border: 2px solid #00ffff; font-family: monospace;';
            console.log('%c Diamond ', stil);
        }, 2000);

        setInterval(() => {
            const start = Date.now();
            debugger;
            const end = Date.now();
            if (end - start > 100) {
                document.body.innerHTML = "<h1>İzinsiz giriş tespit edildi.</h1>";
            }
        }, 100);

        /*Iron Dome*/
    }

    init() {
        this.ui.setCloseCallback(() => this.resetView());
        this.ui.setMenuCallback((faceId) => this.handleMenuNavigation(faceId));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        this.contentMap = {
            'Face_Projects': Projects,
            'Face_Experience': Skills,
            'Face_About': About,
            'Face_Contact': Contact
        };

        this.ui.onScrollPower = (power) => {
            const targetSpeed = Math.min(0.15, power * 0.05);

            gsap.to(this.diamond, {
                rotationSpeed: targetSpeed,
                duration: 0.2,
                overwrite: true,
                onComplete: () => {
                    gsap.to(this.diamond, {
                        rotationSpeed: 0.01,
                        duration: 0.2,
                        ease: "power2.out"
                    });
                }
            });
        };
        this.ui.renderOnePageContent(this.contentMap);
        this.ui.initLightbox();

        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        this.animate();

    }

    setupLoadingManager() {
        const manager = new THREE.LoadingManager();
        const loaderBar = document.querySelector('.loader-bar');
        const loaderPercentage = document.querySelector('.loader-percentage');
        const preloader = document.getElementById('preloader');

        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            loaderBar.style.width = progress + '%';
            loaderPercentage.innerText = Math.round(progress) + '%';
        };

        manager.onLoad = () => {
            gsap.to(preloader, {
                opacity: 0,
                duration: 1,
                delay: 0.5,
                ease: "power2.inOut",
                onComplete: () => {
                    preloader.style.display = 'none';
                }
            });
        };

        return manager;
    }

    handleMenuNavigation(faceName) {
        if (this.isSplitView) {
            this.ui.scrollToSection(faceName);
            this.ui.highlightItem(faceName);
            setTimeout(() => this.ui.initLightbox(), 500);

            gsap.to(this.diamond, {
                rotationSpeed: 0.15,
                duration: 0.5,
                onComplete: () => {
                    gsap.to(this.diamond, {
                        rotationSpeed: 0.01,
                        duration: 1
                    });
                }
            });

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

        this.background.updateMousePosition(x, y);

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

        this.isSplitView = true;

        if (this.hoveredObject) {
            Effects.hoverEffect(this.hoveredObject, false);
            this.hoveredObject = null;
        }

        this.ui.openMenu();
        this.ui.highlightItem(name);

        Effects.enterSplitView(
            this.diamond,
            this.background.laserLight,
            hitPoint,
            this.ui,
            name,
            this.background.sunMesh.position,
            this.sceneManager.scene,
            this.sceneManager.camera,
            this.sceneManager.controls
        );
        setTimeout(() => {
            this.ui.initLightbox();
        }, 1200);

        if (faceName === 'Face_Contact') {
            this.initContactFormLogic();
        }
    }

    resetView() {
        if (!this.isSplitView) return;
        this.isSplitView = false;

        this.ui.clearHighlights();

        Effects.leaveSplitView(
            this.diamond,
            this.ui,
            this.sceneManager.controls
        );
    }

    getContentByName(name) {
        const contentMap = {
            'Face_Projects': Projects,
            'Face_Experience': Skills,
            'Face_About': { header: "ABOUT", body: "Kod yazmayı bir sanat olarak görüyorum. Estetik ve performansı birleştiren çözümler üretiyorum." },
            'Face_Contact': Contact
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

    initContactFormLogic() {
        setTimeout(() => {
            const form = document.getElementById('contactForm');
            if (!form) return;

            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);

            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const btn = document.getElementById('sendBtn');
                const status = document.getElementById('formStatus');
                const gotcha = document.getElementsByName('_gotcha')[0].value;

                if (gotcha !== "") {
                    console.log("Bot detected.");
                    return;
                }

                btn.disabled = true;
                btn.innerHTML = "TRANSMITTING DATA...";
                status.innerHTML = "";

                const formData = {
                    name: document.getElementById('formName').value,
                    email: document.getElementById('formEmail').value,
                    message: document.getElementById('formMessage').value,
                    _gotcha: gotcha
                };

                try {
                    const response = await fetch('./contact.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        status.innerHTML = `<span style="color:#00ff00">> SUCCESS: ${result.message}</span>`;
                        newForm.reset();
                    } else {
                        status.innerHTML = `<span style="color:#ff0000">> ERROR: ${result.message}</span>`;
                    }

                } catch (error) {
                    status.innerHTML = `<span style="color:#ff0000">> FATAL ERROR: CONNECTION LOST.</span>`;
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = "INITIATE TRANSMISSION";
                }
            });
        }, 500);
    }
}

const app = new DiamondPortfolio();