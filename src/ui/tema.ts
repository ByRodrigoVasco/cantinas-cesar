import type { Cantina, CoresDoCardapio } from '../dominio/cantina/Cantina';
import { escapar } from './formatacao';
import { icone } from './icones';

/** Luminância relativa (WCAG 2) de uma cor #rrggbb. */
function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Texto preto ou branco, o que tiver mais contraste sobre a cor. Assim a cantina escolhe
 * qualquer cor e o cardápio continua legível (prevenção de erro, não aviso de erro).
 */
export function corDoTextoSobre(hex: string): string {
  return luminancia(hex) > 0.179 ? '#070606' : '#ffffff';
}

/**
 * Variáveis CSS do cardápio da cantina. As cores já foram validadas pela Cantina (#rrggbb),
 * por isso podem ir direto no atributo style.
 * - principal: topo do cardápio e botões de adicionar
 * - secundária 1: etiquetas das categorias e barra do carrinho
 * - secundária 2: detalhes (estrelas das avaliações, linhas de destaque)
 */
export function estiloDoTema(cores: CoresDoCardapio): string {
  return [
    `--tema-principal:${cores.principal}`,
    `--tema-texto-principal:${corDoTextoSobre(cores.principal)}`,
    `--tema-sec1:${cores.secundaria1}`,
    `--tema-texto-sec1:${corDoTextoSobre(cores.secundaria1)}`,
    `--tema-sec2:${cores.secundaria2}`,
  ].join(';');
}

export function htmlLogo(cantina: Cantina, classe = 'logo-cantina'): string {
  return cantina.logo
    ? `<img class="${classe}" src="${escapar(cantina.logo)}" alt="" />`
    : `<span class="${classe} logo-vazio" aria-hidden="true">${icone('loja')}</span>`;
}

/** Faixa do topo do cardápio, com as cores da cantina. Usada pelo estudante e na prévia da cantina. */
export function htmlCabecalhoDaCantina(cantina: Cantina, extra = ''): string {
  return `
    <header class="cabecalho-cantina">
      ${htmlLogo(cantina)}
      <div>
        <h2>${escapar(cantina.nome)}</h2>
        <p>${escapar(cantina.local)}</p>
      </div>
      ${extra}
    </header>`;
}
