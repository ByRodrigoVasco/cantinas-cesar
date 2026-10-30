import type { Pedido } from './Pedido';

export interface ResumoDeAvaliacao {
  readonly media: number;
  readonly quantidade: number;
}

/** Média das notas de cada produto, juntando todos os pedidos avaliados. */
export function resumirAvaliacoes(pedidos: readonly Pedido[]): Map<string, ResumoDeAvaliacao> {
  const somas = new Map<string, { total: number; quantidade: number }>();
  for (const pedido of pedidos) {
    for (const [produtoId, nota] of pedido.notasDadas()) {
      const atual = somas.get(produtoId) ?? { total: 0, quantidade: 0 };
      somas.set(produtoId, { total: atual.total + nota, quantidade: atual.quantidade + 1 });
    }
  }
  return new Map([...somas].map(([id, { total, quantidade }]) => [id, { media: total / quantidade, quantidade }]));
}

/** Média geral de um conjunto de resumos (ex.: a nota de uma cantina inteira). */
export function mediaGeral(resumos: Iterable<ResumoDeAvaliacao>): ResumoDeAvaliacao | undefined {
  let total = 0;
  let quantidade = 0;
  for (const resumo of resumos) {
    total += resumo.media * resumo.quantidade;
    quantidade += resumo.quantidade;
  }
  return quantidade ? { media: total / quantidade, quantidade } : undefined;
}
