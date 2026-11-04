import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readCampaign, campaignLink } from '../src/lib/campaign.ts';

const page = 'https://nubicore.digital/proyectos/trama-mayorista/';
const whatsapp = 'https://wa.me/51980904787';
const campaign = readCampaign('?utm_source=Instagram&utm_medium=organic_social&utm_campaign=catalogos_30dias&utm_content=post_03');

test('accepts campaign labels and rejects incomplete or arbitrary query data', () => {
  assert.equal(campaign.utm_source, 'instagram');
  assert.equal(readCampaign('?utm_source=instagram'), undefined);
  assert.equal(readCampaign('?utm_source=%3Cscript%3E&utm_campaign=test'), undefined);
  assert.equal(readCampaign('?utm_source=instagram&utm_campaign=' + 'x'.repeat(81)), undefined);
  assert.deepEqual(readCampaign('?utm_source=facebook&utm_campaign=lanzamiento&email=private@example.com'), {
    utm_source: 'facebook', utm_campaign: 'lanzamiento',
  });
});

test('preserves filters and hashes through case and demo navigation', () => {
  const href = campaignLink('/demos/nodo-pc/componentes/?categoria=gpu#catalogo', page, whatsapp, campaign);
  const url = new URL(href, page);
  assert.equal(url.searchParams.get('categoria'), 'gpu');
  assert.equal(url.searchParams.get('utm_campaign'), 'catalogos_30dias');
  assert.equal(url.hash, '#catalogo');
  assert.equal(campaignLink(href, page, whatsapp, campaign), href);
});

test('keeps unrelated destinations, anchors, admin and explicit campaigns unchanged', () => {
  for (const href of ['#proceso', 'mailto:hello@example.com', 'https://example.com/', '/demos/nodo-pc/admin/', '/images/logo.svg', '/?utm_source=facebook&utm_campaign=otra']) {
    assert.equal(campaignLink(href, page, whatsapp, campaign), href);
  }
});

test('adds one editable reference to the studio contact, preserving the original message', () => {
  const href = `${whatsapp}?text=${encodeURIComponent('Hola, vi Trama.\nMe interesan 30 productos.')}`;
  const tagged = campaignLink(href, page, whatsapp, campaign);
  const message = new URL(tagged).searchParams.get('text');
  assert.ok(message.startsWith('Hola, vi Trama.\nMe interesan 30 productos.'));
  assert.ok(message.includes('instagram / organic_social / catalogos_30dias / post_03'));
  assert.equal(campaignLink(tagged, page, whatsapp, campaign), tagged);
  const other = 'https://wa.me/51999999999?text=Hola';
  assert.equal(campaignLink(other, page, whatsapp, campaign), other);
});
