"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ArcReactor() {
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x00ffff, 1.2);
    const point = new THREE.PointLight(0x00ffff, 1.5);
    point.position.set(10, 10, 10);
    scene.add(ambient, point);

    // Core: triangular arc reactor inside a glowing disc
    const coreDiscGeometry = new THREE.CircleGeometry(0.65, 64);
    const coreDiscMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a1b3f,
      transparent: true,
      opacity: 0.9,
    });
    const coreDisc = new THREE.Mesh(coreDiscGeometry, coreDiscMaterial);
    coreDisc.rotation.x = Math.PI / 2;
    scene.add(coreDisc);

    const coreGlowGeometry = new THREE.CircleGeometry(0.7, 64);
    const coreGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.6,
    });
    const coreGlow = new THREE.Mesh(coreGlowGeometry, coreGlowMaterial);
    coreGlow.rotation.x = Math.PI / 2;
    scene.add(coreGlow);

    const triangleShape = new THREE.Shape();
    const triSize = 0.6;
    triangleShape.moveTo(0, triSize);
    triangleShape.lineTo(-triSize * 0.9, -triSize * 0.7);
    triangleShape.lineTo(triSize * 0.9, -triSize * 0.7);
    triangleShape.closePath();
    const triangleGeometry = new THREE.ShapeGeometry(triangleShape);
    const triangleMaterial = new THREE.MeshBasicMaterial({
      color: 0x59c8ff,
      transparent: true,
      opacity: 0.95,
    });
    const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
    triangle.rotation.x = Math.PI / 2;
    scene.add(triangle);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.2,
      metalness: 0.6,
      roughness: 0.3,
    });

    const createRing = (radius, tube) => {
      const geo = new THREE.TorusGeometry(radius, tube, 16, 100);
      const mesh = new THREE.Mesh(geo, ringMaterial.clone());
      mesh.rotation.x = Math.PI / 2;
      scene.add(mesh);
      return mesh;
    };

    const ring1 = createRing(1, 0.04);
    const ring2 = createRing(1.5, 0.04);
    const ring3 = createRing(2.1, 0.06);

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xff003c,
      emissive: 0xff003c,
      emissiveIntensity: 2,
      metalness: 0.7,
      roughness: 0.25,
    });
    const accentGeo = new THREE.TorusGeometry(1.3, 0.025, 24, 120);
    const accentRing = new THREE.Mesh(accentGeo, accentMaterial);
    accentRing.rotation.x = Math.PI / 2;
    scene.add(accentRing);

    // HUD radial ticks
    const ticksGroup = new THREE.Group();
    const tickMaterial = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.7,
    });
    const innerR = 1.55;
    const outerR = 1.8;
    for (let i = 0; i < 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const inner = new THREE.Vector3(
        Math.cos(angle) * innerR,
        0,
        Math.sin(angle) * innerR,
      );
      const outer = new THREE.Vector3(
        Math.cos(angle) * outerR,
        0,
        Math.sin(angle) * outerR,
      );
      const geo = new THREE.BufferGeometry().setFromPoints([inner, outer]);
      const line = new THREE.Line(geo, tickMaterial);
      line.rotation.x = Math.PI / 2;
      ticksGroup.add(line);
    }
    scene.add(ticksGroup);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 6;
      positions[i] = (Math.random() - 0.5) * r * 2;
      positions[i + 1] = (Math.random() - 0.5) * r * 2;
      positions[i + 2] = (Math.random() - 0.5) * 10;
    }
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    const starMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.02,
      transparent: true,
      opacity: 0.7,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    let start = performance.now();

    const animate = (time) => {
      const elapsed = (time - start) / 1000;

      const pulse = 1 + Math.sin(elapsed * 4) * 0.12;
      triangle.scale.set(pulse, pulse, 1);
      coreGlow.scale.set(pulse * 1.05, pulse * 1.05, 1);

      ring1.rotation.z += 0.012;
      ring2.rotation.z -= 0.009;
      ring3.rotation.z += 0.006;
      ticksGroup.rotation.z -= 0.004;

      stars.rotation.z += 0.0008;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      coreDiscGeometry.dispose();
      coreDiscMaterial.dispose();
      coreGlowGeometry.dispose();
      coreGlowMaterial.dispose();
      triangleGeometry.dispose();
      triangleMaterial.dispose();
      [ring1, ring2, ring3, accentRing].forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      ticksGroup.children.forEach((line) => {
        line.geometry.dispose();
      });
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}


