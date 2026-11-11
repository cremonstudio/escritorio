// Tela de entrada: login (conta do escritório) ou visitante. Com o escritório desligado, só visitante (modo solo).
// Resolve com { nome, visual, conta, bemvindo } (bemvindo = resposta do servidor; null no modo solo).
import { COR } from "./moveis.js";

export const VISUAIS = [
  { pele: "#E8B98F", cabelo: "#4A3426", estilo: "curto", camisa: COR.creme, calca: COR.tinta },
  { pele: "#F1C7A3", cabelo: "#1E1A17", estilo: "rabo", camisa: COR.laranja, calca: "#2F3A4A" },
  { pele: "#C68A5E", cabelo: "#1A1410", estilo: "baguncado", camisa: "#2462A8", calca: "#3A3A3A" },
  { pele: "#8D5A3B", cabelo: "#121010", estilo: "curto", camisa: "#4F7A45", calca: "#5A4A3C", sapato: "#F4F4F0" },
  { pele: "#F3D2B5", cabelo: "#D9A441", estilo: "rabo", camisa: COR.tinta, calca: "#8F8D89" },
  { pele: "#EBC09C", cabelo: "#E4E4E0", estilo: "grisalho", camisa: "#7A4E2E", calca: COR.tinta, oculos: true },
];

const CHAVE = "escritorio-cremon:eu";
const CHAVE_SESSAO = "escritorio-cremon:sessao";
const lerLocal = (k, padrao) => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? "null") ?? padrao;
  } catch {
    return padrao;
  }
};
const gravarLocal = (k, v) => {
  try {
    v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v));
  } catch {
    // sem armazenamento: só pergunta de novo da próxima vez
  }
};

export async function telaDeEntrada(rede) {
  // 1) sessão salva: entra direto
  const token = lerLocal(CHAVE_SESSAO, null);
  if (rede && token) {
    rede.enviar("ola", { token });
    const r = await rede.proxima(["bemvindo", "recusado"]);
    if (r?.t === "bemvindo") return { nome: r.nome, visual: r.visual, conta: r.conta, bemvindo: r };
    gravarLocal(CHAVE_SESSAO, null);
  }

  const salvo = lerLocal(CHAVE, {});
  return new Promise((ok) => {
    const tela = document.createElement("div");
    tela.className = "entrada";
    tela.innerHTML = `
      <div class="cartao">
        <div class="logo">CREM<span>✱</span>N</div>
        <form class="login" ${rede ? "" : "hidden"}>
          <h1>Entrar no escritório</h1>
          <label>Usuário<input name="usuario" autocomplete="username" required></label>
          <label>Senha<input name="senha" type="password" autocomplete="current-password" required></label>
          <div class="erro" aria-live="polite"></div>
          <button class="entrar" type="submit">Entrar</button>
          <button class="ou" type="button" data-visitante>Entrar como visitante</button>
        </form>
        <form class="visitante" ${rede ? "hidden" : ""}>
          <h1>${rede ? "Entrar como visitante" : "Bem-vindo ao escritório"}</h1>
          ${rede ? "" : `<p class="nota">O escritório está desligado agora: você entra sozinho, no modo solo.</p>`}
          <label>Seu nome<input name="nome" maxlength="18" required autocomplete="off" placeholder="Como te chamam aqui"></label>
          <div class="rotulo">Seu visual</div>
          <div class="visuais">${VISUAIS.map((v, i) => `<button type="button" data-i="${i}" style="--pele:${v.pele};--cabelo:${v.cabelo};--camisa:${v.camisa}" aria-label="Visual ${i + 1}"><i></i></button>`).join("")}</div>
          <div class="erro" aria-live="polite"></div>
          <button class="entrar" type="submit">Entrar</button>
          ${rede ? `<button class="ou" type="button" data-login>Tenho conta</button>` : ""}
        </form>
      </div>`;
    document.body.append(tela);
    tela.addEventListener("keydown", (e) => e.stopPropagation());
    const login = tela.querySelector(".login");
    const visitante = tela.querySelector(".visitante");
    const mostrar = (f) => {
      login.hidden = f !== login;
      visitante.hidden = f !== visitante;
      f.querySelector("input")?.focus();
    };
    tela.querySelector("[data-visitante]")?.addEventListener("click", () => mostrar(visitante));
    tela.querySelector("[data-login]")?.addEventListener("click", () => mostrar(login));

    let visual = Number.isInteger(salvo.visual) ? salvo.visual : 0;
    const marcar = () => tela.querySelectorAll(".visuais button").forEach((b) => b.classList.toggle("sel", Number(b.dataset.i) === visual));
    marcar();
    tela.querySelector(".visuais").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      visual = Number(b.dataset.i);
      marcar();
    });
    visitante.nome.value = salvo.nome ?? "";

    const concluir = (r) => {
      tela.remove();
      ok(r);
    };

    login.addEventListener("submit", async (e) => {
      e.preventDefault();
      const erro = login.querySelector(".erro");
      erro.textContent = "Entrando...";
      rede.enviar("ola", { usuario: login.usuario.value.trim(), senha: login.senha.value });
      const r = await rede.proxima(["bemvindo", "recusado"]);
      if (r?.t !== "bemvindo") {
        erro.textContent = r?.motivo ?? "Sem resposta do escritório. Tente de novo.";
        login.senha.value = "";
        return;
      }
      if (r.token) gravarLocal(CHAVE_SESSAO, r.token);
      concluir({ nome: r.nome, visual: r.visual, conta: r.conta, bemvindo: r });
    });

    visitante.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = visitante.nome.value.trim().slice(0, 18) || "Visitante";
      gravarLocal(CHAVE, { nome, visual });
      if (!rede) return concluir({ nome, visual, conta: null, bemvindo: null });
      rede.enviar("ola", { nome, visual });
      const r = await rede.proxima(["bemvindo", "recusado"]);
      if (r?.t !== "bemvindo") {
        visitante.querySelector(".erro").textContent = r?.motivo ?? "Sem resposta do escritório.";
        return;
      }
      concluir({ nome: r.nome, visual: r.visual, conta: null, bemvindo: r });
    });

    setTimeout(() => (rede ? login : visitante).querySelector("input")?.focus(), 50);
  });
}
