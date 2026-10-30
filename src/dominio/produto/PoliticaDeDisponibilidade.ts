/**
 * Como um produto fica disponível para venda.
 *
 * Perecível e não perecível NÃO são subclasses de Produto: o Produto É COMPOSTO por uma
 * política (composição em vez de herança). Toda implementação precisa honrar este contrato
 * sem lançar "não suportado" (Substituição de Liskov).
 */
export interface PoliticaDeDisponibilidade {
  /** Minutos que a cantina precisa para deixar UMA unidade pronta. */
  readonly tempoDePreparoMin: number;
  podeAtender(quantidade: number): boolean;
  reservar(quantidade: number): void;
  /** Desfaz uma reserva (pedido cancelado). */
  liberar(quantidade: number): void;
  descricao(): string;
  /** Estado para guardar; restaurado por restaurarPolitica(). */
  paraDados(): PoliticaSalva;
}

export type PoliticaSalva =
  | { readonly tipo: 'feito-na-hora'; readonly tempoDePreparoMin: number }
  | { readonly tipo: 'estoque'; readonly estoqueIdeal: number; readonly quantidade: number };

/**
 * Só o que tem estoque físico é reabastecido. Interface separada para que quem é feito na
 * hora não seja obrigado a implementar métodos que não fazem sentido (Segregação de Interfaces).
 */
export interface Reabastecivel {
  readonly quantidadeEmEstoque: number;
  reabastecer(quantidade: number): void;
  precisaRepor(): boolean;
  sugestaoDeReposicao(): number;
}

export function ehReabastecivel(
  politica: PoliticaDeDisponibilidade,
): politica is PoliticaDeDisponibilidade & Reabastecivel {
  return 'reabastecer' in politica;
}
