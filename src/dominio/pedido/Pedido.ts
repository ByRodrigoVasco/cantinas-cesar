import { ErroDeDominio } from '../ErroDeDominio';
import { Horario } from '../Horario';

export type StatusPedido = 'agendado' | 'pronto' | 'retirado' | 'cancelado';

/** Cópia do produto no momento da compra: se o preço mudar depois, o pedido não muda. */
export interface ItemPedido {
  readonly produtoId: string;
  readonly nome: string;
  readonly quantidade: number;
  readonly precoUnitarioEmCentavos: number;
  readonly tempoDePreparoMin: number;
}

export interface PedidoSalvo {
  readonly numero: number;
  readonly clienteId: string;
  readonly cliente: string;
  readonly itens: readonly ItemPedido[];
  readonly horarioDeRetirada: string;
  readonly status: StatusPedido;
}

/**
 * Pedido agendado por um aluno. O status é privado: só muda pelos métodos abaixo,
 * que garantem a ordem agendado → pronto → retirado (Ocultamento de informação).
 * Saídas de emergência: o aluno cancela enquanto está agendado; a tia desfaz um "pronto".
 */
export class Pedido {
  private _status: StatusPedido = 'agendado';
  readonly itens: readonly ItemPedido[];

  constructor(
    readonly numero: number,
    readonly clienteId: string,
    /** Nome que a tia chama no balcão. */
    readonly cliente: string,
    itens: readonly ItemPedido[],
    readonly horarioDeRetirada: Horario,
  ) {
    if (!clienteId || !cliente.trim()) throw new ErroDeDominio('Entre na sua conta para fazer o pedido.');
    if (itens.length === 0) throw new ErroDeDominio('O pedido está vazio.');
    this.itens = Object.freeze([...itens]);
  }

  get status(): StatusPedido {
    return this._status;
  }

  /** Ainda precisa de atenção da cantina (preparar ou entregar). */
  estaNaFila(): boolean {
    return this._status === 'agendado' || this._status === 'pronto';
  }

  totalEmCentavos(): number {
    return this.itens.reduce((soma, item) => soma + item.precoUnitarioEmCentavos * item.quantidade, 0);
  }

  /** Itens feitos na hora são preparados um depois do outro. */
  tempoDePreparoMin(): number {
    return this.itens.reduce((soma, item) => soma + item.tempoDePreparoMin * item.quantidade, 0);
  }

  /** Hora em que a tia deve começar, para ficar pronto exatamente na retirada. */
  horarioParaComecar(): Horario {
    return this.horarioDeRetirada.menos(this.tempoDePreparoMin());
  }

  marcarPronto(): void {
    if (this._status !== 'agendado') throw new ErroDeDominio(`Pedido #${this.numero} já foi marcado como pronto.`);
    this._status = 'pronto';
  }

  desfazerPronto(): void {
    if (this._status !== 'pronto') throw new ErroDeDominio(`Pedido #${this.numero} não está marcado como pronto.`);
    this._status = 'agendado';
  }

  confirmarRetirada(): void {
    if (this._status !== 'pronto') throw new ErroDeDominio(`Pedido #${this.numero} ainda não está pronto.`);
    this._status = 'retirado';
  }

  cancelar(): void {
    if (this._status !== 'agendado') {
      throw new ErroDeDominio(`Pedido #${this.numero} já foi preparado e não pode ser cancelado. Fale com a tia.`);
    }
    this._status = 'cancelado';
  }

  paraDados(): PedidoSalvo {
    return {
      numero: this.numero,
      clienteId: this.clienteId,
      cliente: this.cliente,
      itens: this.itens,
      horarioDeRetirada: this.horarioDeRetirada.toString(),
      status: this._status,
    };
  }

  static deDados(dados: PedidoSalvo): Pedido {
    const pedido = new Pedido(dados.numero, dados.clienteId, dados.cliente, dados.itens, Horario.de(dados.horarioDeRetirada));
    pedido._status = dados.status;
    return pedido;
  }
}
