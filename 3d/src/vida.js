// Vida no escritório (versão 3D): o diretor de cena, com o mesmo banco de falas da ponte.
import { fala } from "./falas.js";
import { LUGARES } from "./planta.js";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const entre = (a, b) => a + Math.random() * (b - a);

// Protótipo: tarefas lidas das pastas reais dos agentes em 11/11. Na versão final vêm da ponte.
const TAREFAS = { helena: "as mensagens do lote1", sobrinho: "o lote de 10/11", tio: "o parecer do tio de 06/11" };
const OLHAR = {
  "pingpong-esq": [33.5, 26.5], "pingpong-dir": [33.5, 26.5], "sinuca-a": [27.5, 26.5], "sinuca-b": [27.5, 26.5],
  "mesa-helena": [4.35, 16], "mesa-sobrinho": [16, 16], "mesa-tio": [27.35, 16],
  "reuniao-0": [21, 4.3], "reuniao-1": [21, 4.3], "reuniao-2": [21, 5.2], "reuniao-3": [21, 5.2],
  "copa-0": [29, 3.5], "copa-1": [29, 3.5], "copa-2": [29, 4.5],
};

export class Vida {
  constructor({ atores, grade, efeitos, intervalo = [9_000, 20_000], log = () => {} }) {
    this.atores = atores; // [{ id, persona, nome, p: Pessoa }]
    this.grade = grade;
    this.ef = efeitos;
    this.intervalo = intervalo;
    this.log = log;
    this.emCena = new Set();
    this.objetos = new Set(); // "sinuca", "ping" em uso
  }

  livre(id) {
    return !this.emCena.has(id);
  }

  iniciar() {
    (async () => {
      await esperar(3_000);
      for (;;) {
        await this.sortear();
        await esperar(entre(...this.intervalo));
      }
    })();
  }

  async sortear() {
    const livres = this.atores.filter((a) => this.livre(a.id)).sort(() => Math.random() - 0.5);
    if (!livres.length) return;
    const [a, b] = livres;
    const opcoes = b
      ? [
          [30, "visita", () => this.visita(a, b)],
          [25, "pingpong", () => this.pingpong(a, b), "ping"],
          [20, "sinuca", () => this.sinuca(a, b), "sinuca"],
          [15, "cafe", () => this.cafe(a, b)],
          [10, "cafe", () => this.cafe(a)],
        ]
      : [[100, "cafe", () => this.cafe(a)]];
    const validas = opcoes.filter((o) => !o[3] || !this.objetos.has(o[3]));
    let r = Math.random() * validas.reduce((s, o) => s + o[0], 0);
    const escolha = validas.find((o) => (r -= o[0]) < 0) ?? validas[0];
    this.rodar(escolha[1], b ? [a, b] : [a], escolha[2], escolha[3]);
  }

  async rodar(nome, atores, fn, objeto) {
    atores.forEach((a) => this.emCena.add(a.id));
    if (objeto) this.objetos.add(objeto);
    this.log(`${nome}: ${atores.map((a) => a.nome).join(" e ")}`);
    try {
      await fn();
    } catch (e) {
      console.error(e);
    } finally {
      if (objeto) this.objetos.delete(objeto);
      await Promise.all(atores.map((a) => this.ir(a, `mesa-${a.id}`)));
      atores.forEach((a) => this.emCena.delete(a.id));
    }
  }

  async ir(a, lugar) {
    const alvo = LUGARES[lugar];
    const pontos = this.grade.caminho(a.p.pos, alvo) ?? [];
    pontos.push(alvo);
    await a.p.seguir(pontos);
    if (OLHAR[lugar]) a.p.olharPara(...OLHAR[lugar]);
  }

  async falar(a, texto) {
    await a.p.falar(texto);
    await esperar(250);
  }

  // ------------------------------------------------ cenas
  async visita(a, b) {
    await this.ir(a, `visita-${b.id}`);
    a.p.olharPara(...b.p.pos);
    b.p.olharPara(...a.p.pos);
    await this.falar(a, fala("abreVisita", a.persona, { b: b.nome }));
    b.p.gestar("acenar", 900);
    const tarefaB = TAREFAS[b.id];
    await this.falar(a, fala("perguntaTarefa", a.persona, { tarefaB }));
    b.p.gestar("pensar", 1600);
    await this.falar(b, fala("respondeTarefa", b.persona, { tarefa: tarefaB }));
    await this.falar(a, fala("reage", a.persona));
    if (OLHAR[`mesa-${b.id}`]) b.p.olharPara(...OLHAR[`mesa-${b.id}`]);
  }

