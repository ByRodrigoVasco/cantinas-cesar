import { resumirPeriodo, type Periodo, type ResumoDoPeriodo } from '../../dominio/estoque/resumirPeriodo';
import type { Usuario } from '../../dominio/usuario/Usuario';
import { cantinaDe } from '../autorizacao';
import type { RepositorioDeMovimentacoes, Relogio } from '../portas';

/** Acesso cantina: o painel com o resumo do dia, da semana e do mês. */
export class ResumoDaCantina {
  constructor(
    private readonly movimentacoes: RepositorioDeMovimentacoes,
    private readonly relogio: Relogio,
  ) {}

  doPeriodo(quem: Usuario, periodo: Periodo): ResumoDoPeriodo {
    return resumirPeriodo(this.movimentacoes.listar(cantinaDe(quem)), periodo, this.relogio.instante());
  }
}
