
import * as THREE from 'three';
import gsap from 'https://cdn.skypack.dev/gsap';

export class Effects {

    static createRealLaser(startPoint, endPoint, scene) {
        const distance = startPoint.distanceTo(endPoint);
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
        const center = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);

        const geometry = new THREE.CylinderGeometry(0.01, 0.01, distance, 8, 1, true);

        geometry.rotateX(Math.PI / 2);

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffaa,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const laserMesh = new THREE.Mesh(geometry, material);
        laserMesh.position.copy(center);
        laserMesh.lookAt(endPoint);

        const coreGeo = new THREE.CylinderGeometry(0.015, 0.015, distance, 8, 1, true);
        coreGeo.rotateX(Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        laserMesh.add(coreMesh);

        scene.add(laserMesh);

        return { mesh: laserMesh, core: coreMesh, mat: material, coreMat: coreMat };
    }

    static enterSplitView(diamond, laserLight, hitPoint, ui, header, body, sunPosition, scene, camera, controls) {

        if (controls) {
            controls.enabled = false;

            gsap.to(camera.position, {
                x: 0,
                y: 0,
                z: 2.5,
                duration: 1.2,
                ease: "power3.inOut"
            });

            gsap.to(controls.target, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1.2,
                ease: "power3.inOut"
            });
        }

        const tl = gsap.timeline();

        const panelTarget = new THREE.Vector3(2.5, -0.5, 1);

        const laserObj = this.createRealLaser(sunPosition, hitPoint, scene);
        const ricochetObj = this.createRealLaser(hitPoint, panelTarget, scene);

        laserLight.target.position.copy(hitPoint);
        laserLight.target.updateMatrixWorld();

        tl.addLabel("start")

            .to(diamond.diamondGroup.position, {
                x: -3.6,
                y: 0.0,
                z: -0.5,
                duration: 1.2,
                ease: "power3.inOut"
            }, "start")
            .to(diamond.diamondGroup.scale, {
                x: 0.25,
                y: 0.35,
                z: 0.25,
                duration: 1.2,
                ease: "power3.inOut"
            }, "start")
            .to(diamond, { rotationSpeed: 0.01, duration: 1.2 }, "start")
            .to(diamond.energyRing.material, {
                opacity: 0,
                duration: 0.5,
                ease: "power2.inOut"
            }, "start")

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
            })
            .call(() => diamond.toggleLabels(false), null, "start")

        return tl;
    }

    static leaveSplitView(diamond, ui, controls, camera) {
        const tl = gsap.timeline();

        tl.call(() => ui.hidePanel())
            .call(() => {
                if (controls) controls.enabled = true;

            })

            .to(diamond.diamondGroup.position, { x: 0, y: 0, z: 0, duration: 1.0, ease: "power3.inOut" })
            .to(diamond.diamondGroup.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 1.0, ease: "power3.inOut" }, "<")
            .to(diamond.energyRing.material, {
                opacity: 0.3,
                duration: 0.5,
                ease: "power1.inOut"
            }, "-=0.5")

            .call(() => diamond.resetRotationBehavior(), null, "<")
            .call(() => diamond.toggleLabels(true), null, "start");

        return tl;
    }

    static hoverEffect(object, isHovering) {
        if (!object || !object.material) return;

        if (object.material.emissive === undefined) return;

        if (isHovering) {
            gsap.to(object.material, {
                emissiveIntensity: 0.8,
                duration: 0.3,
                overwrite: true
            });
            object.material.emissive = new THREE.Color(0x00ffff);
        } else {
            gsap.to(object.material, {
                emissiveIntensity: 0,
                duration: 0.5,
                overwrite: true
            });
        }
    }
}