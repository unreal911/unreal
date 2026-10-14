const menuToggle = document.querySelector<HTMLButtonElement>('#mobile-menu-toggle');
const siteNav = document.querySelector<HTMLElement>('#site-navigation');

if (menuToggle && siteNav) {
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
    siteNav.classList.remove('is-open');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    siteNav.classList.toggle('is-open', isOpen);
  });

  siteNav.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node) || menuToggle.contains(event.target) || siteNav.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || menuToggle.getAttribute('aria-expanded') !== 'true') return;
    closeMenu();
    menuToggle.focus();
  });

  window.matchMedia('(min-width: 781px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });
}
