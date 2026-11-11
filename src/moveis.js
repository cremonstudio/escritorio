// Móveis do escritório, montados com formas arredondadas (estilo jogo cozy, sem pixel).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const COR = {
  creme: "#F6F1E8", tinta: "#151413", laranja: "#FF5A36", nogueira: "#6B4226", nogueiraClara: "#8A5A36",
  carvalho: "#C99A63", feltro: "#1F7A4C", ping: "#2462A8", cinza: "#8F8D89", cinzaClaro: "#C9CBCD",
  preto: "#1C1C20", branco: "#F4F4F0", verde: "#4E8F4A", verdeEscuro: "#3B7339", terracota: "#C1693C",
  vidro: "#BFD9E6", midnight: "#1E2633",
};

const cache = new Map();
export function mat(cor, extra = {}) {
  const chave = cor + JSON.stringify(extra);
  if (!cache.has(chave)) cache.set(chave, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.78, metalness: 0, ...extra }));
  return cache.get(chave);
}

function sombra(m) {
  m.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return m;
}

export function caixa(w, h, d, cor, r = 0.035, extra) {
  const raio = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(0.001, raio)), typeof cor === "string" ? mat(cor, extra) : cor);
}

function cilindro(rt, rb, h, cor, seg = 18) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(cor));
}

function em(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}

// ------------------------------------------------------------ escritório
export function mesa({ w = 1.4, d = 0.8, cor = COR.carvalho, perna = COR.preto, h = 0.74 } = {}) {
  const g = new THREE.Group();
  g.add(em(caixa(w, 0.06, d, cor, 0.02), 0, h, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
    g.add(em(caixa(0.05, h, 0.05, perna, 0.015), x * (w / 2 - 0.08), h / 2, z * (d / 2 - 0.08)));
  return sombra(g);
}

export function cadeira({ cor = COR.cinzaClaro, encosto = COR.cinza, alta = false } = {}) {
  const g = new THREE.Group();
  g.add(em(cilindro(0.03, 0.03, 0.36, COR.preto), 0, 0.2, 0));
  g.add(em(cilindro(0.2, 0.2, 0.03, COR.preto, 5), 0, 0.03, 0));
  g.add(em(caixa(0.46, 0.08, 0.44, cor, 0.04), 0, 0.44, 0));
  const hEnc = alta ? 0.72 : 0.48;
  g.add(em(caixa(0.44, hEnc, 0.07, encosto, 0.035), 0, 0.48 + hEnc / 2, 0.2));
  if (alta) g.add(em(caixa(0.26, 0.14, 0.07, encosto, 0.035), 0, 0.48 + hEnc + 0.12, 0.2)); // apoio de cabeça
  for (const s of [-1, 1]) g.add(em(caixa(0.05, 0.05, 0.3, COR.cinza, 0.02), s * 0.25, 0.62, 0.02));
  return sombra(g);
}

export function monitor({ largo = 0.62 } = {}) {
  const g = new THREE.Group();
  g.add(em(caixa(largo, 0.36, 0.04, COR.preto, 0.015), 0, 1.06, 0));
  g.add(em(new THREE.Mesh(new THREE.PlaneGeometry(largo - 0.05, 0.31), mat("#2B3A4F", { emissive: "#24344a", emissiveIntensity: 0.6 })), 0, 1.06, -0.022));
  g.children[1].rotation.y = Math.PI;
  g.add(em(caixa(0.05, 0.22, 0.04, COR.preto, 0.01), 0, 0.88, 0.03));
  g.add(em(caixa(0.2, 0.02, 0.14, COR.preto, 0.008), 0, 0.775, 0.03));
  return sombra(g);
}

export function notebook(cor = COR.cinzaClaro) {
  const g = new THREE.Group();
  g.add(em(caixa(0.32, 0.015, 0.22, cor, 0.006), 0, 0.775, 0));
  const tela = em(caixa(0.32, 0.21, 0.012, cor, 0.006), 0, 0.88, -0.11);
  tela.rotation.x = -0.25;
  g.add(tela);
  return sombra(g);
}

export function caneca(cor = COR.verde) {
  return sombra(em(cilindro(0.04, 0.035, 0.09, cor), 0, 0.815, 0));
}

export function planta(escala = 1, alta = false) {
  const g = new THREE.Group();
  g.add(em(cilindro(0.2, 0.15, 0.32, COR.terracota), 0, 0.16, 0));
  const folha = mat(COR.verde, { flatShading: true });
  const folha2 = mat(COR.verdeEscuro, { flatShading: true });
  const blobs = alta
    ? [[0, 0.75, 0, 0.3], [0.12, 1.05, 0.05, 0.24], [-0.1, 1.25, -0.04, 0.2], [0.05, 0.5, 0.1, 0.22]]
    : [[0, 0.52, 0, 0.28], [0.16, 0.6, 0.06, 0.18], [-0.14, 0.62, -0.05, 0.17]];
  blobs.forEach(([x, y, z, r], i) => g.add(em(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), i % 2 ? folha2 : folha), x, y, z)));
  g.scale.setScalar(escala);
  return sombra(g);
}

