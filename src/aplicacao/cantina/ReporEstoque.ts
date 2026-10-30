import type { Produto } from '../../dominio/produto/Produto';
import type { Usuario } from '../../dominio/usuario/Usuario';
import { cantinaDe } from '../autorizacao';
import type { RepositorioDeProdutos } from '../portas';
import type { EstoqueDaCantina } from './EstoqueDaCantina';

export interface ItemDaListaDeCompras {
  readonly produto: Produto;
  readonly quantidade: number;
}

/**
 * Hoje a cantina confere o estoque de cabeça e pede ao fornecedor pelo WhatsApp.
 * Aqui a lista sai pronta; quando a entrega chega, um toque repõe tudo.
 */
export class ReporEstoque {
  constructor(
    private readonly produtos: RepositorioDeProdutos,
    private readonly estoque: EstoqueDaCantina,
  ) {}

  listaDeCompras(quem: Usuario): ItemDaListaDeCompras[] {
    const cantinaId = cantinaDe(quem);
    return this.produtos
      .listar()
      .filter((produto) => produto.cantinaId === cantinaId)
      .map((produto) => ({ produto, quantidade: produto.reposicaoNecessaria() }))
      .filter(({ quantidade }) => quantidade > 0);
  }

  mensagemParaFornecedor(quem: Usuario, nomeDaCantina: string): string {
    const itens = this.listaDeCompras(quem);
    if (itens.length === 0) return '';
    const linhas = itens.map(({ produto, quantidade }) => `• ${quantidade}x ${produto.nome}`);
    return [`Bom dia! Pedido da ${nomeDaCantina} (CESAR):`, ...linhas, 'Obrigada!'].join('\n');
  }

  registrarEntrega(quem: Usuario, itens: { produtoId: string; quantidade: number }[]): void {
    // Cada item recebido vira uma entrada no histórico, como se fosse registrada à mão.
    for (const { produtoId, quantidade } of itens) {
      if (quantidade > 0) this.estoque.registrar(quem, { produtoId, motivo: 'compra', quantidade });
    }
  }
}
