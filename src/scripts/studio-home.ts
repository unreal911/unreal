const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const running = new Set<Animation>();
function enter(element: Element, distance = 14, duration = 450) {
  if (reduceMotion.matches || !element.animate) return;
  const animation = element.animate([
    { opacity: .3, transform: `translateY(${distance}px)` },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration, easing: 'cubic-bezier(.2,.7,.2,1)' });
  running.add(animation);
  animation.finished.finally(() => running.delete(animation)).catch(() => {});
}
reduceMotion.addEventListener('change', () => {
  if (reduceMotion.matches) { running.forEach(animation => animation.cancel()); running.clear(); }
});

// The offer never rotates. Only the visitor can switch its illustrative project.
const showcase = document.querySelector<HTMLElement>('[data-showcase]');
if (showcase) {
  const buttons = [...showcase.querySelectorAll<HTMLButtonElement>('[data-preview-button]')];
  const previews = [...showcase.querySelectorAll<HTMLAnchorElement>('[data-preview]')];
  showcase.querySelector<HTMLElement>('[data-preview-controls]')?.removeAttribute('hidden');
  const count = showcase.querySelector<HTMLElement>('[data-preview-count]');
  function selectPreview(index: number) {
    if (buttons[index].getAttribute('aria-pressed') === 'true') return;
    previews.forEach((preview, i) => { preview.hidden = i !== index; });
    buttons.forEach((control, i) => control.setAttribute('aria-pressed', String(i === index)));
    if (count) count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(previews.length).padStart(2, '0')}`;
    enter(previews[index], 8, 260);
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => selectPreview(index));
    button.addEventListener('keydown', event => {
      const offset = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
      if (!offset) return;
      event.preventDefault();
      const next = (index + offset + buttons.length) % buttons.length;
      buttons[next].focus();
      selectPreview(next);
    });
  });
}

// Progressive enhancement: no element is hidden while waiting for scroll or JS.
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver((entries) => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    reveal.unobserve(entry.target);
    if (entry.boundingClientRect.top > 70) enter(entry.target);
  }), { threshold: .08 });
  document.querySelectorAll('[data-studio-reveal], .pf-service, .pp-stage, .pf-about-copy').forEach(element => reveal.observe(element));

  const stages = document.querySelectorAll('.pp-stage');
  const steps = document.querySelectorAll<HTMLAnchorElement>('.pp-step-nav a');
  const stageObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('is-active', entry.isIntersecting);
    steps.forEach(step => {
      if (step.hash !== `#${entry.target.id}`) return;
      if (entry.isIntersecting) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }), { rootMargin: '-20% 0px -35% 0px' });
  stages.forEach(stage => stageObserver.observe(stage));
}

// A passive, frame-throttled indicator does not alter native scrolling or anchors.
const progress = document.querySelector<HTMLElement>('[data-scroll-progress]');
const navSections = [...document.querySelectorAll<HTMLElement>('[data-nav-section]')].map(control => ({
  control,
  section: document.getElementById(control.dataset.navSection!),
}));
let queued = false;
const updateProgress = () => {
  queued = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  const readingLine = Math.max(96, innerHeight * .26);
  navSections.forEach(({ control, section }) => {
    const bounds = section?.getBoundingClientRect();
    const active = bounds && bounds.top <= readingLine && bounds.bottom > readingLine;
    if (active && !control.hasAttribute('aria-current')) control.setAttribute('aria-current', 'location');
    if (!active && control.hasAttribute('aria-current')) control.removeAttribute('aria-current');
  });
};
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(updateProgress); } }, { passive: true });
addEventListener('resize', updateProgress);
updateProgress();
