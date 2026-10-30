import type { AlertasDeEstoque } from '../../aplicacao/cantina/EstoqueDaCantina';
import type { ItemDaListaDeCompras } from '../../aplicacao/cantina/ReporEstoque';
import { sentidoDe, type Movimentacao, type MotivoDaMovimentacao } from '../../dominio/estoque/Movimentacao';
import type { NivelDeEstoque, Produto } from '../../dominio/produto/Produto';
import { escapar, formatarPreco } from '../formatacao';
import { icone } from '../icones';

export interface DadosDoEstoque {
  readonly alertas: AlertasDeEstoque;
  readonly itens: readonly Produto[];
  readonly todosOsProdutos: readonly Produto[];
  readonly historico: readonly Movimentacao[];
  readonly listaDeCompras: readonly ItemDaListaDeCompras[];
  readonly mensagemParaFornecedor: string;
}

const ROTULO_DO_NIVEL: Record<Exclude<NivelDeEstoque, 'sem-controle'>, string> = {
  esgotado: 'Esgotado',
  baixo: 'Baixo',
  ok: 'Em dia',
};

const ROTULO_DO_MOTIVO: Record<MotivoDaMovimentacao, string> = {
  compra: 'Entrada',
  'venda-app': 'Venda no app',
  'venda-balcao': 'Venda no balcão',
  perda: 'Perda',
};

const dataEHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Aba "Estoque": avisos no topo, registro rápido, níveis, compras e histórico. */
export function htmlEstoque(dados: DadosDoEstoque): string {
  return `
    ${htmlAlertas(dados.alertas)}
    <div class="estoque-colunas">
      ${htmlRegistrar(dados.todosOsProdutos)}
      ${htmlNiveis(dados.itens)}
    </div>
    ${htmlCompras(dados.listaDeCompras, dados.mensagemParaFornecedor)}
    ${htmlHistorico(dados.historico)}`;
}

/** Faixa curta que aparece nas outras abas: o aviso chega à cantina sem ela procurar. */
export function htmlFaixaDeAlerta(alertas: AlertasDeEstoque): string {
  const partes = [
    alertas.esgotados.length ? `${alertas.esgotados.length} ${alertas.esgotados.length === 1 ? 'esgotado' : 'esgotados'}` : '',
    alertas.baixos.length ? `${alertas.baixos.length} com estoque baixo` : '',
  ].filter(Boolean);
  if (partes.length === 0) return '';
  const critico = alertas.esgotados.length > 0;
  return `
    <button class="faixa-alerta ${critico ? 'faixa-critica' : ''}" data-acao="aba" data-aba="estoque">
      ${icone('alerta')}<span><b>Estoque:</b> ${partes.join(' · ')}</span><span class="faixa-acao">Ver estoque</span>
    </button>`;
}

function htmlAlertas({ esgotados, baixos }: AlertasDeEstoque): string {
  if (esgotados.length === 0 && baixos.length === 0) {
    return `<div class="alerta alerta-ok" role="status">${icone('confirmar')}<div><strong>Estoque em dia</strong><p>Nenhum item acabando.</p></div></div>`;
  }
  const lista = (produtos: readonly Produto[], comQuantidade: boolean) =>
    produtos.map((p) => `${escapar(p.nome)}${comQuantidade ? ` (${p.quantidadeEmEstoque})` : ''}`).join(', ');
  return `
    <div class="alertas-estoque">
      ${esgotados.length ? `
        <div class="alerta alerta-critico" role="alert">${icone('alerta')}
          <div><strong>Esgotado: ${esgotados.length} ${esgotados.length === 1 ? 'item' : 'itens'}</strong><p>${lista(esgotados, false)}</p></div>
        </div>` : ''}
      ${baixos.length ? `
        <div class="alerta alerta-atencao" role="status">${icone('alerta')}
          <div><strong>Estoque baixo: ${baixos.length} ${baixos.length === 1 ? 'item' : 'itens'}</strong><p>${lista(baixos, true)}</p></div>
        </div>` : ''}
    </div>`;
}

