const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
export type Campaign = Partial<Record<(typeof campaignKeys)[number], string>>;

/** Only short campaign labels are accepted; arbitrary query strings never reach contact text. */
export function readCampaign(search: string): Campaign | undefined {
  const params = new URLSearchParams(search);
  const campaign: Campaign = {};
  for (const key of campaignKeys) {
    const value = params.get(key)?.toLowerCase();
    if (value && /^[a-z0-9][a-z0-9_.-]{0,79}$/.test(value)) campaign[key] = value;
  }
  return campaign.utm_source && campaign.utm_campaign ? campaign : undefined;
}

/** Keep attribution across local pages and add it to the user's editable WhatsApp draft. */
export function campaignLink(href: string, pageUrl: string, whatsappBase: string, campaign: Campaign): string {
  if (!href || href.startsWith('#')) return href;
  let target: URL;
  try { target = new URL(href, pageUrl); } catch { return href; }
  const page = new URL(pageUrl);
  const contact = new URL(whatsappBase);
  if (target.origin === contact.origin && target.pathname === contact.pathname && target.protocol === 'https:') {
    const text = target.searchParams.get('text');
    if (!text) return href;
    const marker = '\n\nReferencia de campaña: ';
    const reference = [campaign.utm_source, campaign.utm_medium, campaign.utm_campaign, campaign.utm_content]
      .filter(Boolean).join(' / ');
    // Calling twice must not duplicate the reference (including dynamically updated cart links).
    target.searchParams.set('text', `${text.split(marker)[0]}${marker}${reference}`);
    return target.href;
  }
  const publicPage = target.pathname === '/' || /^\/(proyectos|demos)\//.test(target.pathname);
  if (target.origin !== page.origin || !publicPage || /\/admin\/?$/.test(target.pathname)) return href;
  // An explicitly tagged link starts its own campaign; do not merge two campaigns.
  if (campaignKeys.some((key) => target.searchParams.has(key))) return href;
  for (const key of campaignKeys) if (campaign[key]) target.searchParams.set(key, campaign[key]!);
  return `${target.pathname}${target.search}${target.hash}`;
}