export function poltrona(cor = "#E8DCC8") {
  const g = new THREE.Group();
  g.add(em(caixa(0.8, 0.3, 0.75, cor, 0.1), 0, 0.3, 0));
  g.add(em(caixa(0.8, 0.45, 0.18, cor, 0.08), 0, 0.6, 0.29));
  for (const s of [-1, 1]) g.add(em(caixa(0.14, 0.32, 0.72, cor, 0.06), s * 0.36, 0.5, 0));
  g.add(em(caixa(0.72, 0.1, 0.62, "#F2E9DA", 0.05), 0, 0.5, -0.04));
  return sombra(g);
}

export function sofa(largura = 2.2, cor = "#E8DCC8") {
  const g = new THREE.Group();
  g.add(em(caixa(largura, 0.32, 0.85, cor, 0.1), 0, 0.3, 0));
  g.add(em(caixa(largura, 0.5, 0.2, cor, 0.08), 0, 0.62, 0.33));
  for (const s of [-1, 1]) g.add(em(caixa(0.18, 0.4, 0.85, cor, 0.07), s * (largura / 2 - 0.09), 0.52, 0));
  const n = Math.round(largura / 0.7);
  for (let i = 0; i < n; i++) g.add(em(caixa(largura / n - 0.08, 0.12, 0.66, "#F2E9DA", 0.05), -largura / 2 + (i + 0.5) * (largura / n), 0.51, -0.05));
  g.add(em(caixa(0.3, 0.3, 0.1, COR.laranja, 0.05), largura / 2 - 0.4, 0.68, 0.18)); // almofada
  return sombra(g);
}

export function mesinha(w = 0.9, d = 0.5, cor = COR.carvalho) {
  const g = new THREE.Group();
  g.add(em(caixa(w, 0.05, d, cor, 0.02), 0, 0.42, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(em(caixa(0.04, 0.42, 0.04, COR.preto, 0.01), x * (w / 2 - 0.06), 0.21, z * (d / 2 - 0.06)));
  return sombra(g);
}

export function mesaRedonda(cor = COR.branco) {
  const g = new THREE.Group();
  g.add(em(cilindro(0.42, 0.42, 0.04, cor, 28), 0, 0.74, 0));
  g.add(em(cilindro(0.03, 0.03, 0.72, COR.preto), 0, 0.37, 0));
  g.add(em(cilindro(0.22, 0.22, 0.03, COR.preto, 20), 0, 0.02, 0));
  return sombra(g);
}

export function banqueta(cor = COR.laranja) {
  const g = new THREE.Group();
  g.add(em(cilindro(0.17, 0.17, 0.06, cor, 20), 0, 0.5, 0));
  g.add(em(cilindro(0.025, 0.025, 0.48, COR.preto), 0, 0.25, 0));
  g.add(em(cilindro(0.14, 0.14, 0.02, COR.preto, 18), 0, 0.01, 0));
  return sombra(g);
}

// ------------------------------------------------------------ copa
export function balcao(compr = 4.5) {
  const g = new THREE.Group();
  g.add(em(caixa(0.7, 0.86, compr, COR.creme, 0.03), 0, 0.43, 0));
  g.add(em(caixa(0.78, 0.06, compr + 0.04, COR.carvalho, 0.02), 0, 0.89, 0));
  for (let i = 0; i < Math.floor(compr / 0.6); i++)
    g.add(em(caixa(0.02, 0.6, 0.5, "#E6DCCB", 0.01), -0.36, 0.43, -compr / 2 + 0.33 + i * 0.6));
  return sombra(g);
}

export function maquinaCafe() {
  const g = new THREE.Group();
  g.add(em(caixa(0.4, 0.5, 0.36, COR.tinta, 0.05), 0, 1.17, 0));
  g.add(em(caixa(0.18, 0.06, 0.06, "#2a2a2a", 0.02), 0.05, 1.05, -0.18));
  g.add(em(new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), mat(COR.laranja, { emissive: COR.laranja, emissiveIntensity: 1.5 })), -0.12, 1.32, -0.185));
  g.add(em(caixa(0.08, 0.08, 0.08, COR.branco, 0.02), 0.05, 0.96, -0.12));
  return sombra(g);
}

