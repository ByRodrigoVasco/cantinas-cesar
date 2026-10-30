import { ErroDeDominio } from '../dominio/ErroDeDominio';
import type { Pedido } from '../dominio/pedido/Pedido';
import type { Notificador, RepositorioDePedidos } from './portas';

export interface ItemParaPreparar {
  readonly nome: string;
  readonly quantidade: number;
}

/**
 * Casos de uso "Visualizar pedidos agendados" (tia) e o ciclo de vida do pedido.
 * A tia só faz uma coisa: marcar pronto. O aviso ao aluno sai sozinho e quem confirma
 * a retirada é o próprio aluno.
 */
export class AcompanharPedidos {
  constructor(
    private readonly pedidos: RepositorioDePedidos,
    private readonly notificador: Notificador,
  ) {}

  /** Fila da tia: o que precisa começar primeiro aparece primeiro. */
  filaDaCantina(): Pedido[] {
    return this.pedidos
      .listar()
      .filter((pedido) => pedido.estaNaFila())
      .sort((a, b) => a.horarioParaComecar().comparar(b.horarioParaComecar()));
  }

  /** Soma o que ainda falta preparar, para a tia fazer em lote ("5 tapiocas, 3 coxinhas"). */
  resumoDoQueFazer(): ItemParaPreparar[] {
    const totais = new Map<string, number>();
    for (const pedido of this.pedidos.listar().filter((p) => p.status === 'agendado')) {
      for (const item of pedido.itens.filter((i) => i.tempoDePreparoMin > 0)) {
        totais.set(item.nome, (totais.get(item.nome) ?? 0) + item.quantidade);
      }
    }
    return [...totais].map(([nome, quantidade]) => ({ nome, quantidade }));
  }

  pedidosDoCliente(clienteId: string): Pedido[] {
    return this.pedidos.listar().filter((pedido) => pedido.clienteId === clienteId);
  }

  marcarPronto(numero: number): void {
    const pedido = this.buscar(numero);
    pedido.marcarPronto();
    this.pedidos.salvar(pedido);
    this.notificador.notificar({
      clienteId: pedido.clienteId,
      numeroDoPedido: pedido.numero,
      mensagem: `${pedido.cliente}, seu pedido #${pedido.numero} está pronto! Pode retirar no balcão.`,
    });
  }

  /** Toque errado no "Pronto": volta para a fila de preparo e o aviso some da tela do aluno. */
  desfazerPronto(numero: number): void {
    const pedido = this.buscar(numero);
    pedido.desfazerPronto();
    this.pedidos.salvar(pedido);
  }

  confirmarRetirada(numero: number): void {
    const pedido = this.buscar(numero);
    pedido.confirmarRetirada();
    this.pedidos.salvar(pedido);
  }

  private buscar(numero: number): Pedido {
    const pedido = this.pedidos.buscarPorNumero(numero);
    if (!pedido) throw new ErroDeDominio(`Pedido #${numero} não encontrado.`);
    return pedido;
  }
}
