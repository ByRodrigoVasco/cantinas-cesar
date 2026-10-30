import { ControleDeEstoque } from './ControleDeEstoque';
import type { PoliticaDeDisponibilidade, PoliticaSalva } from './PoliticaDeDisponibilidade';
import { PreparoNaHora } from './PreparoNaHora';

/** Único ponto que conhece todas as políticas concretas: uma política nova entra aqui. */
export function restaurarPolitica(salva: PoliticaSalva): PoliticaDeDisponibilidade {
  return salva.tipo === 'feito-na-hora'
    ? new PreparoNaHora(salva.tempoDePreparoMin)
    : new ControleDeEstoque(salva.estoqueIdeal, salva.quantidade);
}
