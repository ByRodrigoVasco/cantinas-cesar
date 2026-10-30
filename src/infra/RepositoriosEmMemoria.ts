import type {
  RepositorioDeCantinas, RepositorioDeMovimentacoes, RepositorioDePedidos, RepositorioDeProdutos, RepositorioDeUsuarios,
  Sessao,
} from '../aplicacao/portas';
import type { Cantina } from '../dominio/cantina/Cantina';
import type { Movimentacao } from '../dominio/estoque/Movimentacao';
import type { Pedido } from '../dominio/pedido/Pedido';
import type { Produto } from '../dominio/produto/Produto';
import type { Usuario } from '../dominio/usuario/Usuario';

/** Versões em memória das portas: usadas nos testes e trocáveis em main.ts sem mudar nada mais. */
export class RepositorioDeCantinasEmMemoria implements RepositorioDeCantinas {
  private readonly cantinas = new Map<string, Cantina>();

  salvar(cantina: Cantina): void {
    this.cantinas.set(cantina.id, cantina);
  }

  buscarPorId(id: string): Cantina | undefined {
    return this.cantinas.get(id);
  }

  listar(): Cantina[] {
    return [...this.cantinas.values()];
  }
}

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

export class RepositorioDeMovimentacoesEmMemoria implements RepositorioDeMovimentacoes {
  private readonly movimentacoes: Movimentacao[] = [];

  registrar(movimentacao: Movimentacao): void {
    this.movimentacoes.push(movimentacao);
  }

  listar(cantinaId: string): Movimentacao[] {
    return this.movimentacoes.filter((m) => m.cantinaId === cantinaId);
  }
}

export class RepositorioDeUsuariosEmMemoria implements RepositorioDeUsuarios {
  private readonly usuarios = new Map<string, Usuario>();

  salvar(usuario: Usuario): void {
    this.usuarios.set(usuario.id, usuario);
  }

  buscarPorId(id: string): Usuario | undefined {
    return this.usuarios.get(id);
  }

  buscarPorEmail(email: string): Usuario | undefined {
    return [...this.usuarios.values()].find((u) => u.email === email);
  }
}

export class SessaoEmMemoria implements Sessao {
  private id: string | null = null;

  idDoUsuario(): string | null {
    return this.id;
  }

  iniciar(idDoUsuario: string): void {
    this.id = idDoUsuario;
  }

  encerrar(): void {
    this.id = null;
  }
}
