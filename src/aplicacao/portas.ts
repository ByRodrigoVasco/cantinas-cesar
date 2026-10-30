import type { Horario } from '../dominio/Horario';
import type { Pedido } from '../dominio/pedido/Pedido';
import type { Produto } from '../dominio/produto/Produto';

/*
 * Portas: abstrações das quais os casos de uso dependem.
 * Os detalhes (memória, tela, relógio do navegador) ficam em src/infra e são ligados
 * só em src/main.ts (Inversão de Dependências).
 */

export interface RepositorioDeProdutos {
  salvar(produto: Produto): void;
  buscarPorId(id: string): Produto | undefined;
  listar(): Produto[];
}

export interface RepositorioDePedidos {
  proximoNumero(): number;
  salvar(pedido: Pedido): void;
  buscarPorNumero(numero: number): Pedido | undefined;
  listar(): Pedido[];
}

export interface Aviso {
  readonly cliente: string;
  readonly numeroDoPedido: number;
  readonly mensagem: string;
}

/** Canal pelo qual o aluno fica sabendo que o pedido está pronto. */
export interface Notificador {
  notificar(aviso: Aviso): void;
}

export interface Relogio {
  agora(): Horario;
}
