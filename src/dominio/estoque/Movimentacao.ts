import { ErroDeDominio } from '../ErroDeDominio';

/**
 * Por que o estoque mudou. Só "venda-app" é automática; as outras a cantina registra à mão,
 * porque acontecem fora do app (venda no balcão, perda, compra que chegou).
 */
export type MotivoDaMovimentacao = 'compra' | 'venda-app' | 'venda-balcao' | 'perda';
export type SentidoDaMovimentacao = 'entrada' | 'saida';

const SENTIDO: Record<MotivoDaMovimentacao, SentidoDaMovimentacao> = {
  compra: 'entrada',
  'venda-app': 'saida',
  'venda-balcao': 'saida',
  perda: 'saida',
};

/** Um registro no histórico de entradas e saídas. Imutável: o histórico não se reescreve. */
export interface Movimentacao {
  readonly id: string;
  readonly cantinaId: string;
  readonly produtoId: string;
  readonly produtoNome: string;
  readonly motivo: MotivoDaMovimentacao;
  readonly quantidade: number;
  /** Quanto entrou no caixa (só vendas); compras e perdas ficam em zero. */
  readonly valorEmCentavos: number;
  /** Data e hora em ISO 8601. */
  readonly momento: string;
  readonly pedidoNumero?: number;
}

export function sentidoDe(movimentacao: Movimentacao): SentidoDaMovimentacao {
  return SENTIDO[movimentacao.motivo];
}

export function ehVenda(movimentacao: Movimentacao): boolean {
  return movimentacao.motivo === 'venda-app' || movimentacao.motivo === 'venda-balcao';
}

export function novaMovimentacao(
  dados: Omit<Movimentacao, 'id' | 'momento'> & { readonly momento: Date },
): Movimentacao {
  if (!Number.isInteger(dados.quantidade) || dados.quantidade <= 0) {
    throw new ErroDeDominio('A quantidade precisa ser um número inteiro maior que zero.');
  }
  return Object.freeze({ ...dados, id: crypto.randomUUID(), momento: dados.momento.toISOString() });
}
