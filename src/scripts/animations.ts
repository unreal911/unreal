import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/portfolio-motion.css';

gsap.registerPlugin(ScrollTrigger);

let animationContext: gsap.Context | undefined;
const splitHeadings = new WeakSet<HTMLElement>();
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

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
  if (motionPreference.matches) return;

  animationContext = gsap.context(() => {
    const home = document.querySelector<HTMLElement>('.portfolio-home');
    const compact = window.matchMedia('(max-width: 780px)').matches;

    gsap.utils.toArray<HTMLElement>('[data-letters], .portfolio-home .pp-intro h2').forEach((heading) => {
      // The hero owns its slide transitions; the manifesto follows the scroll below.
      if (heading.closest('.portfolio-home .pf-hero, .portfolio-home .pf-manifesto')) return;
      splitLetters(heading);
      const letters = heading.querySelectorAll<HTMLElement>('.animated-letter');
      if (!letters.length) return;
      const isHome = Boolean(heading.closest('.portfolio-home'));
      gsap.from(letters, {
        yPercent: isHome ? 125 : 115,
        autoAlpha: 0,
        rotateX: isHome ? -60 : -35,
        rotation: isHome ? 5 : 0,
        transformOrigin: 'center bottom',
        duration: isHome ? 1.05 : heading.tagName === 'H1' ? 0.9 : 0.75,
        stagger: { amount: isHome ? 0.68 : heading.tagName === 'H1' ? 0.48 : 0.32 },
        ease: isHome ? 'power4.out' : 'power3.out',
        clearProps: 'all',
        scrollTrigger: { trigger: heading, start: isHome ? 'top 86%' : 'top 88%', once: true },
      });
    });

    if (home) {
      const manifesto = home.querySelector<HTMLElement>('.pf-manifesto h2');
      if (manifesto) {
        splitLetters(manifesto);
        const words = manifesto.querySelectorAll<HTMLElement>('.animated-word');
        gsap.fromTo(words, { opacity: 0.32, y: compact ? 7 : 14 }, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.4,
          ease: 'none',
          scrollTrigger: {
            trigger: manifesto,
            start: 'top 80%',
            end: 'bottom 43%',
            scrub: 0.65,
          },
        });
      }

      home.querySelectorAll<HTMLElement>('.pf-project').forEach((card, index) => {
        const visual = card.querySelector<HTMLElement>('[data-project-visual]');
        const art = card.querySelector<HTMLElement>('.project-artwork');
        const meta = card.querySelector<HTMLElement>('[data-project-meta]');
        if (!visual || !art || !meta) return;

        const artScale = compact ? 1.1 : 1.14;
        const parallaxDistance = compact ? 10 : 22;
        gsap.set(art, { transition: 'none', '--pf-art-scale': artScale });
        const reveal = gsap.timeline({
          delay: compact ? 0 : (index % 2) * 0.12,
          scrollTrigger: { trigger: card, start: 'top 91%', once: true },
        });
        reveal.fromTo(visual, {
          y: compact ? 46 : 78,
          clipPath: 'inset(12% 0% 88% 0% round 7px)',
        }, {
          y: 0,
          clipPath: 'inset(0% 0% 0% 0% round 7px)',
          duration: compact ? 1.05 : 1.3,
          ease: 'power4.inOut',
          clearProps: 'clipPath,transform',
        });
        reveal.fromTo(art, { '--pf-art-scale': artScale + 0.16 }, {
          '--pf-art-scale': artScale,
          duration: 1.65,
          ease: 'power3.out',
        }, 0.08);
        reveal.from(meta, {
          y: compact ? 25 : 38,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        }, 0.4);

        gsap.fromTo(art, { '--pf-art-y': `${parallaxDistance}px` }, {
          '--pf-art-y': `${-parallaxDistance}px`,
          ease: 'none',
          scrollTrigger: {
            trigger: visual,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.1,
          },
        });
      });
    }

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
      if (card.closest('.portfolio-home')) return;
      const visual = card.querySelector<HTMLElement>('[data-project-visual]');
      const meta = card.querySelector<HTMLElement>('[data-project-meta]');
      if (!visual || !meta) return;

      const timeline = gsap.timeline({
        scrollTrigger: { trigger: card, start: 'top 83%', once: true },
      });
      timeline.from(visual, {
        y: 24, duration: 0.7, ease: 'power3.out', clearProps: 'all',
      });
      timeline.from(meta, {
        y: 24, duration: 0.64,
        ease: 'power3.out', clearProps: 'all',
      }, '-=0.55');
    });

    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
      if (element.closest('.portfolio-home .pp-stage')) return;
      const isHome = Boolean(element.closest('.portfolio-home'));
      gsap.from(element, {
        autoAlpha: 0, y: isHome ? 52 : 38, duration: isHome ? 1 : 0.8, ease: 'power3.out',
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
motionPreference.addEventListener('change', startAnimations);
