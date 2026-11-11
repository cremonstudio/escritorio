// Efeitos do lazer, da copa e da porta: animação + som. Quem chama (pessoa ou você) só pede o efeito.
import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { som } from "./som.js";
import { sortearTacada, sortearRali, resultadoRali } from "./sorteios.js";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const anima = (ms, passo) =>
  new Promise((ok) => {
    const t0 = performance.now();
    const quadro = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      passo(k);
      if (k < 1) requestAnimationFrame(quadro);
      else ok();
    };
    requestAnimationFrame(quadro);
  });

export class Efeitos {
  constructor(cena, mundo, grade) {
    this.cena = cena;
    this.m = mundo;
    this.grade = grade;
    this.espalhada = false;
  }

  // ------------------------------------------------ sinuca
  async tapa() {
    const { mesa, bolas, grupo } = this.m.sinuca;
    som.tapa();
    const fora = document.createElement("div");
    const div = document.createElement("div");
    div.className = "pa";
    div.textContent = "PÁ!";
    fora.append(div);
    const pa = new CSS2DObject(fora);
    pa.position.set(0, 1.9, 0);
    grupo.add(pa);
    const base = bolas.map((b) => b.position.clone());
    await anima(650, (k) => {
      const forca = (1 - k) * 0.05;
      mesa.position.set((Math.random() - 0.5) * forca, (Math.random() - 0.3) * forca, (Math.random() - 0.5) * forca);
      bolas.forEach((b, i) => (b.position.y = base[i].y + Math.abs(Math.sin(k * Math.PI * 2 + i)) * 0.14 * (1 - k)));
    });
    mesa.position.set(0, 0, 0);
    bolas.forEach((b, i) => (b.position.y = base[i].y));
    await esperar(350);
    grupo.remove(pa);
  }

  async tacada(alvos = sortearTacada(this.m.sinuca.bolas.length)) {
    const { bolas } = this.m.sinuca;
    som.tacada();
    const de = bolas.map((b) => b.position.clone());
    const para = alvos.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    await anima(900, (k) => {
      const e = 1 - Math.pow(1 - k, 3);
      bolas.forEach((b, i) => b.position.lerpVectors(de[i], para[i], e));
    });
    this.espalhada = true;
  }

  arrumar() {
    som.clack();
    for (const b of this.m.sinuca.bolas) b.position.copy(b.userData.casa);
    this.espalhada = false;
  }

  // ------------------------------------------------ ping-pong
  /** Um rali; devolve o lado que fez o ponto (-1 esquerda, 1 direita). */
  async rali(r = sortearRali()) {
    const bola = this.m.ping.bola;
    bola.visible = true;
    let lado = r.lado;
    for (const g of r.golpes) {
      const x0 = lado * 1.25, x1 = -lado * 1.25;
      const quique = -lado * g.quique;
      som.toc();
      await anima(420, (k) => {
        bola.position.x = x0 + (x1 - x0) * k;
        bola.position.z = g.z0 + (g.z1 - g.z0) * k;
        // arco até o quique na metade do outro lado, depois sobe de novo
        const kq = (quique - x0) / (x1 - x0);
        if (k < kq) bola.position.y = 0.8 + Math.sin((k / kq) * Math.PI) * 0.32;
        else bola.position.y = 0.8 + Math.sin(((k - kq) / (1 - kq)) * Math.PI) * 0.2;
      });
      som.toc();
      lado = -lado;
    }
    // último: a bola sai da mesa
    const x0 = bola.position.x;
    await anima(380, (k) => {
      bola.position.x = x0 - lado * 1.4 * k;
      bola.position.y = 0.8 + Math.sin(k * Math.PI) * 0.3 - k * 0.8;
    });
    bola.visible = false;
    return resultadoRali(r);
  }

  /** Estado das bolas de sinuca (para quem chega no meio). */
  posicoesSinuca() {
    return this.m.sinuca.bolas.map((b) => b.position.toArray());
  }

  aplicarSinuca(posicoes) {
    this.m.sinuca.bolas.forEach((b, i) => posicoes[i] && b.position.fromArray(posicoes[i]));
  }

  // ------------------------------------------------ café
  async cafe() {
    som.cafe();
    const pos = this.m.maquina.position;
    const geo = new THREE.SphereGeometry(0.04, 8, 6);
    const fumaca = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0 }));
      m.position.set(pos.x + 0.12, 1.05, pos.z + (Math.random() - 0.5) * 0.08);
      m.userData.atraso = i * 0.12;
      this.cena.add(m);
      fumaca.push(m);
    }
    await anima(2600, (k) => {
      const t = k * 2.6;
      for (const m of fumaca) {
        const u = Math.max(0, Math.min(1, (t - m.userData.atraso) / 1.1));
        m.position.y = 1.05 + u * 0.7;
        m.position.x = pos.x + 0.12 + Math.sin(u * 6 + m.userData.atraso * 9) * 0.05;
        m.material.opacity = u > 0 && u < 1 ? (1 - u) * 0.75 : 0;
        m.scale.setScalar(1 + u * 1.5);
      }
    });
    for (const m of fumaca) this.cena.remove(m);
  }

  // ------------------------------------------------ porta da sua sala
  async porta(abrir) {
    const p = this.m.porta;
    if (p.aberta === abrir) return;
    p.aberta = abrir;
    som.porta();
    const de = p.folha.rotation.y, para = abrir ? Math.PI / 2 - 0.08 : 0;
    await anima(500, (k) => (p.folha.rotation.y = de + (para - de) * (1 - Math.pow(1 - k, 3))));
    this.grade.bloquear(7, 10.5, 2, 0.6, abrir ? 1 : 0);
  }

  bater() {
    som.batida();
  }
}
