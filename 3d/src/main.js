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

const voce = new Pessoa(cena, ELENCO.voce);
voce.colocar(...LUGARES.entrada, Math.PI);
voce.velocidade = 3.4;

const atores = ["helena", "sobrinho", "tio"].map((id) => {
  const p = new Pessoa(cena, ELENCO[id]);
  const [x, z] = LUGARES[`mesa-${id}`];
  p.colocar(x, z, Math.PI);
  return { id, persona: id, nome: ELENCO[id].nome, p };
});
const vida = new Vida({ atores, grade, efeitos, log: (m) => console.log("[vida]", m) });
vida.iniciar();
setTimeout(() => vida.daily(), 1_500); // começa com a daily, pra mostrar todo mundo junto

// ---------------------------------------------------- controles
const teclas = new Set();
addEventListener("keydown", (e) => {
  destravarSom();
  teclas.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === "e") interagir("e");
  if (e.key.toLowerCase() === "q") interagir("q");
  if (e.key.toLowerCase() === "r") interagir("r");
});
addEventListener("keyup", (e) => teclas.delete(e.key.toLowerCase()));
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
renderer.domElement.addEventListener("pointerdown", (e) => {
  destravarSom();
  const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raio.setFromCamera(ndc, camera);
  const ponto = new THREE.Vector3();
  if (!raio.ray.intersectPlane(planoChao, ponto)) return;
  const caminho = grade.caminho(voce.pos, [ponto.x, ponto.z]);
  if (caminho) voce.seguir(caminho);
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
  if (perto(PONTOS.portaFora, 1.6) && !mundo.porta.aberta) return ["E", "bater na porta do Mateus"];
  if (perto(PONTOS.portaDentro, 1.6) || (perto(PONTOS.portaFora, 1.6) && mundo.porta.aberta))
    return ["E", mundo.porta.aberta ? "fechar a porta" : "abrir a porta"];
  if (perto(PONTOS.tv, 2.2)) return ["E", "abrir o painel do estúdio"];
  if (perto(PONTOS.arcade, 1.6)) return ["E", "jogar fliperama"];
  const bot = atores.find((a) => perto(a.p.pos, 1.7) && vida.livre(a.id));
  if (bot) return ["E", `conversar com ${bot.nome}`];
  return null;
}

async function interagir(tecla) {
  if (ocupadoVoce) return;
  ocupadoVoce = true;
  try {
    if (perto(PONTOS.sinuca, 2.6) && !vida.objetos.has("sinuca")) {
      voce.olharPara(...PONTOS.sinuca);
      if (tecla === "e") { voce.gestar("tapa", 700); await new Promise((r) => setTimeout(r, 260)); await efeitos.tapa(); }
      if (tecla === "q") { voce.gestar("sacar", 600); await efeitos.tacada(); }
      if (tecla === "r") efeitos.arrumar();
    } else if (tecla === "e" && perto(PONTOS.ping, 2.4) && !vida.objetos.has("ping")) {
      voce.olharPara(...PONTOS.ping);
      voce.gestar("sacar", 500);
      const lado = await efeitos.rali(2 + Math.floor(Math.random() * 5));
      await voce.falar(lado < 0 ? "Ponto da esquerda!" : "Ponto da direita!", 1800);
    } else if (tecla === "e" && perto(PONTOS.cafe, 1.9)) {
      voce.olharPara(29, 3);
      await efeitos.cafe();
    } else if (tecla === "e" && perto(PONTOS.portaFora, 1.6) && !mundo.porta.aberta) {
      efeitos.bater();
      await voce.falar("Toc, toc!", 1400);
      await efeitos.porta(true);
      setTimeout(() => efeitos.porta(false), 12_000);
    } else if (tecla === "e" && (perto(PONTOS.portaDentro, 1.6) || perto(PONTOS.portaFora, 1.6))) {
      await efeitos.porta(!mundo.porta.aberta);
    } else if (tecla === "e" && perto(PONTOS.tv, 2.2)) {
      open("https://painel.cremonstudio.com", "_blank");
    } else if (tecla === "e" && perto(PONTOS.arcade, 1.6)) {
      som.toc();
      voce.gestar("comemorar", 1200);
      await voce.falar("Recorde novo!", 1800);
    } else if (tecla === "e") {
      const bot = atores.find((a) => perto(a.p.pos, 1.7) && vida.livre(a.id));
      if (bot) {
        voce.olharPara(...bot.p.pos);
        await vida.conversar(bot, voce);
      }
    }
  } finally {
    ocupadoVoce = false;
  }
}

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
  voce.atualizar(dt);
  for (const a of atores) a.p.atualizar(dt);
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
window.escritorio = { voce, atores, vida, efeitos, mundo, camera, irPara: (x, z) => voce.seguir(grade.caminho(voce.pos, [x, z]) ?? []), zoom: (z) => { zoom = z; enquadrar(); } };
