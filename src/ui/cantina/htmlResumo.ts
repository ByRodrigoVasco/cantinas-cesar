import type { Intervalo, Periodo, ResumoDoPeriodo } from '../../dominio/estoque/resumirPeriodo';
import { escapar, formatarPreco } from '../formatacao';
import { icone } from '../icones';

const PERIODOS: readonly [Periodo, string][] = [
  ['dia', 'Hoje'],
  ['semana', 'Esta semana'],
  ['mes', 'Este mês'],
];

const NOME_DO_PERIODO: Record<Periodo, string> = { dia: 'de hoje', semana: 'desta semana', mes: 'deste mês' };
const AGRUPAMENTO: Record<Periodo, string> = { dia: 'por hora', semana: 'por dia', mes: 'por dia do mês' };
/** De quantos em quantos intervalos o eixo mostra o rótulo, para não amontoar. */
const PASSO_DO_ROTULO: Record<Periodo, number> = { dia: 2, semana: 1, mes: 5 };

/** Painel "Resumo" da cantina: o dia, a semana ou o mês num relance. */
export function htmlResumo(resumo: ResumoDoPeriodo, periodo: Periodo): string {
  return `
    <div class="seletor-periodo" role="group" aria-label="Período do resumo">
      ${PERIODOS.map(([valor, rotulo]) => `
        <button class="aba ${valor === periodo ? 'aba-ativa' : ''}" data-acao="periodo" data-periodo="${valor}" aria-pressed="${valor === periodo}">${rotulo}</button>`).join('')}
    </div>
    <section class="destaque-numero">
      <p>Vendas ${NOME_DO_PERIODO[periodo]}</p>
      <strong>${formatarPreco(resumo.faturamentoEmCentavos)}</strong>
      <small>${resumo.itensVendidos} ${resumo.itensVendidos === 1 ? 'item vendido' : 'itens vendidos'}, no app e no balcão</small>
    </section>
    <dl class="indicadores">
      ${indicador('Pedidos pelo app', resumo.pedidosDoApp)}
      ${indicador('Itens vendidos no balcão', resumo.vendidosNoBalcao)}
      ${indicador('Entradas no estoque', resumo.entradas, 'unidades')}
      ${indicador('Perdas', resumo.perdas, 'unidades')}
    </dl>
    <div class="resumo-colunas">
      ${htmlGrafico(resumo.intervalos, periodo)}
      ${htmlMaisVendidos(resumo.maisVendidos)}
    </div>`;
}

function indicador(rotulo: string, valor: number, unidade = ''): string {
  return `<div class="indicador"><dt>${rotulo}</dt><dd>${valor.toLocaleString('pt-BR')}${unidade ? ` <small>${unidade}</small>` : ''}</dd></div>`;
}

/** Topo do eixo arredondado para um número "redondo" (5, 10, 20, 50…). */
function topoDoEixo(maior: number): number {
  if (maior <= 5) return 5;
  const ordem = 10 ** Math.floor(Math.log10(maior));
  return [1, 2, 5, 10].map((m) => m * ordem).find((v) => v >= maior) ?? maior;
}

/** Colunas agrupadas: duas séries (entradas e saídas), um eixo só, dica ao passar o mouse e tabela. */
function htmlGrafico(intervalos: readonly Intervalo[], periodo: Periodo): string {
  const maior = Math.max(0, ...intervalos.flatMap((i) => [i.entradas, i.saidas]));
  const titulo = `<h3 class="subtitulo">${icone('grafico')}Entradas e saídas ${AGRUPAMENTO[periodo]}</h3>`;
  if (maior === 0) return `<section class="cartao grafico">${titulo}<p class="vazio">Sem movimento neste período ainda.</p></section>`;
  const topo = topoDoEixo(maior);
  const altura = (valor: number) => `${(valor / topo) * 100}%`;
  const grupos = intervalos.map((intervalo, indice) => {
    const dica = `${intervalo.rotulo}: ${intervalo.entradas} entradas, ${intervalo.saidas} saídas`;
    const mostrarRotulo = indice % PASSO_DO_ROTULO[periodo] === 0;
    return `
      <div class="grafico-grupo" tabindex="0" data-dica="${escapar(dica)}" aria-label="${escapar(dica)}">
        <div class="grafico-barras">
          <span class="barra barra-entrada" style="height:${altura(intervalo.entradas)}"></span>
          <span class="barra barra-saida" style="height:${altura(intervalo.saidas)}"></span>
        </div>
        <span class="grafico-rotulo" ${mostrarRotulo ? '' : 'aria-hidden="true" data-oculto'}>${escapar(intervalo.rotulo)}</span>
      </div>`;
  });
  const linhasDaTabela = intervalos
    .filter((i) => i.entradas || i.saidas)
    .map((i) => `<tr><th scope="row">${escapar(i.rotulo)}</th><td>${i.entradas}</td><td>${i.saidas}</td></tr>`);
  return `
    <section class="cartao grafico">
      <header class="grafico-topo">
        ${titulo}
        <ul class="legenda">
          <li><span class="amostra amostra-entrada"></span>Entradas</li>
          <li><span class="amostra amostra-saida"></span>Saídas</li>
        </ul>
      </header>
      <div class="grafico-area">
        <div class="grafico-eixo" aria-hidden="true">
          <span style="bottom:100%">${topo}</span><span style="bottom:50%">${topo / 2}</span><span style="bottom:0">0</span>
        </div>
        <div class="grafico-colunas">${grupos.join('')}</div>
      </div>
      <details class="tabela-do-grafico">
        <summary>Ver em tabela</summary>
        <table>
          <thead><tr><th scope="col">${periodo === 'dia' ? 'Hora' : 'Dia'}</th><th scope="col">Entradas</th><th scope="col">Saídas</th></tr></thead>
          <tbody>${linhasDaTabela.join('')}</tbody>
        </table>
      </details>
    </section>`;
}

function htmlMaisVendidos(maisVendidos: ResumoDoPeriodo['maisVendidos']): string {
  const titulo = `<h3 class="subtitulo">Mais vendidos</h3>`;
  if (maisVendidos.length === 0) return `<section class="cartao">${titulo}<p class="vazio">Nenhuma venda neste período.</p></section>`;
  const maior = maisVendidos[0].quantidade;
  return `
    <section class="cartao">
      ${titulo}
      <ol class="ranking">
        ${maisVendidos.map(({ nome, quantidade }) => `
          <li>
            <span class="ranking-nome">${escapar(nome)}</span>
            <span class="ranking-trilho"><span style="width:${(quantidade / maior) * 100}%"></span></span>
            <span class="ranking-valor">${quantidade}</span>
          </li>`).join('')}
      </ol>
    </section>`;
}
