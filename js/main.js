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
        this.tiltTarget = { x: 0.3, z: 0 };

        this.init();

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        }, false);

        window.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                return false;
            }
        });
    }

    init() {
        this.ui.setCloseCallback(() => this.resetView());
        this.ui.setMenuCallback((faceId) => this.handleMenuNavigation(faceId));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
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
                        ease: "power2.out",
                        overwrite: true
                    });
                }
            });
        };
        this.ui.renderOnePageContent(this.contentMap);
        this.ui.initLightbox();

        this.animate();

    }

    setupLoadingManager() {
        const manager = new THREE.LoadingManager();
        const loaderBar = document.querySelector('.loader-bar');
        const loaderPercentage = document.querySelector('.loader-percentage');
        const preloader = document.getElementById('preloader');

        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            loaderBar.style.transform = `scaleX(${progress / 100})`;
            loaderPercentage.innerText = Math.round(progress) + '%';
        };

        manager.onLoad = () => {
            if (this.diamond && this.diamond.warmUp) {
                this.diamond.warmUp();
            }

            if (Effects.warmUp) {
                Effects.warmUp(this.sceneManager.scene);
            }

            if (this.diamond && this.raycaster) {
                this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.sceneManager.camera);
                this.raycaster.intersectObjects(this.diamond.getChildren());
            }

            gsap.to(this.diamond, {
                rotationSpeed: 0.15,
                duration: 0.1,
                overwrite: true,
                onComplete: () => {
                    this.diamond.rotationSpeed = 0.01;
                }
            });

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
                overwrite: true,
                onComplete: () => {
                    gsap.to(this.diamond, {
                        rotationSpeed: 0.01,
                        duration: 1,
                        overwrite: true
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

    clearHover() {
        document.body.style.cursor = 'default';
        if (this.hoveredObject) {
            Effects.hoverEffect(this.hoveredObject, false);
            this.hoveredObject = null;
        }
    }

    onMouseMove(event) {
        if (event.target.closest('#side-panel') || event.target.closest('.nav-menu')) {
            this.clearHover();
            return;
        }
        if (this.isSplitView) {
            this.clearHover();
            return;
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        const intersects = this.raycaster.intersectObjects(this.diamond.getChildren());

        let hit = intersects.find(i => this.contentMap && this.contentMap[i.object.name]);
        if (!hit) {
            hit = intersects.find(i => i.object.name && i.object.name.startsWith('Face_'));
        }

        if (hit) {
            document.body.style.cursor = 'pointer';

            if (this.hoveredObject !== hit.object) {
                if (this.hoveredObject) Effects.hoverEffect(this.hoveredObject, false);

                this.hoveredObject = hit.object;
                Effects.hoverEffect(this.hoveredObject, true);
            }
        } else {
            this.clearHover();
        }

        const x = (event.clientX / window.innerWidth) - 0.5;
        const y = (event.clientY / window.innerHeight) - 0.5;

        this.background.updateMousePosition(x, y);

        // Tilt via lerp in animate() instead of a new gsap tween per mousemove
        this.tiltTarget.x = 0.3 + (y * 0.4);
        this.tiltTarget.z = x * 0.4;
    }

    pick(clientX, clientY) {
        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.diamond.getChildren());

        if (intersects.length > 0) {
            this.handleDiamondClick(intersects[0].object, intersects[0].point);
            return true;
        }
        return false;
    }

    onClick(event) {
        if (this.isSplitView) return;
        this.pick(event.clientX, event.clientY);
    }

    onTouchStart(event) {
        if (this.isSplitView) return;

        const touch = event.changedTouches[0];
        if (this.pick(touch.clientX, touch.clientY)) {
            event.preventDefault();
        }
    }


    handleDiamondClick(object, hitPoint) {
        if (this.sceneManager.controls) {
            this.sceneManager.controls.enabled = false;
        }
        const hintElement = document.getElementById('interaction-hint');
        if (hintElement) {
            hintElement.style.opacity = '0';
            setTimeout(() => hintElement.remove(), 500);
        }
        const name = object.name;

        if (!this.contentMap[name]) {
            return;
        }

        this.isSplitView = true;

        if (this.hoveredObject) {
            Effects.hoverEffect(this.hoveredObject, false);
            this.hoveredObject = null;
        }

        if (window.innerWidth > 768) {
            this.ui.openMenu();
        }

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

        if (name === 'Face_Contact') {
            this.initContactFormLogic();
        }
    }

    resetView() {
        if (!this.isSplitView) return;
        if (this.sceneManager.controls) {
            this.sceneManager.controls.enabled = true;
        }
        this.isSplitView = false;

        this.ui.clearHighlights();

        Effects.leaveSplitView(
            this.diamond,
            this.ui,
            this.sceneManager.controls
        );
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = Math.min(this.clock.getDelta(), 0.05);

        // Smooth crystal tilt toward mouse target (replaces mousemove tween flood)
        const rot = this.diamond.diamondGroup.rotation;
        rot.x += (this.tiltTarget.x - rot.x) * 0.08;
        rot.z += (this.tiltTarget.z - rot.z) * 0.08;

        if (this.diamond) this.diamond.rotate();
        if (!this.isSplitView && this.background) this.background.update(deltaTime);
        this.sceneManager.render();
    }


    initContactFormLogic() {

        if (document.getElementById('recaptcha-script')) return;

        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = "https://www.google.com/recaptcha/api.js?render=6LdYPVosAAAAABR9SpfZdem6jkRJwESVBEgft29w";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        setTimeout(() => {
            const oldForm = document.getElementById('contactForm');
            if (!oldForm) return;

            const newForm = oldForm.cloneNode(true);
            oldForm.parentNode.replaceChild(newForm, oldForm);

            const btn = newForm.querySelector('#sendBtn');
            const status = newForm.querySelector('#formStatus');
            const tokenInput = newForm.querySelector('#recaptchaToken');
            const gotchaInput = newForm.querySelector('input[name="_gotcha"]');
            const nameInput = newForm.querySelector('#formName');
            const emailInput = newForm.querySelector('#formEmail');
            const messageInput = newForm.querySelector('#formMessage');

            newForm.addEventListener('submit', (e) => {
                e.preventDefault();

                if (gotchaInput.value !== "") return;

                btn.disabled = true;
                btn.innerHTML = "VERIFYING SECURITY...";
                status.innerHTML = "";

                if (typeof grecaptcha === 'undefined') {
                    status.innerHTML = `<span style="color:#ff0000">> ERROR: reCAPTCHA not loaded. Check internet/index.html</span>`;
                    btn.disabled = false;
                    btn.innerHTML = "INITIATE TRANSMISSION";
                    return;
                }

                grecaptcha.ready(function () {
                    grecaptcha.execute('6LdYPVosAAAAABR9SpfZdem6jkRJwESVBEgft29w', { action: 'submit' }).then(async function (token) {

                        if (tokenInput) tokenInput.value = token;

                        btn.innerHTML = "TRANSMITTING DATA...";

                        const formData = {
                            name: nameInput.value,
                            email: emailInput.value,
                            message: messageInput.value,
                            recaptcha_token: token
                        };

                        try {
                            const response = await fetch('./contact.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(formData)
                            });

                            const responseText = await response.text();
                            let result;

                            try {
                                result = JSON.parse(responseText);
                            } catch (err) {
                                throw new Error("Server Error: " + responseText);
                            }

                            if (result.success) {
                                status.innerHTML = `<span style="color:#00ff00; text-shadow: 0 0 5px #00ff00;">> SUCCESS: ${result.message}</span>`;
                                newForm.reset();
                            } else {
                                status.innerHTML = `<span style="color:#ff0000; text-shadow: 0 0 5px #ff0000;">> ERROR: ${result.message}</span>`;
                            }

                        } catch (error) {
                            console.error(error);
                            status.innerHTML = `<span style="color:#ff0000">> FATAL ERROR: CONNECTION LOST.</span>`;
                        } finally {
                            btn.disabled = false;
                            btn.innerHTML = "INITIATE TRANSMISSION";
                        }
                    });
                });
            });
        }, 800);
    }


}

const app = new DiamondPortfolio();
