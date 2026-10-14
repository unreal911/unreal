import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let animationContext: gsap.Context | undefined;
const splitHeadings = new WeakSet<HTMLElement>();

function splitLetters(heading: HTMLElement) {
  if (splitHeadings.has(heading)) return;
  splitHeadings.add(heading);

  const accessibleText = heading.innerText?.replace(/\s+/g, ' ').trim();
  if (accessibleText) heading.setAttribute('aria-label', accessibleText);

  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    const parts = (node.textContent ?? '').split(/(\s+)/);

    parts.forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        return;
      }

      const word = document.createElement('span');
      word.className = 'animated-word';
      word.setAttribute('aria-hidden', 'true');

      for (const letter of Array.from(part)) {
        const mask = document.createElement('span');
        mask.className = 'letter-mask';
        const glyph = document.createElement('span');
        glyph.className = 'animated-letter';
        glyph.textContent = letter;
        mask.appendChild(glyph);
        word.appendChild(mask);
      }
      fragment.appendChild(word);
    });

    node.replaceWith(fragment);
  });
}

function startAnimations() {
  animationContext?.revert();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  animationContext = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('[data-letters]').forEach((heading) => {
      splitLetters(heading);
      const letters = heading.querySelectorAll<HTMLElement>('.animated-letter');
      if (!letters.length) return;
      gsap.from(letters, {
        yPercent: 115,
        autoAlpha: 0,
        rotateX: -35,
        transformOrigin: 'center bottom',
        duration: heading.tagName === 'H1' ? 0.9 : 0.75,
        stagger: { amount: heading.tagName === 'H1' ? 0.48 : 0.32 },
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
      });
    });

    const heroDetails = document.querySelectorAll('[data-hero-fade]');
    if (heroDetails.length) {
      gsap.from(heroDetails, {
        autoAlpha: 0, y: 20, delay: 0.28, duration: 0.7, stagger: 0.1,
        ease: 'power2.out', clearProps: 'all',
      });
    }

    const heroVisual = document.querySelector('[data-hero-visual]');
    if (heroVisual) {
      gsap.from(heroVisual, {
        autoAlpha: 0, x: 45, rotate: 2, duration: 1.05, delay: 0.2,
        ease: 'power3.out', clearProps: 'all',
      });
    }

    gsap.utils.toArray<HTMLElement>('[data-project-card]').forEach((card) => {
      const visual = card.querySelector<HTMLElement>('[data-project-visual]');
      const meta = card.querySelector<HTMLElement>('[data-project-meta]');
      const demo = card.querySelector<HTMLElement>('.project-demo-link');
      if (!visual || !meta) return;

      const timeline = gsap.timeline({
        scrollTrigger: { trigger: card, start: 'top 83%', once: true },
      });
      timeline.from(visual, {
        autoAlpha: 0, y: 54, clipPath: 'inset(16% 0 0 0)',
        duration: 1.05, ease: 'power3.out', clearProps: 'all',
      });
      timeline.from(meta, {
        autoAlpha: 0, y: 24, duration: 0.64,
        ease: 'power3.out', clearProps: 'all',
      }, '-=0.55');
      if (demo) timeline.from(demo, {
        autoAlpha: 0, y: 12, duration: 0.45, clearProps: 'all',
      }, '-=0.4');
    });

    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
      gsap.from(element, {
        autoAlpha: 0, y: 38, duration: 0.8, ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: { trigger: element, start: 'top 88%', once: true },
      });
    });

    ScrollTrigger.refresh();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAnimations, { once: true });
} else {
  startAnimations();
}

document.addEventListener('astro:before-swap', () => animationContext?.revert());
document.addEventListener('astro:after-swap', startAnimations);
