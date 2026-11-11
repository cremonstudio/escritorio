// Bonecos 3D estilo chibi (cabeça grande, corpo pequeno), com animação de andar, falar e gestos.
import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { caixa, mat, COR } from "./moveis.js";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function membro(r, comp, cor) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, comp, 4, 10), mat(cor));
  m.castShadow = true;
  return m;
}

function cabelo(estilo, cor) {
  const g = new THREE.Group();
  const m = mat(cor, { roughness: 0.6 });
  const calota = new THREE.Mesh(new THREE.SphereGeometry(0.335, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), m);
  calota.position.y = 0.02;
  calota.rotation.x = -0.25;
  g.add(calota);
  if (estilo === "rabo") {
    const rabo = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.32, 4, 10), m);
    rabo.position.set(0, -0.08, 0.32);
    rabo.rotation.x = 0.5;
    g.add(rabo);
    const prendedor = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.025, 8, 16), mat(COR.laranja));
    prendedor.position.set(0, 0.1, 0.3);
    g.add(prendedor);
    for (const s of [-1, 1]) {
      const mecha = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.2, 4, 8), m);
      mecha.position.set(s * 0.29, -0.08, -0.05);
      g.add(mecha);
    }
  } else if (estilo === "baguncado") {
    for (let i = 0; i < 7; i++) {
      const tufo = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 6), m);
      const a = (i / 7) * Math.PI * 2;
      tufo.position.set(Math.cos(a) * 0.18, 0.27, Math.sin(a) * 0.18 - 0.02);
      tufo.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
      g.add(tufo);
    }
  } else if (estilo === "grisalho") {
    calota.scale.set(1, 0.75, 1);
    for (const s of [-1, 1]) {
      const lado = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), m);
      lado.position.set(s * 0.29, -0.02, 0.05);
      g.add(lado);
    }
  } else if (estilo === "curto") {
    calota.scale.set(1, 0.85, 1);
  }
  return g;
}

