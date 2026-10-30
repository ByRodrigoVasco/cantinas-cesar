import { ErroDeDominio } from '../ErroDeDominio';
import type { PoliticaDeDisponibilidade } from './PoliticaDeDisponibilidade';

/** Produto perecível: feito na hora (tapioca, coxinha). Não tem estoque a controlar. */
export class PreparoNaHora implements PoliticaDeDisponibilidade {
  constructor(readonly tempoDePreparoMin: number) {
    if (!(tempoDePreparoMin > 0)) throw new ErroDeDominio('Tempo de preparo deve ser maior que zero.');
  }

  podeAtender(quantidade: number): boolean {
    return quantidade > 0;
  }

  reservar(quantidade: number): void {
    if (!this.podeAtender(quantidade)) throw new ErroDeDominio('Quantidade inválida.');
  }

  /** Nada foi separado de estoque, então não há o que devolver. */
  liberar(): void {}

  descricao(): string {
    return `Feito na hora · ~${this.tempoDePreparoMin} min`;
  }
}