function htmlRegistrar(produtos: readonly Produto[]): string {
  const opcoes = (lista: readonly Produto[]) =>
    lista.map((p) => `<option value="${p.id}">${escapar(p.nome)}${p.quantidadeEmEstoque === undefined ? '' : ` (tem ${p.quantidadeEmEstoque})`}</option>`).join('');
  const ordenados = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));
  return `
    <section class="cartao">
      <h3 class="subtitulo">Registrar entrada ou saída</h3>
      <p class="dica">Para o que acontece fora do app: venda no balcão, perda ou mercadoria que chegou.</p>
      <form class="formulario" data-form="movimentacao">
        <fieldset class="escolha escolha-motivo">
          <legend>O que aconteceu?</legend>
          <label><input type="radio" name="motivo" value="venda-balcao" checked /> ${icone('saida')}Venda no balcão</label>
          <label><input type="radio" name="motivo" value="perda" /> ${icone('saida')}Perda ou descarte</label>
          <label><input type="radio" name="motivo" value="compra" /> ${icone('entrada')}Chegou mercadoria</label>
        </fieldset>
        <label class="campo"><span>Produto</span>
          <select name="produtoId" required>
            <optgroup label="Com estoque">${opcoes(ordenados.filter((p) => p.quantidadeEmEstoque !== undefined))}</optgroup>
            <optgroup label="Feitos na hora (só saída)">${opcoes(ordenados.filter((p) => p.quantidadeEmEstoque === undefined))}</optgroup>
          </select>
        </label>
        <label class="campo"><span>Quantidade</span><input name="quantidade" type="number" min="1" value="1" required inputmode="numeric" /></label>
        <button class="botao botao-primario" type="submit">Registrar</button>
      </form>
    </section>`;
}

function htmlNiveis(itens: readonly Produto[]): string {
  const linhas = itens.map((produto) => {
    const nivel = produto.nivelDeEstoque() as Exclude<NivelDeEstoque, 'sem-controle'>;
    const quantidade = produto.quantidadeEmEstoque ?? 0;
    const ideal = produto.estoqueIdeal ?? 1;
    return `
      <li class="item-estoque nivel-${nivel}">
        <div class="item-estoque-texto">
          <strong>${escapar(produto.nome)}</strong>
          <small>${quantidade} de ${ideal}</small>
        </div>
        <span class="medidor" role="meter" aria-valuemin="0" aria-valuemax="${ideal}" aria-valuenow="${quantidade}" aria-label="Estoque de ${escapar(produto.nome)}">
          <span style="width:${Math.min(100, (quantidade / ideal) * 100)}%"></span>
        </span>
        <span class="selo-nivel">${icone(nivel === 'ok' ? 'confirmar' : 'alerta')}${ROTULO_DO_NIVEL[nivel]}</span>
      </li>`;
  });
  return `
    <section class="cartao">
      <h3 class="subtitulo">${icone('pacote')}Itens no estoque</h3>
      ${linhas.length ? `<ul class="lista-estoque">${linhas.join('')}</ul>` : '<p class="dica">Nenhum item de pronta-entrega cadastrado.</p>'}
    </section>`;
}

function htmlCompras(lista: readonly ItemDaListaDeCompras[], mensagem: string): string {
  if (lista.length === 0) return '';
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
    <section class="cartao">
      <h3 class="subtitulo">Pedir ao fornecedor</h3>
      <p class="dica">Itens abaixo da metade do estoque. A lista e a mensagem já vêm prontas.</p>
      <a class="botao botao-whatsapp" href="https://wa.me/?text=${encodeURIComponent(mensagem)}" target="_blank" rel="noopener">Enviar pedido no WhatsApp</a>
      <form data-form="entrega">
        <ul class="lista-produtos">${linhas.join('')}</ul>
        <button class="botao botao-primario botao-largo" type="submit">Entrega chegou: repor estoque</button>
      </form>
    </section>`;
}

function htmlHistorico(historico: readonly Movimentacao[]): string {
  if (historico.length === 0) return '';
  const linhas = historico.map((m) => {
    const entrada = sentidoDe(m) === 'entrada';
    return `
      <tr>
        <td>${dataEHora.format(new Date(m.momento))}</td>
        <td>${escapar(m.produtoNome)}</td>
        <td><span class="motivo ${entrada ? 'motivo-entrada' : 'motivo-saida'}">${icone(entrada ? 'entrada' : 'saida')}${ROTULO_DO_MOTIVO[m.motivo]}</span></td>
        <td class="numero-tabela">${entrada ? '+' : '−'}${m.quantidade}</td>
        <td class="numero-tabela">${m.valorEmCentavos ? formatarPreco(m.valorEmCentavos) : '—'}</td>
      </tr>`;
  });
  return `
    <section class="cartao">
      <h3 class="subtitulo">Últimas entradas e saídas</h3>
      <div class="tabela-rolavel">
        <table class="tabela">
          <thead><tr><th scope="col">Quando</th><th scope="col">Produto</th><th scope="col">Tipo</th><th scope="col">Qtd.</th><th scope="col">Valor</th></tr></thead>
          <tbody>${linhas.join('')}</tbody>
        </table>
      </div>
    </section>`;
}
