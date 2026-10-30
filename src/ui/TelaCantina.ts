import type { AcompanharPedidos } from '../aplicacao/AcompanharPedidos';
import type { CadastrarProduto, DadosDoProduto } from '../aplicacao/CadastrarProduto';
import type { GerenciarCardapio } from '../aplicacao/GerenciarCardapio';
import type { Relogio } from '../aplicacao/portas';
import type { ReporEstoque } from '../aplicacao/ReporEstoque';
import type { Pedido } from '../dominio/pedido/Pedido';
import { agruparPorCategoria, escapar, formatarPreco, htmlFoto, htmlMensagem } from './formatacao';
import { icone, iconeDaCategoria } from './icones';
import type { Mensagem, Tela } from './Tela';

export interface DependenciasDaCantina {
  readonly pedidos: AcompanharPedidos;
  readonly cardapio: GerenciarCardapio;
  readonly repor: ReporEstoque;
  readonly cadastrar: CadastrarProduto;
  readonly relogio: Relogio;
}

type Aba = 'pedidos' | 'cardapio' | 'compras' | 'novo';

export class TelaCantina implements Tela {
  readonly nome = 'cantina';
  private aba: Aba = 'pedidos';
  private mensagem: Mensagem | null = null;

  constructor(private readonly deps: DependenciasDaCantina) {}

  mostrarMensagem(mensagem: Mensagem | null): void {
    this.mensagem = mensagem;
  }

  aoDigitar(): void {}

  aoClicar(acao: string, elemento: HTMLElement): void {
    const numero = Number(elemento.dataset.numero);
    if (acao === 'aba') this.aba = elemento.dataset.aba as Aba;
    if (acao === 'pronto') this.deps.pedidos.marcarPronto(numero);
    if (acao === 'entregue') this.deps.pedidos.confirmarRetirada(numero);
    if (acao === 'desfazer') this.deps.pedidos.desfazerPronto(numero);
    if (acao === 'alternar') this.deps.cardapio.alternarNoCardapio(elemento.dataset.id ?? '');
  }

  aoEnviar(formulario: HTMLFormElement): void {
    const dados = new FormData(formulario);
    if (formulario.dataset.form === 'entrega') {
      this.deps.repor.registrarEntrega(
        [...dados].map(([produtoId, quantidade]) => ({ produtoId, quantidade: Number(quantidade) })),
      );
      this.mensagem = { tipo: 'sucesso', texto: 'Estoque atualizado.' };
    }
    if (formulario.dataset.form === 'novo-produto') {
      const produto = this.deps.cadastrar.executar(lerNovoProduto(dados));
      this.mensagem = { tipo: 'sucesso', texto: `${produto.nome} já está no cardápio.` };
    }
  }

  html(): string {
    const conteudo = {
      pedidos: () => this.htmlPedidos(),
      cardapio: () => this.htmlCardapio(),
      compras: () => this.htmlCompras(),
      novo: () => this.htmlNovoProduto(),
    }[this.aba];
    return `${this.htmlAbas()}${htmlMensagem(this.mensagem)}${this.htmlAjuda()}${conteudo()}`;
  }

  private htmlAjuda(): string {
    return `
      <details class="ajuda">
        <summary>Como funciona?</summary>
        <ul>
          <li><b>Pedidos:</b> chegam sozinhos, na ordem de começar a preparar. Toque em <b>Pronto</b> e o aluno é avisado.</li>
          <li><b>Cardápio:</b> o estoque baixa sozinho a cada venda. Desligue só o que acabou e não volta hoje.</li>
          <li><b>Compras:</b> a lista para o fornecedor já vem pronta. Quando a entrega chegar, toque em repor.</li>
        </ul>
      </details>`;
  }

