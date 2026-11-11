// Sorteios dos jogos, separados da animação: o servidor sorteia e todo cliente anima o mesmo resultado.
export function sortearTacada(nBolas) {
  const alvos = [];
  for (let i = 0; i < nBolas; i++) alvos.push([-1.3 + Math.random() * 2.6, 0.875, -0.62 + Math.random() * 1.24]);
  if (Math.random() < 0.45) {
    const i = Math.floor(Math.random() * (nBolas - 1)); // às vezes uma cai na caçapa
    alvos[i] = [[-1.42, 0, 1.42][Math.floor(Math.random() * 3)], 0.575, Math.random() < 0.5 ? -0.72 : 0.72];
  }
  return alvos;
}

export function sortearRali(trocas = 3 + Math.floor(Math.random() * 6)) {
  const lado = Math.random() < 0.5 ? -1 : 1;
  const golpes = [];
  for (let i = 0; i < trocas; i++)
    golpes.push({ z0: (Math.random() - 0.5) * 1.1, z1: (Math.random() - 0.5) * 1.1, quique: 0.35 + Math.random() * 0.5 });
  return { lado, golpes };
}

/** Lado que fez o ponto (-1 esquerda, 1 direita): quem não devolveu a última bola perde. */
export function resultadoRali({ lado, golpes }) {
  const ultimo = golpes.length % 2 === 0 ? lado : -lado; // lado de quem rebateria depois da última troca
  return -ultimo;
}

export const DURACAO = {
  rali: (r) => r.golpes.length * 420 + 380,
  tacada: 900,
  tapa: 1000,
  cafe: 2600,
};
