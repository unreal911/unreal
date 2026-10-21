import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function initializeSendaCafe() {
  const root = document.body;
  if (root.dataset.sendaInitialized === 'true') return;
  root.dataset.sendaInitialized = 'true';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scrollLocks = new Set<string>();
  let previousOverflow = '';

  const setScrollLock = (key: string, locked: boolean) => {
    if (locked) {
      if (!scrollLocks.size) previousOverflow = root.style.overflow;
      scrollLocks.add(key);
      root.style.overflow = 'hidden';
    } else {
      if (!scrollLocks.has(key)) return;
      scrollLocks.delete(key);
      if (!scrollLocks.size) root.style.overflow = previousOverflow;
    }
  };

  const header = root.querySelector<HTMLElement>('[data-cafe-header]');
  const designerCta = root.querySelector<HTMLElement>('.designer-cta');
  const heroSection = root.querySelector<HTMLElement>('.cafe-hero');
  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 30);
    designerCta?.classList.toggle('is-visible', window.scrollY > (heroSection?.offsetHeight ?? 720) - 80);
  };
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const menuToggle = root.querySelector<HTMLButtonElement>('.menu-toggle');
  const navigation = root.querySelector<HTMLElement>('#cafe-navigation');
  if (menuToggle && navigation) {
    const setMenu = (open: boolean, restoreFocus = false) => {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
      navigation.classList.toggle('is-open', open);
      header?.classList.toggle('is-menu-open', open);
      setScrollLock('navigation', open);
      if (restoreFocus) menuToggle.focus();
    };

    menuToggle.setAttribute('aria-controls', navigation.id);
    setMenu(false);
    menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
    navigation.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenu(false, true);
      }
      if (event.key === 'Tab') {
        const links = [...navigation.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
          .filter((element) => element !== menuToggle && element.getClientRects().length > 0);
        const controls: HTMLElement[] = [menuToggle, ...links];
        const currentIndex = controls.indexOf(document.activeElement as HTMLElement);
        const nextIndex = currentIndex < 0 ? 0 : (currentIndex + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
        event.preventDefault();
        controls[nextIndex].focus();
      }
    });
    window.addEventListener('resize', () => {
      if (getComputedStyle(menuToggle).display === 'none') setMenu(false);
    }, { passive: true });
  }

  const heroImages = [...root.querySelectorAll<HTMLElement>('[data-hero-image]')];
  const heroCounter = root.querySelector<HTMLElement>('[data-hero-counter]');
  let heroIndex = Math.max(0, heroImages.findIndex((element) => element.classList.contains('is-active')));
  const showHero = (index: number) => {
    if (!heroImages.length) return;
    heroIndex = (index + heroImages.length) % heroImages.length;
    heroImages.forEach((element, imageIndex) => {
      element.classList.toggle('is-active', imageIndex === heroIndex);
      element.setAttribute('aria-hidden', String(imageIndex !== heroIndex));
    });
    if (heroCounter) {
      const total = document.createElement('i');
      total.textContent = `/ ${String(heroImages.length).padStart(2, '0')}`;
      heroCounter.replaceChildren(document.createTextNode(`${String(heroIndex + 1).padStart(2, '0')} `), total);
    }
  };
  root.querySelector<HTMLButtonElement>('[data-hero-prev]')?.addEventListener('click', () => showHero(heroIndex - 1));
  root.querySelector<HTMLButtonElement>('[data-hero-next]')?.addEventListener('click', () => showHero(heroIndex + 1));
  showHero(heroIndex);

  const filterButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-menu-filter]')];
  const menuItems = [...root.querySelectorAll<HTMLElement>('[data-menu-category]')];
  const filterMenu = (category: string) => {
    filterButtons.forEach((button) => {
      const active = button.dataset.menuFilter === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    menuItems.forEach((item) => {
      item.hidden = category !== 'todo' && item.dataset.menuCategory !== category;
    });
    ScrollTrigger.refresh(true);
  };
  filterButtons.forEach((button) => button.addEventListener('click', () => filterMenu(button.dataset.menuFilter ?? 'todo')));
  const initialFilter = filterButtons.find((button) => button.getAttribute('aria-pressed') === 'true')
    ?? filterButtons.find((button) => button.classList.contains('is-active'))
    ?? filterButtons[0];
  if (initialFilter) filterMenu(initialFilter.dataset.menuFilter ?? 'todo');

  root.querySelectorAll<HTMLAnchorElement>('[data-menu-shortcut]').forEach((link) => {
    link.addEventListener('click', () => filterMenu(link.dataset.menuShortcut ?? 'cafe'));
  });

  const galleryTriggers = [...root.querySelectorAll<HTMLButtonElement>('[data-gallery-src]')]
    .filter((button) => Boolean(button.dataset.gallerySrc));
  const galleryDialog = root.querySelector<HTMLDialogElement>('[data-gallery-dialog]');
  const galleryImage = galleryDialog?.querySelector<HTMLImageElement>('[data-gallery-image]');
  const galleryCaption = galleryDialog?.querySelector<HTMLElement>('[data-gallery-caption]');
  const galleryCount = galleryDialog?.querySelector<HTMLElement>('[data-gallery-count]');
  let galleryIndex = 0;
  let galleryOpener: HTMLButtonElement | undefined;

  if (galleryDialog && galleryImage) {
    if (!galleryImage.getAttribute('src')) galleryImage.removeAttribute('src');
    const showGalleryImage = (index: number) => {
      if (!galleryTriggers.length) return;
      galleryIndex = (index + galleryTriggers.length) % galleryTriggers.length;
      const trigger = galleryTriggers[galleryIndex];
      const caption = trigger.dataset.galleryCaption ?? '';
      galleryImage.src = trigger.dataset.gallerySrc!;
      galleryImage.alt = trigger.querySelector<HTMLImageElement>('img')?.alt || caption;
      if (galleryCaption) galleryCaption.textContent = caption;
      if (galleryCount) galleryCount.textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(galleryTriggers.length).padStart(2, '0')}`;
    };
    galleryTriggers.forEach((trigger, index) => trigger.addEventListener('click', () => {
      galleryOpener = trigger;
      showGalleryImage(index);
      if (!galleryDialog.open) galleryDialog.showModal();
      setScrollLock('gallery', true);
    }));
    galleryDialog.querySelector<HTMLButtonElement>('[data-gallery-prev]')?.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
    galleryDialog.querySelector<HTMLButtonElement>('[data-gallery-next]')?.addEventListener('click', () => showGalleryImage(galleryIndex + 1));
    galleryDialog.querySelector<HTMLButtonElement>('[data-gallery-close]')?.addEventListener('click', () => galleryDialog.close());
    galleryDialog.addEventListener('click', (event) => {
      if (event.target !== galleryDialog) return;
      const rect = galleryDialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) galleryDialog.close();
    });
    galleryDialog.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      showGalleryImage(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });
    galleryDialog.addEventListener('close', () => {
      setScrollLock('gallery', false);
      galleryOpener?.focus({ preventScroll: true });
    });
  }

  const reservationForm = root.querySelector<HTMLFormElement>('[data-reservation-form]');
  const reservationResult = root.querySelector<HTMLElement>('[data-reservation-result]');
  const reservationSummary = root.querySelector<HTMLElement>('[data-reservation-summary]');
  if (reservationForm && reservationResult && reservationSummary) {
    const nameInput = reservationForm.querySelector<HTMLInputElement>('[name="name"]');
    const dateInput = reservationForm.querySelector<HTMLInputElement>('[name="date"]');
    const timeInput = reservationForm.querySelector<HTMLInputElement | HTMLSelectElement>('[name="time"]');
    const guestsInput = reservationForm.querySelector<HTMLInputElement | HTMLSelectElement>('[name="guests"]');
    const limaClock = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    const getLimaNow = () => {
      const parts = limaClock.formatToParts(new Date());
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? '';
      return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
    };
    const validateReservation = () => {
      const now = getLimaNow();
      if (dateInput) {
        dateInput.min = now.date;
        dateInput.setCustomValidity(dateInput.value && dateInput.value < now.date ? 'Elige una fecha de hoy en adelante.' : '');
      }
      if (timeInput) {
        const selectedTime = timeInput.value.slice(0, 5);
        const pastTime = dateInput?.value === now.date && /^\d{2}:\d{2}$/.test(selectedTime) && selectedTime <= now.time;
        timeInput.setCustomValidity(pastTime ? 'Esta hora ya pasó en Lima. Elige una hora posterior o cambia la fecha.' : '');
      }
      if (nameInput) nameInput.setCustomValidity(nameInput.value && !nameInput.value.trim() ? 'Escribe tu nombre.' : '');
    };
    reservationForm.addEventListener('input', validateReservation);
    reservationForm.addEventListener('change', validateReservation);
    reservationForm.addEventListener('focusin', validateReservation);
    // Refresh the local day before native validation, including after midnight.
    reservationForm.querySelector<HTMLButtonElement>('[type="submit"]')?.addEventListener('click', validateReservation);
    reservationForm.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') validateReservation();
    });
    window.addEventListener('focus', validateReservation);
    validateReservation();
    reservationForm.addEventListener('submit', (event) => {
      event.preventDefault();
      validateReservation();
      if (!reservationForm.reportValidity() || !dateInput || !timeInput || !guestsInput) return;
      const reservationDate = new Date(`${dateInput.value}T12:00:00-05:00`);
      if (Number.isNaN(reservationDate.getTime())) return;
      const dateLabel = new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima', day: 'numeric', month: 'long', year: 'numeric',
      }).format(reservationDate);
      const guests = Number(guestsInput.value);
      const guestLabel = guests === 1 ? '1 persona' : `${guestsInput.value} personas`;
      reservationSummary.textContent = `${nameInput?.value.trim() || 'Tu visita'} · ${guestLabel} · ${dateLabel} · ${timeInput.value} h (Lima). Esta es una demostración; no se ha enviado una reserva.`;
      reservationForm.hidden = true;
      reservationResult.hidden = false;
      reservationResult.tabIndex = -1;
      reservationResult.focus({ preventScroll: true });
      ScrollTrigger.refresh(true);
    });
    root.querySelector<HTMLButtonElement>('[data-reservation-reset]')?.addEventListener('click', () => {
      reservationForm.reset();
      reservationForm.hidden = false;
      reservationResult.hidden = true;
      validateReservation();
      nameInput?.focus({ preventScroll: true });
      ScrollTrigger.refresh(true);
    });
  }

  const originSteps = [...root.querySelectorAll<HTMLDetailsElement>('.origin-steps details')];
  originSteps.forEach((step) => {
    // Native grouping avoids competing asynchronous toggle callbacks.
    step.setAttribute('name', 'senda-origin');
    step.addEventListener('toggle', () => ScrollTrigger.refresh(true));
  });

  let motionContext: gsap.Context | undefined;
  const startMotion = () => {
    motionContext?.revert();
    // The portfolio preview is a noninteractive iframe; keep every section visible there.
    if (reducedMotion.matches || window.self !== window.top) return;
    motionContext = gsap.context(() => {
      const heroCopy = root.querySelectorAll<HTMLElement>('.hero-eyebrow, #hero-title > span, .hero-description, .hero-actions');
      if (heroCopy.length) gsap.from(heroCopy, {
        y: 32, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity',
      });
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 38, opacity: 0, duration: .85, ease: 'power3.out', immediateRender: false,
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: element, start: 'top 91%', once: true },
        });
      });
      root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((element) => {
        const amount = Number.parseFloat(element.dataset.parallax ?? '');
        const distance = Number.isFinite(amount) ? Math.min(Math.abs(amount), 14) : 6;
        gsap.fromTo(element, { yPercent: -distance }, {
          yPercent: distance, ease: 'none',
          scrollTrigger: { trigger: element.parentElement ?? element, start: 'top bottom', end: 'bottom top', scrub: .8 },
        });
      });
    }, root);
  };
  startMotion();
  reducedMotion.addEventListener('change', startMotion);
  // Images reserve their layout space; refreshing on lazy loads interrupts native smooth scrolling.
  document.fonts?.ready.then(() => ScrollTrigger.refresh(true));
}

initializeSendaCafe();
document.addEventListener('astro:page-load', initializeSendaCafe);
