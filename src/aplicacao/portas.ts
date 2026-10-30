import type { Cantina } from '../dominio/cantina/Cantina';
import type { Movimentacao } from '../dominio/estoque/Movimentacao';
import type { Horario } from '../dominio/Horario';
import type { Pedido } from '../dominio/pedido/Pedido';
import type { Produto } from '../dominio/produto/Produto';
import type { Usuario } from '../dominio/usuario/Usuario';

/*
 * Portas: abstrações das quais os casos de uso dependem.
 * Os detalhes (memória, armazenamento do navegador, relógio) ficam em src/infra e são ligados
 * só em src/main.ts (Inversão de Dependências).
 */

export interface RepositorioDeCantinas {
  salvar(cantina: Cantina): void;
  buscarPorId(id: string): Cantina | undefined;
  listar(): Cantina[];
}

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

/** Histórico de entradas e saídas: só acrescenta, nunca altera. */
export interface RepositorioDeMovimentacoes {
  registrar(movimentacao: Movimentacao): void;
  listar(cantinaId: string): Movimentacao[];
}

export interface RepositorioDeUsuarios {
  salvar(usuario: Usuario): void;
  buscarPorId(id: string): Usuario | undefined;
  buscarPorEmail(email: string): Usuario | undefined;
}

/** Quem está usando o app neste dispositivo. */
export interface Sessao {
  idDoUsuario(): string | null;
  iniciar(idDoUsuario: string): void;
  encerrar(): void;
}

export interface Aviso {
  readonly clienteId: string;
  readonly numeroDoPedido: number;
  readonly mensagem: string;
}

/** Lado de quem avisa (a cantina): canal pelo qual o estudante fica sabendo que o pedido está pronto. */
export interface Notificador {
  notificar(aviso: Aviso): void;
}

/**
 * Lado de quem recebe (o estudante). Separado de Notificador (Segregação de Interfaces): quem só
 * avisa não precisa saber ler, e um canal como SMS pode avisar sem nunca ser lido pelo app.
 */
export interface LeitorDeAvisos {
  avisosPara(clienteId: string): Aviso[];
}

export interface Relogio {
  agora(): Horario;
  /** Data e hora completas, para o histórico e os resumos do dia, semana e mês. */
  instante(): Date;
}
