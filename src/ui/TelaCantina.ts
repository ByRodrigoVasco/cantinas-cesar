import type { CadastrarProduto, DadosDoProduto } from '../aplicacao/cantina/CadastrarProduto';
import type { ConfigurarCantina } from '../aplicacao/cantina/ConfigurarCantina';
import type { EstoqueDaCantina, MotivoManual } from '../aplicacao/cantina/EstoqueDaCantina';
import type { GerenciarCardapio } from '../aplicacao/cantina/GerenciarCardapio';
import type { PainelDaCantina } from '../aplicacao/cantina/PainelDaCantina';
import type { ReporEstoque } from '../aplicacao/cantina/ReporEstoque';
import type { ResumoDaCantina } from '../aplicacao/cantina/ResumoDaCantina';
import type { Relogio } from '../aplicacao/portas';
import { CORES_PADRAO, type Cantina } from '../dominio/cantina/Cantina';
import type { Periodo } from '../dominio/estoque/resumirPeriodo';
import type { Pedido } from '../dominio/pedido/Pedido';
import type { Usuario } from '../dominio/usuario/Usuario';
import { htmlEstoque, htmlFaixaDeAlerta } from './cantina/htmlEstoque';
import { htmlResumo } from './cantina/htmlResumo';
import { agruparPorCategoria, escapar, formatarPreco, htmlFoto, htmlMensagem } from './formatacao';
import { icone, iconeDaCategoria, type NomeDoIcone } from './icones';
import { reduzirImagem } from './imagem';
import { estiloDoTema, htmlCabecalhoDaCantina, htmlLogo } from './tema';
import type { Mensagem, Tela } from './Tela';

export interface DependenciasDaCantina {
  readonly usuario: Usuario;
  readonly painel: PainelDaCantina;
  readonly cardapio: GerenciarCardapio;
  readonly estoque: EstoqueDaCantina;
  readonly repor: ReporEstoque;
  readonly resumo: ResumoDaCantina;
  readonly cadastrar: CadastrarProduto;
  readonly configurar: ConfigurarCantina;
  readonly relogio: Relogio;
}

type Aba = 'pedidos' | 'resumo' | 'estoque' | 'cardapio' | 'novo' | 'configuracoes';

const ROTULO_DO_MOTIVO: Record<MotivoManual, string> = {
  compra: 'entrada',
  'venda-balcao': 'venda no balcão',
  perda: 'perda',
};

/** Acesso cantina: pedidos, resumo, estoque, cardápio e configurações, só da própria cantina. */
export class TelaCantina implements Tela {
  readonly nome = 'cantina';
  private aba: Aba = 'pedidos';
  private periodo: Periodo = 'dia';
  private mensagem: Mensagem | null = null;
  /** O que já foi digitado no "Novo produto" sobrevive a redesenhos (ex.: ao escolher a foto). */
  private rascunho: Record<string, string> = {};
  private fotoNova: string | undefined;

  constructor(private readonly deps: DependenciasDaCantina) {}

  mostrarMensagem(mensagem: Mensagem | null): void {
    this.mensagem = mensagem;
  }

  aoDigitar(campo: string, valor: string): void {
    this.rascunho[campo] = valor;
  }

  async aoEscolherArquivo(campo: string, arquivo: File): Promise<void> {
    if (campo === 'foto') this.fotoNova = await reduzirImagem(arquivo);
  }

  aoClicar(acao: string, elemento: HTMLElement): void {
    const { usuario } = this.deps;
    const numero = Number(elemento.dataset.numero);
    if (acao === 'aba') this.aba = elemento.dataset.aba as Aba;
    if (acao === 'periodo') this.periodo = elemento.dataset.periodo as Periodo;
    if (acao === 'pronto') this.deps.painel.marcarPronto(usuario, numero);
    if (acao === 'entregue') this.deps.painel.confirmarEntrega(usuario, numero);
    if (acao === 'desfazer') this.deps.painel.desfazerPronto(usuario, numero);
    if (acao === 'alternar') this.deps.cardapio.alternarNoCardapio(usuario, elemento.dataset.id ?? '');
    if (acao === 'remover-foto') this.fotoNova = undefined;
    if (acao === 'cores-padrao') {
      this.deps.configurar.mudarCores(usuario, CORES_PADRAO);
      this.mensagem = { tipo: 'sucesso', texto: 'Cores do CESAR aplicadas ao seu cardápio.' };
    }
  }