export function geladeira() {
  const g = new THREE.Group();
  g.add(em(caixa(0.7, 1.8, 0.65, "#DADAD6", 0.06), 0, 0.9, 0));
  g.add(em(caixa(0.03, 0.4, 0.04, COR.cinza, 0.01), 0.27, 1.25, -0.34));
  g.add(em(caixa(0.03, 0.3, 0.04, COR.cinza, 0.01), 0.27, 0.55, -0.34));
  return sombra(g);
}

// ------------------------------------------------------------ reunião
export function mesaReuniao(compr = 4.2) {
  const g = new THREE.Group();
  const vidro = new THREE.MeshPhysicalMaterial({ color: COR.vidro, roughness: 0.15, transmission: 0.4, transparent: true, opacity: 0.85 });
  g.add(em(caixa(1.3, 0.05, compr, vidro, 0.02), 0, 0.74, 0));
  for (const z of [-1, 1]) g.add(em(caixa(0.9, 0.7, 0.06, COR.preto, 0.02), 0, 0.37, z * (compr / 2 - 0.4)));
  return sombra(g);
}

export function quadroBranco(largura = 2.2) {
  const g = new THREE.Group();
  g.add(em(caixa(largura, 1.1, 0.05, COR.cinzaClaro, 0.02), 0, 1.45, 0));
  g.add(em(caixa(largura - 0.1, 1.0, 0.02, "#FFFFFF", 0.01), 0, 1.45, -0.03));
  const rabisco = mat(COR.laranja);
  for (let i = 0; i < 4; i++) g.add(em(caixa(0.5 + Math.random() * 0.7, 0.03, 0.01, i === 0 ? rabisco : mat("#3d5a80"), 0.005), -0.3 + Math.random() * 0.4, 1.7 - i * 0.18, -0.045));
  return sombra(g);
}

// ------------------------------------------------------------ sua sala
export function estanteLed() {
  const g = new THREE.Group();
  g.add(em(caixa(1.6, 2.0, 0.4, COR.nogueira, 0.03), 0, 1.0, 0));
  const cores = ["#C4A06E", "#5A6E82", "#AA503C", "#E6DCC8", "#46593F", "#966E5A"];
  for (const y of [0.25, 0.75, 1.25, 1.72]) {
    g.add(em(caixa(1.5, 0.03, 0.36, COR.nogueiraClara, 0.01), 0, y, -0.02));
    g.add(em(caixa(1.46, 0.015, 0.02, "#FFB347", 0.005, { emissive: "#FFB347", emissiveIntensity: 2 }), 0, y + 0.4, -0.19));
    let x = -0.68;
    while (x < 0.64) {
      const w = 0.05 + Math.random() * 0.05;
      const h = 0.26 + Math.random() * 0.12;
      g.add(em(caixa(w, h, 0.26, cores[Math.floor(Math.random() * cores.length)], 0.008), x + w / 2, y + 0.015 + h / 2, -0.04));
      x += w + 0.008 + (Math.random() < 0.15 ? 0.08 : 0);
    }
  }
  const luz = new THREE.PointLight("#FFB347", 1.6, 2.6, 2);
  luz.position.set(0, 1.4, -0.6);
  g.add(luz);
  return sombra(g);
}

export function mesaMateus() {
  const g = mesa({ w: 1.8, d: 0.85, cor: COR.nogueira });
  g.add(em(caixa(0.9, 0.006, 0.5, "#8A8A86", 0.003), 0, 0.775, 0.05)); // feltro cinza
  const m = monitor({ largo: 0.9 });
  m.position.z = -0.25;
  g.add(m);
  const mac = notebook(COR.midnight);
  mac.position.set(-0.05, 0, 0.12);
  g.add(mac);
  const cx = caneca(COR.verde);
  cx.position.set(0.6, 0, 0.1);
  g.add(cx);
  const copo = caneca(COR.preto);
  copo.scale.set(0.9, 1.6, 0.9);
  copo.position.set(-0.65, -0.03, 0.1);
  g.add(copo);
  return sombra(g);
}

export function quadroAsterisco() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  x.fillStyle = COR.creme;
  x.fillRect(0, 0, 256, 256);
  x.fillStyle = COR.laranja;
  x.font = "800 190px Inter, Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("✱", 128, 140);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  g.add(em(caixa(0.7, 0.7, 0.04, "#D6B45A", 0.01), 0, 1.6, 0));
  const tela = em(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ map: tex })), 0, 1.6, -0.025);
  tela.rotation.y = Math.PI;
  g.add(tela);
  return sombra(g);
}

