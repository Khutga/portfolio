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
        document.body.appendChild(menuBtn);

        const menuContainer = document.createElement('div');
        menuContainer.className = 'nav-menu'; 

        const items = [
            { label: 'PROJELER', id: 'Face_Projects' },
            { label: 'DENEYİM', id: 'Face_Experience' },
            { label: 'HAKKIMDA', id: 'Face_About' },
            { label: 'İLETİŞİM', id: 'Face_Contact' }
        ];

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.innerText = item.label;
            
            btn.addEventListener('click', () => {
                if (this.onMenuClick) this.onMenuClick(item.id);
                menuContainer.classList.remove('open');
            });
            
            menuContainer.appendChild(btn);
        });

        document.body.appendChild(menuContainer);

        menuBtn.addEventListener('click', () => {
            menuContainer.classList.toggle('open');
        });
    }
    setCloseCallback(callback) {
        this.onClose = callback;
    }

    showPanel(header, text) {
        if (this.titleEl) this.titleEl.innerText = header;
        if (this.descEl) this.descEl.innerText = text;
        if (this.sidePanel) this.sidePanel.classList.add('active');
    }

    hidePanel() {
        if (this.sidePanel) this.sidePanel.classList.remove('active');
    }
}