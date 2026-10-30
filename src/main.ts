import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './ui/estilos.css';
import { AcompanharPedidos } from './aplicacao/AcompanharPedidos';
import { AgendarCompra } from './aplicacao/AgendarCompra';
import { Autenticacao } from './aplicacao/Autenticacao';
import { CadastrarAluno } from './aplicacao/CadastrarAluno';
import { CadastrarProduto } from './aplicacao/CadastrarProduto';
import { CancelarPedido } from './aplicacao/CancelarPedido';
import { GerenciarCardapio } from './aplicacao/GerenciarCardapio';
import { ReporEstoque } from './aplicacao/ReporEstoque';
import type { Usuario } from './dominio/usuario/Usuario';
import {
  aoMudarEmOutraAba, apagarDadosLocais, CaixaDeAvisosLocal, RepositorioDePedidosLocal, RepositorioDeProdutosLocal,
  RepositorioDeUsuariosLocal, SessaoDaAba,
} from './infra/armazenamentoLocal';
import { CONTAS_DE_DEMONSTRACAO, prepararDadosDeDemonstracao } from './infra/dadosDeDemonstracao';
import { NotificadorComposto } from './infra/notificadores';
import { RelogioDoSistema } from './infra/RelogioDoSistema';
import { App } from './ui/App';
import type { Tela } from './ui/Tela';
import { TelaAluno } from './ui/TelaAluno';
import { TelaCantina } from './ui/TelaCantina';
import { TelaLogin } from './ui/TelaLogin';

/*
 * Raiz de composição: o ÚNICO lugar que conhece as classes concretas.
 * Para voltar a guardar tudo só em memória (ou ir para um backend), basta trocar as quatro
 * linhas abaixo por outras implementações das mesmas portas. Nenhum caso de uso muda.
 */
const produtos = new RepositorioDeProdutosLocal();
const pedidos = new RepositorioDePedidosLocal();
const usuarios = new RepositorioDeUsuariosLocal();
const sessao = new SessaoDaAba();
const relogio = new RelogioDoSistema();
const caixaDeAvisos = new CaixaDeAvisosLocal();
const notificador = new NotificadorComposto([caixaDeAvisos]);

const autenticacao = new Autenticacao(usuarios, sessao);
const cadastrarAluno = new CadastrarAluno(usuarios, sessao);
const cadastrarProduto = new CadastrarProduto(produtos);
const cardapio = new GerenciarCardapio(produtos);
const agendarCompra = new AgendarCompra(produtos, pedidos, relogio);
const cancelarPedido = new CancelarPedido(pedidos, produtos);
const acompanhar = new AcompanharPedidos(pedidos, notificador);
const repor = new ReporEstoque(produtos);

prepararDadosDeDemonstracao(produtos, usuarios, cadastrarProduto);

function criarTela(usuario: Usuario | undefined): Tela {
  if (!usuario) {
    return new TelaLogin({
      autenticacao,
      cadastrarAluno,
      contasDeDemonstracao: CONTAS_DE_DEMONSTRACAO,
      restaurarDemonstracao: () => {
        apagarDadosLocais();
        prepararDadosDeDemonstracao(produtos, usuarios, cadastrarProduto);
      },
    });
  }
  if (usuario.perfil === 'cantina') {
    return new TelaCantina({ pedidos: acompanhar, cardapio, repor, cadastrar: cadastrarProduto, relogio });
  }
  return new TelaAluno({
    usuario, avisos: caixaDeAvisos, cardapio, agendarCompra, cancelarPedido, pedidos: acompanhar, relogio,
  });
}

const raiz = document.querySelector<HTMLElement>('#app');
if (raiz) new App(raiz, { autenticacao, criarTela, aoMudarEmOutraAba });
