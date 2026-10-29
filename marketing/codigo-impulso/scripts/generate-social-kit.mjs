import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'exports');
await fs.mkdir(out, { recursive: true });
const C = { dark: '#131a16', lime: '#ddf77b', cream: '#ecf0e5', muted: '#b3bea9', stroke: '#354031' };
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const rect = (x,y,w,h,fill,rx=0,stroke='none',sw=1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const txt = (text,x,y,size=34,fill=C.dark,weight=400,extra='') => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${esc(text)}</text>`;
const lines = (arr,x,y,size,fill,weight=700,leading=1.05) => arr.map((s,i)=>txt(s,x,y+i*size*leading,size,fill,weight,'letter-spacing="-3"')).join('');
const line = (x1,y1,x2,y2,color=C.stroke,width=2) => `<path d="M${x1} ${y1}H${x2}" stroke="${color}" stroke-width="${width}"/>`;
const arrow = (x,y,size,color=C.lime,sw=12) => `<g transform="translate(${x} ${y}) scale(${size/100})"><path d="M10 90 90 10M20 10h70v70" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const mark = (x,y,size,fg=C.cream,accent=C.lime,bg=C.dark) => `<g transform="translate(${x} ${y}) scale(${size/64})">${rect(0,0,64,64,bg,14)}<path d="M32 24a12 12 0 1 0 0 18M44 28v20" fill="none" stroke="${fg}" stroke-width="7" stroke-linecap="round"/><path d="M40 17h9v9m0-9-10 10" fill="none" stroke="${accent}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
function brand(dark=false, n='01',label='DISEÑO + DESARROLLO WEB') {
  const fg=dark?C.cream:C.dark;
  return mark(64,58,70)+txt('código impulso.',154,103,38,fg,700,'letter-spacing="-1.4"')+txt(n,1016,100,26,fg,400,'text-anchor="end"')+txt(label,64,173,21,dark?C.muted:C.stroke,700,'letter-spacing="2"');
}
function footer(dark=false,cta='Hablemos de tu web') {
  const fg=dark?C.cream:C.dark;
  return line(64,1176,1016,1176,dark?C.stroke:'#c9d1c0')+txt(cta,64,1231,30,fg,700)+txt('+51 980 904 787',64,1279,29,dark?C.muted:C.stroke)+arrow(948,1210,55,dark?C.lime:C.dark,9);
}
function browser(x,y,w,h,{bg=C.dark,fg=C.cream,accent=C.lime,mode='company'}={}) {
  let content=rect(x,y,w,h,bg,24)+`<path d="M${x} ${y+48}h${w}" stroke="${fg}" stroke-opacity=".18" stroke-width="2"/>`;
  content += [24,40,56].map(n=>`<circle cx="${x+n}" cy="${y+24}" r="4" fill="${fg}" opacity=".5"/>`).join('');
  content += rect(x+24,y+68,90,13,fg,6)+rect(x+w-174,y+71,46,5,fg,2)+rect(x+w-111,y+71,46,5,fg,2)+rect(x+w-48,y+65,22,17,accent,4);
  if(mode==='company') {
    content += rect(x+26,y+126,w*.48,17,fg,4)+rect(x+26,y+157,w*.38,17,fg,4)+rect(x+26,y+197,w*.4,6,fg,3)+rect(x+26,y+213,w*.32,6,fg,3)+rect(x+26,y+244,107,33,accent,16);
    const arrowSize=Math.min(w*.21,128);
    content += rect(x+w*.64,y+113,w*.3,150,accent,12)+arrow(x+w*.64+(w*.3-arrowSize)/2,y+113+(150-arrowSize)/2,arrowSize,bg,7);
    if(h>350) content += [0,1,2].map(i=>rect(x+26+i*(w-52)/3,y+h-79,(w-70)/3,49,fg,9)).join('');
  } else if(mode==='landing') {
    content += txt('Tu siguiente',x+28,y+145,38,fg,700)+txt('gran paso.',x+28,y+190,38,accent,700)+rect(x+28,y+218,w*.51,6,fg,3)+rect(x+28,y+233,w*.39,6,fg,3)+rect(x+28,y+266,150,40,accent,20);
    content += `<circle cx="${x+w-100}" cy="${y+210}" r="64" fill="${accent}"/>`+arrow(x+w-142,y+168,84,bg,6);
  } else {
    const cardW=(w-76)/3;
    content += [0,1,2].map(i=>rect(x+24+i*(cardW+14),y+112,cardW,h-142,fg,12)+rect(x+37+i*(cardW+14),y+125,cardW-26,116,accent,8)+`<circle cx="${x+24+i*(cardW+14)+cardW/2}" cy="${y+181}" r="31" fill="${bg}" opacity=".85"/>`+rect(x+37+i*(cardW+14),y+259,cardW-28,8,bg,3)+rect(x+37+i*(cardW+14),y+280,(cardW-28)*.65,6,bg,3)+rect(x+37+i*(cardW+14),y+314,cardW-28,29,bg,12)).join('');
  }
  return content;
}
const svg = (body,w=1080,h=1350,bg=C.dark) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>Código Impulso — Diseño y desarrollo web</title>${rect(0,0,w,h,bg)}<g font-family="Arial, Helvetica, sans-serif">${body}</g></svg>`;
const assets = [];
function add(name,body,w=1080,h=1350,bg=C.dark){assets.push({name,svg:svg(body,w,h,bg),w,h});}

add('01-presentacion',
  brand(true,'01','ESTUDIO DE DISEÑO Y DESARROLLO WEB')+
  lines(['La web para el','siguiente paso','de tu negocio.'],60,303,98,C.cream,700,1.04)+
  txt('Diseño y desarrollo web a medida.',64,592,34,C.muted)+
  `<g transform="translate(64 691)">${rect(0,0,952,403,C.lime,26)}${txt('Ideas claras.',36,66,31,C.dark,700)}${txt('Webs que avanzan.',36,111,31,C.dark,700)}${arrow(42,171,173,C.dark,7)}${browser(362,52,540,305,{bg:C.dark,fg:C.cream,accent:C.lime})}</g>`+
  footer(true));

add('02-webs-corporativas',
  brand(false,'02','WEBS CORPORATIVAS')+
  lines(['Tu empresa.','Una web','a su altura.'],60,313,105,C.dark,700,1.02)+
  txt('Webs corporativas para presentar tus',64,622,34,C.stroke)+txt('servicios y facilitar el contacto.',64,668,34,C.stroke)+
  browser(64,738,952,365,{mode:'company'})+footer(false),1080,1350,C.cream);

add('03-landing-pages',
  brand(false,'03','LANDING PAGES')+
  lines(['Una idea.','Un objetivo.','Una landing.'],60,312,106,C.dark,700,1.03)+
  txt('Presenta tu oferta y facilita',64,634,34,C.stroke)+txt('las consultas.',64,680,34,C.stroke)+
  browser(64,750,952,352,{mode:'landing'})+footer(false),1080,1350,C.lime);

add('04-catalogos',
  brand(false,'04','CATÁLOGOS DIGITALES')+
  lines(['Tu catálogo,','a un mensaje.'],60,313,101,C.dark,700,1.05)+
  txt('Productos, filtros y consultas',64,548,34,C.stroke)+txt('por WhatsApp.',64,595,34,C.stroke)+
  browser(64,675,952,429,{mode:'catalog'})+footer(false,'Cotiza por WhatsApp'),1080,1350,C.cream);

add('05-proceso',
  brand(false,'05','ASÍ TRABAJAMOS')+
  lines(['De la idea','a la web.'],60,309,113,C.dark,700,1.03)+
  txt('Un proceso claro, de principio a fin.',64,579,33,C.stroke)+
  ['Entender','Ordenar','Diseñar','Construir'].map((name,i)=>{
    const y=663+i*113;
    return txt(`0${i+1}`,67,y+47,28,C.stroke)+txt(name,158,y+51,49,C.dark,700)+line(64,y+85,1016,y+85,'#b7cf64')+arrow(961,y+12,42,C.dark,7);
  }).join('')+footer(false),1080,1350,C.lime);

add('06-servicios-precios',
  brand(true,'06','SERVICIOS A MEDIDA')+
  lines(['Elige tu','siguiente paso.'],60,310,100,C.cream,700,1.05)+
  ['Landing page','Web corporativa','Catálogo digital'].map((name,i)=>{
    const y=530+i*163;
    return line(64,y,1016,y,C.stroke)+txt(name,64,y+54,36,C.cream,700)+txt('DESDE',64,y+106,20,C.muted,700,'letter-spacing="2"')+txt(['S/ 1,200','S/ 2,500','S/ 3,500'][i],1016,y+112,60,C.lime,700,'text-anchor="end" letter-spacing="-2"');
  }).join('')+line(64,1019,1016,1019,C.stroke)+txt('Precios de partida según alcance.',64,1074,28,C.muted)+txt('Dominio y hosting aparte.',64,1116,28,C.muted)+footer(true,'Cotiza por WhatsApp'));

add('06-servicios-cotizacion',
  brand(true,'06','SERVICIOS A MEDIDA')+
  lines(['Elige tu','siguiente paso.'],60,310,100,C.cream,700,1.05)+
  ['Landing pages','Webs corporativas','Catálogos digitales'].map((name,i)=>{
    const y=530+i*163;
    return line(64,y,1016,y,C.stroke)+txt(name,64,y+82,47,C.cream,700)+arrow(949,y+40,60,C.lime,7);
  }).join('')+line(64,1019,1016,1019,C.stroke)+txt('Solicita una propuesta a medida.',64,1084,35,C.lime,700)+footer(true,'Cotiza por WhatsApp'));

add('avatar',mark(145,145,790),1080,1080,C.dark);

add('facebook-cover',
  `<path d="M1184 624 1530 278M1260 278h270v270" fill="none" stroke="${C.lime}" stroke-width="53" stroke-linecap="round" stroke-linejoin="round" opacity=".12"/>`+
  txt('código impulso.',420,215,92,C.cream,700,'letter-spacing="-4"')+
  txt('La web para el siguiente',422,302,45,C.cream,700)+txt('paso de tu negocio.',422,360,45,C.lime,700)+
  txt('Diseño y desarrollo web a medida.',422,429,27,C.muted)+line(422,467,1195,467,C.stroke)+txt('Hablemos de tu web',422,511,25,C.cream)+txt('+51 980 904 787',1195,511,25,C.cream,400,'text-anchor="end"'),1640,624,C.dark);

add('story-lanzamiento',
  mark(64,285,76)+txt('código impulso.',161,334,42,C.cream,700,'letter-spacing="-1.7"')+
  txt('DISEÑO + DESARROLLO WEB',64,437,24,C.muted,700,'letter-spacing="2"')+
  lines(['La web para','el siguiente','paso de tu','negocio.'],60,578,107,C.cream,700,1.06)+
  rect(64,1010,952,316,C.lime,25)+txt('Webs a medida para',102,1090,41,C.dark,700)+txt('negocios que avanzan.',102,1147,41,C.dark,700)+arrow(835,1216,65,C.dark,8)+
  txt('Landing · Web corporativa · Catálogo',102,1268,27,C.dark)+
  line(64,1408,1016,1408,C.stroke)+txt('Hablemos de tu web',64,1480,37,C.cream,700)+txt('+51 980 904 787',64,1541,35,C.muted)+arrow(940,1470,65,C.lime,8),1080,1920,C.dark);

for (const item of assets) {
  await fs.writeFile(path.join(out,`${item.name}.svg`),item.svg);
  await sharp(Buffer.from(item.svg)).png({palette:true,colors:128,quality:95,compressionLevel:9,effort:10}).toFile(path.join(out,`${item.name}.png`));
}
const thumbs=await Promise.all(assets.slice(0,6).map(item=>sharp(path.join(out,`${item.name}.png`)).resize(360,450).toBuffer()));
await sharp({create:{width:1152,height:948,channels:4,background:'#cdd3c5'}}).composite(thumbs.map((input,i)=>({input,left:18+(i%3)*378,top:18+Math.floor(i/3)*462}))).png({palette:true,colors:128,compressionLevel:9}).toFile(path.join(out,'contact-sheet.png'));
console.log(JSON.stringify(await Promise.all(assets.map(async a=>({name:a.name,width:a.w,height:a.h,bytes:(await fs.stat(path.join(out,`${a.name}.png`))).size}))),null,2));
