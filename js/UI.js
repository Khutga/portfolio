import * as THREE from 'three';
import gsap from 'https://cdn.skypack.dev/gsap';

export class UI {
    constructor() {
        this.infoPanel = document.getElementById('info-panel');
        this.title = document.getElementById('panel-title');
        this.desc = document.getElementById('panel-desc');
        this.closeBtn = document.getElementById('close-btn');
        
        this.init();
    }

    init() {
        this.closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onClose) this.onClose();
        });
    }

    showPanel(header, description) {
        this.title.textContent = header;
        this.desc.textContent = description;
        this.infoPanel.classList.add('active');
    }

    hidePanel() {
        this.infoPanel.classList.remove('active');
    }

    createContentTexture(header, text) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Arka plan
        ctx.fillStyle = "rgba(10, 10, 30, 0.95)";
        ctx.fillRect(0, 0, 1024, 1024);

        // Çerçeve
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 20;
        ctx.strokeRect(20, 20, 984, 984);

        // Başlık
        ctx.font = "bold 120px Segoe UI, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(header, 512, 200);

        // Alt çizgi
        ctx.beginPath();
        ctx.moveTo(100, 230);
        ctx.lineTo(924, 230);
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 5;
        ctx.stroke();

        // İçerik metni
        ctx.font = "50px Segoe UI, sans-serif";
        ctx.fillStyle = "#cccccc";
        const words = text.split(' ');
        let line = '';
        let y = 350;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 800 && n > 0) {
                ctx.fillText(line, 512, y);
                line = words[n] + ' ';
                y += 70;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 512, y);

        return new THREE.CanvasTexture(canvas);
    }

    updatePanelPosition(vector3, camera) {
        if (!this.infoPanel.classList.contains('active')) return;

        const vector = vector3.clone();
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

        this.infoPanel.style.left = `${x}px`;
        this.infoPanel.style.top = `${y}px`;
    }

    setCloseCallback(callback) {
        this.onClose = callback;
    }
}