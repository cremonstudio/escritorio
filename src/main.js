// Escritório 3D do Cremon Studio: cena, câmera isométrica, luz, controles e interações.
import * as THREE from "three";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { Grade } from "./caminho.js";
import { montarMundo } from "./mundo.js";
import { Pessoa, ELENCO } from "./pessoa.js";
import { Efeitos } from "./efeitos.js";
import { Vida } from "./vida.js";
import { LUGARES, LARGURA, ALTURA } from "./planta.js";
import { destravarSom, som } from "./som.js";
import { conectar, urlDoServidor } from "./rede.js";
import { criarChatBot } from "./chatbot.js";
import { telaDeEntrada, VISUAIS } from "./entrada.js";

const palco = document.getElementById("palco");
const dica = document.getElementById("dica");

// ---------------------------------------------------- render
// ?leve: sombra menor e sem antialias (testes em Chrome sem GPU, máquinas fracas)
const LEVE = new URLSearchParams(location.search).has("leve");
const renderer = new THREE.WebGLRenderer({ antialias: !LEVE, powerPreference: "high-performance" });
renderer.setPixelRatio(LEVE ? 1 : Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
palco.appendChild(renderer.domElement);
const rotulos = new CSS2DRenderer();
rotulos.setSize(innerWidth, innerHeight);
rotulos.domElement.id = "rotulos";
document.body.appendChild(rotulos.domElement);

const cena = new THREE.Scene();
cena.background = new THREE.Color("#EDE5D8");

// câmera isométrica (vista de sudeste)
const ALTURA_VISTA = 15;
let zoom = 1;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
const DIRECAO = new THREE.Vector3(1, 1.2, 1).normalize();
const alvo = new THREE.Vector3(16.5, 0, 27);
function enquadrar() {
  const a = innerWidth / innerHeight;
  const h = ALTURA_VISTA / zoom;
  camera.left = (-h * a) / 2;
  camera.right = (h * a) / 2;
  camera.top = h / 2;
  camera.bottom = -h / 2;
  camera.updateProjectionMatrix();
}
enquadrar();

// luz: céu quente + sol da janela + preenchimento
cena.add(new THREE.HemisphereLight("#FFF6E8", "#C9B8A0", 1.15));
const sol = new THREE.DirectionalLight("#FFF0DA", 2.3);
sol.castShadow = true;
sol.shadow.mapSize.set(LEVE ? 1024 : 4096, LEVE ? 1024 : 4096);
sol.shadow.camera.left = -30;
sol.shadow.camera.right = 30;
sol.shadow.camera.top = 26;
sol.shadow.camera.bottom = -26;
sol.shadow.camera.near = 1;
sol.shadow.camera.far = 80;
sol.shadow.bias = -0.0004;
sol.shadow.normalBias = 0.025;
sol.position.set(LARGURA / 2 - 14, 30, ALTURA / 2 - 10);
sol.target.position.set(LARGURA / 2, 0, ALTURA / 2);
cena.add(sol, sol.target);
const preenchimento = new THREE.DirectionalLight("#DDE8FF", 0.45);
preenchimento.position.set(LARGURA / 2 + 20, 15, ALTURA / 2 + 20);
cena.add(preenchimento);

// ---------------------------------------------------- mundo e gente
const grade = new Grade();
const mundo = montarMundo(cena, grade);
const efeitos = new Efeitos(cena, mundo, grade);
Pessoa.livre = (x, z) => grade.pode(Math.floor(x), Math.floor(z));

renderer.render(cena, camera); // mostra o escritório atrás da tela de entrada
const rede = await conectar(await urlDoServidor(), 4000);
const online = Boolean(rede);
const escolha = await telaDeEntrada(rede); // login, sessão salva ou visitante
const voce = new Pessoa(cena, { ...VISUAIS[escolha.visual] ?? VISUAIS[0], nome: escolha.nome, voce: true, membro: Boolean(escolha.conta) });
voce.colocar(...LUGARES.entrada, Math.PI);
voce.velocidade = 3.4;

const atores = ["helena", "sobrinho", "tio"].map((id) => {
  const p = new Pessoa(cena, ELENCO[id]);
  const [x, z] = LUGARES[`mesa-${id}`];
  p.colocar(x, z, Math.PI);
  return { id, persona: id, nome: ELENCO[id].nome, p };
});
const vida = new Vida({ atores, grade, efeitos, assentos: mundo.assentos, log: (m) => console.log("[vida]", m) });

// ---------------------------------------------------- rede (multiplayer)
const chatBot = criarChatBot({ rede, conta: escolha.conta, online });
const outros = new Map(); // id -> { p: Pessoa, alvo: [x, z], dir }
const contador = document.createElement("div");
contador.className = "online";
document.body.append(contador);
function atualizarContador() {
  contador.textContent = online ? `● ${outros.size + 1} ${outros.size ? "pessoas" : "pessoa"} no escritório` : "modo solo";
  contador.classList.toggle("on", online);
}
atualizarContador();

if (!online) {
  vida.iniciar();
  if (!new URLSearchParams(location.search).has("semdaily")) setTimeout(() => vida.daily(), 1_500);
} else {
  const botPorId = (id) => atores.find((a) => a.id === id);
  const sentarBot = (p, idx) => {
    const a = mundo.assentos[idx];
    if (!a) return;
    if (p.assento) p.assento.quem = null;
    a.quem = p;
    p.sentar(a);
  };
  const levantarBot = (p) => {
    if (!p.assento) return;
    p.assento.quem = null;
    p.levantar();
  };
  const novoOutro = ({ id, nome, visual, estado, membro }) => {
    const p = new Pessoa(cena, { ...(VISUAIS[visual] ?? VISUAIS[0]), nome, membro });
    const o = { p, alvo: null, dir: 0 };
    outros.set(id, o);
    if (estado) aplicarEstado(o, estado, true);
    else p.colocar(...LUGARES.entrada, Math.PI);
    atualizarContador();
    return o;
  };
  const aplicarEstado = (o, e, inicio = false) => {
    if (e.assento !== null && e.assento !== undefined) {
      if (o.p.assento !== mundo.assentos[e.assento]) sentarBot(o.p, e.assento);
      o.alvo = null;
    } else {
      if (o.p.assento) levantarBot(o.p);
      o.alvo = [e.x, e.z];
      o.p.correndo = Boolean(e.correndo);
      if (inicio) o.p.colocar(e.x, e.z, e.dir);
    }
    o.dir = e.dir;
    if (e.acao && o.p.acao?.nome !== e.acao) o.p.gestar(e.acao);
    if (!e.acao && o.p.acao?.ate === Infinity) o.p.pararAcao();
  };

  const processarBemvindo = (m) => {
    meuId = m.id;
    for (const j of m.jogadores) novoOutro(j);
    for (const b of m.bots) {
      const a = botPorId(b.id);
      if (!a) continue;
      a.p.colocar(b.pos[0], b.pos[1], b.dir);
      if (b.assento !== null) sentarBot(a.p, b.assento);
      if (b.acao) a.p.gestar(b.acao);
    }
    if (m.mundo.sinuca) efeitos.tacada(m.mundo.sinuca);
    if (m.mundo.porta) efeitos.porta(true);
    for (const o of m.mundo.ocupados) vida.objetos.add(o);
  };
  rede.on("entrou", (m) => novoOutro(m));
  rede.on("saiu", ({ id }) => {
    const o = outros.get(id);
    if (!o) return;
    if (o.p.assento) o.p.assento.quem = null;
    cena.remove(o.p.grupo);
    o.p.grupo.traverse((x) => x.element?.remove?.());
    outros.delete(id);
    atualizarContador();
  });
  rede.on("estado", (m) => {
    const o = outros.get(m.id);
    if (o) aplicarEstado(o, m);
  });
  const quem = (id) => outros.get(id)?.p;
  rede.on("gesto", ({ id, nome }) => quem(id)?.gestar(nome));
  rede.on("parar", ({ id }) => quem(id)?.pararAcao());
  rede.on("reacao", ({ id, emoji }) => quem(id)?.reagir(emoji));
  rede.on("fala", ({ id, texto, ms }) => (id === meuId ? voce : quem(id))?.falar(texto, ms));
  rede.on("bot", (m) => {
    const p = botPorId(m.id)?.p;
    if (!p) return;
    switch (m.tipo) {
      case "andar": {
        levantarBot(p);
        if (Math.hypot(p.pos[0] - m.de[0], p.pos[1] - m.de[1]) > 1.5 && !p.caminho.length) p.colocar(m.de[0], m.de[1], p.direcao);
        const pontos = grade.caminho(p.pos, m.alvo) ?? [];
        pontos.push(m.alvo);
        p.seguir(pontos);
        break;
      }
      case "olhar": p.olharPara(m.x, m.z); break;
      case "fala": p.falar(m.texto, m.ms); break;
      case "gesto": p.gestar(m.nome, m.ms); break;
      case "parar": p.pararAcao(); break;
      case "reacao": p.reagir(m.emoji); break;
      case "sentar": p.caminho = []; sentarBot(p, m.idx); break;
      case "levantar": levantarBot(p); break;
    }
  });
  rede.on("efeito", (m) => {
    if (m.nome === "rali") efeitos.rali(m.r);
    else if (m.nome === "tacada") efeitos.tacada(m.alvos);
    else if (m.nome === "tapa") efeitos.tapa();
    else if (m.nome === "arrumar") efeitos.arrumar();
    else if (m.nome === "cafe") efeitos.cafe();
    else if (m.nome === "bater") efeitos.bater();
  });
  rede.on("porta", ({ aberta }) => efeitos.porta(aberta));
  rede.on("ocupado", ({ objeto, sim }) => (sim ? vida.objetos.add(objeto) : vida.objetos.delete(objeto)));
  rede.on("caiu", () => {
    contador.textContent = "conexão caiu, voltando...";
    setTimeout(() => location.reload(), 3000);
  });
  // alguém bateu na porta da sua sala (só chega para o dono)
  rede.on("bateram", ({ quem: nome }) => {
    const aviso = document.createElement("div");
    aviso.className = "batida";
    aviso.innerHTML = `<b></b> bateu na porta da sua sala.<div><button data-sim>Deixar entrar</button><button data-nao>Agora não</button></div>`;
    aviso.querySelector("b").textContent = nome;
    document.body.append(aviso);
    const fechar = () => aviso.remove();
    aviso.querySelector("[data-sim]").onclick = () => {
      rede.enviar("efeito", { nome: "deixarEntrar" });
      fechar();
    };
    aviso.querySelector("[data-nao]").onclick = fechar;
    setTimeout(fechar, 20_000);
  });
  processarBemvindo(escolha.bemvindo);
}
var meuId = null;

/** Manda seu estado para a sala (até 10 vezes por segundo, só quando muda). */
let ultimoEnvio = 0, ultimoEstado = "";
function enviarEstado() {
  if (!online || performance.now() - ultimoEnvio < 100) return;
  const e = {
    x: +voce.pos[0].toFixed(2), z: +voce.pos[1].toFixed(2), dir: +voce.direcao.toFixed(2),
    andando: voce.andando, correndo: voce.correndo && voce.andando, assento: voce.assento ? mundo.assentos.indexOf(voce.assento) : null,
    acao: voce.acao?.ate === Infinity ? voce.acao.nome : null,
  };
  const chave = JSON.stringify(e);
  if (chave === ultimoEstado) return;
  ultimoEstado = chave;
  ultimoEnvio = performance.now();
  rede.enviar("estado", e);
}

// ---------------------------------------------------- controles
const teclas = new Set();
// ações do dia a dia (tecla -> ação)
const ACOES = [
  { tecla: " ", rotulo: "Espaço", nome: "Pular", acao: "pular" },
  { tecla: "f", rotulo: "F", nome: "Sentar", acao: "sentar" },
  { tecla: "1", rotulo: "1", nome: "Café", acao: "cafe" },
  { tecla: "2", rotulo: "2", nome: "Celular", acao: "celular" },
  { tecla: "3", rotulo: "3", nome: "Espreguiçar", acao: "espreguicar" },
  { tecla: "4", rotulo: "4", nome: "Bocejar", acao: "bocejar" },
  { tecla: "5", rotulo: "5", nome: "Dançar", acao: "dancar" },
  { tecla: "6", rotulo: "6", nome: "Joinha", acao: "joinha" },
  { tecla: "7", rotulo: "7", nome: "Facepalm", acao: "facepalm" },
  { tecla: "8", rotulo: "8", nome: "Comemorar", acao: "comemorar" },
  { tecla: "9", rotulo: "9", nome: "Acenar", acao: "acenar" },
];
const REACOES = ["👍", "❤️", "😂", "🔥", "👏", "☕", "💡", "🎉"];

function fazer(acao) {
  destravarSom();
  if (acao === "sentar") return alternarSentar();
  if ((acao === "dancar" || acao === "celular") && voce.acao?.nome === acao) {
    rede?.enviar("parar");
    return voce.pararAcao();
  }
  voce.gestar(acao);
  rede?.enviar("gesto", { nome: acao });
  if (acao === "comemorar") setTimeout(() => atores.filter((a) => vida.livre(a.id) && Math.hypot(a.p.pos[0] - voce.pos[0], a.p.pos[1] - voce.pos[1]) < 9).forEach((a) => a.p.reagir("👏")), 500);
}

function alternarSentar() {
  if (voce.sentado) {
    voce.assento.quem = null;
    voce.levantar();
    return;
  }
  const livre = mundo.assentos
    .filter((a) => !a.quem)
    .map((a) => ({ a, d: Math.hypot(a.x - voce.pos[0], a.z - voce.pos[1]) }))
    .filter((x) => x.d < 1.6)
    .sort((x, y) => x.d - y.d)[0];
  if (!livre) return voce.reagir("🤷");
  livre.a.quem = voce;
  voce.sentar(livre.a);
}

const barra = document.createElement("div");
barra.className = "barra";
barra.innerHTML = `<div class="acoes">${ACOES.map((a) => `<button data-acao="${a.acao}"><kbd>${a.rotulo}</kbd>${a.nome}</button>`).join("")}</div><div class="reacoes">${REACOES.map((r) => `<button data-reacao="${r}">${r}</button>`).join("")}</div>`;
document.body.append(barra);
barra.addEventListener("pointerdown", (e) => e.stopPropagation());
barra.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.acao) fazer(b.dataset.acao);
  if (b.dataset.reacao) {
    voce.reagir(b.dataset.reacao);
    rede?.enviar("reacao", { emoji: b.dataset.reacao });
  }
});