  private htmlAbas(): string {
    const aguardando = this.deps.pedidos.filaDaCantina().filter((p) => p.status === 'agendado').length;
    const paraComprar = this.deps.repor.listaDeCompras().length;
    const abas: [Aba, string, number][] = [
      ['pedidos', 'Pedidos', aguardando],
      ['cardapio', 'Cardápio', 0],
      ['compras', 'Compras', paraComprar],
      ['novo', 'Novo produto', 0],
    ];
    const botoes = abas.map(
      ([aba, rotulo, contador]) => `
        <button class="aba ${this.aba === aba ? 'aba-ativa' : ''}" data-acao="aba" data-aba="${aba}" aria-pressed="${this.aba === aba}">
          ${rotulo}${contador ? ` <span class="contador-aba">${contador}</span>` : ''}
        </button>`,
    );
    return `<nav class="abas">${botoes.join('')}</nav>`;
  }

  private htmlPedidos(): string {
    const fila = this.deps.pedidos.filaDaCantina();
    if (fila.length === 0) {
      return `<p class="vazio">${icone('vazio')}Nenhum pedido agendado ainda.<br />Os pedidos dos alunos aparecem aqui sozinhos, na ordem de preparo.</p>`;
    }
    const resumo = this.deps.pedidos.resumoDoQueFazer();
    const htmlResumo = resumo.length
      ? `<section class="resumo">
           <h3 class="subtitulo">Para preparar</h3>
           <ul class="etiquetas">${resumo.map((i) => `<li><b>${i.quantidade}×</b> ${escapar(i.nome)}</li>`).join('')}</ul>
         </section>`
      : '';
    return `${htmlResumo}<div class="fila">${fila.map((pedido) => this.htmlPedido(pedido)).join('')}</div>`;
  }

  private htmlPedido(pedido: Pedido): string {
    const agora = this.deps.relogio.agora();
    const jaDeveComecar = !agora.ehAntesDe(pedido.horarioParaComecar());
    const urgente = pedido.status === 'agendado' && jaDeveComecar;
    const acao =
      pedido.status === 'agendado'
        ? `<small class="${urgente ? 'texto-urgente' : ''}">${urgente ? `${icone('relogio')}Começar agora` : `Começar às ${pedido.horarioParaComecar()}`}</small>
           <button class="botao botao-pronto" data-acao="pronto" data-numero="${pedido.numero}">${icone('confirmar')}Pronto</button>`
        : `<small>${icone('sino')}Aviso enviado para ${escapar(pedido.cliente)}</small>
           <span>
             <button class="botao-link" data-acao="desfazer" data-numero="${pedido.numero}">Desfazer</button>
             <button class="botao-link" data-acao="entregue" data-numero="${pedido.numero}">Já entreguei</button>
           </span>`;
    return `
      <article class="pedido pedido-${pedido.status} ${urgente ? 'pedido-urgente' : ''}">
        <header>
          <span class="numero">#${pedido.numero}</span>
          <strong>${escapar(pedido.cliente)}</strong>
          <span class="retirada">retira ${pedido.horarioDeRetirada}</span>
        </header>
        <ul class="itens">${pedido.itens.map((i) => `<li>${i.quantidade}× ${escapar(i.nome)}</li>`).join('')}</ul>
        <p class="receber">Receber <b>${formatarPreco(pedido.totalEmCentavos())}</b></p>
        <footer>${acao}</footer>
      </article>`;
  }

  private htmlCardapio(): string {
    const grupos = agruparPorCategoria(this.deps.cardapio.todosOsProdutos());
    const secoes = [...grupos].map(
      ([categoria, produtos]) => `
        <h3 class="subtitulo">${iconeDaCategoria(categoria)} ${escapar(categoria)}</h3>
        <ul class="lista-produtos">
          ${produtos
            .map(
              (produto) => `
              <li class="produto ${produto.estaNoCardapio ? '' : 'produto-fora'}">
                ${htmlFoto(produto)}
                <div class="produto-info">
                  <strong>${escapar(produto.nome)}</strong>
                  <small>${escapar(produto.descricaoDisponibilidade())}</small>
                </div>
                <button class="interruptor ${produto.estaNoCardapio ? 'interruptor-ligado' : ''}" role="switch"
                  aria-checked="${produto.estaNoCardapio}" aria-label="${escapar(produto.nome)} no cardápio"
                  data-acao="alternar" data-id="${produto.id}"></button>
              </li>`,
            )
            .join('')}
        </ul>`,
    );
    return `<p class="dica">O estoque baixa sozinho a cada venda. Desligue só o que acabou e não volta hoje.</p>${secoes.join('')}`;
  }