  aoEnviar(formulario: HTMLFormElement): void {
    const { usuario } = this.deps;
    const dados = new FormData(formulario);
    if (formulario.dataset.form === 'entrega') {
      this.deps.repor.registrarEntrega(
        usuario,
        [...dados].map(([produtoId, quantidade]) => ({ produtoId, quantidade: Number(quantidade) })),
      );
      this.mensagem = { tipo: 'sucesso', texto: 'Estoque atualizado e entrada registrada no histórico.' };
    }
    if (formulario.dataset.form === 'movimentacao') {
      const motivo = String(dados.get('motivo')) as MotivoManual;
      const registro = this.deps.estoque.registrar(usuario, {
        produtoId: String(dados.get('produtoId')),
        motivo,
        quantidade: Number(dados.get('quantidade')),
      });
      this.mensagem = { tipo: 'sucesso', texto: `Registrado: ${registro.quantidade}× ${registro.produtoNome} (${ROTULO_DO_MOTIVO[motivo]}).` };
    }
    if (formulario.dataset.form === 'novo-produto') {
      const produto = this.deps.cadastrar.executar(usuario, { ...lerNovoProduto(dados), foto: this.fotoNova });
      this.mensagem = { tipo: 'sucesso', texto: `${produto.nome} já está no cardápio.` };
      this.rascunho = {};
      this.fotoNova = undefined;
    }
    if (formulario.dataset.form === 'cores') {
      this.deps.configurar.mudarCores(usuario, {
        principal: String(dados.get('principal')),
        secundaria1: String(dados.get('secundaria1')),
        secundaria2: String(dados.get('secundaria2')),
      });
      this.mensagem = { tipo: 'sucesso', texto: 'Cores salvas. Os estudantes já veem o cardápio com elas.' };
    }
  }

  html(): string {
    const cantina = this.deps.configurar.minhaCantina(this.deps.usuario);
    const alertas = this.deps.estoque.alertas(this.deps.usuario);
    const conteudo = {
      pedidos: () => this.htmlPedidos(),
      resumo: () => htmlResumo(this.deps.resumo.doPeriodo(this.deps.usuario, this.periodo), this.periodo),
      estoque: () => this.htmlEstoque(cantina),
      cardapio: () => this.htmlCardapio(),
      novo: () => this.htmlNovoProduto(),
      configuracoes: () => this.htmlConfiguracoes(cantina),
    }[this.aba];
    return `
      <header class="cabecalho-tela cabecalho-com-logo">
        ${htmlLogo(cantina)}
        <div>
          <p class="sobretitulo">Painel da cantina</p>
          <h2 class="titulo-tela">${escapar(cantina.nome)}</h2>
        </div>
      </header>
      ${this.htmlAbas(alertas.esgotados.length + alertas.baixos.length)}
      ${this.aba === 'estoque' ? '' : htmlFaixaDeAlerta(alertas)}
      ${htmlMensagem(this.mensagem)}
      ${this.htmlAjuda()}
      ${conteudo()}`;
  }

  private htmlAjuda(): string {
    return `
      <details class="ajuda">
        <summary>Como funciona?</summary>
        <ul>
          <li><b>Pedidos:</b> chegam sozinhos, na ordem de começar a preparar. Toque em <b>Pronto</b> e o estudante é avisado.</li>
          <li><b>Resumo:</b> vendas, entradas e saídas de hoje, da semana e do mês.</li>
          <li><b>Estoque:</b> avisa o que acabou ou está acabando. Registre aqui a venda no balcão, a perda e a mercadoria que chegou.</li>
          <li><b>Cardápio:</b> desligue só o que acabou e não volta hoje.</li>
          <li><b>Configurações:</b> escolha as cores do seu cardápio virtual.</li>
        </ul>
      </details>`;
  }

