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
  constructor(cena, { nome, pele = "#E8B98F", cabelo: corCabelo = "#3B2A20", estilo = "curto", camisa = COR.creme, calca = COR.tinta, sapato = COR.tinta, oculos = false, bigode = false, voce = false, membro: temConta = false }) {
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
    // objetos de mão (aparecem nas ações)
    this.caneca = new THREE.Group();
    const corpoCaneca = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.12, 16), mat(COR.laranja));
    const alca = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 12), mat(COR.laranja));
    alca.position.set(0.06, 0, 0);
    this.caneca.add(corpoCaneca, alca);
    this.caneca.position.set(0, -0.4, -0.06);
    this.caneca.visible = false;
    this.bracos[1].add(this.caneca);
    this.celular = caixa(0.07, 0.15, 0.02, COR.tinta, 0.01);
    this.celular.position.set(-0.03, -0.38, -0.05);
    this.celular.visible = false;
    this.bracos[1].add(this.celular);
    // cabeça
    this.cabeca = new THREE.Group();
    this.cabeca.position.y = 1.16;
    const rosto = new THREE.Mesh(new THREE.SphereGeometry(0.32, 28, 20), mat(pele, { roughness: 0.6 }));
    rosto.scale.set(1, 0.95, 0.95);
    rosto.castShadow = true;
    this.cabeca.add(rosto);
    this.olhos = [];
    for (const s of [-1, 1]) {
      const olho = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), mat("#1a1a1a", { roughness: 0.3 }));
      olho.scale.set(1, 1.35, 0.6);
      olho.position.set(s * 0.11, 0.02, -0.29);
      this.cabeca.add(olho);
      this.olhos.push(olho);
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
    etiqueta.className = "nome" + (voce ? " voce" : "") + (temConta ? " membro" : "");
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

  // ------------------------------------------------------------ ações
  /**
   * Ações de uma vez: pular, acenar, cafe, espreguicar, bocejar, joinha, facepalm, comemorar,
   * sacar, tapa, pensar. Ações contínuas (até mexer): dancar, celular.
   */
  gestar(nome, ms) {
    const DUR = { pular: 700, acenar: 1300, cafe: 3400, espreguicar: 2200, bocejar: 1900, joinha: 1400, facepalm: 1800, comemorar: 1700, sacar: 500, tapa: 700, pensar: 1600 };
    const continua = nome === "dancar" || nome === "celular";
    this.acao = { nome, inicio: performance.now(), ate: continua ? Infinity : performance.now() + (ms ?? DUR[nome] ?? 1000) };
    if (nome === "pular" && this.altura <= 0.001) this.vy = 4.4;
    if (nome === "comemorar") {
      if (this.altura <= 0.001) this.vy = 3.6;
      this.confete();
    }
    if (nome === "cafe") this.reagir("☕");
    if (nome === "dancar") this.reagir("♪");
  }

  pararAcao() {
    this.acao = null;
  }

  sentar(assento) {
    this.caminho = [];
    this.assento = assento;
    this.grupo.position.set(assento.x, 0, assento.z);
    this.direcao = assento.rot;
    this.grupo.rotation.y = assento.rot;
    if (this.acao?.ate === Infinity && this.acao.nome !== "celular") this.acao = null;
  }

  levantar() {
    if (!this.assento) return;
    const a = this.assento;
    this.assento = null;
    // Sai por trás da cadeira (a frente costuma ser a mesa); se estiver bloqueado, pelos lados.
    const livre = Pessoa.livre ?? (() => true);
    const tras = [Math.sin(a.rot), Math.cos(a.rot)];
    const lado = [Math.cos(a.rot), -Math.sin(a.rot)];
    const opcoes = [
      [tras[0] * 0.75, tras[1] * 0.75], [lado[0] * 0.8, lado[1] * 0.8], [-lado[0] * 0.8, -lado[1] * 0.8],
      [tras[0] * 1.2, tras[1] * 1.2], [-tras[0] * 0.75, -tras[1] * 0.75],
    ];
    for (const [dx, dz] of opcoes)
      if (livre(a.x + dx, a.z + dz)) {
        this.grupo.position.x = a.x + dx;
        this.grupo.position.z = a.z + dz;
        return;
      }
  }

  get sentado() {
    return Boolean(this.assento);
  }

  /** Emoji que sobe e some em cima da cabeça. */
  reagir(emoji) {
    // invólucro: o CSS2D posiciona o de fora; a animação de subir fica no de dentro
    const fora = document.createElement("div");
    const div = document.createElement("div");
    div.className = "reacao";
    div.textContent = emoji;
    fora.append(div);
    const o = new CSS2DObject(fora);
    o.position.set((Math.random() - 0.5) * 0.3, 1.75, 0);
    this.grupo.add(o);
    setTimeout(() => this.grupo.remove(o), 1700);
  }

  confete() {
    const cores = [COR.laranja, "#FFD23F", COR.creme, COR.tinta, "#2ECC71"];
    const pedacos = [];
    for (let i = 0; i < 36; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.08), new THREE.MeshBasicMaterial({ color: cores[i % cores.length], side: THREE.DoubleSide }));
      m.position.set(0, 1.6, 0);
      m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 2.4, 2 + Math.random() * 2, (Math.random() - 0.5) * 2.4);
      m.userData.g = new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0);
      this.grupo.add(m);
      pedacos.push(m);
    }
    this.confetes = (this.confetes ?? []).concat(pedacos.map((m) => ({ m, fim: performance.now() + 1600 })));
  }

  atualizar(dt) {
    this.t += dt;
    // movimento
    if (this.caminho.length) {
      if (this.assento) this.levantar();
      if (this.acao?.ate === Infinity) this.acao = null;
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
      if (this.andando && this.assento) this.levantar();
      if (this.andando && this.acao?.ate === Infinity) this.acao = null;
    }
    let d = this.direcao - this.grupo.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.grupo.rotation.y += d * Math.min(1, dt * 12);

    // pulo (gravidade)
    this.altura = this.altura ?? 0;
    this.vy = this.vy ?? 0;
    if (this.altura > 0 || this.vy > 0) {
      this.vy -= 15 * dt;
      this.altura = Math.max(0, this.altura + this.vy * dt);
      if (this.altura === 0) this.vy = 0;
    }

    // pose-alvo
    const t = this.t;
    const a = { pE: 0, pD: 0, bEx: 0, bDx: 0, bEz: 0, bDz: 0, y: 0, cX: 0, cZ: 0, rotCorpo: 0, olho: 1, boca: 1, bocaX: 1 };
    const ciclo = t * 11;
    if (this.andando) {
      const s = Math.sin(ciclo);
      a.pE = s * 0.7; a.pD = -s * 0.7; a.bEx = -s * 0.6; a.bDx = s * 0.6;
      a.y = Math.abs(Math.cos(ciclo)) * 0.06;
      a.cZ = Math.sin(ciclo) * 0.04;
    } else if (this.assento) {
      a.pE = a.pD = 1.45;
      a.y = 0.07;
      if (this.assento.mesa && !this.acao) {
        // digitando
        a.bEx = 1.15 + Math.sin(t * 17) * 0.07;
        a.bDx = 1.15 + Math.sin(t * 17 + 2) * 0.07;
        a.bEz = 0.18; a.bDz = -0.18;
        a.cX = 0.12;
      }
    } else {
      a.y = Math.sin(t * 2.2) * 0.012;
      a.cZ = Math.sin(t * 1.3) * 0.03;
    }

    const acao = this.acao;
    let canecaVisivel = false, celularVisivel = false;
    if (acao) {
      const agora = performance.now();
      const k = acao.ate === Infinity ? 0 : (agora - acao.inicio) / (acao.ate - acao.inicio);
      const tt = (agora - acao.inicio) / 1000;
      if (k >= 1) this.acao = null;
      else
        switch (acao.nome) {
          case "pular":
            a.bEz = -0.9; a.bDz = 0.9; a.pE = a.pD = this.altura > 0.05 ? -0.3 : 0;
            break;
          case "acenar":
            a.bDz = 2.5 + Math.sin(k * Math.PI * 6) * 0.35; a.cZ = -0.08;
            break;
          case "cafe":
            canecaVisivel = true;
            a.bDx = k < 0.15 ? 1.1 * (k / 0.15) : k < 0.85 ? 1.1 + (Math.sin((k - 0.15) * 14) > 0.2 ? 1.2 : 0.4) : 1.1 * (1 - (k - 0.85) / 0.15);
            a.bDz = -0.35;
            a.cX = a.bDx > 2 ? -0.22 : 0;
            break;
          case "celular":
            celularVisivel = true;
            a.bDz = 2.4; a.bDx = 0.35; a.cZ = 0.16;
            a.bocaX = 1;
            a.boca = 1 + Math.abs(Math.sin(t * 9)) * (Math.sin(t * 1.3) > 0 ? 1.2 : 0);
            break;
          case "espreguicar":
            a.bEz = -2.9; a.bDz = 2.9; a.cX = -0.25; a.y += Math.sin(k * Math.PI) * 0.05; a.olho = 0.25;
            break;
          case "bocejar":
            a.bEx = 2.4; a.bEz = 0.55; a.boca = 1 + Math.sin(k * Math.PI) * 3.2; a.bocaX = 1 + Math.sin(k * Math.PI) * 0.8; a.olho = 0.2; a.cX = -0.15;
            break;
          case "joinha":
            a.bDx = 1.5; a.bDz = -0.2; a.cZ = -0.1;
            break;
          case "facepalm":
            a.bDx = 2.55; a.bDz = -0.55; a.cX = 0.32; a.olho = 0.3;
            break;
          case "comemorar":
            a.bEz = -2.7; a.bDz = 2.7; a.y += Math.abs(Math.sin(k * Math.PI * 4)) * 0.06;
            break;
          case "dancar": {
            const b = tt * 8.5;
            a.y += Math.abs(Math.sin(b)) * 0.09;
            a.rotCorpo = Math.sin(tt * 4.25) * 0.45;
            a.bEz = -1.4 - Math.sin(b) * 0.7; a.bDz = 1.4 - Math.sin(b + Math.PI) * 0.7;
            a.pE = Math.max(0, Math.sin(b)) * 0.5; a.pD = Math.max(0, -Math.sin(b)) * 0.5;
            a.cZ = Math.sin(b) * 0.15;
            if (Math.floor(tt / 1.6) !== this.ultimaNota) {
              this.ultimaNota = Math.floor(tt / 1.6);
              this.reagir(Math.random() < 0.5 ? "♪" : "♫");
            }
            break;
          }
          case "sacar":
            a.bDx = 1.2 + Math.sin(k * Math.PI) * 1.2;
            break;
          case "tapa":
            a.bDx = k < 0.4 ? 2.8 * (k / 0.4) : 2.8 - 1.9 * Math.min(1, (k - 0.4) / 0.15);
            break;
          case "pensar":
            a.bDx = 2.2; a.bDz = -0.5; a.cZ = 0.15;
            break;
        }
    }
    this.caneca.visible = canecaVisivel;
    this.celular.visible = celularVisivel;

    // falando: boca mexe e cabeça acompanha
    if (this.balao.visible && a.boca === 1) a.boca = 1 + Math.abs(Math.sin(t * 14)) * 1.4;
    if (this.balao.visible && !this.andando) a.cX += Math.sin(t * 5) * 0.05;

    // aplica (suave)
    const k = Math.min(1, dt * (this.andando ? 22 : 12));
    const ir = (atual, alvo) => atual + (alvo - atual) * k;
    this.pernas[0].rotation.x = ir(this.pernas[0].rotation.x, a.pE);
    this.pernas[1].rotation.x = ir(this.pernas[1].rotation.x, a.pD);
    this.bracos[0].rotation.x = ir(this.bracos[0].rotation.x, a.bEx);
    this.bracos[1].rotation.x = ir(this.bracos[1].rotation.x, a.bDx);
    this.bracos[0].rotation.z = ir(this.bracos[0].rotation.z, a.bEz);
    this.bracos[1].rotation.z = ir(this.bracos[1].rotation.z, a.bDz);
    this.corpo.position.y = ir(this.corpo.position.y, a.y) ;
    this.corpo.rotation.y = ir(this.corpo.rotation.y, a.rotCorpo);
    this.cabeca.rotation.x = ir(this.cabeca.rotation.x, a.cX);
    this.cabeca.rotation.z = ir(this.cabeca.rotation.z, a.cZ);
    for (const o of this.olhos) o.scale.y = ir(o.scale.y, 1.35 * a.olho);
    this.boca.scale.y = a.boca;
    this.boca.scale.x = a.bocaX;
    this.grupo.position.y = this.altura;

    // confete
    if (this.confetes?.length) {
      const agora = performance.now();
      this.confetes = this.confetes.filter(({ m, fim }) => {
        if (agora > fim) {
          this.grupo.remove(m);
          return false;
        }
        m.userData.v.y -= 6 * dt;
        m.position.addScaledVector(m.userData.v, dt);
        m.rotation.x += m.userData.g.x * dt;
        m.rotation.y += m.userData.g.y * dt;
        return true;
      });
    }
  }
}

export const ELENCO = {
  helena: { nome: "Helena", pele: "#F1C7A3", cabelo: "#C2502E", estilo: "rabo", camisa: "#FFFFFF", calca: "#2F3A4A" },
  sobrinho: { nome: "Sobrinho", pele: "#D9A27A", cabelo: "#4A2E1F", estilo: "baguncado", camisa: COR.laranja, calca: "#2D4E8A", sapato: "#F4F4F0" },
  tio: { nome: "Tio", pele: "#EBC09C", cabelo: "#E4E4E0", estilo: "grisalho", camisa: "#4F7A45", calca: "#5A4A3C", oculos: true, bigode: true },
  voce: { nome: "Você", pele: "#E8B98F", cabelo: "#4A3426", estilo: "curto", camisa: COR.creme, calca: COR.tinta, voce: true },
};