  private htmlCompras(): string {
    const lista = this.deps.repor.listaDeCompras();
    if (lista.length === 0) return `<p class="vazio">${icone('confirmar')}Estoque em dia. Nada para pedir ao fornecedor.</p>`;
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(this.deps.repor.mensagemParaFornecedor())}`;
    const linhas = lista.map(
      ({ produto, quantidade }) => `
        <li class="produto">
          <div class="produto-info">
            <strong>${escapar(produto.nome)}</strong>
            <small>Tem ${produto.quantidadeEmEstoque ?? 0}</small>
          </div>
          <label class="campo-quantidade">
            <span class="visualmente-oculto">Quantidade de ${escapar(produto.nome)}</span>
            <input type="number" name="${produto.id}" value="${quantidade}" min="0" inputmode="numeric" />
          </label>
        </li>`,
    );
    return `
      <p class="dica">Itens abaixo da metade do estoque. A lista e a mensagem já vêm prontas.</p>
      <a class="botao botao-whatsapp" href="${whatsapp}" target="_blank" rel="noopener">Enviar pedido no WhatsApp</a>
      <form data-form="entrega">
        <ul class="lista-produtos">${linhas.join('')}</ul>
        <button class="botao botao-primario botao-largo" type="submit">Entrega chegou: repor estoque</button>
      </form>`;
  }

  private htmlNovoProduto(): string {
    const categorias = [...new Set(this.deps.cardapio.todosOsProdutos().map((p) => p.categoria))];
    return `
      <form class="formulario" data-form="novo-produto">
        <label class="campo"><span>Nome</span><input name="nome" required placeholder="Ex.: Tapioca de frango" /></label>
        <label class="campo"><span>Categoria</span><input name="categoria" list="categorias" required placeholder="Ex.: Tapiocas" /></label>
        <datalist id="categorias">${categorias.map((c) => `<option value="${escapar(c)}"></option>`).join('')}</datalist>
        <label class="campo"><span>Preço (R$)</span><input name="preco" required inputmode="decimal" placeholder="10,00" /></label>
        <fieldset class="escolha">
          <legend>Como é vendido?</legend>
          <label><input type="radio" name="tipo" value="perecivel" checked /> Feito na hora</label>
          <label><input type="radio" name="tipo" value="nao-perecivel" /> Pronta-entrega</label>
        </fieldset>
        <label class="campo so-feito-na-hora"><span>Minutos para preparar 1 unidade</span><input name="tempo" type="number" min="1" value="5" /></label>
        <label class="campo so-pronta-entrega"><span>Quantas unidades costuma ter</span><input name="estoque" type="number" min="1" value="12" /></label>
        <button class="botao botao-primario botao-largo" type="submit">Colocar no cardápio</button>
      </form>`;
  }
}

function lerNovoProduto(dados: FormData): DadosDoProduto {
  const comuns = {
    nome: String(dados.get('nome') ?? ''),
    categoria: String(dados.get('categoria') ?? '').trim() || 'Outros',
    precoEmCentavos: Math.round(Number(String(dados.get('preco') ?? '').replace(',', '.')) * 100),
  };
  return dados.get('tipo') === 'nao-perecivel'
    ? { ...comuns, tipo: 'nao-perecivel', estoqueIdeal: Number(dados.get('estoque')) }
    : { ...comuns, tipo: 'perecivel', tempoDePreparoMin: Number(dados.get('tempo')) };
}