export class Pessoa {
  constructor(cena, { nome, pele = "#E8B98F", cabelo: corCabelo = "#3B2A20", estilo = "curto", camisa = COR.creme, calca = COR.tinta, sapato = COR.tinta, oculos = false, bigode = false, voce = false }) {
    this.nome = nome;
    this.grupo = new THREE.Group();
    this.corpo = new THREE.Group();
    this.grupo.add(this.corpo);
    cena.add(this.grupo);

    // pernas (pivô no quadril)
    this.pernas = [-1, 1].map((s) => {
      const p = new THREE.Group();
      p.position.set(s * 0.1, 0.42, 0);
      const perna = membro(0.075, 0.26, calca);
      perna.position.y = -0.2;
      p.add(perna);
      const pe = caixa(0.14, 0.07, 0.2, sapato, 0.03);
      pe.position.set(0, -0.4, -0.03);
      p.add(pe);
      this.corpo.add(p);
      return p;
    });
    // tronco
    const tronco = caixa(0.42, 0.42, 0.28, camisa, 0.11);
    tronco.position.y = 0.62;
    tronco.castShadow = true;
    this.corpo.add(tronco);
    this.tronco = tronco;
    // braços (pivô no ombro)
    this.bracos = [-1, 1].map((s) => {
      const b = new THREE.Group();
      b.position.set(s * 0.26, 0.78, 0);
      const braco = membro(0.06, 0.24, camisa);
      braco.position.y = -0.17;
      b.add(braco);
      const mao = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mat(pele));
      mao.position.y = -0.34;
      mao.castShadow = true;
      b.add(mao);
      this.corpo.add(b);
      return b;
    });
    // cabeça
    this.cabeca = new THREE.Group();
    this.cabeca.position.y = 1.16;
    const rosto = new THREE.Mesh(new THREE.SphereGeometry(0.32, 28, 20), mat(pele, { roughness: 0.6 }));
    rosto.scale.set(1, 0.95, 0.95);
    rosto.castShadow = true;
    this.cabeca.add(rosto);
    for (const s of [-1, 1]) {
      const olho = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), mat("#1a1a1a", { roughness: 0.3 }));
      olho.scale.set(1, 1.35, 0.6);
      olho.position.set(s * 0.11, 0.02, -0.29);
      this.cabeca.add(olho);
      const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), mat("#ffffff", { emissive: "#ffffff" }));
      brilho.position.set(s * 0.11 + 0.012, 0.045, -0.315);
      this.cabeca.add(brilho);
      const bochecha = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat("#F08A7A", { transparent: true, opacity: 0.45 }));
      bochecha.scale.set(1, 0.6, 0.3);
      bochecha.position.set(s * 0.19, -0.07, -0.26);
      this.cabeca.add(bochecha);
    }
    const boca = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 6, 12, Math.PI), mat("#7a3b2e"));
    boca.position.set(0, -0.09, -0.3);
    boca.rotation.z = Math.PI;
    this.cabeca.add(boca);
    this.boca = boca;
    if (oculos)
      for (const s of [-1, 1]) {
        const aro = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 8, 18), mat(COR.tinta));
        aro.position.set(s * 0.11, 0.02, -0.31);
        this.cabeca.add(aro);
      }
    if (bigode) {
      const b = caixa(0.18, 0.04, 0.05, corCabelo, 0.02);
      b.position.set(0, -0.055, -0.3);
      this.cabeca.add(b);
    }
    const cab = cabelo(estilo, corCabelo);
    this.cabeca.add(cab);
    this.corpo.add(this.cabeca);
    // sombra suave no chão
    const sombra = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.12 }));
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = 0.012;
    this.grupo.add(sombra);

    // nome e fala (HTML nítido em cima da cabeça)
    const etiqueta = document.createElement("div");
    etiqueta.className = "nome" + (voce ? " voce" : "");
    etiqueta.textContent = nome;
    this.etiqueta = new CSS2DObject(etiqueta);
    this.etiqueta.position.set(0, 1.62, 0);
    this.grupo.add(this.etiqueta);
    this.balaoDiv = document.createElement("div");
    this.balao = new CSS2DObject(this.balaoDiv);
    this.balao.position.set(0, 1.95, 0);
    this.balao.visible = false;
    this.grupo.add(this.balao);

    this.caminho = [];
    this.velocidade = 2.6;
    this.andando = false;
    this.t = Math.random() * 10;
    this.gesto = null;
    this.direcao = 0;
    this.chegou = null;
  }

  get pos() {
    return [this.grupo.position.x, this.grupo.position.z];
  }

  colocar(x, z, rot = 0) {
    this.grupo.position.set(x, 0, z);
    this.direcao = rot;
    this.grupo.rotation.y = rot;
  }

  /** Anda pelo caminho (lista de [x, z]); resolve quando chega. */
  seguir(pontos) {
    this.caminho = pontos ? [...pontos] : [];
    return new Promise((ok) => {
      this.chegou?.();
      this.chegou = ok;
      if (!this.caminho.length) {
        this.chegou = null;
        ok();
      }
    });
  }

  olharPara(x, z) {
    const [px, pz] = this.pos;
    this.direcao = Math.atan2(-(x - px), -(z - pz));
  }

  async falar(texto, ms) {
    const dur = ms ?? Math.min(6500, Math.max(2200, texto.length * 60));
    this.balaoDiv.innerHTML = "";
    const div = document.createElement("div");
    div.className = "fala";
    const b = document.createElement("b");
    b.textContent = this.nome;
    div.append(b, document.createTextNode(texto));
    this.balaoDiv.append(div);
    this.balao.visible = true;
    this.falando = performance.now() + dur;
    await esperar(dur);
    if (performance.now() >= this.falando - 50) this.balao.visible = false;
  }

  /** Gestos curtos: "comemorar", "tapa", "sacar", "pensar". */
  gestar(nome, ms = 900) {
    this.gesto = { nome, ate: performance.now() + ms, inicio: performance.now() };
  }

  atualizar(dt) {
    this.t += dt;
    // movimento
    if (this.caminho.length) {
      const [tx, tz] = this.caminho[0];
      const [px, pz] = this.pos;
      const dx = tx - px, dz = tz - pz;
      const dist = Math.hypot(dx, dz);
      const passo = this.velocidade * dt;
      if (dist <= passo) {
        this.grupo.position.x = tx;
        this.grupo.position.z = tz;
        this.caminho.shift();
        if (!this.caminho.length) {
          const ok = this.chegou;
          this.chegou = null;
          ok?.();
        }
      } else {
        this.grupo.position.x += (dx / dist) * passo;
        this.grupo.position.z += (dz / dist) * passo;
        this.direcao = Math.atan2(-dx, -dz);
      }
      this.andando = true;
    } else {
      this.andando = Boolean(this.empurrado); // andando pelo teclado
    }
    // vira suave
    let d = this.direcao - this.grupo.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.grupo.rotation.y += d * Math.min(1, dt * 12);

    // animação
    const ciclo = this.t * 11;
    if (this.andando) {
      const s = Math.sin(ciclo);
      this.pernas[0].rotation.x = s * 0.7;
      this.pernas[1].rotation.x = -s * 0.7;
      this.bracos[0].rotation.x = -s * 0.6;
      this.bracos[1].rotation.x = s * 0.6;
      this.corpo.position.y = Math.abs(Math.cos(ciclo)) * 0.06;
      this.cabeca.rotation.z = Math.sin(ciclo) * 0.04;
    } else {
      for (const p of this.pernas) p.rotation.x *= 0.8;
      for (const b of this.bracos) b.rotation.x *= 0.85;
      this.bracos[0].rotation.z = 0;
      this.bracos[1].rotation.z = 0;
      this.corpo.position.y = Math.sin(this.t * 2.2) * 0.012;
      this.cabeca.rotation.z = Math.sin(this.t * 1.3) * 0.03;
    }
    // falando: cabeça mexe um pouco e boca abre
    const falando = this.balao.visible;
    this.boca.scale.y = falando ? 1 + Math.abs(Math.sin(this.t * 14)) * 1.4 : 1;
    if (falando && !this.andando) this.cabeca.rotation.x = Math.sin(this.t * 5) * 0.05;
    else this.cabeca.rotation.x *= 0.9;

    // gestos
    if (this.gesto) {
      const agora = performance.now();
      const k = (agora - this.gesto.inicio) / (this.gesto.ate - this.gesto.inicio);
      if (k >= 1) this.gesto = null;
      else if (this.gesto.nome === "comemorar") {
        this.bracos[0].rotation.z = -2.6;
        this.bracos[1].rotation.z = 2.6;
        this.corpo.position.y = Math.abs(Math.sin(k * Math.PI * 4)) * 0.25;
      } else if (this.gesto.nome === "tapa") {
        this.bracos[1].rotation.x = k < 0.4 ? -2.6 * (k / 0.4) : -2.6 + 3.4 * Math.min(1, (k - 0.4) / 0.15);
      } else if (this.gesto.nome === "sacar") {
        this.bracos[1].rotation.x = -1.2 - Math.sin(k * Math.PI) * 1.2;
      } else if (this.gesto.nome === "pensar") {
        this.bracos[1].rotation.x = -2.0;
        this.bracos[1].rotation.z = 0.6;
        this.cabeca.rotation.z = 0.15;
      } else if (this.gesto.nome === "acenar") {
        this.bracos[1].rotation.z = 2.5 + Math.sin(k * Math.PI * 6) * 0.35;
      }
    }
  }
}

export const ELENCO = {
  helena: { nome: "Helena", pele: "#F1C7A3", cabelo: "#C2502E", estilo: "rabo", camisa: "#FFFFFF", calca: "#2F3A4A" },
  sobrinho: { nome: "Sobrinho", pele: "#D9A27A", cabelo: "#4A2E1F", estilo: "baguncado", camisa: COR.laranja, calca: "#2D4E8A", sapato: "#F4F4F0" },
  tio: { nome: "Tio", pele: "#EBC09C", cabelo: "#E4E4E0", estilo: "grisalho", camisa: "#4F7A45", calca: "#5A4A3C", oculos: true, bigode: true },
  voce: { nome: "Você", pele: "#E8B98F", cabelo: "#4A3426", estilo: "curto", camisa: COR.creme, calca: COR.tinta, voce: true },
};
