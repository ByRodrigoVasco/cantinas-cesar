import type { AcompanharPedidos } from '../aplicacao/AcompanharPedidos';
import type { AgendarCompra, ItemSolicitado } from '../aplicacao/AgendarCompra';
import type { CancelarPedido } from '../aplicacao/CancelarPedido';
import type { GerenciarCardapio } from '../aplicacao/GerenciarCardapio';
import type { Aviso, Relogio } from '../aplicacao/portas';
import { ErroDeDominio } from '../dominio/ErroDeDominio';
import { Horario } from '../dominio/Horario';
import type { Pedido, StatusPedido } from '../dominio/pedido/Pedido';
import type { Produto } from '../dominio/produto/Produto';
import { agruparPorCategoria, escapar, formatarPreco, htmlMensagem, iconeDaCategoria } from './formatacao';
import type { Mensagem, Tela } from './Tela';

export interface DependenciasDoAluno {
  readonly cardapio: GerenciarCardapio;
  readonly agendarCompra: AgendarCompra;
  readonly cancelarPedido: CancelarPedido;
  readonly pedidos: AcompanharPedidos;
  readonly relogio: Relogio;
}

const ROTULO_DO_STATUS: Record<StatusPedido, string> = {
  agendado: 'Agendado',
  pronto: 'Pronto!',
  retirado: 'Retirado',
  cancelado: 'Cancelado',
};

/** Antecedência sugerida para o horário de retirada quando a tela abre. */
const MINUTOS_DE_ANTECEDENCIA = 15;

export class TelaAluno implements Tela {
  private nome = '';
  private horario: string;
  private readonly carrinho = new Map<string, number>();
  private readonly avisos: Aviso[] = [];
  private mensagem: Mensagem | null = null;

  constructor(private readonly deps: DependenciasDoAluno) {
    this.horario = deps.relogio.agora().mais(MINUTOS_DE_ANTECEDENCIA).toString();
  }

  receberAviso(aviso: Aviso): void {
    this.avisos.push(aviso);
  }

  mostrarMensagem(mensagem: Mensagem | null): void {
    this.mensagem = mensagem;
  }

  aoDigitar(campo: string, valor: string): void {
    if (campo === 'nome') this.nome = valor;
    if (campo === 'horario') this.horario = valor;
  }

  aoClicar(acao: string, elemento: HTMLElement): void {
    const produtoId = elemento.dataset.id ?? '';
    const numero = Number(elemento.dataset.numero);
    if (acao === 'adicionar') this.carrinho.set(produtoId, (this.carrinho.get(produtoId) ?? 0) + 1);
    if (acao === 'remover') this.removerDoCarrinho(produtoId);
    if (acao === 'repetir') this.pedirDeNovo(numero);
    if (acao === 'retirei') {
      this.deps.pedidos.confirmarRetirada(numero);
      this.mensagem = { tipo: 'sucesso', texto: 'Bom lanche! 😋' };
    }
    if (acao === 'cancelar') {
      this.deps.cancelarPedido.executar(numero);
      this.mensagem = { tipo: 'sucesso', texto: `Pedido #${numero} cancelado.` };
    }
    this.ajustarHorario();
  }

  aoEnviar(): void {
    const pedido = this.deps.agendarCompra.executar({
      cliente: this.nome,
      horarioDeRetirada: this.horario,
      itens: this.itensDoCarrinho(),
    });
    this.carrinho.clear();
    this.mensagem = {
      tipo: 'sucesso',
      texto: `Pedido #${pedido.numero} agendado para ${pedido.horarioDeRetirada}. A tia avisa aqui quando estiver pronto.`,
    };
  }

  html(): string {
    return `
      <details class="ajuda">
        <summary>Como funciona?</summary>
        <ol>
          <li>Escolha o lanche e o horário em que vai buscar.</li>
          <li>A tia prepara para ficar pronto nesse horário.</li>
          <li>Quando estiver pronto, aparece um aviso aqui. É só buscar no balcão e pagar.</li>
        </ol>
      </details>
      <label class="campo">
        <span>Seu nome</span>
        <input data-campo="nome" value="${escapar(this.nome)}" placeholder="Como a tia vai chamar você" autocomplete="given-name" />
      </label>
      ${htmlMensagem(this.mensagem)}
      ${this.htmlAvisos()}
      ${this.htmlMeusPedidos()}
      ${this.htmlCardapio()}
      ${this.htmlCarrinho()}`;
  }

  private removerDoCarrinho(produtoId: string): void {
    const quantidade = (this.carrinho.get(produtoId) ?? 0) - 1;
    if (quantidade > 0) this.carrinho.set(produtoId, quantidade);
    else this.carrinho.delete(produtoId);
  }

  private itensDoCarrinho(): ItemSolicitado[] {
    return [...this.carrinho].map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
  }

  /** Atalho para quem pede sempre a mesma coisa: refaz o carrinho com o que ainda está disponível. */
  private pedirDeNovo(numero: number): void {
    const pedido = this.meusPedidos().find((p) => p.numero === numero);
    if (!pedido) return;
    const produtos = new Map(this.deps.cardapio.cardapioDoDia().map((p) => [p.id, p]));
    this.carrinho.clear();
    const faltando: string[] = [];
    for (const item of pedido.itens) {
      if (produtos.get(item.produtoId)?.estaDisponivel(item.quantidade)) this.carrinho.set(item.produtoId, item.quantidade);
      else faltando.push(item.nome);
    }
    if (faltando.length) {
      this.mensagem = { tipo: 'erro', texto: `Hoje não tem: ${faltando.join(', ')}. O resto já está no carrinho.` };
    }
  }

