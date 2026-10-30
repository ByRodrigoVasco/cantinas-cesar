import type { Produto } from '../../dominio/produto/Produto';
import { agruparPorCategoria, escapar, htmlFoto } from '../formatacao';
import { icone, iconeDaCategoria } from '../icones';

/** Aba "Cardápio": liga e desliga o que aparece para os estudantes hoje. */
export function htmlCardapio(produtos: readonly Produto[]): string {
  if (produtos.length === 0) return `<p class="vazio">${icone('loja')}Seu cardápio está vazio. Comece em <b>Novo produto</b>.</p>`;
  const secoes = [...agruparPorCategoria([...produtos])].map(
    ([categoria, daCategoria]) => `
      <h3 class="subtitulo">${iconeDaCategoria(categoria)} ${escapar(categoria)}</h3>
      <ul class="lista-produtos">${daCategoria.map(htmlProduto).join('')}</ul>`,
  );
  return `<p class="dica">O estoque baixa sozinho a cada venda. Desligue só o que acabou e não volta hoje.</p>${secoes.join('')}`;
}

function htmlProduto(produto: Produto): string {
  return `
    <li class="produto ${produto.estaNoCardapio ? '' : 'produto-fora'}">
      ${htmlFoto(produto)}
      <div class="produto-info">
        <strong>${escapar(produto.nome)}</strong>
        <small>${escapar(produto.descricaoDisponibilidade())}</small>
      </div>
      <button class="interruptor ${produto.estaNoCardapio ? 'interruptor-ligado' : ''}" role="switch"
        aria-checked="${produto.estaNoCardapio}" aria-label="${escapar(produto.nome)} no cardápio"
        data-acao="alternar" data-id="${produto.id}"></button>
    </li>`;
}
