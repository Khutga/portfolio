import gsap from 'https://cdn.skypack.dev/gsap';

export class Effects {
    static createLaserEffect(laserLight, startPos, targetPos, contentScreen, headerText, bodyText, ui) {
        const tl = gsap.timeline();
        
        // İçerik ekranına doku yükle
        contentScreen.material.map = ui.createContentTexture(headerText, bodyText);
        contentScreen.material.needsUpdate = true;
        
        // Lazer pozisyonu
        laserLight.position.copy(startPos);
        laserLight.target.position.copy(targetPos);
        
        // Animasyon
        tl.to(laserLight, { intensity: 200, duration: 0.1, ease: "power2.in" })
          .to(contentScreen.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 0.4, ease: "back.out(1.7)" }, "<")
          .to(contentScreen.material, { opacity: 1, duration: 0.2 }, "<")
          .to(laserLight, { intensity: 0, duration: 0.4, ease: "power2.out" });
        
        return tl;
    }

    static resetView(contentScreen, camera, controls, diamondGroup, ui) {
        const tl = gsap.timeline();
        
        // Ekranı kapat
        tl.to(contentScreen.scale, { x: 0, y: 0, z: 0, duration: 0.3, ease: "back.in(2)" })
          .to(contentScreen.material, { opacity: 0, duration: 0.2 }, "<");
        
        // UI panelini gizle
        ui.hidePanel();
        
        // Kamera reset
        tl.to(camera.position, { x: 0, y: 0, z: 5, duration: 1.0, ease: "power2.inOut" })
          .to(controls.target, { x: 0, y: 0, z: 0, duration: 1.0, ease: "power2.inOut" }, "<");
        
        // Elmas dönüşü
        tl.to(diamondGroup.rotation, { 
            y: diamondGroup.rotation.y + Math.PI * 2, 
            duration: 0.8, 
            ease: "back.out(1.0)" 
        }, "-=0.8");
        
        return tl;
    }

    static hoverEffect(object, isHovering) {
        if (!object) return;
        
        if (isHovering) {
            object.material.emissive = new THREE.Color(0x5050ff);
            gsap.to(object.material, { emissiveIntensity: 0.3, duration: 0.2 });
        } else {
            gsap.to(object.material, { emissiveIntensity: 0, duration: 0.5 });
        }
    }
}