  /** Prevenção de erro: o horário nunca fica antes do que dá para preparar. */
  private ajustarHorario(): void {
    const maisCedo = this.deps.agendarCompra.horarioMaisCedo(this.itensDoCarrinho());
    try {
      if (Horario.de(this.horario).ehAntesDe(maisCedo)) this.horario = maisCedo.toString();
    } catch (erro) {
      if (!(erro instanceof ErroDeDominio)) throw erro;
      this.horario = maisCedo.toString();
    }
  }

  private meusPedidos(): Pedido[] {
    if (!this.nome.trim()) return [];
    return this.deps.pedidos.pedidosDoCliente(this.nome).sort((a, b) => b.numero - a.numero);
  }

  private htmlAvisos(): string {
    return this.meusPedidos()
      .filter((pedido) => pedido.status === 'pronto')
      .map((pedido) => {
        const aviso = this.avisos.findLast((a) => a.numeroDoPedido === pedido.numero);
        return `
          <div class="aviso-pronto" role="status">
            <span class="aviso-sino" aria-hidden="true">🔔</span>
            <p>${escapar(aviso?.mensagem ?? `Pedido #${pedido.numero} pronto!`)}</p>
            <button class="botao botao-primario" data-acao="retirei" data-numero="${pedido.numero}">Peguei!</button>
          </div>`;
      })
      .join('');
  }

  private htmlMeusPedidos(): string {
    const pedidos = this.meusPedidos();
    if (pedidos.length === 0) return '';
    const linhas = pedidos.map(
      (pedido) => `
        <li class="meu-pedido status-${pedido.status}">
          <div>
            <strong>#${pedido.numero} · retirar às ${pedido.horarioDeRetirada}</strong>
            <small>${pedido.itens.map((item) => `${item.quantidade}× ${escapar(item.nome)}`).join(', ')}</small>
          </div>
          <span class="selo selo-${pedido.status}">${ROTULO_DO_STATUS[pedido.status]}</span>
          ${this.htmlAcaoDoPedido(pedido)}
        </li>`,
    );
    return `<h3 class="subtitulo">Meus pedidos</h3><ul class="meus-pedidos">${linhas.join('')}</ul>`;
  }

  private htmlAcaoDoPedido(pedido: Pedido): string {
    if (pedido.status === 'agendado') {
      return `<button class="botao-link" data-acao="cancelar" data-numero="${pedido.numero}">Cancelar</button>`;
    }
    if (pedido.status === 'pronto') return '';
    return `<button class="botao-link" data-acao="repetir" data-numero="${pedido.numero}">Pedir de novo</button>`;
  }

  private htmlCardapio(): string {
    const grupos = agruparPorCategoria(this.deps.cardapio.cardapioDoDia());
    return [...grupos]
      .map(
        ([categoria, produtos]) => `
          <h3 class="subtitulo">${iconeDaCategoria(categoria)} ${escapar(categoria)}</h3>
          <ul class="lista-produtos">${produtos.map((produto) => this.htmlProduto(produto)).join('')}</ul>`,
      )
      .join('');
  }

  private htmlProduto(produto: Produto): string {
    const noCarrinho = this.carrinho.get(produto.id) ?? 0;
    const cabeMais = produto.estaDisponivel(noCarrinho + 1);
    return `
      <li class="produto ${produto.estaDisponivel() ? '' : 'produto-esgotado'}">
        <div class="produto-info">
          <strong>${escapar(produto.nome)}</strong>
          <small>${escapar(produto.descricaoDisponibilidade())}</small>
        </div>
        <span class="preco">${formatarPreco(produto.precoEmCentavos)}</span>
        <div class="contador">
          ${noCarrinho ? `<button class="botao-redondo" data-acao="remover" data-id="${produto.id}" aria-label="Tirar ${escapar(produto.nome)}">−</button><span>${noCarrinho}</span>` : ''}
          <button class="botao-redondo botao-mais" data-acao="adicionar" data-id="${produto.id}" aria-label="Adicionar ${escapar(produto.nome)}" ${cabeMais ? '' : 'disabled'}>+</button>
        </div>
      </li>`;
  }

  private htmlCarrinho(): string {
    if (this.carrinho.size === 0) {
      return `<div class="carrinho carrinho-vazio">Escolha seu lanche e agende a retirada para o intervalo.</div>`;
    }
    const produtos = new Map(this.deps.cardapio.todosOsProdutos().map((p) => [p.id, p]));
    const itens = [...this.carrinho].flatMap(([id, quantidade]) => {
      const produto = produtos.get(id);
      return produto ? [{ produto, quantidade }] : [];
    });
    const total = itens.reduce((soma, { produto, quantidade }) => soma + produto.precoEmCentavos * quantidade, 0);
    const maisCedo = this.deps.agendarCompra.horarioMaisCedo(this.itensDoCarrinho()).toString();
    return `
      <form class="carrinho" data-form="agendar">
        <div class="carrinho-resumo">
          <strong>${formatarPreco(total)}</strong>
          <small>${itens.map(({ produto, quantidade }) => `${quantidade}× ${escapar(produto.nome)}`).join(', ')}</small>
        </div>
        <label class="campo-horario">
          <span>Retirar às (fica pronto a partir das ${maisCedo})</span>
          <input type="time" data-campo="horario" value="${escapar(this.horario)}" min="${maisCedo}" required />
        </label>
        <button class="botao botao-primario" type="submit">Agendar</button>
      </form>`;
  }
}
