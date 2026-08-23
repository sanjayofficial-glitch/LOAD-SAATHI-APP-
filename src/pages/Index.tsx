import { useEffect, useState, useRef } from 'react';
import SeoMeta from '@/components/SeoMeta';
import HeroSection from '@/features/home/sections/HeroSection';
import SectionNav from '@/features/home/sections/SectionNav';
import ProofBar from '@/features/home/sections/ProofBar';
import BentoGrid from '@/features/home/sections/BentoGrid';
import WhatIsLoadSaathi from '@/features/home/sections/WhatIsLoadSaathi';
import HowItWorksSection from '@/features/home/sections/HowItWorksSection';
import WhyLoadSaathi from '@/features/home/sections/WhyLoadSaathi';
import PlatformTabs from '@/features/home/sections/PlatformTabs';
import TrustedAcrossEastIndia from '@/features/home/sections/TrustedAcrossEastIndia';
import VisionSection from '@/features/home/sections/VisionSection';
import AppPreview from '@/features/home/sections/AppPreview';
import SafetyTrust from '@/features/home/sections/SafetyTrust';
import FaqSection from '@/features/home/sections/FaqSection';
import CtaSection from '@/features/home/sections/CtaSection';
import IndexSkeleton from '@/components/IndexSkeleton';
import { useTheme } from '@/theme/theme';

