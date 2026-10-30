import { Autenticacao } from '../src/aplicacao/acesso/Autenticacao';
import { CadastrarEstudante } from '../src/aplicacao/acesso/CadastrarEstudante';
import { CadastrarProduto } from '../src/aplicacao/cantina/CadastrarProduto';
import { ConfigurarCantina } from '../src/aplicacao/cantina/ConfigurarCantina';
import { EstoqueDaCantina } from '../src/aplicacao/cantina/EstoqueDaCantina';
import { GerenciarCardapio } from '../src/aplicacao/cantina/GerenciarCardapio';
import { PainelDaCantina } from '../src/aplicacao/cantina/PainelDaCantina';
import { ReporEstoque } from '../src/aplicacao/cantina/ReporEstoque';
import { CadastrarCantina } from '../src/aplicacao/cesar/CadastrarCantina';
import { VisaoGeralDasCantinas } from '../src/aplicacao/cesar/VisaoGeralDasCantinas';
import { AgendarCompra } from '../src/aplicacao/estudante/AgendarCompra';
import { ConsultarCantinas } from '../src/aplicacao/estudante/ConsultarCantinas';
import { PedidosDoEstudante } from '../src/aplicacao/estudante/PedidosDoEstudante';
import type { Aviso, Notificador, Relogio } from '../src/aplicacao/portas';
import { Horario } from '../src/dominio/Horario';
import type { Produto } from '../src/dominio/produto/Produto';
import { Usuario } from '../src/dominio/usuario/Usuario';
import {
  RepositorioDeCantinasEmMemoria, RepositorioDeMovimentacoesEmMemoria, RepositorioDePedidosEmMemoria,
  RepositorioDeProdutosEmMemoria, RepositorioDeUsuariosEmMemoria, SessaoEmMemoria,
} from '../src/infra/RepositoriosEmMemoria';

/* Dublês: só funcionam porque os casos de uso dependem de portas, não de classes concretas. */
export class RelogioParado implements Relogio {
  constructor(private momento: Date) {}
  agora(): Horario {
    return Horario.deData(this.momento);
  }
  instante(): Date {
    return new Date(this.momento);
  }
  avancarPara(momento: Date): void {
    this.momento = momento;
  }
}

export class NotificadorEspiao implements Notificador {
  readonly avisos: Aviso[] = [];
  notificar(aviso: Aviso): void {
    this.avisos.push(aviso);
  }
}

/** Quarta-feira, 29/10/2026, 20:00 — o intervalo da noite. */
export const QUARTA_20H = new Date(2026, 9, 28, 20, 0);

/**
 * O campus inteiro em memória: o CESAR, a Imperial e um Café, com produtos e dois estudantes.
 * Cada teste ganha um cenário novo, então um não interfere no outro.
 */
export function montarCenario() {
  const repositorios = {
    cantinas: new RepositorioDeCantinasEmMemoria(),
    usuarios: new RepositorioDeUsuariosEmMemoria(),
    produtos: new RepositorioDeProdutosEmMemoria(),
    pedidos: new RepositorioDePedidosEmMemoria(),
    movimentacoes: new RepositorioDeMovimentacoesEmMemoria(),
  };
  const { cantinas, usuarios, produtos, pedidos, movimentacoes } = repositorios;
  const sessao = new SessaoEmMemoria();
  const relogio = new RelogioParado(QUARTA_20H);
  const notificador = new NotificadorEspiao();

  const estoque = new EstoqueDaCantina(produtos, movimentacoes, relogio);
  const casos = {
    autenticacao: new Autenticacao(usuarios, sessao),
    cadastrarEstudante: new CadastrarEstudante(usuarios, sessao),
    cadastrarCantina: new CadastrarCantina(cantinas, usuarios),
    visaoGeral: new VisaoGeralDasCantinas(cantinas, produtos, pedidos),
    cadastrarProduto: new CadastrarProduto(produtos),
    cardapio: new GerenciarCardapio(produtos),
    estoque,
    repor: new ReporEstoque(produtos, estoque),
    painel: new PainelDaCantina(pedidos, notificador, estoque),
    configurar: new ConfigurarCantina(cantinas),
    consultar: new ConsultarCantinas(cantinas, produtos, pedidos),
    agendar: new AgendarCompra(produtos, pedidos, relogio),
    meusPedidos: new PedidosDoEstudante(pedidos, produtos, estoque),
  };

  const gestao = new Usuario('cesar', 'Gestão CESAR', 'gestao@cesar.school', 'cesar', 'senha123');
  usuarios.salvar(gestao);
  const abrirCantina = (nome: string, email: string) => {
    const cantina = casos.cadastrarCantina.executar(gestao, { nome, local: 'Campus', responsavel: 'Equipe', email, senha: 'senha123' });
    const conta = usuarios.buscarPorEmail(email);
    if (!conta) throw new Error('conta da cantina não criada');
    return { cantina, conta };
  };
  const imperial = abrirCantina('Imperial Padaria', 'imperial@cantina.com');
  const cafe = abrirCantina('Café do Térreo', 'cafe@cantina.com');

  const tapioca: Produto = casos.cadastrarProduto.executar(imperial.conta, {
    nome: 'Tapioca', categoria: 'Tapiocas', precoEmCentavos: 1000, tipo: 'perecivel', tempoDePreparoMin: 6,
  });
  const refri: Produto = casos.cadastrarProduto.executar(imperial.conta, {
    nome: 'Refri', categoria: 'Bebidas', precoEmCentavos: 800, tipo: 'nao-perecivel', estoqueIdeal: 4,
  });
  const cafezinho: Produto = casos.cadastrarProduto.executar(cafe.conta, {
    nome: 'Cafezinho', categoria: 'Bebidas', precoEmCentavos: 400, tipo: 'perecivel', tempoDePreparoMin: 2,
  });

  const estudante = (nome: string) => {
    const usuario = new Usuario(nome.toLowerCase(), nome, `${nome.toLowerCase()}@cesar.school`, 'estudante', 'senha123');
    usuarios.salvar(usuario);
    return usuario;
  };
  const ana = estudante('Ana');
  const beto = estudante('Beto');

  /** Atalho: estudante agenda na Imperial. */
  const pedir = (cliente: Usuario, horario: string, itens: [Produto, number][], cantinaId = imperial.cantina.id) =>
    casos.agendar.executar({
      cliente,
      cantinaId,
      horarioDeRetirada: horario,
      itens: itens.map(([produto, quantidade]) => ({ produtoId: produto.id, quantidade })),
    });

  return {
    ...repositorios, sessao, relogio, notificador, casos,
    gestao, imperial, cafe, tapioca, refri, cafezinho, ana, beto, pedir,
  };
}
