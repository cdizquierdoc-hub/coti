/* COTI · código compartido por index.html y metricas.html */
(function (global) {
"use strict";
const RAW = "https://raw.githubusercontent.com/cdizquierdoc-hub/coti/data/precios/";

const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => n == null || isNaN(n) ? "—" : "$" + Number(n).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const money0 = n => n == null || isNaN(n) ? "—" : "$" + Math.round(n).toLocaleString("en-US");
const pct = (n, d = 1) => n == null || isNaN(n) ? "—" : (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n * 100).toFixed(d) + "%";
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/* ---- tipo de producto a partir del nombre (el orden importa: accesorios primero) ---- */
const TIPOS = [
  ["Accesorio", /control remoto|soporte (de|para)|base para|\bcable\b|repuesto|\bfiltro\b|accesorio|\bfunda\b|protector|adaptador|kit (de )?instalaci|para laptop|para (perro|gato|mascota)|alimento para/],
  ["Minibar", /minibar|mini bar|frigobar|mini ?nevera|mini ?refri/],
  ["Vitrina", /vitrina|enfriador vertical|\bcooler\b|cava de vino/],
  ["Refrigeradora", /refrigerad|nevera|side ?by ?side|french door/],
  ["Congelador", /congelador|freezer|arcon/],
  ["Cocina", /^cocina|cocina (a gas|de induccion|electrica|\d)|cocineta/],
  ["Encimera", /encimera|anafe/],
  ["Microondas", /microondas|micro ondas/],
  ["Horno", /\bhorno\b/],
  ["Campana", /campana|extractor de olor/],
  ["Lavadora", /lavadora|lavaseca/],
  ["Secadora", /secadora(?! de (pelo|cabello))/],
  ["Aire acondicionado", /aire acondicionado|\bsplit\b|\d{4,5} ?btu/],
  ["Ventilador", /ventilador/],
  ["Televisor", /televisor|smart tv|\btv\b|\bqled\b|\boled\b/],
  ["Celular", /celular|smartphone|iphone|galaxy [asz]\d/],
  ["Laptop", /laptop|notebook|portatil|macbook/],
  ["Tablet", /tablet|\bipad\b/],
  ["Consola", /consola|playstation|\bps5\b|xbox|nintendo/],
  ["Parlante", /parlante|partybox|barra de sonido|soundbar|torre de sonido|equipo de sonido/],
  ["Audífonos", /audifono|auricular|earbuds|airpods/],
  ["Licuadora", /licuadora/],
  ["Freidora de aire", /freidora|air ?fryer/],
  ["Olla arrocera", /arrocera/],
  ["Olla multifunción", /olla (de presion|multi|electrica)/],
  ["Cafetera", /cafetera|espresso/],
  ["Batidora", /batidora/],
  ["Extractor de jugo", /extractor de jugo|exprimidor|extractor (oster|electrico)/],
  ["Sanduchera", /sanduchera|sandwichera|waflera/],
  ["Plancha", /plancha(?! (de|para) (cabello|pelo))/],
  ["Aspiradora", /aspiradora/],
  ["Dispensador de agua", /dispensador.*agua|agua.*dispensador|bebedero/],
  ["Monitor", /\bmonitor\b/],
  ["Impresora", /impresora/],
  ["Colchón", /colchon/],
  ["Motocicleta", /motocicleta|\bmoto\b/],
];
function tipoDe(nombre) {
  const n = norm(nombre);
  for (const [t, re] of TIPOS) if (re.test(n)) return t;
  return null;
}

/* ---- atributos comparables: litros, pulgadas, BTU, kg, quemadores, GB ---- */
function num(s) { return parseFloat(String(s).replace(",", ".")); }
function atributosDe(nombre) {
  const n = norm(nombre).replace(/”|''/g, '"');
  const a = {};
  let m;
  if ((m = n.match(/(\d{2,4}(?:[.,]\d+)?)\s*(?:l|lt|lts|litros)\b/))) a.litros = num(m[1]);
  else if ((m = n.match(/(\d(?:[.,]\d+)?)\s*(?:l|lt|lts|litros)\b/))) a.litros = num(m[1]);
  if ((m = n.match(/(\d{2,3}(?:[.,]\d)?)\s*(?:"|pulg|pulgadas|in\b)/))) a.pulgadas = num(m[1]);
  if ((m = n.match(/(\d{4,5})\s*btu/))) a.btu = num(m[1]);
  if ((m = n.match(/(\d{1,2}(?:[.,]\d)?)\s*(?:kg|kilos)\b/))) a.kg = num(m[1]);
  if ((m = n.match(/(\d)\s*quemador/))) a.quemadores = num(m[1]);
  const gbs = [...n.matchAll(/(\d{2,4})\s*gb/g)].map(x => num(x[1]));
  if (gbs.length) a.gb = Math.max(...gbs);
  return a;
}

/* ---- carga de datos ---- */
async function cargar() {
  const meta = await fetch(RAW + "resumen.json?t=" + Date.now()).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  const stores = meta.tiendas;
  const storeById = Object.fromEntries(stores.map(s => [s.id, s]));
  const lists = await Promise.all(stores.map(s => s.error ? [] :
    fetch(RAW + s.id + ".json?t=" + encodeURIComponent(meta.actualizado)).then(r => r.ok ? r.json() : []).catch(() => [])));
  const products = lists.flat();
  for (const p of products) {
    p._n = norm(p.n);
    p._k = " " + norm([p.n, p.m, p.mo, p.c].join(" "));
    p._c = p._k.replace(/[\s\-.]/g, "");
    p._tipo = tipoDe(p.n);
    p._a = atributosDe(p.n);
    p._cresa = storeById[p.t]?.grupo === "cresa";
  }
  const byModel = agruparModelos(products);
  return {meta, stores, storeById, products, byModel};
}

/* ---- modelos: une códigos que solo difieren en el sufijo (RI7568 / RI7568D) ---- */
function agruparModelos(products) {
  const valido = mo => mo && !/^P\d{3,6}$/.test(mo) && !/^\d+(EN|IN|X|W)\d+$/.test(mo); // códigos internos de proveedor y medidas no son modelos
  for (const p of products) if (p.mo && !valido(p.mo)) delete p.mo;
  const keys = [...new Set(products.filter(p => p.mo && !/^\s*combo\b/i.test(p.n)).map(p => p.mo))].sort();
  const canon = new Map(); let base = null;
  for (const k of keys) {
    if (base && base.length >= 6 && k.startsWith(base) && k.length - base.length <= 4) canon.set(k, base);
    else { base = k; canon.set(k, k); }
  }
  const byModel = new Map();
  for (const p of products) {
    p._g = p.mo && canon.has(p.mo) ? canon.get(p.mo) : null;
    if (p._g) { const l = byModel.get(p._g) || []; l.push(p); byModel.set(p._g, l); }
  }
  return byModel;
}

/* ---- alternativas en CRESA para un producto que no tenemos ---- */
function penalizacion(ref, c) {
  let pen = 0;
  for (const k of Object.keys(ref._a)) {
    const a = ref._a[k], b = c._a[k];
    if (b == null) pen += 0.6;
    else pen += 3 * Math.abs(a - b) / Math.max(a, b);
  }
  pen += Math.min(2, Math.abs(c.p - ref.p) / ref.p);
  const marca = norm(c.m).trim();
  if ((ref.m && marca && norm(ref.m) === marca) || (marca.length >= 2 && new RegExp("\\b" + marca.replace(/[^a-z0-9 ]/g, "") + "\\b").test(ref._n))) pen -= 0.6;
  return pen;
}
/* Devuelve hasta `k` alternativas CRESA del mismo tipo: cada una agrupa las cadenas que la tienen.
   etiqueta: "Más parecido" (menor penalización) y "Mejor precio" (la más barata entre las parecidas). */
function alternativas(ref, products, k = 3) {
  if (!ref._tipo || ref._tipo === "Accesorio") return [];
  const cands = products.filter(c => c._cresa && c._tipo === ref._tipo && c.p > 0 && !/^\s*combo\b/i.test(c.n));
  if (!cands.length) return [];
  // una entrada por producto (mismo modelo o mismo nombre en Crecos/Orve/Japón)
  const grupos = new Map();
  const clave = c => {
    const base = c._n.split("|")[0].replace(/\b(celular|televisor|parlante)\b/g, "").replace(/\s+/g, " ").trim();
    return base.split(" ").length >= 3 ? base : (c._g || c._n);
  };
  for (const c of cands) {
    const key = clave(c);
    const g = grupos.get(key);
    if (!g) grupos.set(key, {p: c, cadenas: [c]});
    else { g.cadenas.push(c); if (c.p < g.p.p) g.p = c; }
  }
  const lista = [...grupos.values()].map(g => ({...g, pen: penalizacion(ref, g.p)}))
    .filter(g => g.pen < 2.2).sort((a, b) => a.pen - b.pen);
  if (!lista.length) return [];
  const out = [];
  const parecido = lista[0]; out.push({...parecido, etiqueta: "Más parecido"});
  const top = lista.slice(0, 8).filter(g => g.pen <= parecido.pen + 0.8);
  const barato = top.reduce((a, b) => b.p.p < a.p.p ? b : a);
  if (barato !== parecido) out.push({...barato, etiqueta: "Mejor precio"});
  else out[0].etiqueta = "Más parecido y mejor precio";
  for (const g of lista) { if (out.length >= k) break; if (!out.includes(g) && g !== barato && g !== parecido) out.push({...g, etiqueta: "Parecido"}); }
  return out;
}

/* ---- comparación CRESA vs competencia en modelos compartidos ----
   ref: "cresa" (mejor precio de las 3 cadenas) o el id de una cadena */
const LIMITE_OUTLIER = 0.6; // diferencias mayores al 60% suelen ser modelos mal emparejados
function pares(data, {ref = "cresa", tipo = ""} = {}) {
  const out = [];
  for (const [g, items] of data.byModel) {
    const deTipo = items[0]._tipo;
    if (tipo && !items.some(p => p._tipo === tipo)) continue;
    const cres = items.filter(p => p._cresa && (ref === "cresa" || p.t === ref));
    const comps = items.filter(p => !p._cresa);
    if (!cres.length || !comps.length) continue;
    const c = cres.reduce((a, b) => b.p < a.p ? b : a);
    const porTienda = new Map();
    for (const p of comps) { const x = porTienda.get(p.t); if (!x || p.p < x.p) porTienda.set(p.t, p); }
    for (const [t, p] of porTienda) {
      const d = (c.p - p.p) / p.p;
      if (Math.abs(d) > LIMITE_OUTLIER) continue;
      out.push({g, tipo: deTipo || c._tipo || p._tipo, cresa: c, comp: p, tienda: t, d});
    }
  }
  return out;
}

global.COTI = {RAW, norm, esc, money, money0, pct, median, tipoDe, atributosDe, cargar, agruparModelos, alternativas, pares, TIPOS: TIPOS.map(t => t[0])};
})(window);