const Index = () => {
  const [ready, setReady] = useState(false);

  const globeRef = useRef<HTMLDivElement>(null);
  const globeInited = useRef(false);
  const { isDark } = useTheme();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const globeMatRef = useRef<any>(null);
  const innerMatRef = useRef<any>(null);
  const pointsMatRef = useRef<any>(null);
  const arcMatsRef = useRef<any[]>([]);
  const ambientRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const globeObserverRef = useRef<IntersectionObserver | null>(null);
  const cleanupFnsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-section').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const container = globeRef.current;
    if (!container || globeInited.current) return;
    globeInited.current = true;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    let scene: any, camera: any, renderer: any, group: any;
    let animationId: number;
    let mouseX = 0, mouseY = 0;
    const geometries: any[] = [];
    const meshes: any[] = [];

    const init = async () => {
      try {
        const THREE = await new Promise<any>((resolve) => {
          if ((window as any).THREE) {
            resolve((window as any).THREE);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
          script.integrity = 'sha256-knS7zsjZYWhibHMrXTHHdaqM+36qBZm+wMF1kIosHOI=';
          script.crossOrigin = 'anonymous';
          script.onload = () => resolve((window as any).THREE);
          script.onerror = () => {
            console.warn('[LoadSaathi] Three.js CDN unavailable — globe disabled');
            resolve(null);
          };
          document.head.appendChild(script);
        });

        if (!THREE) return;
        if (!container.isConnected) return;

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 500;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.appendChild(renderer.domElement);

        group = new THREE.Group();
        scene.add(group);

        const isLightMode = !isDark;

        const globeGeo = new THREE.SphereGeometry(2, 64, 64);
        const globeMat = new THREE.MeshPhongMaterial({
          color: isLightMode ? 0x4B8FD4 : 0x2E6FB5,
          wireframe: true,
          transparent: true,
          opacity: isLightMode ? 0.25 : 0.15,
        });
        globeMatRef.current = globeMat;
        const globeMesh = new THREE.Mesh(globeGeo, globeMat);
        geometries.push(globeGeo);
        meshes.push(globeMesh);
        group.add(globeMesh);

        const innerGeo = new THREE.SphereGeometry(1.95, 64, 64);
        const innerMat = new THREE.MeshPhongMaterial({
          color: isLightMode ? 0xCCE4F7 : 0x0D2340,
          transparent: true,
          opacity: isLightMode ? 0.25 : 0.4,
        });
        innerMatRef.current = innerMat;
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        geometries.push(innerGeo);
        meshes.push(innerMesh);
        group.add(innerMesh);

        const pointsCount = 500;
        const positions = new Float32Array(pointsCount * 3);
        for (let i = 0; i < pointsCount; i++) {
          const phi = Math.acos(-1 + (2 * i) / pointsCount);
          const theta = Math.sqrt(pointsCount * Math.PI) * phi;
          positions[i * 3] = 2 * Math.cos(theta) * Math.sin(phi);
          positions[i * 3 + 1] = 2 * Math.sin(theta) * Math.sin(phi);
          positions[i * 3 + 2] = 2 * Math.cos(phi);
        }
        const pointsGeo = new THREE.BufferGeometry();
        pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pointsMat = new THREE.PointsMaterial({
          color: isLightMode ? 0xE8620C : 0xFF6B00,
          size: 0.03,
          transparent: true,
          opacity: isLightMode ? 0.5 : 0.8
        });
        pointsMatRef.current = pointsMat;
        const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
        geometries.push(pointsGeo);
        meshes.push(pointsMesh);
        group.add(pointsMesh);

        for (let i = 0; i < 15; i++) {
          const si = Math.floor(Math.random() * pointsCount) * 3;
          const ei = Math.floor(Math.random() * pointsCount) * 3;
          const start = new THREE.Vector3(positions[si], positions[si + 1], positions[si + 2]);
          const end = new THREE.Vector3(positions[ei], positions[ei + 1], positions[ei + 2]);
          const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5).setLength(2.5);
          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          const arcGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
          const arcMat = new THREE.LineBasicMaterial({
            color: isLightMode ? 0xE8620C : 0xFF6B00,
            transparent: true,
            opacity: isLightMode ? 0.2 : 0.3
          });
          arcMatsRef.current.push(arcMat);
          geometries.push(arcGeo);
          group.add(new THREE.Line(arcGeo, arcMat));
        }

        const light1 = new THREE.PointLight(0xffffff, 1);
        light1.position.set(5, 5, 5);
        scene.add(light1);
        const ambient = new THREE.AmbientLight(isLightMode ? 0x888888 : 0x404040);
        ambientRef.current = ambient;
        scene.add(ambient);

        camera.position.z = 6;

        const handleMouseMove = (e: MouseEvent) => {
          mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
          mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
        };
        window.addEventListener('mousemove', handleMouseMove);
        cleanupFnsRef.current.push(() => window.removeEventListener('mousemove', handleMouseMove));

        let isGlobeVisible = true;
        globeObserverRef.current = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry) {
              isGlobeVisible = entry.isIntersecting;
            }
          },
          { threshold: 0.1 }
        );
        if (container) globeObserverRef.current.observe(container);

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          if (isGlobeVisible) {
            group.rotation.y += 0.003;
            group.rotation.y += mouseX * 0.008;
            group.rotation.x += mouseY * 0.005;
            renderer.render(scene, camera);
          }
        };
        animate();

        const resize = () => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (w > 0 && h > 0) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
          }
        };
        window.addEventListener('resize', resize);
        cleanupFnsRef.current.push(() => window.removeEventListener('resize', resize));
      } catch (e) {
        console.error('Globe init failed:', e);
      }
    };

    const scheduleGlobeInit = () => {
      if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(() => { init(); }, { timeout: 2500 });
      }
      return setTimeout(() => { init(); }, 500);
    };
    const globeIdleHandle = scheduleGlobeInit();

    return () => {
      if (typeof globeIdleHandle === 'number') {
        if ('cancelIdleCallback' in window) {
          window.cancelIdleCallback(globeIdleHandle);
        } else {
          clearTimeout(globeIdleHandle);
        }
      }
      if (animationId) cancelAnimationFrame(animationId);
      if (globeObserverRef.current) globeObserverRef.current.disconnect();
      cleanupFnsRef.current.forEach(fn => fn());
      cleanupFnsRef.current = [];
      geometries.forEach((g) => { try { g.dispose(); } catch {} });
      if (scene) {
        scene.traverse((child: any) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!globeMatRef.current || !innerMatRef.current || !pointsMatRef.current || !ambientRef.current) return;
    const lightMode = !isDark;
    globeMatRef.current.color.setHex(lightMode ? 0x4B8FD4 : 0x2E6FB5);
    globeMatRef.current.opacity = lightMode ? 0.25 : 0.15;
    innerMatRef.current.color.setHex(lightMode ? 0xCCE4F7 : 0x0D2340);
    innerMatRef.current.opacity = lightMode ? 0.25 : 0.4;
    pointsMatRef.current.color.setHex(lightMode ? 0xE8620C : 0xFF6B00);
    pointsMatRef.current.opacity = lightMode ? 0.5 : 0.8;
    arcMatsRef.current.forEach((mat) => {
      mat.color.setHex(lightMode ? 0xE8620C : 0xFF6B00);
      mat.opacity = lightMode ? 0.2 : 0.3;
    });
    ambientRef.current.color.setHex(lightMode ? 0x888888 : 0x404040);
  }, [isDark]);

  if (!ready) {
    return <IndexSkeleton />;
  }

  return (
    <>
      <SeoMeta
        title="Shared Freight Marketplace | PTL/LTL East India"
        description="LoadSaathi connects shippers and truckers for PTL and LTL shared freight across East India. Save up to 40% on freight costs on the Rourkela–Ranchi–Burdwan corridor. Book part loads online."
        canonical="/"
        keywords="PTL freight Rourkela, LTL transport East India, shared truck Ranchi Burdwan, part load Jharkhand Odisha, freight marketplace India, truck booking Rourkela"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is LoadSaathi and how does it work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "LoadSaathi is an AI-powered shared freight marketplace connecting shippers and truckers for PTL and LTL loads across East India. Shippers post their loads, AI matches them with the best available trucks based on route, capacity, price, and reliability — and both sides track the shipment in real time with GPS."
              }
            },
            {
              "@type": "Question",
              "name": "How much does it cost to use LoadSaathi?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "LoadSaathi is free to join for both shippers and truckers. We charge a small transaction fee of 2–5% per completed shipment, which varies by role, volume, and credit score. There are no subscriptions, no hidden fees, and no minimum commitments."
              }
            },
            {
              "@type": "Question",
              "name": "Which cities and routes does LoadSaathi cover?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "LoadSaathi currently operates across East India with the Rourkela–Ranchi–Burdwan corridor as our primary route. We also cover Bhubaneswar, Kolkata, Jamshedpur, and 50+ cities across Odisha, Jharkhand, and West Bengal with 25+ active freight corridors."
              }
            },
            {
              "@type": "Question",
              "name": "How does the credit score system work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Every user on LoadSaathi has a digital freight credit score ranging from 300 to 900. The score is based on completion rate, on-time performance, bidirectional reviews, and tenure on the platform. Higher scores unlock better loads and preferential matching."
              }
            },
            {
              "@type": "Question",
              "name": "Is my payment secure on LoadSaathi?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. LoadSaathi uses an escrow-backed payment system. Funds are held securely and released in milestones as delivery progresses. Digital settlements mean faster, transparent payouts compared to traditional 30–60 day credit cycles."
              }
            },
            {
              "@type": "Question",
              "name": "Who can use LoadSaathi — shippers or truckers?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Both. Shippers (MSMEs, manufacturers, traders) can post loads and find truck space. Truckers (independent operators, fleet owners) can browse available loads, fill empty capacity, and earn on return trips."
              }
            },
            {
              "@type": "Question",
              "name": "Is LoadSaathi a loan company?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. LoadSaathi (loadsaathi.in) is a truck freight and logistics marketplace that connects shippers with truckers for PTL, FTL, and return loads. It is not a loan, lending, or financial services company and has no connection to any 'Loan Saathi' finance website."
              }
            }
          ]
        }}
      />
      <HeroSection />
      <SectionNav />
      <div id="problems"><ProofBar /><BentoGrid /></div>
      <div id="what-is"><WhatIsLoadSaathi /></div>
      <div id="how-it-works"><HowItWorksSection /><WhyLoadSaathi /></div>
      <div id="platform"><PlatformTabs /></div>
      <div id="locations"><TrustedAcrossEastIndia /></div>
      <VisionSection globeRef={globeRef} />
      <AppPreview />
      <SafetyTrust />
      <div id="faq"><FaqSection /></div>
      <CtaSection />
    </>
  );
};

export default Index;