// ------------------------------------------------------------ lazer
const CORES_BOLAS = ["#F0C828", "#2850C8", "#D22828", "#7832A0", "#F08220", "#1E8C3C", "#821E28", "#141414", "#F0C828", "#2850C8"];

export function sinuca() {
  const g = new THREE.Group();
  const mesaG = new THREE.Group();
  g.add(mesaG);
  mesaG.add(em(caixa(3.2, 0.5, 1.8, COR.nogueira, 0.08), 0, 0.55, 0));
  mesaG.add(em(caixa(2.9, 0.04, 1.5, COR.feltro, 0.01), 0, 0.81, 0));
  for (const [x, z] of [[-1.55, -0.85], [1.55, -0.85], [-1.55, 0.85], [1.55, 0.85]]) mesaG.add(em(caixa(0.22, 0.32, 0.22, COR.nogueiraClara, 0.05), x * 0.92, 0.16, z * 0.85));
  for (const [x, z] of [[-1.42, -0.72], [0, -0.74], [1.42, -0.72], [-1.42, 0.72], [0, 0.74], [1.42, 0.72]])
    mesaG.add(em(cilindro(0.065, 0.065, 0.02, "#0A0A0A", 16), x, 0.83, z));
  const bolas = [];
  const geo = new THREE.SphereGeometry(0.045, 16, 12);
  let k = 0;
  for (let fila = 0; fila < 4; fila++)
    for (let j = 0; j <= fila; j++) {
      const b = em(new THREE.Mesh(geo, mat(CORES_BOLAS[k++ % 10], { roughness: 0.25 })), 0.7 + fila * 0.08, 0.875, -fila * 0.047 + j * 0.094);
      b.castShadow = true;
      b.userData.casa = b.position.clone();
      bolas.push(b);
      mesaG.add(b);
    }
  const branca = em(new THREE.Mesh(geo, mat("#FAFAF6", { roughness: 0.25 })), -0.7, 0.875, 0);
  branca.userData.casa = branca.position.clone();
  bolas.push(branca);
  mesaG.add(branca);
  sombra(mesaG);
  return { grupo: g, mesa: mesaG, bolas };
}

export function pingpong() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 288;
  const x = c.getContext("2d");
  x.fillStyle = COR.ping;
  x.fillRect(0, 0, 512, 288);
  x.strokeStyle = "#FFFFFF";
  x.lineWidth = 8;
  x.strokeRect(6, 6, 500, 276);
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(6, 144);
  x.lineTo(506, 144);
  x.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const topo = em(caixa(2.74, 0.05, 1.52, COR.ping, 0.015), 0, 0.76, 0);
  g.add(topo);
  const pintura = em(new THREE.Mesh(new THREE.PlaneGeometry(2.72, 1.5), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })), 0, 0.786, 0);
  pintura.rotation.x = -Math.PI / 2;
  g.add(pintura);
  for (const [px, pz] of [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]]) g.add(em(caixa(0.06, 0.74, 0.06, COR.preto, 0.015), px, 0.37, pz));
  g.add(em(caixa(0.02, 0.16, 1.7, "#E8E8E8", 0.005, { transparent: true, opacity: 0.85 }), 0, 0.87, 0));
  g.add(em(caixa(0.03, 0.03, 1.72, COR.tinta, 0.01), 0, 0.95, 0));
  const bola = em(new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 10), mat("#FF8A1E", { roughness: 0.3 })), -1.1, 0.95, 0);
  bola.visible = false;
  g.add(bola);
  for (const s of [-1, 1]) {
    const raquete = new THREE.Group();
    raquete.add(em(cilindro(0.09, 0.09, 0.015, s < 0 ? "#C0392B" : COR.tinta, 20), 0, 0, 0));
    raquete.add(em(caixa(0.03, 0.015, 0.1, COR.carvalho, 0.005), 0, 0, 0.12));
    raquete.position.set(s * 1.15, 0.8, 0.5);
    g.add(raquete);
  }
  return { grupo: sombra(g), bola };
}

