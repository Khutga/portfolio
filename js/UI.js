import gsap from 'gsap';
export class UI {
    constructor() {
        this.sidePanel = document.getElementById('side-panel');
        this.titleEl = document.getElementById('side-title');
        this.descEl = document.getElementById('side-desc');
        this.closeBtn = document.getElementById('close-side-btn');

        this.onClose = null;
        this.onMenuClick = null;

        this.isManualScrolling = false;

        this.init();
        this.createNavMenu();
    }

    init() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                if (this.onClose) this.onClose();
            });
        }

        this.sidePanel.addEventListener('scroll', () => {
            if (this.isManualScrolling) return;

            const sections = document.querySelectorAll('.onepage-section');
            let currentSectionId = "";

            const isAtBottom = Math.abs(this.sidePanel.scrollHeight - this.sidePanel.scrollTop - this.sidePanel.clientHeight) < 10;
            if (!this.isManualScrolling) {
                const currentScroll = this.sidePanel.scrollTop;
                const delta = Math.abs(currentScroll - (this.lastScroll || 0));
                this.lastScroll = currentScroll;

                if (this.onScrollPower && delta > 0) {
                    this.onScrollPower(delta);
                }
            }
            if (isAtBottom) {
                currentSectionId = "Face_Contact";
            } else {
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    if (this.sidePanel.scrollTop >= (sectionTop - 150)) {
                        currentSectionId = section.id;
                    }
                });
            }

            if (currentSectionId) {
                this.highlightItem(currentSectionId);
            }
        });
    }

    setMenuCallback(callback) {
        this.onMenuClick = callback;
    }

    createNavMenu() {
        const menuBtn = document.createElement('div');
        menuBtn.className = 'diamond-menu-btn';
        menuBtn.innerHTML = '<div class="inner-diamond"></div>';
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
                this.highlightItem(item.id);
                
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
    const lightboxImg = lightbox.querySelector('img');
    const projectImages = document.querySelectorAll('.project-img');

    if (!lightbox || !lightboxImg) return;

    projectImages.forEach(img => {
        img.onclick = (e) => {
            e.stopPropagation();
            const src = img.getAttribute('src');
            lightboxImg.src = src;

            gsap.set(lightbox, { display: 'flex', opacity: 0 });
            
            gsap.to(lightbox, { opacity: 1, duration: 0.3 });
            gsap.fromTo(lightboxImg,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
            );
        };
    });

    const closeLightbox = () => {
        gsap.to(lightbox, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                lightbox.style.display = 'none';
                lightboxImg.src = ""; 
            }
        });
    };

    lightbox.onclick = closeLightbox;

    lightboxImg.onclick = (e) => {
        e.stopPropagation();
    };
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
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-page'));

        const targetBtn = document.querySelector(`.nav-btn[data-id="${faceId}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active-page');
        }
    }

    clearHighlights() {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-page'));
    }


    renderOnePageContent(contentMap) {
        const wrapper = document.querySelector('.content-wrapper');
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
    }

    scrollToSection(id) {
        const section = document.getElementById(id);
        if (section && this.sidePanel) {
            this.isManualScrolling = true;
            this.sidePanel.classList.add('active');

            section.scrollIntoView({ behavior: 'smooth', block: 'start' });

            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.isManualScrolling = false;
            }, 800);
        }
    }

    setCloseCallback(callback) {
        this.onClose = callback;
    }


    openPanel() {
        if (this.sidePanel) this.sidePanel.classList.add('active');
    }



    hidePanel() {
        if (this.sidePanel) this.sidePanel.classList.remove('active');
    }
}