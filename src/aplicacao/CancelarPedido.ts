import { ErroDeDominio } from '../dominio/ErroDeDominio';
import type { RepositorioDePedidos, RepositorioDeProdutos } from './portas';

/** O aluno desistiu antes do preparo: o pedido sai da fila e o estoque volta sozinho. */
export class CancelarPedido {
  constructor(
    private readonly pedidos: RepositorioDePedidos,
    private readonly produtos: RepositorioDeProdutos,
  ) {}

  executar(numero: number): void {
    const pedido = this.pedidos.buscarPorNumero(numero);
    if (!pedido) throw new ErroDeDominio(`Pedido #${numero} não encontrado.`);
    pedido.cancelar();
    for (const item of pedido.itens) {
      const produto = this.produtos.buscarPorId(item.produtoId);
      if (!produto) continue;
      produto.liberar(item.quantidade);
      this.produtos.salvar(produto);
    }
    this.pedidos.salvar(pedido);
  }
}
