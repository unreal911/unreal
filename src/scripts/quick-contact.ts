const quickContact = document.querySelector<HTMLElement>('.quick-contact');
const contactZones = document.querySelectorAll<HTMLElement>('.site-footer, .studio-cover, .pf-hero, .case-hero, .case-contact');

if (quickContact && 'IntersectionObserver' in window) {
  const visibleZones = new Set<Element>();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleZones.add(entry.target);
      else visibleZones.delete(entry.target);
    });

    const hidden = visibleZones.size > 0;
    quickContact.classList.toggle('is-hidden', hidden);
    quickContact.inert = hidden;
  });

  contactZones.forEach((zone) => observer.observe(zone));
}