const TECLAS_ANDAR = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
const soltouEm = new Map();
const VEL_ANDAR = 3.4, VEL_CORRER = 6.6;

addEventListener("keydown", (e) => {
  destravarSom();
  const k = e.key.toLowerCase();
  teclas.add(k);
  if (e.repeat) return;
  // toque duplo numa tecla de andar = correr (enquanto segurar)
  if (TECLAS_ANDAR.has(k)) {
    if (performance.now() - (soltouEm.get(k) ?? -1e9) < 400) voce.correndoTeclado = true;
  }
  if (k === "e") interagir("e");
  if (k === "q") interagir("q");
  if (k === "r") interagir("r");
  const acao = ACOES.find((a) => a.tecla === k);
  if (acao) {
    e.preventDefault();
    fazer(acao.acao);
  }
});
addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  teclas.delete(k);
  if (TECLAS_ANDAR.has(k)) {
    soltouEm.set(k, performance.now());
    if (![...TECLAS_ANDAR].some((t) => teclas.has(t))) voce.correndoTeclado = false;
  }
});
addEventListener("blur", () => {
  teclas.clear();
  voce.correndoTeclado = false;
});
addEventListener("wheel", (e) => {
  zoom = THREE.MathUtils.clamp(zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.55, 2.4);
  enquadrar();
}, { passive: true });
addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  rotulos.setSize(innerWidth, innerHeight);
  enquadrar();
});

