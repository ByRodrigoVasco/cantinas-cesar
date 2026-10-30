import { ErroDeDominio } from '../dominio/ErroDeDominio';
import type { Produto } from '../dominio/produto/Produto';
import type { RepositorioDeProdutos } from './portas';

export interface ItemDaListaDeCompras {
  readonly produto: Produto;
  readonly quantidade: number;
}

/**
 * Hoje a tia confere o estoque de cabeça e pede ao fornecedor pelo WhatsApp.
 * Aqui a lista sai pronta; quando a entrega chega, um toque repõe tudo.
 */
export class ReporEstoque {
  constructor(private readonly produtos: RepositorioDeProdutos) {}

  listaDeCompras(): ItemDaListaDeCompras[] {
    return this.produtos
      .listar()
      .filter((produto) => produto.precisaRepor())
      .map((produto) => ({ produto, quantidade: produto.sugestaoDeReposicao() }));
  }

  mensagemParaFornecedor(): string {
    const itens = this.listaDeCompras();
    if (itens.length === 0) return '';
    const linhas = itens.map(({ produto, quantidade }) => `• ${quantidade}x ${produto.nome}`);
    return ['Bom dia! Pedido da cantina do CESAR:', ...linhas, 'Obrigada!'].join('\n');
  }

  registrarEntrega(itens: { produtoId: string; quantidade: number }[]): void {
    for (const { produtoId, quantidade } of itens) {
      if (quantidade <= 0) continue;
      const produto = this.produtos.buscarPorId(produtoId);
      if (!produto) throw new ErroDeDominio('Produto não encontrado.');
      produto.reabastecer(quantidade);
      this.produtos.salvar(produto);
    }
  }
}
