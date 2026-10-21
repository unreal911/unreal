import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Development hot reloads and Astro navigation must not leave a second carousel alive.
window.dispatchEvent(new Event('portfolio:slider:dispose'));
const sliderRoot = document.querySelector<HTMLElement>('[data-portfolio-slider]');

if (sliderRoot) {
  const slider = sliderRoot;
  const slides = Array.from(slider.querySelectorAll<HTMLElement>('[data-slide]'));
  const art = Array.from(slider.querySelectorAll<HTMLElement>('[data-art]'));
  const artCards = art.map((stage) => Array.from(stage.children) as HTMLElement[]);
  const glow = slider.querySelectorAll('.pf-scene-wipe span');
  const tabs = Array.from(slider.querySelectorAll<HTMLButtonElement>('[data-slide-to]'));
  const bars = tabs.map((tab) => tab.querySelector<HTMLElement>('.pf-tab-track i'));
  const play = slider.querySelector<HTMLButtonElement>('[data-slide-play]')!;
  const counter = slider.querySelector<HTMLElement>('[data-slide-number]')!;
  const status = slider.querySelector<HTMLElement>('[data-slide-status]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileViewport = window.matchMedia('(max-width: 780px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const events = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(target: Element | null, type: K, callback: (event: HTMLElementEventMap[K]) => void) => {
    target?.addEventListener(type, callback as EventListener, { signal: events.signal });
  };
  let disposed = false;
  let active = 0;
  let requested = 0;
  // Let touch visitors read the full composition before choosing another scene.
  let userPaused = mobileViewport.matches;
  let visible = true;
  let reading = false;
  let transition: gsap.core.Timeline | undefined;
  let timer: gsap.core.Tween | undefined;
  let touchStart: { x: number; y: number } | undefined;
  const ambient = gsap.timeline({ paused: true })
    .to(slider.querySelector('.pf-orbit-core'), { y: -18, scale: 1.035, duration: 4.5, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0)
    .to(slider.querySelector('.pf-orbit-line'), { rotation: 35, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0);

  const canRun = () => !userPaused && visible && !document.hidden && !motion.matches && !reading;
  const syncPlayback = () => {
    if (canRun()) timer?.resume();
    else timer?.pause();
    if (visible && !document.hidden && !motion.matches) ambient.resume();
    else ambient.pause();
    play.setAttribute('aria-pressed', String(userPaused));
    const label = userPaused ? 'Activar cambio automático' : 'Pausar cambio automático';
    play.setAttribute('aria-label', label);
    play.title = label;
    play.querySelector('[data-play-icon]')!.textContent = userPaused ? '▷' : 'Ⅱ';
    play.querySelector('.pf-play-label')!.textContent = userPaused ? 'Reproducir' : 'Pausar';
    slider.dataset.playing = String(canRun());
  };

  const clearScene = (index: number) => {
    gsap.set(slides[index], { clearProps: 'opacity,transform' });
    gsap.set(slides[index].querySelectorAll('.pf-title-letter, .pf-type-letter, .pf-type-caret, .pf-hero-eyebrow, .pf-hero-description'), { clearProps: 'all' });
    gsap.set(art[index], { clearProps: 'all' });
    gsap.set(artCards[index], { clearProps: 'opacity,--pf-card-y' });
    slides[index].querySelector('.pf-type-caret')?.classList.remove('is-blinking');
  };

  const positionCaret = (index: number) => {
    const letters = slides[index].querySelectorAll<HTMLElement>('.pf-type-letter');
    const last = letters[letters.length - 1];
    if (last) gsap.set(slides[index].querySelector('.pf-type-caret'), { x: last.offsetLeft + last.offsetWidth + 5 });
  };

  const render = (index: number) => {
    slides.forEach((slide, i) => {
      clearScene(i);
      slide.hidden = i !== index;
      art[i].hidden = i !== index;
    });
    slider.dataset.scene = slides[index].dataset.themeName;
    counter.textContent = String(index + 1).padStart(2, '0');
    tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === index)));
    positionCaret(index);
  };

  const startTimer = () => {
    if (disposed) return;
    positionCaret(active);
    timer?.kill();
    gsap.set(bars, { scaleX: 0 });
    timer = gsap.to(bars[active], {
      scaleX: 1, duration: 6.5, ease: 'none', paused: true,
      onComplete: () => showSlide(active + 1, false),
    });
    syncPlayback();
  };

  const prepare = (index: number) => {
    gsap.set(slides[index].querySelectorAll('.pf-title-letter, .pf-type-letter, .pf-type-caret, .pf-hero-eyebrow, .pf-hero-description'), { opacity: 0 });
    gsap.set(artCards[index], { '--pf-card-y': '26px', opacity: 0 });
  };

  const enterScene = (timeline: gsap.core.Timeline, index: number, at: number) => {
    const slide = slides[index];
    const letters = Array.from(slide.querySelectorAll<HTMLElement>('.pf-type-letter'));
    const caret = slide.querySelector<HTMLElement>('.pf-type-caret');
    timeline.fromTo(slide.querySelector('.pf-hero-eyebrow'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .5, immediateRender: false }, at);
    timeline.fromTo(slide.querySelectorAll('.pf-title-letter'),
      { yPercent: 115, rotation: 7, opacity: 0 },
      { yPercent: 0, rotation: 0, opacity: 1, duration: .8, stagger: .023, ease: 'power4.out', immediateRender: false }, at + .06);
    timeline.set(letters, { opacity: 0 }, at);
    timeline.set(caret, { x: 0, opacity: 0 }, at);
    timeline.set(caret, { opacity: 1 }, at + .55);
    // Reveal complete glyphs, with the cursor following actual proportional widths.
    letters.forEach((letter, i) => {
      const time = at + .6 + i * .055;
      timeline.set(letter, { opacity: 1 }, time);
      timeline.set(caret, { x: () => letter.offsetLeft + letter.offsetWidth + 5 }, time);
    });
    timeline.call(() => caret?.classList.add('is-blinking'), [], at + .65 + letters.length * .055);
    timeline.fromTo(slide.querySelector('.pf-hero-description'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .6, immediateRender: false }, at + .55);
    // Stagger the cards without touching the CSS transform that sets their tilt.
    timeline.to(artCards[index], {
      '--pf-card-y': '0px', opacity: 1, duration: .82,
      stagger: (i) => i === 0 ? 0 : i === 1 ? .18 : .28,
      ease: 'power3.out',
    }, at + .05);
  };

  function showSlide(index: number, manual = true) {
    const next = (index + slides.length) % slides.length;
    if (manual) { userPaused = true; syncPlayback(); }
    if (next === requested) return;
    requested = next;
    timer?.kill();
    transition?.kill();
    // Continue from the visible pose when a visitor interrupts an entrance.
    const previous = active;
    if (manual && status) status.textContent = slides[next].getAttribute('aria-label') ?? '';
    if (motion.matches) {
      active = next;
      render(next);
      startTimer();
      return;
    }
    transition = gsap.timeline({ onComplete: startTimer });
    transition.to(slides[previous], { y: -8, opacity: 0, duration: .26, ease: 'power2.inOut' }, 0);
    transition.to(art[previous], { y: -10, opacity: 0, duration: .28, ease: 'power2.inOut' }, 0);
    // Let every glow band finish before changing scene; interrupted sweeps keep their pose.
    transition.to(glow, { scaleY: 1, duration: .32, stagger: .025, ease: 'power2.inOut' }, 0);
    transition.call(() => { active = next; render(next); prepare(next); }, [], .44);
    transition.set(glow, { transformOrigin: 'bottom' }, .44);
    transition.to(glow, { scaleY: 0, duration: .5, stagger: .02, ease: 'power3.out' }, .46);
    transition.set(glow, { transformOrigin: 'top' }, 1.05);
    enterScene(transition, next, .44);
  }

  tabs.forEach((tab, i) => on(tab, 'click', () => showSlide(i)));
  on(slider.querySelector('[data-slide-prev]'), 'click', () => showSlide(requested - 1));
  on(slider.querySelector('[data-slide-next]'), 'click', () => showSlide(requested + 1));
  on(play, 'click', () => { userPaused = !userPaused; syncPlayback(); });
  on(slider, 'focusin', (event) => {
    if (event.target instanceof Element && !event.target.closest('[data-slide-play]')) {
      userPaused = true;
      syncPlayback();
    }
  });
  on(slider, 'keydown', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('.pf-slider-controls')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showSlide(requested + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  // Pause while the visitor reads the copy; controls remain usable for playback.
  on(slider.querySelector('.pf-slides'), 'pointerenter', () => {
    if (finePointer.matches) { reading = true; syncPlayback(); }
  });
  on(slider.querySelector('.pf-slides'), 'pointerleave', () => { reading = false; syncPlayback(); });
  on(slider, 'pointerdown', (event) => {
    if (event.pointerType === 'touch' && !(event.target as Element).closest('a, button')) touchStart = { x: event.clientX, y: event.clientY };
  });
  on(slider, 'pointerup', (event) => {
    if (!touchStart) return;
    const x = event.clientX - touchStart.x;
    const y = event.clientY - touchStart.y;
    if (Math.abs(x) > 55 && Math.abs(y) < 45) showSlide(requested + (x < 0 ? 1 : -1));
    touchStart = undefined;
  });
  on(slider, 'pointercancel', () => { touchStart = undefined; });
  const observer = new IntersectionObserver(([entry]) => { visible = entry.intersectionRatio >= .15; syncPlayback(); }, { threshold: .15 });
  observer.observe(slider);
  document.addEventListener('visibilitychange', syncPlayback, { signal: events.signal });
  motion.addEventListener('change', () => {
    transition?.kill();
    active = requested;
    render(active);
    gsap.set(glow, { scaleY: 0, transformOrigin: 'top' });
    startTimer();
  }, { signal: events.signal });
  mobileViewport.addEventListener('change', (event) => {
    if (event.matches) { userPaused = true; syncPlayback(); }
  }, { signal: events.signal });
  const resize = new ResizeObserver(() => {
    if (!transition?.isActive()) positionCaret(active);
  });
  resize.observe(slider);
  document.fonts.ready.then(() => {
    if (!disposed && !transition?.isActive()) positionCaret(active);
  });

  const animateFirstScene = !motion.matches && document.documentElement.dataset.pfHero === 'pending';
  gsap.set(glow, { scaleY: 0, transformOrigin: 'top' });
  render(0);
  if (animateFirstScene) prepare(0);
  slider.dataset.sliderReady = 'true';
  delete document.documentElement.dataset.pfHero;
  if (!animateFirstScene) startTimer();
  else {
    transition = gsap.timeline({ onComplete: startTimer });
    enterScene(transition, 0, 0);
  }
  // Only the background moves with scroll; slide transforms belong to the carousel.
  const scrollMotion = gsap.matchMedia();
  scrollMotion.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.to(slider.querySelector('.pf-hero-ambient'), { yPercent: 18, ease: 'none', scrollTrigger: { trigger: slider, start: 'top top', end: 'bottom top', scrub: .7 } });
  });
  const dispose = () => {
    disposed = true;
    transition?.kill();
    timer?.kill();
    ambient.kill();
    observer.disconnect();
    resize.disconnect();
    events.abort();
    scrollMotion.revert();
    window.removeEventListener('portfolio:slider:dispose', dispose);
  };
  window.addEventListener('portfolio:slider:dispose', dispose, { once: true });
  document.addEventListener('astro:before-swap', dispose, { once: true, signal: events.signal });
}