  private htmlAbas(alertasDeEstoque: number): string {
    const aguardando = this.deps.painel.fila(this.deps.usuario).filter((p) => p.status === 'agendado').length;
    const abas: [Aba, string, NomeDoIcone | null, number][] = [
      ['pedidos', 'Pedidos', null, aguardando],
      ['resumo', 'Resumo', 'grafico', 0],
      ['estoque', 'Estoque', 'pacote', alertasDeEstoque],
      ['cardapio', 'Cardápio', null, 0],
      ['novo', 'Novo produto', null, 0],
      ['configuracoes', 'Configurações', 'configuracoes', 0],
    ];
    const botoes = abas.map(
      ([aba, rotulo, nomeDoIcone, contador]) => `
        <button class="aba ${this.aba === aba ? 'aba-ativa' : ''}" data-acao="aba" data-aba="${aba}" aria-pressed="${this.aba === aba}">
          ${nomeDoIcone ? icone(nomeDoIcone) : ''}${rotulo}${contador ? ` <span class="contador-aba ${aba === 'estoque' ? 'contador-alerta' : ''}">${contador}</span>` : ''}
        </button>`,
    );
    return `<nav class="abas">${botoes.join('')}</nav>`;
  }

  private htmlPedidos(): string {
    const fila = this.deps.painel.fila(this.deps.usuario);
    if (fila.length === 0) {
      return `<p class="vazio">${icone('vazio')}Nenhum pedido agendado ainda.<br />Os pedidos dos estudantes aparecem aqui sozinhos, na ordem de preparo.</p>`;
    }
    const resumo = this.deps.painel.resumoDoQueFazer(this.deps.usuario);
    const htmlResumoDoPreparo = resumo.length
      ? `<section class="resumo">
           <h3 class="subtitulo">Para preparar</h3>
           <ul class="etiquetas">${resumo.map((i) => `<li><b>${i.quantidade}×</b> ${escapar(i.nome)}</li>`).join('')}</ul>
         </section>`
      : '';
    return `${htmlResumoDoPreparo}<div class="fila">${fila.map((pedido) => this.htmlPedido(pedido)).join('')}</div>`;
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

  private htmlEstoque(cantina: Cantina): string {
    const { usuario } = this.deps;
    return htmlEstoque({
      alertas: this.deps.estoque.alertas(usuario),
      itens: this.deps.estoque.itens(usuario),
      todosOsProdutos: this.deps.cardapio.todosOsProdutos(usuario),
      historico: this.deps.estoque.historico(usuario),
      listaDeCompras: this.deps.repor.listaDeCompras(usuario),
      mensagemParaFornecedor: this.deps.repor.mensagemParaFornecedor(usuario, cantina.nome),
    });
  }

  private htmlCardapio(): string {
    const grupos = agruparPorCategoria(this.deps.cardapio.todosOsProdutos(this.deps.usuario));
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
    if (secoes.length === 0) return `<p class="vazio">${icone('loja')}Seu cardápio está vazio. Comece em <b>Novo produto</b>.</p>`;
    return `<p class="dica">O estoque baixa sozinho a cada venda. Desligue só o que acabou e não volta hoje.</p>${secoes.join('')}`;
  }

  private htmlNovoProduto(): string {
    const categorias = [...new Set(this.deps.cardapio.todosOsProdutos(this.deps.usuario).map((p) => p.categoria))];
    const valor = (campo: string, padrao = '') => escapar(this.rascunho[campo] ?? padrao);
    const prontaEntrega = this.rascunho.tipo === 'nao-perecivel';
    const foto = this.fotoNova
      ? `<img class="foto-previa" src="${this.fotoNova}" alt="Prévia da foto do produto" />
         <button class="botao-link" type="button" data-acao="remover-foto">Tirar foto</button>`
      : `<span class="foto-previa foto-vazia" aria-hidden="true">${icone('camera')}</span>`;
    return `
      <form class="formulario cartao" data-form="novo-produto">
        <div class="campo-foto">
          ${foto}
          <label class="botao botao-contorno">
            ${icone('camera')}${this.fotoNova ? 'Trocar foto' : 'Adicionar foto'}
            <input class="visualmente-oculto" type="file" accept="image/*" data-campo="foto" />
          </label>
        </div>
        <label class="campo"><span>Nome</span><input name="nome" data-campo="nome" required placeholder="Ex.: Tapioca de frango" value="${valor('nome')}" /></label>
        <label class="campo"><span>Categoria</span><input name="categoria" data-campo="categoria" list="categorias" required placeholder="Ex.: Tapiocas" value="${valor('categoria')}" /></label>
        <datalist id="categorias">${categorias.map((c) => `<option value="${escapar(c)}"></option>`).join('')}</datalist>
        <label class="campo"><span>Preço (R$)</span><input name="preco" data-campo="preco" required inputmode="decimal" placeholder="10,00" value="${valor('preco')}" /></label>
        <fieldset class="escolha">
          <legend>Como é vendido?</legend>
          <label><input type="radio" name="tipo" data-campo="tipo" value="perecivel" ${prontaEntrega ? '' : 'checked'} /> Feito na hora</label>
          <label><input type="radio" name="tipo" data-campo="tipo" value="nao-perecivel" ${prontaEntrega ? 'checked' : ''} /> Pronta-entrega</label>
        </fieldset>
        <label class="campo so-feito-na-hora"><span>Minutos para preparar 1 unidade</span><input name="tempo" data-campo="tempo" type="number" min="1" value="${valor('tempo', '5')}" /></label>
        <label class="campo so-pronta-entrega"><span>Quantas unidades costuma ter</span><input name="estoque" data-campo="estoque" type="number" min="1" value="${valor('estoque', '12')}" /></label>
        <button class="botao botao-primario botao-largo" type="submit">Colocar no cardápio</button>
      </form>`;
  }

  private htmlConfiguracoes(cantina: Cantina): string {
    const { principal, secundaria1, secundaria2 } = cantina.cores;
    const campoDeCor = (nome: string, valor: string, rotulo: string, uso: string) => `
      <label class="campo-cor">
        <input type="color" name="${nome}" value="${valor}" />
        <span><b>${rotulo}</b><small>${uso}</small></span>
      </label>`;
    return `
      <section class="cartao">
        <h3 class="subtitulo">Cores do cardápio virtual</h3>
        <p class="dica">É assim que os estudantes veem a sua cantina. O texto fica claro ou escuro sozinho, para continuar legível com qualquer cor.</p>
        <form class="formulario" data-form="cores">
          ${campoDeCor('principal', principal, 'Cor principal', 'Topo do cardápio e botões de adicionar')}
          ${campoDeCor('secundaria1', secundaria1, 'Secundária 1', 'Categorias e barra do carrinho')}
          ${campoDeCor('secundaria2', secundaria2, 'Secundária 2', 'Detalhes, como as estrelas das avaliações')}
          <div class="acoes-formulario">
            <button class="botao botao-primario" type="submit">Salvar cores</button>
            <button class="botao-link" type="button" data-acao="cores-padrao">Voltar às cores do CESAR</button>
          </div>
        </form>
      </section>
      <section>
        <h3 class="subtitulo">Prévia</h3>
        <div class="cardapio-tematico previa" style="${estiloDoTema(cantina.cores)}">
          ${htmlCabecalhoDaCantina(cantina)}
          <div class="corpo-cardapio">
            <h3 class="categoria-tematica">${iconeDaCategoria('Salgados')}Salgados</h3>
            <div class="previa-linha"><span>Coxinha de frango</span><span class="nota">${icone('estrela')}4,8</span><span class="botao-redondo botao-mais">+</span></div>
          </div>
          <div class="carrinho">Carrinho</div>
        </div>
      </section>`;
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