const raio = new THREE.Raycaster();
const planoChao = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let ultimoClique = 0;
renderer.domElement.addEventListener("pointerdown", (e) => {
  destravarSom();
  const duplo = performance.now() - ultimoClique < 380; // pointerdown não traz a contagem de cliques
  ultimoClique = performance.now();
  const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raio.setFromCamera(ndc, camera);
  // clicou num funcionário: abre o chat com ele
  const clicado = atores.find((a) => raio.intersectObject(a.p.grupo, true).length);
  if (clicado) {
    chatBot.abrir({ id: clicado.id, nome: clicado.nome });
    return;
  }
  const ponto = new THREE.Vector3();
  if (!raio.ray.intersectPlane(planoChao, ponto)) return;
  const caminho = grade.caminho(voce.pos, [ponto.x, ponto.z]);
  // duplo clique = correr até lá
  if (caminho) {
    voce.correndoClique = duplo;
    const meu = (voce.idClique = (voce.idClique ?? 0) + 1);
    voce.seguir(caminho).then(() => {
      if (voce.idClique === meu) voce.correndoClique = false; // só o último trajeto encerra a corrida
    });
  }
});

// direções da tela no mundo isométrico
const CIMA = new THREE.Vector2(-1, -1).normalize();
const DIREITA = new THREE.Vector2(1, -1).normalize();
function moverPeloTeclado(dt) {
  let v = new THREE.Vector2();
  if (teclas.has("w") || teclas.has("arrowup")) v.add(CIMA);
  if (teclas.has("s") || teclas.has("arrowdown")) v.sub(CIMA);
  if (teclas.has("d") || teclas.has("arrowright")) v.add(DIREITA);
  if (teclas.has("a") || teclas.has("arrowleft")) v.sub(DIREITA);
  if (!v.lengthSq()) return false;
  voce.caminho = [];
  v.normalize().multiplyScalar(voce.velocidade * dt);
  const [x, z] = voce.pos;
  const livre = (px, pz) => grade.pode(Math.floor(px), Math.floor(pz));
  if (livre(x + v.x * 3, z)) voce.grupo.position.x += v.x;
  if (livre(voce.grupo.position.x, z + v.y * 3)) voce.grupo.position.z += v.y;
  voce.direcao = Math.atan2(-v.x, -v.y);
  return true;
}

