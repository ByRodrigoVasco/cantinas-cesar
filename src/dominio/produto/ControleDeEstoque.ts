import { ErroDeDominio } from '../ErroDeDominio';
import type { PoliticaDeDisponibilidade, Reabastecivel } from './PoliticaDeDisponibilidade';

/** Abaixo desta fração do estoque ideal, o item entra sozinho na lista de compras. */
const FRACAO_PARA_REPOR = 0.5;

/** Produto não perecível: pronta-entrega (refrigerante, salgadinho), vendido do estoque. */
export class ControleDeEstoque implements PoliticaDeDisponibilidade, Reabastecivel {
  readonly tempoDePreparoMin = 0;
  private quantidade: number;

  constructor(
    private readonly estoqueIdeal: number,
    quantidadeInicial: number = estoqueIdeal,
  ) {
    if (!(estoqueIdeal > 0)) throw new ErroDeDominio('Estoque ideal deve ser maior que zero.');
    if (!(quantidadeInicial >= 0)) throw new ErroDeDominio('Estoque não pode ser negativo.');
    this.quantidade = quantidadeInicial;
  }

  get quantidadeEmEstoque(): number {
    return this.quantidade;
  }

  podeAtender(quantidade: number): boolean {
    return quantidade > 0 && quantidade <= this.quantidade;
  }

  reservar(quantidade: number): void {
    if (!this.podeAtender(quantidade)) throw new ErroDeDominio('Estoque insuficiente.');
    this.quantidade -= quantidade;
  }

  liberar(quantidade: number): void {
    this.quantidade += quantidade;
  }

  reabastecer(quantidade: number): void {
    if (quantidade <= 0) throw new ErroDeDominio('Quantidade para repor deve ser maior que zero.');
    this.quantidade += quantidade;
  }

  precisaRepor(): boolean {
    return this.quantidade < this.estoqueIdeal * FRACAO_PARA_REPOR;
  }

  sugestaoDeReposicao(): number {
    return Math.max(0, this.estoqueIdeal - this.quantidade);
  }

  descricao(): string {
    return this.quantidade > 0 ? `Pronta-entrega · ${this.quantidade} no estoque` : 'Esgotado';
  }
}
