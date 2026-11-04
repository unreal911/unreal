const menuToggle = document.querySelector<HTMLButtonElement>('#mobile-menu-toggle');
const siteNav = document.querySelector<HTMLElement>('#site-navigation');

if (menuToggle && siteNav) {
  const groups = [...siteNav.querySelectorAll<HTMLDetailsElement>('details')];
  const closeGroups = () => groups.forEach(group => { group.open = false; });
  const closeMenu = () => {
    closeGroups();
    siteNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
  };

  menuToggle.addEventListener('click', () => {
    if (siteNav.classList.contains('is-open')) return closeMenu();
    siteNav.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    siteNav.querySelector<HTMLElement>('summary, a')?.focus();
  });

  siteNav.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('a')) closeMenu();
  });

  const closeOutside = (event: Event) => {
    if (event.target instanceof Node && !siteNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  };
  document.addEventListener('click', closeOutside);
  document.addEventListener('focusin', closeOutside);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openGroup = groups.find(group => group.open);
    if (openGroup) {
      openGroup.open = false;
      openGroup.querySelector('summary')?.focus();
    } else if (siteNav.classList.contains('is-open')) {
      closeMenu();
      menuToggle.focus();
    }
  });

  window.matchMedia('(min-width: 781px)').addEventListener('change', closeMenu);
  window.addEventListener('pageshow', closeMenu);
}
