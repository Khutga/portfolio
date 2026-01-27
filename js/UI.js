export class UI {
    constructor() {
        this.sidePanel = document.getElementById('side-panel');
        this.titleEl = document.getElementById('side-title');
        this.descEl = document.getElementById('side-desc');
        this.closeBtn = document.getElementById('close-side-btn');

        this.onClose = null;
        this.onMenuClick = null;

        this.init();
        this.createNavMenu();
    }

    init() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                if (this.onClose) this.onClose();
            });
        }
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
            { label: 'PROJECTS', id: 'Face_Projects' },
            { label: 'SKILLS', id: 'Face_Experience' },
            { label: 'ABOUT', id: 'Face_About' },
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


    setCloseCallback(callback) {
        this.onClose = callback;
    }

    showPanel(header, htmlContent) {
        if (this.titleEl) this.titleEl.innerText = header;
        if (this.descEl) this.descEl.innerHTML = htmlContent;
        if (this.sidePanel) this.sidePanel.classList.add('active');
    }

    hidePanel() {
        if (this.sidePanel) this.sidePanel.classList.remove('active');
    }
}