import * as THREE from 'three';
import gsap from 'https://cdn.skypack.dev/gsap';

export class Effects {
    // 1. SAHNEYİ İKİYE BÖLME (Giriş Efekti)
    static enterSplitView(diamond, laserLight, hitPoint, ui, header, body) {
        const tl = gsap.timeline();
        
        // Lazer Konumu
        laserLight.position.copy(hitPoint);
        const bounceTarget = new THREE.Vector3(5, hitPoint.y + 2, 0); 
        laserLight.target.position.copy(bounceTarget);
        laserLight.target.updateMatrixWorld();

        tl.addLabel("start")
        // Lazer Parlasın
          .to(laserLight, { intensity: 500, duration: 0.1, ease: "power2.in" }, "start")
        
        // Panel Açılsın
          .to(laserLight, { intensity: 0, duration: 0.4, ease: "power2.out" }, "start+=0.1")
          .call(() => ui.showPanel(header, body), null, "start+=0.2") 

        // Elmas Sola Kaysın ve Hızlansın
          .to(diamond.diamondGroup.position, { x: -2.5, duration: 1.2, ease: "power3.inOut" }, "start")
          .to(diamond, { rotationSpeed: 0.02, duration: 1.2, ease: "power2.in" }, "start"); 
        
        return tl;
    }

    // 2. NORMAL GÖRÜNÜME DÖNÜŞ (Çıkış Efekti)
    static leaveSplitView(diamond, ui) {
        const tl = gsap.timeline();

        // Paneli kapat
        tl.call(() => ui.hidePanel())
        
        // Elması merkeze çek ve yavaşlat
          .to(diamond.diamondGroup.position, { x: 0, duration: 1.0, ease: "power3.inOut" })
          .to(diamond, { rotationSpeed: 0.002, duration: 1.0, ease: "power2.out" }, "<");
        
        return tl;
    }

    // 3. HOVER EFEKTİ
    static hoverEffect(object, isHovering) {
        if (!object) return;
        if (isHovering) {
            gsap.to(object.material, { emissiveIntensity: 0.5, duration: 0.3 });
            object.material.emissive = new THREE.Color(0x00ffff);
        } else {
            gsap.to(object.material, { emissiveIntensity: 0, duration: 0.5 });
        }
    }
}