  async pingpong(a, b) {
    await this.ir(a, `visita-${b.id}`);
    a.p.olharPara(...b.p.pos);
    b.p.olharPara(...a.p.pos);
    await this.falar(a, fala("convitePing", a.persona, { b: b.nome }));
    if (Math.random() < 0.2) return void (await this.falar(b, fala("recusa", b.persona, { b: a.nome })));
    await this.falar(b, fala("aceita", b.persona));
    await Promise.all([this.ir(a, "pingpong-esq"), this.ir(b, "pingpong-dir")]);
    await this.falar(a, fala("provocaPing", a.persona));
    const pontos = { [a.id]: 0, [b.id]: 0 };
    let sacador = a;
    while (Math.max(pontos[a.id], pontos[b.id]) < 3) {
      sacador.p.gestar("sacar", 500);
      const lado = await this.ef.rali();
      const vencedor = lado < 0 ? a : b;
      pontos[vencedor.id]++;
      vencedor.p.gestar("comemorar", 700);
      if (Math.random() < 0.5) {
        const quem = Math.random() < 0.5 ? a : b;
        await this.falar(quem, fala("ponto", quem.persona, { placar: `${pontos[a.id]} a ${pontos[b.id]}` }));
      } else await esperar(500);
      sacador = sacador === a ? b : a;
    }
    const [ganhou, perdeu] = pontos[a.id] > pontos[b.id] ? [a, b] : [b, a];
    ganhou.p.gestar("comemorar", 1500);
    await this.falar(ganhou, fala("ganhou", ganhou.persona));
    await this.falar(perdeu, fala("perdeu", perdeu.persona));
    if (Math.random() < 0.35) await this.falar(perdeu, fala("revanche", perdeu.persona));
  }

  async sinuca(a, b) {
    await this.ir(a, `visita-${b.id}`);
    a.p.olharPara(...b.p.pos);
    await this.falar(a, fala("conviteSinuca", a.persona, { b: b.nome }));
    if (Math.random() < 0.2) return void (await this.falar(b, fala("recusa", b.persona, { b: a.nome })));
    await this.falar(b, fala("aceita", b.persona));
    await Promise.all([this.ir(a, "sinuca-a"), this.ir(b, "sinuca-b")]);
    this.ef.arrumar();
    const rodadas = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < rodadas; i++) {
      const vez = i % 2 ? b : a;
      vez.p.gestar("sacar", 600);
      await this.ef.tacada();
      if (Math.random() < 0.55) {
        vez.p.gestar("comemorar", 800);
        await this.falar(vez, fala("tacadaBoa", vez.persona));
      } else if (vez.persona === "tio" || Math.random() < 0.3) {
        vez.p.gestar("tapa", 700);
        await esperar(260);
        this.ef.tapa();
        await this.falar(vez, fala("tapa", vez.persona));
      } else await this.falar(vez, fala("tacadaRuim", vez.persona));
      await esperar(400);
    }
    this.ef.arrumar();
    await this.falar(b, fala("fimSinuca", b.persona));
  }

  async cafe(a, b) {
    if (b) {
      await this.ir(a, `visita-${b.id}`);
      a.p.olharPara(...b.p.pos);
      await this.falar(a, fala("conviteCafe", a.persona, { b: b.nome }));
      await this.falar(b, fala("aceita", b.persona));
      await Promise.all([this.ir(a, "copa-0"), this.ir(b, "copa-1")]);
      this.ef.cafe();
      const [p1, p2] = fala("papoLeve", "padrao").split("|");
      a.p.olharPara(...b.p.pos);
      b.p.olharPara(...a.p.pos);
      await this.falar(a, p1);
      await this.falar(b, p2);
    } else {
      await this.ir(a, "copa-0");
      await this.ef.cafe();
      await this.falar(a, fala("cafeSolo", a.persona));
    }
    await esperar(1_200);
  }

  async daily() {
    const atores = this.atores.filter((a) => this.livre(a.id));
    if (atores.length < 2) return;
    await this.rodar("daily", atores, async () => {
      await Promise.all(atores.map((a, i) => this.ir(a, `reuniao-${i % 4}`)));
      const condutor = atores.find((a) => a.persona === "tio") ?? atores[0];
      await this.falar(condutor, fala("abreDaily", condutor.persona));
      for (const a of atores) await this.falar(a, fala("statusDaily", a.persona, { tarefa: TAREFAS[a.id] }));
      await this.falar(condutor, fala("fechaDaily", condutor.persona));
    });
  }

  /** Você puxou conversa (tecla E perto de um bot livre). */
  async conversar(a, voce) {
    if (!this.livre(a.id)) return;
    this.emCena.add(a.id);
    a.p.olharPara(...voce.pos);
    a.p.gestar("acenar", 900);
    const linhas = [
      `Oi! Sou ${a.nome === "Helena" ? "a" : "o"} ${a.nome}. ${fala("respondeTarefa", a.persona, { tarefa: TAREFAS[a.id] })}`,
      fala("respondeTarefa", a.persona, { tarefa: TAREFAS[a.id] }),
      fala("cafeSolo", a.persona),
    ];
    await this.falar(a, linhas[Math.floor(Math.random() * linhas.length)]);
    this.emCena.delete(a.id);
    if (OLHAR[`mesa-${a.id}`]) a.p.olharPara(...OLHAR[`mesa-${a.id}`]);
  }
}
