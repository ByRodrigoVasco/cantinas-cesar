import { ControleDeEstoque } from '../dominio/produto/ControleDeEstoque';
import { PreparoNaHora } from '../dominio/produto/PreparoNaHora';
import { Produto } from '../dominio/produto/Produto';
import type { RepositorioDeProdutos } from './portas';

export type DadosDoProduto = {
  nome: string;
  categoria: string;
  precoEmCentavos: number;
} & (
  | { tipo: 'perecivel'; tempoDePreparoMin: number }
  | { tipo: 'nao-perecivel'; estoqueIdeal: number; quantidadeInicial?: number }
);

/** Caso de uso da tia: "Cadastra produto" (perecível ou não perecível). */
export class CadastrarProduto {
  constructor(private readonly produtos: RepositorioDeProdutos) {}

  executar(dados: DadosDoProduto): Produto {
    const politica =
      dados.tipo === 'perecivel'
        ? new PreparoNaHora(dados.tempoDePreparoMin)
        : new ControleDeEstoque(dados.estoqueIdeal, dados.quantidadeInicial);
    const produto = new Produto(crypto.randomUUID(), dados.nome.trim(), dados.categoria, dados.precoEmCentavos, politica);
    this.produtos.salvar(produto);
    return produto;
  }
}
