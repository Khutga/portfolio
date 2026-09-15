import gsap from 'gsap';

export class UI {
    constructor() {
        this.sidePanel = document.getElementById('side-panel');
        this.closeBtn = document.getElementById('close-side-btn');

        this.onClose = null;
        this.onMenuClick = null;

        this.isManualScrolling = false;

        this.sectionsCache = [];
        this.lastActiveId = "";
        this.isScrolling = false;

        this.init();
        this.createNavMenu();
    }

    init() {

        // Hide broken images gracefully (e.g. asset missing on server -> no broken-icon UI)
        document.addEventListener('error', (e) => {
            const t = e.target;
            if (t && t.tagName === 'IMG' && t.classList.contains('tech-icon')) {
                t.style.display = 'none';
            }
        }, true);

        ['mousedown', 'touchstart', 'pointerdown'].forEach(evt => {
            this.sidePanel.addEventListener(evt, (e) => {
                e.stopPropagation();
            }, { passive: false });
        });
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                if (this.onClose) this.onClose();
            });
        }

        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        this.sidePanel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        this.sidePanel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const xDiff = touchEndX - touchStartX;
            const yDiff = Math.abs(touchEndY - touchStartY);
            if (xDiff > 60 && yDiff < 60) {
                if (this.onClose) this.onClose();
            }
        };

        this.sidePanel.addEventListener('wheel', (e) => {
            const power = Math.abs(e.deltaY);

            if (this.onScrollPower && power > 2) {
                this.onScrollPower(power);
            }
        }, { passive: true });


        this.sidePanel.addEventListener('scroll', () => {
            const menuBtn = document.querySelector('.diamond-menu-btn');

            if (this.sidePanel.scrollTop > 50) {
                if (menuBtn) menuBtn.classList.add('faded');
            } else {
                if (menuBtn) menuBtn.classList.remove('faded');
            }

            if (this.isManualScrolling) return;

            if (!this.isScrolling) {
                this.isScrolling = true;
                requestAnimationFrame(() => {
                    this.handleMenuHighlight();
                    this.isScrolling = false;
                });
            }
        });
    }

    updateSectionCache() {
        const sections = document.querySelectorAll('.onepage-section');
        this.sectionsCache = [];

        sections.forEach(section => {
            this.sectionsCache.push({
                id: section.id,
                top: section.offsetTop,
                height: section.offsetHeight
            });
        });
    }

    handleMenuHighlight() {
        const scrollPosition = this.sidePanel.scrollTop + 150;
        let currentSectionId = "";

        const isAtBottom = Math.abs(this.sidePanel.scrollHeight - this.sidePanel.scrollTop - this.sidePanel.clientHeight) < 10;

        if (isAtBottom) {
            currentSectionId = "Face_Contact";
        } else {
            for (let i = this.sectionsCache.length - 1; i >= 0; i--) {
                if (scrollPosition >= this.sectionsCache[i].top) {
                    currentSectionId = this.sectionsCache[i].id;
                    break;
                }
            }
        }

        if (currentSectionId) {
            this.highlightItem(currentSectionId);
        }
    }

    setMenuCallback(callback) {
        this.onMenuClick = callback;
    }

    createNavMenu() {
        const existingBtn = document.querySelector('.diamond-menu-btn');
        if (existingBtn) existingBtn.remove();
        const existingMenu = document.querySelector('.nav-menu');
        if (existingMenu) existingMenu.remove();

        const menuBtn = document.createElement('div');
        menuBtn.className = 'diamond-menu-btn';
        document.body.appendChild(menuBtn);

        const menuContainer = document.createElement('div');
        menuContainer.className = 'nav-menu';

        const items = [
            { label: 'ABOUT', id: 'Face_About' },
            { label: 'SKILLS', id: 'Face_Experience' },
            { label: 'PROJECTS', id: 'Face_Projects' },
            { label: 'CONTACT', id: 'Face_Contact' }
        ];

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.innerText = item.label;
            btn.dataset.id = item.id;

            btn.addEventListener('click', () => {
                if (this.onMenuClick) this.onMenuClick(item.id);

                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-page'));
                btn.classList.add('active-page');

                if (window.innerWidth < 768) {
                    menuContainer.classList.remove('open');
                    const menuBtn = document.querySelector('.diamond-menu-btn');
                    if (menuBtn) menuBtn.classList.remove('menu-active');
                }
            });

            menuContainer.appendChild(btn);
        });

        document.body.appendChild(menuContainer);

        menuBtn.addEventListener('click', (e) => {
            menuContainer.classList.toggle('open');
            menuBtn.classList.toggle('menu-active');
        });
    }

    initLightbox() {
        const lightbox = document.getElementById('image-lightbox');
        if (!lightbox || lightbox.dataset.bound === '1') return;
        lightbox.dataset.bound = '1';

        const lightboxImg = lightbox.querySelector('img');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        const counter = lightbox.querySelector('.lightbox-counter');
        const wrapper = document.querySelector('.content-wrapper');

        let galleryImages = [];
        let currentIndex = 0;

        const showImage = (index) => {
            currentIndex = index;
            if (lightboxImg) lightboxImg.src = galleryImages[index];
            if (counter) counter.textContent = `${index + 1} / ${galleryImages.length}`;
            if (prevBtn) prevBtn.style.display = galleryImages.length > 1 ? 'flex' : 'none';
            if (nextBtn) nextBtn.style.display = galleryImages.length > 1 ? 'flex' : 'none';
            if (counter) counter.style.display = galleryImages.length > 1 ? 'block' : 'none';
        };

        if (wrapper) {
            wrapper.addEventListener('click', (e) => {
                if (e.target.classList.contains('project-img')) {
                    e.stopPropagation();

                    const parent = e.target.closest('.project-gallery') || e.target.closest('.project-image-wrapper');
                    if (parent) {
                        galleryImages = Array.from(parent.querySelectorAll('.project-img')).map(img => img.getAttribute('src'));
                        currentIndex = galleryImages.indexOf(e.target.getAttribute('src'));
                    } else {
                        galleryImages = [e.target.getAttribute('src')];
                        currentIndex = 0;
                    }

                    showImage(currentIndex);
                    gsap.set(lightbox, { display: 'flex', opacity: 0 });
                    gsap.to(lightbox, { opacity: 1, duration: 0.3 });

                    if (lightboxImg) {
                        gsap.fromTo(lightboxImg,
                            { scale: 0.8, opacity: 0 },
                            { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
                        );
                    }
                }
            });
        }

        const closeLightbox = () => {
            gsap.to(lightbox, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    lightbox.style.display = 'none';
                    if (lightboxImg) lightboxImg.src = "";
                }
            });
        };

        lightbox.onclick = closeLightbox;
        if (lightboxImg) {
            lightboxImg.onclick = (e) => e.stopPropagation();
        }
        if (prevBtn) {
            prevBtn.onclick = (e) => {
                e.stopPropagation();
                showImage((currentIndex - 1 + galleryImages.length) % galleryImages.length);
                gsap.fromTo(lightboxImg, { opacity: 0.5 }, { opacity: 1, duration: 0.2 });
            };
        }
        if (nextBtn) {
            nextBtn.onclick = (e) => {
                e.stopPropagation();
                showImage((currentIndex + 1) % galleryImages.length);
                gsap.fromTo(lightboxImg, { opacity: 0.5 }, { opacity: 1, duration: 0.2 });
            };
        }

        document.addEventListener('keydown', (e) => {
            if (lightbox.style.display === 'flex') {
                if (e.key === 'ArrowLeft') prevBtn?.click();
                if (e.key === 'ArrowRight') nextBtn?.click();
                if (e.key === 'Escape') closeLightbox();
            }
        });
    }

    openMenu() {
        const menuContainer = document.querySelector('.nav-menu');
        const menuBtn = document.querySelector('.diamond-menu-btn');
        if (menuContainer && menuBtn) {
            menuContainer.classList.add('open');
            menuBtn.classList.add('menu-active');
        }
    }

    highlightItem(faceId) {
        if (this.lastActiveId === faceId) return;
        this.lastActiveId = faceId;

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-page'));

        const targetBtn = document.querySelector(`.nav-btn[data-id="${faceId}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active-page');
        }
    }

    clearHighlights() {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-page'));
        this.lastActiveId = "";
    }

    renderOnePageContent(contentMap) {
        const wrapper = document.querySelector('.content-wrapper');
        if (!wrapper) return;

        wrapper.innerHTML = '';

        const order = ['Face_About', 'Face_Experience', 'Face_Projects', 'Face_Contact'];

        order.forEach(key => {
            const sectionData = contentMap[key];
            if (!sectionData) return;

            const section = document.createElement('section');
            section.id = key;
            section.classList.add('onepage-section');
            section.style.marginBottom = "150px";
            section.style.paddingTop = "20px";
            section.innerHTML = sectionData.body;
            wrapper.appendChild(section);
        });

        setTimeout(() => this.updateSectionCache(), 300);
    }

    scrollToSection(id) {
        const section = document.getElementById(id);
        if (section && this.sidePanel) {
            this.isManualScrolling = true;
            this.sidePanel.classList.add('active');

            section.scrollIntoView({ behavior: 'smooth', block: 'start' });

            if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.isManualScrolling = false;
                this.highlightItem(id);
            }, 800);
        }
    }

    setCloseCallback(callback) {
        this.onClose = callback;
    }

    openPanel() {
        if (this.sidePanel) {
            this.sidePanel.classList.add('active');
            setTimeout(() => this.updateSectionCache(), 300);
        }
    }

    hidePanel() {
        if (this.sidePanel) this.sidePanel.classList.remove('active');
    }
}