// ---------------------------------------------------- interações
const perto = (pos, r) => Math.hypot(voce.pos[0] - pos[0], voce.pos[1] - pos[1]) < r;
let ocupadoVoce = false;
const PONTOS = {
  sinuca: [27.5, 26.5], ping: [33.5, 26.5], cafe: [30.6, 3.4], portaFora: [7, 11.7], portaDentro: [7, 9.2],
  tv: [3, 25.5], arcade: [41.4, 28.9],
};

function oQueFazer() {
  if (perto(PONTOS.sinuca, 2.6))
    return vida.objetos.has("sinuca") ? ["Mesa ocupada: tem jogo rolando"] : ["E", "tapa na mesa", "Q", "tacada", "R", "arrumar as bolas"];
  if (perto(PONTOS.ping, 2.4)) return vida.objetos.has("ping") ? ["Mesa ocupada: tem partida rolando"] : ["E", "sacar"];
  if (perto(PONTOS.cafe, 1.9)) return ["E", "pegar um café"];
  const dono = escolha.conta?.dono || !online;
  if (perto(PONTOS.portaFora, 1.6) && !mundo.porta.aberta) return ["E", dono ? "abrir a porta da sua sala" : "bater na porta do Mateus"];
  if (perto(PONTOS.portaDentro, 1.6) || (perto(PONTOS.portaFora, 1.6) && mundo.porta.aberta))
    return ["E", mundo.porta.aberta ? "fechar a porta" : "abrir a porta"];
  if (perto(PONTOS.tv, 2.2)) return ["E", "abrir o painel do estúdio"];
  if (perto(PONTOS.arcade, 1.6)) return ["E", "jogar fliperama"];
  const bot = atores.find((a) => perto(a.p.pos, 1.7) && vida.livre(a.id) && !a.p.sentado);
  if (bot) return ["E", `conversar com ${bot.nome}`];
  const botSentado = atores.find((a) => perto(a.p.pos, 1.7) && vida.livre(a.id));
  if (botSentado) return ["E", `falar com ${botSentado.nome}`];
  if (voce.sentado) return ["F", "levantar"];
  if (mundo.assentos.some((a) => !a.quem && perto([a.x, a.z], 1.6))) return ["F", "sentar"];
  return null;
}

