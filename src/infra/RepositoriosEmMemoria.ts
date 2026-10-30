import type { RepositorioDePedidos, RepositorioDeProdutos } from '../aplicacao/portas';
import type { Pedido } from '../dominio/pedido/Pedido';
import type { Produto } from '../dominio/produto/Produto';

/** PoC sem banco: trocar por um banco real é criar outra classe que implemente a mesma porta. */
export class RepositorioDeProdutosEmMemoria implements RepositorioDeProdutos {
  private readonly produtos = new Map<string, Produto>();

  salvar(produto: Produto): void {
    this.produtos.set(produto.id, produto);
  }

  buscarPorId(id: string): Produto | undefined {
    return this.produtos.get(id);
  }

  listar(): Produto[] {
    return [...this.produtos.values()];
  }
}

export class RepositorioDePedidosEmMemoria implements RepositorioDePedidos {
  private readonly pedidos = new Map<number, Pedido>();
  private ultimoNumero = 0;

  proximoNumero(): number {
    return ++this.ultimoNumero;
  }

  salvar(pedido: Pedido): void {
    this.pedidos.set(pedido.numero, pedido);
  }

  buscarPorNumero(numero: number): Pedido | undefined {
    return this.pedidos.get(numero);
  }

  listar(): Pedido[] {
    return [...this.pedidos.values()];
  }
}
