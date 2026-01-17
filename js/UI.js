export class UI {
    constructor() {
        this.sidePanel = document.getElementById('side-panel');
        this.titleEl = document.getElementById('side-title');
        this.descEl = document.getElementById('side-desc');
        this.closeBtn = document.getElementById('close-side-btn');
        
        this.onClose = null;
        this.init();
    }

    init() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                if (this.onClose) this.onClose();
            });
        }
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