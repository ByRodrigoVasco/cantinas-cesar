import { Produto } from '../dominio/produto/Produto';
import { restaurarPolitica } from '../dominio/produto/restaurarPolitica';
import type { RepositorioDeProdutos } from './portas';

export type DadosDoProduto = {
  nome: string;
  categoria: string;
  precoEmCentavos: number;
  foto?: string;
} & (
  | { tipo: 'perecivel'; tempoDePreparoMin: number }
  | { tipo: 'nao-perecivel'; estoqueIdeal: number; quantidadeInicial?: number }
);

/** Caso de uso da tia: "Cadastra produto" (perecível ou não perecível). */
export class CadastrarProduto {
  constructor(private readonly produtos: RepositorioDeProdutos) {}

  executar(dados: DadosDoProduto): Produto {
    const politica = restaurarPolitica(
      dados.tipo === 'perecivel'
        ? { tipo: 'feito-na-hora', tempoDePreparoMin: dados.tempoDePreparoMin }
        : { tipo: 'estoque', estoqueIdeal: dados.estoqueIdeal, quantidade: dados.quantidadeInicial ?? dados.estoqueIdeal },
    );
    const produto = new Produto(
      crypto.randomUUID(), dados.nome.trim(), dados.categoria, dados.precoEmCentavos, politica, dados.foto,
    );
    this.produtos.salvar(produto);
    return produto;
  }
}
