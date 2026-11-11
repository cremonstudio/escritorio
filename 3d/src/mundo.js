// Monta o escritório 3D a partir da planta: piso, paredes em corte (altas no fundo, baixas na frente) e móveis.
import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { LARGURA, ALTURA, parede, SALAS } from "./planta.js";
import * as M from "./moveis.js";
import { COR, mat, caixa, texturaCanvas } from "./moveis.js";

const ROT = { norte: Math.PI, sul: 0, leste: -Math.PI / 2, oeste: Math.PI / 2 }; // para onde fica a frente (-z no modelo)

function texturaTaco(base, escuro, claro) {
  const t = texturaCanvas(512, 512, (x, W, H) => {
    x.fillStyle = base;
    x.fillRect(0, 0, W, H);
    const fileiras = 8;
    for (let r = 0; r < fileiras; r++) {
      const y = (r * H) / fileiras;
      let px = -((r * 137) % 200);
      while (px < W) {
        const w = 160 + ((r * 31 + px) % 120);
        x.fillStyle = (r + Math.floor(px / 90)) % 3 === 0 ? escuro : (r % 2 ? claro : base);
        x.globalAlpha = 0.55;
        x.fillRect(px + 2, y + 2, w - 4, H / fileiras - 4);
        x.globalAlpha = 1;
        x.fillStyle = "rgba(60,35,15,.18)";
        x.fillRect(px, y, 2, H / fileiras);
        px += w;
      }
      x.fillStyle = "rgba(60,35,15,.22)";
      x.fillRect(0, y, W, 2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function texturaLadrilho() {
  const t = texturaCanvas(256, 256, (x, W) => {
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        x.fillStyle = (i + j) % 2 ? "#EFE7DA" : "#E2D6C4";
        x.fillRect(i * 64, j * 64, 64, 64);
      }
    x.strokeStyle = "rgba(0,0,0,.08)";
    for (let i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, W); x.stroke();
      x.beginPath(); x.moveTo(0, i * 64); x.lineTo(W, i * 64); x.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function texturaLisa(cor, ruido = 0.05) {
  const t = texturaCanvas(256, 256, (x, W, H) => {
    x.fillStyle = cor;
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < 1800; i++) {
      x.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${ruido})` : `rgba(255,255,255,${ruido})`;
      x.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const PISOS = {
  carvalho: () => texturaTaco("#D2A672", "#BF8F5C", "#DDB683"),
  nogueira: () => texturaTaco("#7A4E2E", "#64402A", "#8A5A36"),
  carpete: () => texturaLisa("#9AA0A6", 0.06),
  ladrilho: () => texturaLadrilho(),
  pedra: () => texturaLisa("#E4DDD2", 0.04),
};

export function montarMundo(cena, grade) {
  const interativos = [];
  const raiz = new THREE.Group();
  cena.add(raiz);
  const por = (obj, x, z, rot = 0, y = 0) => {
    obj.position.set(x, y, z);
    obj.rotation.y = rot;
    raiz.add(obj);
    return obj;
  };

  // ---------------------------------------------------- chão em volta e piso
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat("#E7DCCB", { roughness: 1 }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(LARGURA / 2, -0.06, ALTURA / 2);
  chao.receiveShadow = true;
  cena.add(chao);
  const base = new THREE.Mesh(new THREE.BoxGeometry(LARGURA + 0.4, 0.12, ALTURA + 0.4), mat("#CDBFA9"));
  base.position.set(LARGURA / 2, -0.06, ALTURA / 2);
  base.receiveShadow = true;
  raiz.add(base);
  const piso = (x, z, w, d, tipo, y = 0.001) => {
    const tex = PISOS[tipo]();
    tex.repeat.set(w / 3, d / 3);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x + w / 2, y, z + d / 2);
    m.receiveShadow = true;
    raiz.add(m);
  };
  piso(0, 0, LARGURA, ALTURA, "carvalho");
  for (const s of Object.values(SALAS)) if (s.piso !== "carvalho") piso(s.x, s.y, s.w, s.h, s.piso, 0.003);

  // ---------------------------------------------------- paredes
  const corParede = mat("#F1E9DC");
  const corTopo = mat(COR.tinta);
  const ESP = 0.22;
  for (let y = 0; y < ALTURA; y++)
    for (let x = 0; x < LARGURA; x++) {
      if (!parede(x, y)) continue;
      const alta = y === 0 || x === 0;
      const h = alta ? 2.6 : 0.55;
      const pecas = [[ESP, ESP, 0, 0]];
      if (parede(x + 1, y)) pecas.push([0.5 + ESP / 2, ESP, 0.25 + ESP / 4, 0]);
      if (parede(x - 1, y)) pecas.push([0.5 + ESP / 2, ESP, -0.25 - ESP / 4, 0]);
      if (parede(x, y + 1)) pecas.push([ESP, 0.5 + ESP / 2, 0, 0.25 + ESP / 4]);
      if (parede(x, y - 1)) pecas.push([ESP, 0.5 + ESP / 2, 0, -0.25 - ESP / 4]);
      for (const [w, d, ox, oz] of pecas) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), corParede);
        m.position.set(x + 0.5 + ox, h / 2, y + 0.5 + oz);
        m.castShadow = m.receiveShadow = true;
        raiz.add(m);
        const topo = new THREE.Mesh(new THREE.BoxGeometry(w + 0.01, 0.04, d + 0.01), corTopo);
        topo.position.set(x + 0.5 + ox, h + 0.02, y + 0.5 + oz);
        raiz.add(topo);
      }
    }
  // rodapé laranja na parede do fundo (detalhe da marca)
  for (const [x0, x1] of [[1, 14], [15, 28], [29, 43]]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.08, 0.02), mat(COR.laranja));
    r.position.set((x0 + x1) / 2, 0.04, 0.62);
    raiz.add(r);
  }

  // janelas na parede do fundo
  const janela = (x, z, largura, rot = 0) => {
    const g = new THREE.Group();
    const moldura = caixa(largura, 1.4, 0.06, COR.tinta, 0.02);
    moldura.position.set(0, 1.45, 0);
    g.add(moldura);
    const vidro = new THREE.Mesh(new THREE.PlaneGeometry(largura - 0.12, 1.28), mat("#BFE0F0", { emissive: "#BFE0F0", emissiveIntensity: 0.5 }));
    vidro.position.set(0, 1.45, 0.035);
    g.add(vidro);
    const nPaineis = Math.max(1, Math.round(largura / 1.2));
    for (let i = 1; i < nPaineis; i++) {
      const barra = caixa(0.04, 1.3, 0.04, COR.tinta, 0.01);
      barra.position.set(-largura / 2 + (i * largura) / nPaineis, 1.45, 0.04);
      g.add(barra);
    }
    por(g, x, z, rot);
  };
  janela(5.5, 0.64, 5.2); // janelão da sua sala
  janela(37, 0.64, 4);
  janela(0.64, 16, 3.5, Math.PI / 2);

  // ---------------------------------------------------- placas dos setores
  const placa = (texto, x, z, y = 2.3) => {
    const div = document.createElement("div");
    div.className = "placa";
    div.textContent = texto;
    const o = new CSS2DObject(div);
    o.position.set(x, y, z);
    raiz.add(o);
  };
  placa("Sala do Mateus", 7, 1.2, 3.0);
  placa("Reunião", 21, 1.2, 3.0);
  placa("Copa", 35.5, 1.2, 3.0);
  placa("Prospecção", 5, 12);
  placa("Prévias", 17, 12);
  placa("Qualidade", 28, 12);
  placa("Design e copy", 38, 12);
  placa("Mural", 5.5, 22.8);
  placa("Recepção", 16.5, 22.8);
  placa("Lazer", 32.5, 22.8);

  const bloq = (cx, cz, w, d) => grade.bloquear(cx, cz, w, d);
  // assentos: onde dá pra sentar (rot = para onde a pessoa olha; mesa = senta e trabalha no computador)
  const assentos = [];
  const assento = (x, z, rot, mesa = false) => assentos.push({ x, z, rot, mesa, quem: null });

  // ---------------------------------------------------- sua sala
  const tapeteSala = new THREE.Mesh(new THREE.CircleGeometry(2.1, 40), mat("#8D8A84", { roughness: 1 }));
  tapeteSala.rotation.x = -Math.PI / 2;
  por(tapeteSala, 6.5, 5.2, 0, 0.006);
  por(M.mesaMateus(), 6.5, 4.6, 0); bloq(6.5, 4.6, 1.8, 0.85);
  por(M.cadeira({ cor: "#C5C8CB", encosto: "#B4B7BA", alta: true }), 6.5, 5.55, 0);
  assento(6.5, 5.55, 0, true);
  por(M.estanteLed(), 11.2, 0.84, ROT.sul + Math.PI); bloq(11.2, 0.84, 1.6, 0.4);
  por(M.quadroAsterisco(), 13.1, 0.66, ROT.sul + Math.PI);
  por(M.poltrona("#E8DCC8"), 11.6, 4.6, ROT.oeste);
  por(M.poltrona("#E8DCC8"), 11.6, 6.6, ROT.oeste);
  assento(11.6, 4.6, ROT.oeste);
  assento(11.6, 6.6, ROT.oeste);
  por(M.mesaRedonda(COR.carvalho), 11.6, 5.6).scale.set(0.7, 0.62, 0.7);
  bloq(11.6, 5.6, 1, 3);
  por(M.planta(1.2, true), 1.6, 1.6); bloq(1.6, 1.6, 0.6, 0.6);
  por(M.planta(1, true), 12.8, 8.6); bloq(12.8, 8.6, 0.6, 0.6);
  por(M.planta(0.9), 1.5, 8.6); bloq(1.5, 8.6, 0.5, 0.5);

  // porta da sua sala
  const folha = por(M.porta(), 6.05, 10.5, 0);
  const porta = { aberta: false, folha, alvo: 0 };
  grade.bloquear(7, 10.5, 2, 0.6);

  // ---------------------------------------------------- reunião
  por(M.mesaReuniao(4.2), 21, 5.6); bloq(21, 5.6, 1.3, 4.2);
  for (const z of [4.3, 5.2, 6.1, 7.0]) {
    por(M.cadeira({ cor: COR.tinta, encosto: "#2b2a29" }), 19.9, z, ROT.leste);
    por(M.cadeira({ cor: COR.tinta, encosto: "#2b2a29" }), 22.1, z, ROT.oeste);
    assento(19.9, z, ROT.leste);
    assento(22.1, z, ROT.oeste);
  }
  por(M.quadroBranco(2.4), 21, 0.66, Math.PI);
  por(M.planta(1.1, true), 15.7, 1.7); bloq(15.7, 1.7, 0.6, 0.6);
  por(M.planta(1), 27.2, 8.6); bloq(27.2, 8.6, 0.5, 0.5);

  // ---------------------------------------------------- copa
  por(M.balcao(5), 29.0, 4.9); bloq(29.3, 4.9, 0.7, 5);
  const maquina = por(M.maquinaCafe(), 29.05, 3.0, ROT.leste);
  por(M.geladeira(), 29.05, 8.3, ROT.leste); bloq(29.3, 8.3, 0.7, 0.7);
  for (const [cx, cz] of [[35, 5], [39, 5]]) {
    por(M.mesaRedonda(), cx, cz); bloq(cx, cz, 0.8, 0.8);
    for (const [dx, dz] of [[-0.75, 0], [0.75, 0], [0, -0.75], [0, 0.75]]) por(M.banqueta(dx < 0 ? COR.laranja : "#E8DCC8"), cx + dx, cz + dz);
  }
  por(M.planta(1.2, true), 42, 1.7); bloq(42, 1.7, 0.6, 0.6);
  por(M.planta(1), 42, 8.6); bloq(42, 8.6, 0.5, 0.5);

  // ---------------------------------------------------- open space: setores
  const ilha = (cx, cz) => {
    por(M.mesa({ w: 2.6, d: 1.4, cor: COR.carvalho }), cx, cz); bloq(cx, cz, 2.6, 1.4);
    por(caixa(2.5, 0.32, 0.04, COR.creme, 0.015), cx, cz, 0, 0.93);
    for (const s of [-1, 1]) {
      por(M.monitor(), cx + s * 0.65, cz - 0.25, 0);
      por(M.monitor(), cx + s * 0.65, cz + 0.25, Math.PI);
      por(M.cadeira(), cx + s * 0.65, cz - 1.05, Math.PI);
      por(M.cadeira(), cx + s * 0.65, cz + 1.05, 0);
      assento(cx + s * 0.65, cz - 1.05, Math.PI, true);
      assento(cx + s * 0.65, cz + 1.05, 0, true);
    }
    por(M.caneca(COR.laranja), cx - 1.05, cz - 0.4);
  };
  ilha(5, 16);
  ilha(28, 16);
  ilha(38, 16);
  // Prévias: bancada longa
  por(M.mesa({ w: 4.6, d: 1.0, cor: COR.carvalho }), 17, 15.65); bloq(17, 15.65, 4.6, 1.0);
  for (const x of [15.5, 17, 18.5]) {
    por(M.monitor({ largo: 0.8 }), x, 15.9, 0);
    por(M.cadeira(), x, 14.85, Math.PI);
    assento(x, 14.85, Math.PI, true);
  }
  por(M.notebook(COR.cinzaClaro), 16.2, 15.45, Math.PI);
  for (const x of [11.5, 22.5, 33.5]) {
    por(M.planta(1.1, true), x, 13.2); bloq(x, 13.2, 0.6, 0.6);
    por(M.planta(0.9), x, 19.3); bloq(x, 19.3, 0.5, 0.5);
  }
  por(M.impressora(), 42.2, 12.3); bloq(42.2, 12.3, 0.6, 0.5);

  // ---------------------------------------------------- mural
  por(M.tvPainel(), 0.66, 25.5, ROT.leste);
  por(M.poltrona(COR.laranja), 3.8, 24.6, ROT.oeste);
  por(M.poltrona("#E8DCC8"), 3.8, 26.4, ROT.oeste);
  assento(3.8, 24.6, ROT.oeste);
  assento(3.8, 26.4, ROT.oeste);
  bloq(3.8, 25.5, 0.8, 2.6);
  por(M.planta(1.2, true), 9.6, 29.4); bloq(9.6, 29.4, 0.6, 0.6);
  por(M.planta(0.9), 1.5, 29.5); bloq(1.5, 29.5, 0.5, 0.5);

  // ---------------------------------------------------- recepção
  por(M.tapeteLogo(6, 2), 16.5, 26.6, 0, 0.006);
  por(M.balcaoRecepcao(), 16.5, 23.6); bloq(16.5, 23.6, 2.6, 0.7);
  por(M.planta(1.2, true), 12.6, 22.8); bloq(12.6, 22.8, 0.6, 0.6);
  por(M.planta(1.2, true), 21.4, 22.8); bloq(21.4, 22.8, 0.6, 0.6);
  por(M.poltrona("#E8DCC8"), 20.8, 28.1, ROT.oeste);
  por(M.poltrona(COR.laranja), 20.8, 29.3, ROT.oeste);
  assento(20.8, 28.1, ROT.oeste);
  assento(20.8, 29.3, ROT.oeste);
  bloq(20.8, 28.7, 0.8, 2);

  // ---------------------------------------------------- lazer
  const sinuca = M.sinuca();
  por(sinuca.grupo, 27.5, 26.5); bloq(27.5, 26.5, 3.2, 1.8);
  const ping = M.pingpong();
  por(ping.grupo, 33.5, 26.5); bloq(33.5, 26.5, 2.74, 1.52);
  por(M.sofa(2.6, "#E8DCC8"), 39.6, 22.55, Math.PI); bloq(39.6, 22.55, 2.6, 0.85);
  assento(39.0, 22.6, Math.PI);
  assento(40.2, 22.6, Math.PI);
  por(M.mesinha(1.1, 0.55), 39.6, 23.9); bloq(39.6, 23.9, 1.1, 0.55);
  por(M.poltrona(COR.laranja), 41.8, 24.4, ROT.oeste); bloq(41.8, 24.4, 0.8, 0.8);
  assento(41.8, 24.4, ROT.oeste);
  por(M.arcade(), 42.1, 28.9, ROT.oeste); bloq(42.1, 28.9, 0.7, 0.75);
  por(M.planta(1.2, true), 37.2, 22.6); bloq(37.2, 22.6, 0.6, 0.6);
  por(M.planta(1.2, true), 23.6, 29.4); bloq(23.6, 29.4, 0.6, 0.6);
  const tapeteLazer = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 4.2), mat("#E9DFCF", { roughness: 1 }));
  tapeteLazer.rotation.x = -Math.PI / 2;
  por(tapeteLazer, 30.5, 26.5, 0, 0.005);

  return { raiz, porta, sinuca, ping, maquina, interativos, assentos };
}
