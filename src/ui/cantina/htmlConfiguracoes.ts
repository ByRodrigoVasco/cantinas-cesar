import type { Cantina } from '../../dominio/cantina/Cantina';
import { icone, iconeDaCategoria } from '../icones';
import { estiloDoTema, htmlCabecalhoDaCantina } from '../tema';

/** Aba "Configurações": as três cores do cardápio virtual, com prévia. */
export function htmlConfiguracoes(cantina: Cantina): string {
  const { principal, secundaria1, secundaria2 } = cantina.cores;
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

function campoDeCor(nome: string, valor: string, rotulo: string, uso: string): string {
  return `
    <label class="campo-cor">
      <input type="color" name="${nome}" value="${valor}" />
      <span><b>${rotulo}</b><small>${uso}</small></span>
    </label>`;
}
