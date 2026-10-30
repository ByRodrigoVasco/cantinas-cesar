import { ControleDeEstoque } from './ControleDeEstoque';
import type { PoliticaDeDisponibilidade, PoliticaSalva } from './PoliticaDeDisponibilidade';
import { PreparoNaHora } from './PreparoNaHora';

type TipoDePolitica = PoliticaSalva['tipo'];

/**
 * Registro das políticas: cada uma sabe se restaurar (paraDados/deDados ficam juntos na classe).
 * Uma política nova entra com uma classe nova e uma linha aqui, sem mexer em nenhum "if" ou
 * "switch" (Aberto/Fechado). O tipo abaixo obriga o registro a cobrir todos os tipos: esquecer
 * a linha vira erro de compilação, não bug em produção.
 */
const POLITICAS: { [T in TipoDePolitica]: (salva: Extract<PoliticaSalva, { tipo: T }>) => PoliticaDeDisponibilidade } = {
  'feito-na-hora': PreparoNaHora.deDados,
  estoque: ControleDeEstoque.deDados,
};

export function restaurarPolitica<T extends TipoDePolitica>(salva: Extract<PoliticaSalva, { tipo: T }>): PoliticaDeDisponibilidade {
  const restaurar = POLITICAS[salva.tipo as T] as (salva: Extract<PoliticaSalva, { tipo: T }>) => PoliticaDeDisponibilidade;
  return restaurar(salva);
}
