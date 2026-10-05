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
        this.isLoaded = false;
        this.hoveredObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        this.tiltTarget = { x: 0.3, z: 0 };
        this._downPos = null;
        this._downTime = 0;

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
        this._suppressHash = false;
        this._pendingHash = (window.location.hash || '').replace('#', '').toLowerCase();
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('hashchange', () => this.handleHashChange());
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        const canvas = this.sceneManager.renderer.domElement;
        // Only left-button / single-touch taps on the canvas count as clicks.
        // Dragging to orbit (left-drag) must NOT trigger a diamond click and
        // must NOT start a text selection (blue "Touch here" highlight).
        canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
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
        const loaderText = document.querySelector('.loader-text');
        const loaderError = document.querySelector('.loader-error');
        const preloader = document.getElementById('preloader');

        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            if (!itemsTotal) return;
            const progress = (itemsLoaded / itemsTotal) * 100;
            if (loaderBar) loaderBar.style.transform = `scaleX(${progress / 100})`;
            if (loaderPercentage) loaderPercentage.innerText = Math.round(progress) + '%';
        };

        manager.onError = (url) => {
            console.warn('Asset failed to load:', url);
            if (loaderError) {
                loaderError.hidden = false;
                loaderError.textContent = 'A 3D asset failed to load — showing lite scene…';
                loaderError.style.cssText = 'color:#ff6666;font-family:monospace;font-size:0.75rem;max-width:260px';
            }
            // Don't hang forever on a missing .glb — finish with what we have.
            clearTimeout(this._loadFallbackTimer);
            this._loadFallbackTimer = setTimeout(() => this.finishLoading(), 1500);
        };

        // Safety net: never trap the user behind the loader (slow CDN, blocked Draco, missing file).
        clearTimeout(this._loadFallbackTimer);
        this._loadFallbackTimer = setTimeout(() => {
            if (!this.isLoaded) {
                console.warn('Loading timed out — forcing lite finish.');
                this.finishLoading();
            }
        }, 15000);

        manager.onLoad = () => {
            clearTimeout(this._loadFallbackTimer);
            this.finishLoading();
        };

        return manager;
    }

    finishLoading() {
        if (this.isLoaded) return;
        const preloader = document.getElementById('preloader');
        if (this.diamond && this.diamond.warmUp) {
            try { this.diamond.warmUp(); } catch (e) { console.warn(e); }
        }

        if (Effects.warmUp) {
            try { Effects.warmUp(this.sceneManager.scene); } catch (e) { console.warn(e); }
        }

        if (this.diamond && this.raycaster) {
            try {
                this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.sceneManager.camera);
                this.raycaster.intersectObjects(this.diamond.getChildren());
            } catch (e) { console.warn(e); }
        }

        gsap.to(this.diamond, {
            rotationSpeed: 0.15,
            duration: 0.1,
            overwrite: true,
            onComplete: () => {
                this.diamond.rotationSpeed = 0.01;
            }
        });

        // Allow clicks only after everything is ready, and stop the
        // fading preloader from eating / blocking pointer events.
        this.isLoaded = true;
        if (preloader) preloader.style.pointerEvents = 'none';

        gsap.to(preloader, {
            opacity: 0,
            duration: 1,
            delay: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
                preloader.style.display = 'none';
            }
        });

        // Deep link: seyidzade.sbs/#projects etc. opens right after load.
        const pending = (this._pendingHash || (window.location.hash || '').replace('#', '').toLowerCase());
        this._pendingHash = '';
        if (pending) {
            const face = this.hashToFace(pending);
            if (face) {
                setTimeout(() => this.triggerSection(face), 900);
            }
        }
    }

    faceToHash(faceName) {
        const map = { 'Face_About': 'about', 'Face_Experience': 'skills', 'Face_Projects': 'projects', 'Face_Contact': 'contact' };
        return map[faceName] || '';
    }

    hashToFace(hash) {
        const map = { 'about': 'Face_About', 'skills': 'Face_Experience', 'experience': 'Face_Experience', 'projects': 'Face_Projects', 'contact': 'Face_Contact' };
        return map[(hash || '').toLowerCase()] || '';
    }

    setHash(faceName) {
        const h = this.faceToHash(faceName);
        if (!h) return;
        if ((window.location.hash || '').replace('#', '') === h) return;
        this._suppressHash = true;
        window.location.hash = h;
        setTimeout(() => { this._suppressHash = false; }, 50);
    }

    handleHashChange() {
        if (this._suppressHash) return;
        const hash = (window.location.hash || '').replace('#', '').toLowerCase();
        if (!hash) {
            if (this.isSplitView) this.resetView(true);
            return;
        }
        const face = this.hashToFace(hash);
        if (!face) return;
        if (!this.isLoaded) {
            this._pendingHash = hash;
            return;
        }
        if (this.isSplitView) {
            this.ui.scrollToSection(face);
            this.ui.highlightItem(face);
        } else {
            this.triggerSection(face);
        }
    }

    onKeyDown(event) {
        if (event.key === 'Escape') {
            // Lightbox has its own Escape handler in UI.js — let it close first.
            const lightbox = document.getElementById('image-lightbox');
            if (lightbox && lightbox.style.display === 'flex') return;
            if (this.isSplitView) this.resetView();
        }
    }

    handleMenuNavigation(faceName) {
        if (this.isSplitView) {
            this.setHash(faceName);
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

    onPointerDown(event) {
        // Left button / touch only. Ignore right & middle buttons entirely.
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        this._downPos = { x: event.clientX, y: event.clientY };
        this._downTime = performance.now();
        // Kill any blue text-selection highlight the moment user presses.
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0 && !sel.isCollapsed) sel.removeAllRanges();
        }
    }

    onPointerUp(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (!this._downPos) return;
        if (!this.isLoaded || this.isSplitView) {
            this._downPos = null;
            return;
        }
        const dx = event.clientX - this._downPos.x;
        const dy = event.clientY - this._downPos.y;
        const dist = Math.hypot(dx, dy);
        const dt = performance.now() - this._downTime;
        this._downPos = null;
        // If user dragged (orbiting the cosmos), it's NOT a click.
        if (dist > 6 || dt > 500) return;
        this.pick(event.clientX, event.clientY);
    }


    handleDiamondClick(object, hitPoint) {
        const name = object.name;
        if (!this.contentMap[name]) return;
        if (this.sceneManager.controls) {
            this.sceneManager.controls.enabled = false;
        }
        this.setHash(name);
        const hintElement = document.getElementById('interaction-hint');
        if (hintElement) {
            hintElement.style.opacity = '0';
            setTimeout(() => { hintElement.style.display = 'none'; }, 500);
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

    resetView(skipHash = false) {
        if (!this.isSplitView) return;
        if (this.sceneManager.controls) {
            this.sceneManager.controls.enabled = true;
        }
        this.isSplitView = false;

        if (!skipHash && window.location.hash) {
            try {
                history.pushState(null, '', window.location.pathname + window.location.search);
            } catch (e) {
                this._suppressHash = true;
                window.location.hash = '';
                setTimeout(() => { this._suppressHash = false; }, 50);
            }
        }

        this.ui.clearHighlights();

        // Restore hint on close.
        const hintElement = document.getElementById('interaction-hint');
        if (hintElement) {
            hintElement.style.display = 'flex';
            requestAnimationFrame(() => { hintElement.style.opacity = '1'; });
            const label = hintElement.querySelector('.hint-text');
            if (label) label.textContent = 'DRAG TO ORBIT • TAP CRYSTAL';
        }

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
        if (this.background) {
            // Jet keeps flying even with the menu open (stars stay calm while reading).
            if (!this.isSplitView) this.background.update(deltaTime);
            else this.background.updateJet(deltaTime);
        }
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

                            const setStatus = (ok, text) => {
                                status.textContent = (ok ? '> SUCCESS: ' : '> ERROR: ') + String(text || '');
                                status.style.color = ok ? '#00ff00' : '#ff0000';
                                status.style.textShadow = ok ? '0 0 5px #00ff00' : '0 0 5px #ff0000';
                            };
                            if (result.success) {
                                setStatus(true, result.message);
                                newForm.reset();
                            } else {
                                setStatus(false, result.message);
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
