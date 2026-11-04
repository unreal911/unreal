import { site } from '../data/site';
import { campaignLink, readCampaign } from '../lib/campaign';

// No cookies, storage, analytics requests or automatic messages. The campaign stays in URLs.
const campaign = readCampaign(window.location.search);
if (campaign) {
  const updateLink = (link: HTMLAnchorElement) => {
    const href = link.getAttribute('href');
    if (!href || link.hasAttribute('download')) return;
    const attributed = campaignLink(href, window.location.href, site.whatsapp, campaign);
    if (attributed !== href) link.setAttribute('href', attributed);
  };
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(updateLink);
  // Refresh contact links whose message is generated after choosing demo products.
  const handleLink = (event: MouseEvent) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (link) updateLink(link);
  };
  document.addEventListener('click', handleLink, { capture: true });
  document.addEventListener('auxclick', handleLink, { capture: true });
}
