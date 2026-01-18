export class UI {
    constructor() {
        this.sidePanel = document.getElementById('side-panel');
        this.titleEl = document.getElementById('side-title');
        this.descEl = document.getElementById('side-desc');
        this.closeBtn = document.getElementById('close-side-btn');
        
        this.onClose = null;
        this.onMenuClick = null; // Menü tıklama callback'i

        this.init();
        this.createNavMenu(); // Başlarken menüyü oluştur
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
        // 1. ELMAS BUTONU OLUŞTUR
        const menuBtn = document.createElement('div');
        menuBtn.className = 'diamond-menu-btn';
        document.body.appendChild(menuBtn);

        // 2. MENÜ LİSTESİNİ OLUŞTUR
        const menuContainer = document.createElement('div');
        menuContainer.className = 'nav-menu'; // CSS'de varsayılan olarak gizli

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
                // Tıklayınca sayfaya git
                if (this.onMenuClick) this.onMenuClick(item.id);
                // Ve menüyü kapat
                menuContainer.classList.remove('open');
            });
            
            menuContainer.appendChild(btn);
        });

        document.body.appendChild(menuContainer);

        // 3. TOGGLE MANTIĞI (Aç/Kapa)
        menuBtn.addEventListener('click', () => {
            menuContainer.classList.toggle('open');
        });
    }
    setCloseCallback(callback) {
        this.onClose = callback;
    }

    // Paneli göster
    showPanel(header, text) {
        if (this.titleEl) this.titleEl.innerText = header;
        if (this.descEl) this.descEl.innerText = text;
        if (this.sidePanel) this.sidePanel.classList.add('active');
    }

    // Paneli gizle
    hidePanel() {
        if (this.sidePanel) this.sidePanel.classList.remove('active');
    }
}