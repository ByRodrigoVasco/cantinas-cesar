import type {
  Aviso, LeitorDeAvisos, Notificador, RepositorioDeCantinas, RepositorioDeMovimentacoes, RepositorioDePedidos,
  RepositorioDeProdutos,
  RepositorioDeUsuarios, Sessao,
} from '../aplicacao/portas';
import { Cantina, type CantinaSalva } from '../dominio/cantina/Cantina';
import type { Movimentacao } from '../dominio/estoque/Movimentacao';
import { Pedido, type PedidoSalvo } from '../dominio/pedido/Pedido';
import { Produto, type ProdutoSalvo } from '../dominio/produto/Produto';
import { Usuario, type UsuarioSalvo } from '../dominio/usuario/Usuario';

/*
 * Implementações das portas usando o armazenamento do navegador. Os dados sobrevivem ao
 * recarregar a página e são compartilhados entre abas: estudante numa aba e cantina em outra.
 * Os casos de uso não sabem disso; main.ts é quem escolhe esta implementação.
 */

/** v2: a versão com várias cantinas; dados da v1 (uma cantina só) são ignorados. */
const PREFIXO = 'cantina-cesar:v2:';

/** Uma "tabela" guardada como JSON { chave: registro } numa entrada do Storage. */
class ColecaoLocal<T> {
  constructor(
    private readonly nome: string,
    private readonly armazenamento: Storage = localStorage,
  ) {}

  listar(): T[] {
    return Object.values(this.ler());
  }

  buscar(chave: string): T | undefined {
    return this.ler()[chave];
  }

  salvar(chave: string, registro: T): void {
    const tabela = this.ler();
    tabela[chave] = registro;
    this.armazenamento.setItem(PREFIXO + this.nome, JSON.stringify(tabela));
  }

  private ler(): Record<string, T> {
    try {
      return JSON.parse(this.armazenamento.getItem(PREFIXO + this.nome) ?? '{}');
    } catch {
      return {};
    }
  }
}

export class RepositorioDeCantinasLocal implements RepositorioDeCantinas {
  private readonly colecao = new ColecaoLocal<CantinaSalva>('cantinas');

  salvar(cantina: Cantina): void {
    this.colecao.salvar(cantina.id, cantina.paraDados());
  }

  buscarPorId(id: string): Cantina | undefined {
    const salva = this.colecao.buscar(id);
    return salva && Cantina.deDados(salva);
  }

  listar(): Cantina[] {
    return this.colecao.listar().map(Cantina.deDados);
  }
}

export class RepositorioDeProdutosLocal implements RepositorioDeProdutos {
  private readonly colecao = new ColecaoLocal<ProdutoSalvo>('produtos');

  salvar(produto: Produto): void {
    this.colecao.salvar(produto.id, produto.paraDados());
  }

  buscarPorId(id: string): Produto | undefined {
    const salvo = this.colecao.buscar(id);
    return salvo && Produto.deDados(salvo);
  }

  listar(): Produto[] {
    return this.colecao.listar().map(Produto.deDados);
  }
}

export class RepositorioDePedidosLocal implements RepositorioDePedidos {
  private readonly colecao = new ColecaoLocal<PedidoSalvo>('pedidos');

  proximoNumero(): number {
    return Math.max(0, ...this.colecao.listar().map((p) => p.numero)) + 1;
  }

  salvar(pedido: Pedido): void {
    this.colecao.salvar(String(pedido.numero), pedido.paraDados());
  }

  buscarPorNumero(numero: number): Pedido | undefined {
    const salvo = this.colecao.buscar(String(numero));
    return salvo && Pedido.deDados(salvo);
  }

  listar(): Pedido[] {
    return this.colecao.listar().map(Pedido.deDados);
  }
}

export class RepositorioDeMovimentacoesLocal implements RepositorioDeMovimentacoes {
  private readonly colecao = new ColecaoLocal<Movimentacao>('movimentacoes');

  registrar(movimentacao: Movimentacao): void {
    this.colecao.salvar(movimentacao.id, movimentacao);
  }

  listar(cantinaId: string): Movimentacao[] {
    return this.colecao.listar().filter((m) => m.cantinaId === cantinaId);
  }
}

export class RepositorioDeUsuariosLocal implements RepositorioDeUsuarios {
  private readonly colecao = new ColecaoLocal<UsuarioSalvo>('usuarios');

  salvar(usuario: Usuario): void {
    this.colecao.salvar(usuario.id, usuario.paraDados());
  }

  buscarPorId(id: string): Usuario | undefined {
    const salvo = this.colecao.buscar(id);
    return salvo && Usuario.deDados(salvo);
  }

  buscarPorEmail(email: string): Usuario | undefined {
    const salvo = this.colecao.listar().find((u) => u.email === email);
    return salvo && Usuario.deDados(salvo);
  }
}

/**
 * Um aviso por pedido, guardado onde a aba do estudante consegue ler. Implementa as duas
 * interfaces separadas (Notificador e LeitorDeAvisos) porque aqui o mesmo lugar escreve e lê.
 */
export class CaixaDeAvisosLocal implements Notificador, LeitorDeAvisos {
  private readonly colecao = new ColecaoLocal<Aviso>('avisos');

  notificar(aviso: Aviso): void {
    this.colecao.salvar(String(aviso.numeroDoPedido), aviso);
  }

  avisosPara(clienteId: string): Aviso[] {
    return this.colecao.listar().filter((aviso) => aviso.clienteId === clienteId);
  }
}

/** Sessão por aba (sessionStorage): dá para ter o estudante numa aba e a cantina em outra. */
export class SessaoDaAba implements Sessao {
  private static readonly CHAVE = PREFIXO + 'sessao';

  idDoUsuario(): string | null {
    return sessionStorage.getItem(SessaoDaAba.CHAVE);
  }

  iniciar(idDoUsuario: string): void {
    sessionStorage.setItem(SessaoDaAba.CHAVE, idDoUsuario);
  }

  encerrar(): void {
    sessionStorage.removeItem(SessaoDaAba.CHAVE);
  }
}

/** Volta ao estado inicial da demonstração (usado antes de gravar o vídeo). */
export function apagarDadosLocais(): void {
  for (const armazenamento of [localStorage, sessionStorage]) {
    Object.keys(armazenamento)
      .filter((chave) => chave.startsWith(PREFIXO))
      .forEach((chave) => armazenamento.removeItem(chave));
  }
}

/** Avisa quando outra aba mudou os dados (ex.: a cantina marcou um pedido como pronto). */
export function aoMudarEmOutraAba(ouvinte: () => void): void {
  window.addEventListener('storage', (evento) => {
    if (evento.key?.startsWith(PREFIXO)) ouvinte();
  });
}
