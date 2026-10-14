const quickContact = document.querySelector<HTMLElement>('.quick-contact');
const footer = document.querySelector<HTMLElement>('.site-footer');

if (quickContact && footer && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    quickContact.classList.toggle('is-hidden', entry?.isIntersecting ?? false);
  }, { threshold: 0.12 }).observe(footer);
}