export function arcade() {
  const g = new THREE.Group();
  g.add(em(caixa(0.75, 1.75, 0.7, COR.tinta, 0.06), 0, 0.875, 0));
  const tela = em(new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.42), mat("#1d2b53", { emissive: "#3b6dff", emissiveIntensity: 0.9 })), 0, 1.3, -0.355);
  tela.rotation.y = Math.PI;
  g.add(tela);
  g.add(em(caixa(0.7, 0.12, 0.3, COR.laranja, 0.03), 0, 0.98, -0.4));
  for (const [x, c] of [[-0.15, "#FFD23F"], [0.05, "#2ECC71"], [0.18, "#3498DB"]]) g.add(em(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat(c)), x, 1.06, -0.44));
  const luz = new THREE.PointLight("#5b8bff", 0.9, 2.2, 2);
  luz.position.set(0, 1.3, -0.8);
  g.add(luz);
  return sombra(g);
}

// ------------------------------------------------------------ texturas de canvas
export function texturaCanvas(w, h, desenhar) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  desenhar(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function tapeteLogo(w = 6, d = 2) {
  const tex = texturaCanvas(1200, 400, (x, W, H) => {
    x.fillStyle = COR.creme;
    x.beginPath();
    x.roundRect(8, 8, W - 16, H - 16, 40);
    x.fill();
    x.strokeStyle = COR.tinta;
    x.lineWidth = 8;
    x.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  const img = new Image();
  img.onload = () => {
    const c = tex.image;
    const x = c.getContext("2d");
    const lw = 900, lh = (img.height / img.width) * lw;
    x.drawImage(img, (c.width - lw) / 2, (c.height - lh) / 2, lw, lh);
    tex.needsUpdate = true;
  };
  img.src = "assets/logo.png";
  return m;
}

export function tvPainel() {
  const tex = texturaCanvas(640, 360, (x, W, H) => {
    x.fillStyle = COR.tinta;
    x.fillRect(0, 0, W, H);
    x.fillStyle = COR.creme;
    x.font = "700 28px Inter, Arial";
    x.fillText("painel do estúdio", 34, 54);
    x.font = "600 18px Inter, Arial";
    x.globalAlpha = 0.6;
    x.fillText("leads da semana", 34, 84);
    x.globalAlpha = 1;
    [70, 110, 90, 150, 130, 190, 170].forEach((h, i) => {
      x.fillStyle = COR.laranja;
      x.fillRect(40 + i * 46, 320 - h, 30, h);
    });
    x.strokeStyle = COR.creme;
    x.lineWidth = 4;
    x.beginPath();
    [[400, 260], [450, 210], [500, 230], [560, 150], [600, 120]].forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
    x.stroke();
  });
  const g = new THREE.Group();
  g.add(em(caixa(2.0, 1.15, 0.06, "#0d0d0f", 0.03), 0, 1.5, 0));
  const tela = em(new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.05), new THREE.MeshStandardMaterial({ map: tex, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: 0.35 })), 0, 1.5, -0.035);
  tela.rotation.y = Math.PI;
  g.add(tela);
  return sombra(g);
}

export function impressora() {
  const g = new THREE.Group();
  g.add(em(caixa(0.6, 0.7, 0.5, "#E6E6E2", 0.05), 0, 0.35, 0));
  g.add(em(caixa(0.4, 0.03, 0.25, COR.branco, 0.01), 0, 0.72, 0));
  return sombra(g);
}

export function balcaoRecepcao() {
  const g = new THREE.Group();
  g.add(em(caixa(2.6, 1.0, 0.7, COR.tinta, 0.06), 0, 0.5, 0));
  g.add(em(caixa(2.7, 0.06, 0.8, COR.carvalho, 0.02), 0, 1.03, 0));
  const tex = texturaCanvas(256, 128, (x) => {
    x.fillStyle = COR.tinta;
    x.fillRect(0, 0, 256, 128);
    x.fillStyle = COR.laranja;
    x.font = "800 96px Inter, Arial";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("✱", 128, 70);
  });
  const ast = em(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshStandardMaterial({ map: tex })), 0, 0.55, 0.356);
  g.add(ast);
  return sombra(g);
}

export function porta() {
  // Folha que gira na dobradiça (pivô na esquerda)
  const pivo = new THREE.Group();
  const folha = em(caixa(1.9, 2.1, 0.08, COR.nogueira, 0.03), 0.95, 1.05, 0);
  pivo.add(folha);
  const placa = texturaCanvas(256, 64, (x) => {
    x.fillStyle = "#D6B45A";
    x.fillRect(0, 0, 256, 64);
    x.fillStyle = COR.tinta;
    x.font = "700 34px Inter, Arial";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("Mateus", 128, 34);
  });
  pivo.add(em(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), new THREE.MeshStandardMaterial({ map: placa })), 0.95, 1.6, 0.045));
  pivo.add(em(new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), mat("#D6B45A", { metalness: 0.6, roughness: 0.3 })), 1.7, 1.0, 0.07));
  return sombra(pivo);
}
