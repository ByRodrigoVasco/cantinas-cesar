import type { DadosDoProduto } from '../../aplicacao/cantina/CadastrarProduto';
import { escapar } from '../formatacao';
import { icone } from '../icones';

/** Aba "Novo produto". O rascunho devolve o que já foi digitado quando a tela é redesenhada. */
export function htmlNovoProduto(categorias: readonly string[], rascunho: Readonly<Record<string, string>>, foto?: string): string {
  const valor = (campo: string, padrao = '') => escapar(rascunho[campo] ?? padrao);
  const prontaEntrega = rascunho.tipo === 'nao-perecivel';
  const previa = foto
    ? `<img class="foto-previa" src="${foto}" alt="Prévia da foto do produto" />
       <button class="botao-link" type="button" data-acao="remover-foto">Tirar foto</button>`
    : `<span class="foto-previa foto-vazia" aria-hidden="true">${icone('camera')}</span>`;
  return `
    <form class="formulario cartao" data-form="novo-produto">
      <div class="campo-foto">
        ${previa}
        <label class="botao botao-contorno">
          ${icone('camera')}${foto ? 'Trocar foto' : 'Adicionar foto'}
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

/** Lê o formulário acima e devolve os dados no formato do caso de uso. */
export function lerNovoProduto(dados: FormData): DadosDoProduto {
  const comuns = {
    nome: String(dados.get('nome') ?? ''),
    categoria: String(dados.get('categoria') ?? '').trim() || 'Outros',
    precoEmCentavos: Math.round(Number(String(dados.get('preco') ?? '').replace(',', '.')) * 100),
  };
  return dados.get('tipo') === 'nao-perecivel'
    ? { ...comuns, tipo: 'nao-perecivel', estoqueIdeal: Number(dados.get('estoque')) }
    : { ...comuns, tipo: 'perecivel', tempoDePreparoMin: Number(dados.get('tempo')) };
}