async function interagir(tecla) {
  if (ocupadoVoce) return;
  ocupadoVoce = true;
  const gesto = (nome) => {
    voce.gestar(nome);
    rede?.enviar("gesto", { nome });
  };
  try {
    if (perto(PONTOS.sinuca, 2.6) && !vida.objetos.has("sinuca")) {
      voce.olharPara(...PONTOS.sinuca);
      if (tecla === "e") {
        gesto("tapa");
        await new Promise((r) => setTimeout(r, 260));
        online ? rede.enviar("efeito", { nome: "tapa" }) : await efeitos.tapa();
      }
      if (tecla === "q") {
        gesto("sacar");
        online ? rede.enviar("efeito", { nome: "tacada" }) : await efeitos.tacada();
      }
      if (tecla === "r") online ? rede.enviar("efeito", { nome: "arrumar" }) : efeitos.arrumar();
    } else if (tecla === "e" && perto(PONTOS.ping, 2.4) && !vida.objetos.has("ping")) {
      voce.olharPara(...PONTOS.ping);
      gesto("sacar");
      if (online) rede.enviar("efeito", { nome: "rali" });
      else {
        const lado = await efeitos.rali();
        await voce.falar(lado < 0 ? "Ponto da esquerda!" : "Ponto da direita!", 1800);
      }
    } else if (tecla === "e" && perto(PONTOS.cafe, 1.9)) {
      voce.olharPara(29, 3);
      gesto("cafe");
      online ? rede.enviar("efeito", { nome: "cafe" }) : await efeitos.cafe();
    } else if (tecla === "e" && perto(PONTOS.portaFora, 1.6) && !mundo.porta.aberta && online && escolha.conta?.dono) {
      rede.enviar("efeito", { nome: "porta" });
    } else if (tecla === "e" && perto(PONTOS.portaFora, 1.6) && !mundo.porta.aberta) {
      voce.falar("Toc, toc!", 1400);
      rede?.enviar("fala", { texto: "Toc, toc!" });
      if (online) rede.enviar("efeito", { nome: "bater" });
      else {
        efeitos.bater();
        await new Promise((r) => setTimeout(r, 1200));
        await efeitos.porta(true);
        setTimeout(() => efeitos.porta(false), 12_000);
      }
    } else if (tecla === "e" && (perto(PONTOS.portaDentro, 1.6) || perto(PONTOS.portaFora, 1.6))) {
      online ? rede.enviar("efeito", { nome: "porta" }) : await efeitos.porta(!mundo.porta.aberta);
    } else if (tecla === "e" && perto(PONTOS.tv, 2.2)) {
      open("https://painel.cremonstudio.com", "_blank");
    } else if (tecla === "e" && perto(PONTOS.arcade, 1.6)) {
      som.toc();
      gesto("comemorar");
      voce.falar("Recorde novo!", 1800);
      rede?.enviar("fala", { texto: "Recorde novo!" });
    } else if (tecla === "e") {
      const bot = atores.find((a) => perto(a.p.pos, 1.7) && vida.livre(a.id));
      if (bot) {
        voce.olharPara(...bot.p.pos);
        if (online) rede.enviar("conversar", { bot: bot.id });
        else await vida.conversar(bot, voce);
      }
    }
  } finally {
    ocupadoVoce = false;
  }
}

