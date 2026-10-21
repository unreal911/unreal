import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import './portfolio-slider';

const progress = document.querySelector<HTMLElement>('[data-scroll-progress]');
if (progress) {
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => { progress.style.transform = `scaleX(${self.progress})`; } });
}

document.querySelectorAll<HTMLElement>('.pp-stage').forEach((stage) => {
  ScrollTrigger.create({
    trigger: stage, start: 'top 60%', end: 'bottom 40%',
    onToggle: ({ isActive }) => {
      stage.classList.toggle('is-active', isActive);
      const step = document.querySelector<HTMLAnchorElement>(`.pp-step-nav a[href="#${stage.id}"]`);
      if (isActive) step?.setAttribute('aria-current', 'step');
      else step?.removeAttribute('aria-current');
    },
  });
});
gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
  document.querySelectorAll<HTMLElement>('.pp-stage').forEach((stage) => {
    gsap.from(stage, { y: 28, opacity: 0, duration: .7, ease: 'power3.out', clearProps: 'all', scrollTrigger: { trigger: stage, start: 'top 92%', once: true } });
  });
});

const navLinks = document.querySelectorAll<HTMLAnchorElement>('.site-nav a');
if (document.querySelector('.portfolio-home') && 'IntersectionObserver' in window) {
  const visibleSections = new Map<string, number>();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.boundingClientRect.top);
      else visibleSections.delete(entry.target.id);
    });
    const activeSection = Array.from(visibleSections).sort((a, b) => a[1] - b[1])[0]?.[0];
    navLinks.forEach((link) => {
      if (link.hash === `#${activeSection}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -45% 0px', threshold: 0 });
  document.querySelectorAll<HTMLElement>('#proyectos, #proceso, #servicios, #sobre-mi').forEach((section) => observer.observe(section));
}
