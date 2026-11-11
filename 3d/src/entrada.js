// Tela de entrada: nome e visual do seu boneco. Fica salvo no navegador para a próxima vez.
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

export function telaDeEntrada() {
  let salvo = {};
  try {
    salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "{}");
  } catch {
    salvo = {};
  }
  return new Promise((ok) => {
    const tela = document.createElement("form");
    tela.className = "entrada";
    tela.innerHTML = `
      <div class="cartao">
        <div class="logo">CREM<span>✱</span>N</div>
        <h1>Bem-vindo ao escritório</h1>
        <label>Seu nome<input name="nome" maxlength="18" required autocomplete="off" placeholder="Como te chamam aqui"></label>
        <div class="rotulo">Seu visual</div>
        <div class="visuais">${VISUAIS.map((v, i) => `<button type="button" data-i="${i}" style="--pele:${v.pele};--cabelo:${v.cabelo};--camisa:${v.camisa}" aria-label="Visual ${i + 1}"><i></i></button>`).join("")}</div>
        <button class="entrar" type="submit">Entrar</button>
      </div>`;
    document.body.append(tela);
    const campo = tela.querySelector("input");
    campo.value = salvo.nome ?? "";
    let visual = Number.isInteger(salvo.visual) ? salvo.visual : 0;
    const marcar = () => tela.querySelectorAll(".visuais button").forEach((b) => b.classList.toggle("sel", Number(b.dataset.i) === visual));
    marcar();
    tela.querySelector(".visuais").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      visual = Number(b.dataset.i);
      marcar();
    });
    tela.addEventListener("keydown", (e) => e.stopPropagation());
    tela.addEventListener("submit", (e) => {
      e.preventDefault();
      const escolha = { nome: campo.value.trim().slice(0, 18) || "Visitante", visual };
      try {
        localStorage.setItem(CHAVE, JSON.stringify(escolha));
      } catch {
        // sem armazenamento: pergunta de novo da próxima vez
      }
      tela.remove();
      ok(escolha);
    });
    setTimeout(() => campo.focus(), 50);
  });
}