// ---------------------------------------------------- chat (Enter)
const chat = document.createElement("form");
chat.className = "chat";
chat.innerHTML = `<input maxlength="160" placeholder="Fale com quem está no escritório (Enter manda, Esc fecha)">`;
document.body.append(chat);
const campoChat = chat.querySelector("input");
chat.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = campoChat.value.trim();
  if (texto) {
    voce.falar(texto);
    rede?.enviar("fala", { texto });
  }
  campoChat.value = "";
  chat.classList.remove("on");
  campoChat.blur();
});
campoChat.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key === "Escape") {
    chat.classList.remove("on");
    campoChat.blur();
  }
});
addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement !== campoChat) {
    e.preventDefault();
    teclas.clear();
    chat.classList.add("on");
    campoChat.focus();
  }
});

function atualizarDica() {
  const o = oQueFazer();
  if (!o) return dica.classList.remove("on");
  dica.classList.add("on");
  if (o.length === 1) dica.textContent = o[0];
  else {
    dica.innerHTML = "";
    for (let i = 0; i < o.length; i += 2) {
      const k = document.createElement("kbd");
      k.textContent = o[i];
      dica.append(k, document.createTextNode(o[i + 1] + (i + 2 < o.length ? "   " : "")));
    }
  }
}

// ---------------------------------------------------- laço
const relogio = new THREE.Clock();
function quadro() {
  const dt = Math.min(0.05, relogio.getDelta());
  voce.empurrado = moverPeloTeclado(dt);
  if (!voce.caminho.length) voce.correndoClique = false;
  voce.correndo = Boolean(voce.correndoTeclado || voce.correndoClique);
  voce.velocidade = voce.correndo ? VEL_CORRER : VEL_ANDAR;
  if (voce.assento && (voce.empurrado || voce.caminho.length)) voce.assento.quem = null;
  voce.atualizar(dt);
  for (const a of atores) a.p.atualizar(dt);
  for (const o of outros.values()) {
    if (o.alvo) {
      const [x, z] = o.p.pos;
      const d = Math.hypot(o.alvo[0] - x, o.alvo[1] - z);
      if (d > 3) o.p.colocar(o.alvo[0], o.alvo[1], o.dir);
      else if (d > 0.02) {
        const passo = Math.min(d, (o.p.correndo ? 7 : 3.8) * dt);
        o.p.grupo.position.x += ((o.alvo[0] - x) / d) * passo;
        o.p.grupo.position.z += ((o.alvo[1] - z) / d) * passo;
      }
      o.p.empurrado = d > 0.05;
    } else o.p.empurrado = false;
    o.p.direcao = o.dir;
    o.p.atualizar(dt);
  }
  enviarEstado();
  // porta bloqueia/desbloqueia já em efeitos; câmera segue você
  alvo.lerp(new THREE.Vector3(voce.pos[0], 0, voce.pos[1]), Math.min(1, dt * 4));
  camera.position.copy(alvo).addScaledVector(DIRECAO, 60);
  camera.lookAt(alvo);
  atualizarDica();
  renderer.render(cena, camera);
  rotulos.render(cena, camera);
  requestAnimationFrame(quadro);
}
quadro();

// acesso para teste e para a ponte no futuro
window.escritorio = { voce, atores, vida, efeitos, mundo, camera, outros, online, rede, irPara: (x, z) => voce.seguir(grade.caminho(voce.pos, [x, z]) ?? []), zoom: (z) => { zoom = z; enquadrar(); } };
