import './ui/estilos.css';
import { AcompanharPedidos } from './aplicacao/AcompanharPedidos';
import { AgendarCompra } from './aplicacao/AgendarCompra';
import { CadastrarProduto } from './aplicacao/CadastrarProduto';
import { CancelarPedido } from './aplicacao/CancelarPedido';
import { GerenciarCardapio } from './aplicacao/GerenciarCardapio';
import { ReporEstoque } from './aplicacao/ReporEstoque';
import { carregarCardapioInicial } from './infra/cardapioInicial';
import { NotificadorComposto, NotificadorNaTela } from './infra/notificadores';
import { RelogioDoSistema } from './infra/RelogioDoSistema';
import { RepositorioDePedidosEmMemoria, RepositorioDeProdutosEmMemoria } from './infra/RepositoriosEmMemoria';
import { App } from './ui/App';
import { TelaAluno } from './ui/TelaAluno';
import { TelaCantina } from './ui/TelaCantina';

/*
 * Raiz de composição: o ÚNICO lugar que conhece as classes concretas.
 * Trocar memória por banco, ou adicionar um canal de aviso, é mudar só esta parte.
 */
const produtos = new RepositorioDeProdutosEmMemoria();
const pedidos = new RepositorioDePedidosEmMemoria();
const relogio = new RelogioDoSistema();
const avisoNaTela = new NotificadorNaTela();
const notificador = new NotificadorComposto([avisoNaTela]);

const cadastrar = new CadastrarProduto(produtos);
const cardapio = new GerenciarCardapio(produtos);
const agendarCompra = new AgendarCompra(produtos, pedidos, relogio);
const cancelarPedido = new CancelarPedido(pedidos, produtos);
const acompanhar = new AcompanharPedidos(pedidos, notificador);
const repor = new ReporEstoque(produtos);

carregarCardapioInicial(cadastrar);

const telaAluno = new TelaAluno({ cardapio, agendarCompra, cancelarPedido, pedidos: acompanhar, relogio });
avisoNaTela.inscrever((aviso) => telaAluno.receberAviso(aviso));
const telaCantina = new TelaCantina({ pedidos: acompanhar, cardapio, repor, cadastrar, relogio });

const raiz = document.querySelector<HTMLElement>('#app');
if (raiz) new App(raiz, telaAluno, telaCantina);
