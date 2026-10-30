import { Produto } from '../../dominio/produto/Produto';
import { restaurarPolitica } from '../../dominio/produto/restaurarPolitica';
import type { Usuario } from '../../dominio/usuario/Usuario';
import { cantinaDe } from '../autorizacao';
import type { RepositorioDeProdutos } from '../portas';

export type DadosDoProduto = {
  nome: string;
  categoria: string;
  precoEmCentavos: number;
  foto?: string;
} & (
  | { tipo: 'perecivel'; tempoDePreparoMin: number }
  | { tipo: 'nao-perecivel'; estoqueIdeal: number; quantidadeInicial?: number }
);

/** Acesso cantina: "Cadastra produto" (perecível ou não perecível) no próprio cardápio. */
export class CadastrarProduto {
  constructor(private readonly produtos: RepositorioDeProdutos) {}

  executar(quem: Usuario, dados: DadosDoProduto): Produto {
    const politica = restaurarPolitica(
      dados.tipo === 'perecivel'
        ? { tipo: 'feito-na-hora', tempoDePreparoMin: dados.tempoDePreparoMin }
        : { tipo: 'estoque', estoqueIdeal: dados.estoqueIdeal, quantidade: dados.quantidadeInicial ?? dados.estoqueIdeal },
    );
    const produto = new Produto(
      crypto.randomUUID(), cantinaDe(quem), dados.nome.trim(), dados.categoria, dados.precoEmCentavos, politica, dados.foto,
    );
    this.produtos.salvar(produto);
    return produto;
  }
}
