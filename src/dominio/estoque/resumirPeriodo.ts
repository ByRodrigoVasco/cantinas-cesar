import { ehVenda, sentidoDe, type Movimentacao } from './Movimentacao';

export type Periodo = 'dia' | 'semana' | 'mes';

/** Um intervalo do gráfico: uma hora (no dia) ou um dia (na semana e no mês). */
export interface Intervalo {
  readonly rotulo: string;
  readonly entradas: number;
  readonly saidas: number;
}

export interface ResumoDoPeriodo {
  readonly faturamentoEmCentavos: number;
  readonly itensVendidos: number;
  readonly pedidosDoApp: number;
  readonly vendidosNoBalcao: number;
  readonly entradas: number;
  readonly perdas: number;
  readonly maisVendidos: readonly { readonly nome: string; readonly quantidade: number }[];
  readonly intervalos: readonly Intervalo[];
}

/** Horário em que a cantina costuma funcionar: o gráfico do dia mostra só essas horas. */
const PRIMEIRA_HORA = 7;
const ULTIMA_HORA = 22;
const DIAS_DA_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const QUANTOS_MAIS_VENDIDOS = 5;

/** Início do período no calendário: hoje à meia-noite, a segunda-feira desta semana ou o dia 1. */
export function inicioDoPeriodo(periodo: Periodo, agora: Date): Date {
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  if (periodo === 'semana') inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  if (periodo === 'mes') inicio.setDate(1);
  return inicio;
}

export function resumirPeriodo(movimentacoes: readonly Movimentacao[], periodo: Periodo, agora: Date): ResumoDoPeriodo {
  const inicio = inicioDoPeriodo(periodo, agora).getTime();
  const doPeriodo = movimentacoes.filter((m) => {
    const momento = new Date(m.momento).getTime();
    return momento >= inicio && momento <= agora.getTime();
  });
  const vendas = doPeriodo.filter(ehVenda);
  const somar = (lista: readonly Movimentacao[]) => lista.reduce((total, m) => total + m.quantidade, 0);

  const porProduto = new Map<string, number>();
  for (const venda of vendas) porProduto.set(venda.produtoNome, (porProduto.get(venda.produtoNome) ?? 0) + venda.quantidade);

  return {
    faturamentoEmCentavos: vendas.reduce((total, m) => total + m.valorEmCentavos, 0),
    itensVendidos: somar(vendas),
    pedidosDoApp: new Set(vendas.filter((m) => m.motivo === 'venda-app').map((m) => m.pedidoNumero)).size,
    vendidosNoBalcao: somar(vendas.filter((m) => m.motivo === 'venda-balcao')),
    entradas: somar(doPeriodo.filter((m) => sentidoDe(m) === 'entrada')),
    perdas: somar(doPeriodo.filter((m) => m.motivo === 'perda')),
    maisVendidos: [...porProduto]
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, QUANTOS_MAIS_VENDIDOS),
    intervalos: montarIntervalos(doPeriodo, periodo, agora),
  };
}

function montarIntervalos(movimentacoes: readonly Movimentacao[], periodo: Periodo, agora: Date): Intervalo[] {
  const rotulos = rotulosDoPeriodo(periodo, agora);
  const totais = rotulos.map((rotulo) => ({ rotulo, entradas: 0, saidas: 0 }));
  for (const movimentacao of movimentacoes) {
    const indice = indiceDoIntervalo(new Date(movimentacao.momento), periodo);
    const intervalo = totais[indice];
    if (!intervalo) continue;
    if (sentidoDe(movimentacao) === 'entrada') intervalo.entradas += movimentacao.quantidade;
    else intervalo.saidas += movimentacao.quantidade;
  }
  return totais;
}

function rotulosDoPeriodo(periodo: Periodo, agora: Date): string[] {
  if (periodo === 'dia') {
    return Array.from({ length: ULTIMA_HORA - PRIMEIRA_HORA + 1 }, (_, i) => `${PRIMEIRA_HORA + i}h`);
  }
  if (periodo === 'semana') return DIAS_DA_SEMANA;
  const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
  return Array.from({ length: diasNoMes }, (_, i) => String(i + 1));
}

function indiceDoIntervalo(momento: Date, periodo: Periodo): number {
  if (periodo === 'dia') return momento.getHours() - PRIMEIRA_HORA;
  if (periodo === 'semana') return (momento.getDay() + 6) % 7;
  return momento.getDate() - 1;
}
