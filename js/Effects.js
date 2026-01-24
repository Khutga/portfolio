// js/Effects.js dosyasının TAMAMINI bununla güncelleyebilirsin:

import * as THREE from 'three';
import gsap from 'https://cdn.skypack.dev/gsap';

export class Effects {

    // YENİ: Gerçekçi Lazer Oluşturucu (Silindir Geometrisi ile)
    static createRealLaser(startPoint, endPoint, scene) {
        // 1. Mesafeyi ve Orta Noktayı Bul
        const distance = startPoint.distanceTo(endPoint);
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
        const center = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);

        // 2. Lazer Geometrisi (İnce uzun silindir)
        // radiusTop: 0.05, radiusBottom: 0.05 -> İnce bir ışın
        const geometry = new THREE.CylinderGeometry(0.01, 0.01, distance, 8, 1, true);

        // Silindir varsayılan olarak Y ekseninde diktir. Onu Z eksenine yatırıp 'lookAt' ile yönlendireceğiz.
        geometry.rotateX(Math.PI / 2);

        // 3. Materyal (Neon Parlaması için AdditiveBlending)
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffaa,       
            transparent: true,
            opacity: 0,            // Başlangıçta görünmez
            blending: THREE.AdditiveBlending, // Parlama efekti verir
            depthWrite: false,     // Diğer nesnelerin arkasında bozulmasın
            side: THREE.DoubleSide
        });

        // 4. Mesh Oluşturma ve Konumlandırma
        const laserMesh = new THREE.Mesh(geometry, material);
        laserMesh.position.copy(center);
        laserMesh.lookAt(endPoint); // Lazer hedefe baksın

        // 5. İçirde daha parlak beyaz bir çekirdek (Daha "High-Tech" görünüm)
        const coreGeo = new THREE.CylinderGeometry(0.015, 0.015, distance, 8, 1, true);
        coreGeo.rotateX(Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff, // Beyaz çekirdek
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        laserMesh.add(coreMesh); // Çekirdeği ana lazere ekle

        scene.add(laserMesh);

        return { mesh: laserMesh, core: coreMesh, mat: material, coreMat: coreMat };
    }

    // 1. GİRİŞ EFEKTİ (Lazerli & Panelli)
    static enterSplitView(diamond, laserLight, hitPoint, ui, header, body, sunPosition, scene, camera, controls) {
        
        if (controls ) {
            controls.enabled = false;
            
            // 2. KAMERAYI MERKEZE SÜZÜLEREK GETİR (Sinematik Reset)
            // Kamerayı başlangıç pozisyonuna (0, 0, 2.5) çekiyoruz
            gsap.to(camera.position, { 
                x: 0, 
                y: 0, 
                z: 2.5, 
                duration: 1.2, 
                ease: "power3.inOut" 
            });
            
            // Kameranın baktığı noktayı merkeze (0,0,0) çekiyoruz
            gsap.to(controls.target, { 
                x: 0, 
                y: 0, 
                z: 0, 
                duration: 1.2, 
                ease: "power3.inOut" 
            });
        }

        const tl = gsap.timeline();

        // Ricochet Hedefi (Panelin sol kenarına çarpıyor gibi görünsün)
        const panelTarget = new THREE.Vector3(2.5, -0.5, 1);

        const laserObj = this.createRealLaser(sunPosition, hitPoint, scene);
        const ricochetObj = this.createRealLaser(hitPoint, panelTarget, scene);

        laserLight.target.position.copy(hitPoint);
        laserLight.target.updateMatrixWorld();

        tl.addLabel("start")

            // --- GÜNCELLENEN KONUM AYARI (SOLA SABİTLEME) ---
            .to(diamond.diamondGroup.position, {
                x: -3.6,  // Ekranın sol kenarına tam oturacak güvenli nokta
                y: 0.0,   // Dikeyde tam ortala
                z: -0.5,  // Kameradan çok uzaklaşmasın, net görünsün
                duration: 1.2,
                ease: "power3.inOut"
            }, "start")
            .to(diamond.diamondGroup.scale, {
                x: 0.35, // %20'lik alana sığacak ideal boyut
                y: 0.35,
                z: 0.35,
                duration: 1.2,
                ease: "power3.inOut"
            }, "start")
            .to(diamond, { rotationSpeed: 0.01, duration: 1.2 }, "start")
            // ------------------------------------------------

            // ... (Geri kalan lazer ve panel kodları AYNI kalacak) ...
            .to([laserObj.mat, laserObj.coreMat], { opacity: 1, duration: 0.1 }, "start+=0.2")
            .to(laserLight, { intensity: 1500, duration: 0.1 }, "start+=0.2")
            .to([ricochetObj.mat, ricochetObj.coreMat], { opacity: 1, duration: 0.1 }, "start+=0.3")
            .call(() => ui.showPanel(header, body), null, "start+=0.4")
            .to([laserObj.mat, laserObj.coreMat], { opacity: 0, duration: 0.4 }, "start+=0.8")
            .to([ricochetObj.mat, ricochetObj.coreMat], { opacity: 0, duration: 0.4 }, "start+=0.8")
            .to(laserLight, { intensity: 0, duration: 0.5 }, "start+=0.8")
            .call(() => {
                scene.remove(laserObj.mesh);
                scene.remove(ricochetObj.mesh);
                laserObj.mesh.geometry.dispose();
                ricochetObj.mesh.geometry.dispose();
            });

        return tl;
    }

    // 2. ÇIKIŞ EFEKTİ
    static leaveSplitView(diamond, ui, controls, camera) {
        const tl = gsap.timeline();

      tl.call(() => ui.hidePanel()) 
          .call(() => {
              if (controls) controls.enabled = true; 
             
          })

            // Elması merkeze çek, büyüt
            .to(diamond.diamondGroup.position, { x: 0, y: 0, z: 0, duration: 1.0, ease: "power3.inOut" })
            .to(diamond.diamondGroup.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 1.0, ease: "power3.inOut" }, "<")

            // DÖNÜŞ HIZI EFEKTİ
            .call(() => diamond.resetRotationBehavior(), null, "<");

        return tl;
    }

    // 3. HOVER EFEKTİ
static hoverEffect(object, isHovering) {
        if (!object || !object.material) return;

        // Eğer materyalin "emissive" özelliği yoksa (örn: SpriteMaterial), işlemi iptal et
        if (object.material.emissive === undefined) return;

        if (isHovering) {
            // Renk parlaması
            gsap.to(object.material, { 
                emissiveIntensity: 0.8, 
                duration: 0.3,
                overwrite: true // Önceki animasyonları iptal et
            });
            object.material.emissive = new THREE.Color(0x00ffff);
        } else {
            // Normale dön
            gsap.to(object.material, { 
                emissiveIntensity: 0, 
                duration: 0.5,
                overwrite: true
            });
        }
    }
}