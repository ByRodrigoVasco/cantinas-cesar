import { beforeEach, describe, expect, it } from 'vitest';
import { novaMovimentacao } from '../src/dominio/estoque/Movimentacao';
import { inicioDoPeriodo, resumirPeriodo } from '../src/dominio/estoque/resumirPeriodo';
import { montarCenario, QUARTA_20H } from './cenario';

let c: ReturnType<typeof montarCenario>;
beforeEach(() => {
  c = montarCenario();
});

describe('Estoque da cantina (entradas e saídas fora do app)', () => {
  it('venda no balcão baixa o estoque e entra no faturamento', () => {
    c.casos.estoque.registrar(c.imperial.conta, { produtoId: c.refri.id, motivo: 'venda-balcao', quantidade: 2 });
    expect(c.produtos.buscarPorId(c.refri.id)?.quantidadeEmEstoque).toBe(2);
    const resumo = c.casos.resumo.doPeriodo(c.imperial.conta, 'dia');
    expect(resumo.faturamentoEmCentavos).toBe(1600);
    expect(resumo.vendidosNoBalcao).toBe(2);
  });

  it('perda baixa o estoque sem faturar; compra repõe', () => {
    c.casos.estoque.registrar(c.imperial.conta, { produtoId: c.refri.id, motivo: 'perda', quantidade: 1 });
    c.casos.estoque.registrar(c.imperial.conta, { produtoId: c.refri.id, motivo: 'compra', quantidade: 5 });
    expect(c.produtos.buscarPorId(c.refri.id)?.quantidadeEmEstoque).toBe(8);
    const resumo = c.casos.resumo.doPeriodo(c.imperial.conta, 'dia');
    expect(resumo).toMatchObject({ faturamentoEmCentavos: 0, perdas: 1, entradas: 5 });
  });

  it('vende no balcão até item fora do cardápio do app', () => {
    c.casos.cardapio.alternarNoCardapio(c.imperial.conta, c.refri.id);
    expect(() => c.casos.estoque.registrar(c.imperial.conta, { produtoId: c.refri.id, motivo: 'venda-balcao', quantidade: 1 })).not.toThrow();
  });

  it('recusa saída maior que o estoque e entrada em item feito na hora', () => {
    expect(() => c.casos.estoque.registrar(c.imperial.conta, { produtoId: c.refri.id, motivo: 'venda-balcao', quantidade: 9 }))
      .toThrow('só tem 4');
    expect(() => c.casos.estoque.registrar(c.imperial.conta, { produtoId: c.tapioca.id, motivo: 'compra', quantidade: 3 }))
      .toThrow('feito na hora');
    expect(c.casos.estoque.historico(c.imperial.conta)).toHaveLength(0);
  });

  it('não registra em produto de outra cantina', () => {
    expect(() => c.casos.estoque.registrar(c.cafe.conta, { produtoId: c.refri.id, motivo: 'perda', quantidade: 1 }))
      .toThrow('da sua cantina');
  });

  it('avisa o que esgotou e o que está acabando', () => {
    expect(c.casos.estoque.alertas(c.imperial.conta)).toEqual({ esgotados: [], baixos: [] });
    c.casos.estoque.registrar(c.imperial.conta, { produtoId: c.refri.id, motivo: 'venda-balcao', quantidade: 3 });
    expect(c.casos.estoque.alertas(c.imperial.conta).baixos.map((p) => p.nome)).toEqual(['Refri']);
    c.casos.estoque.registrar(c.imperial.conta, { produtoId: c.refri.id, motivo: 'venda-balcao', quantidade: 1 });
    expect(c.casos.estoque.alertas(c.imperial.conta).esgotados.map((p) => p.nome)).toEqual(['Refri']);
    expect(c.casos.estoque.itens(c.imperial.conta)[0].nivelDeEstoque()).toBe('esgotado');
  });

  it('a entrega do fornecedor entra no histórico como entrada', () => {
    c.casos.estoque.registrar(c.imperial.conta, { produtoId: c.refri.id, motivo: 'venda-balcao', quantidade: 3 });
    c.casos.repor.registrarEntrega(c.imperial.conta, [{ produtoId: c.refri.id, quantidade: 3 }]);
    expect(c.casos.estoque.historico(c.imperial.conta).map((m) => m.motivo)).toContain('compra');
    expect(c.produtos.buscarPorId(c.refri.id)?.quantidadeEmEstoque).toBe(4);
  });
});

describe('Resumo do dia, da semana e do mês', () => {
  const venda = (momento: Date, quantidade: number) =>
    novaMovimentacao({
      cantinaId: 'c1', produtoId: 'p1', produtoNome: 'Coxinha', motivo: 'venda-balcao', quantidade,
      valorEmCentavos: 1200 * quantidade, momento,
    });

  it('o período começa hoje, na segunda-feira ou no dia 1', () => {
    expect(inicioDoPeriodo('dia', QUARTA_20H)).toEqual(new Date(2026, 9, 28));
    expect(inicioDoPeriodo('semana', QUARTA_20H)).toEqual(new Date(2026, 9, 26));
    expect(inicioDoPeriodo('mes', QUARTA_20H)).toEqual(new Date(2026, 9, 1));
  });

  it('cada período soma só o que está dentro dele', () => {
    const movimentos = [
      venda(new Date(2026, 9, 28, 10, 0), 1), // hoje
      venda(new Date(2026, 9, 27, 15, 0), 2), // ontem (mesma semana)
      venda(new Date(2026, 9, 20, 20, 0), 3), // semana passada (mesmo mês)
      venda(new Date(2026, 8, 30, 20, 0), 4), // mês passado
    ];
    expect(resumirPeriodo(movimentos, 'dia', QUARTA_20H).itensVendidos).toBe(1);
    expect(resumirPeriodo(movimentos, 'semana', QUARTA_20H).itensVendidos).toBe(3);
    expect(resumirPeriodo(movimentos, 'mes', QUARTA_20H).itensVendidos).toBe(6);
  });

  it('agrupa por hora no dia e por dia na semana', () => {
    const movimentos = [venda(new Date(2026, 9, 28, 10, 15), 2), venda(new Date(2026, 9, 27, 15, 0), 5)];
    const dia = resumirPeriodo(movimentos, 'dia', QUARTA_20H).intervalos;
    expect(dia.find((i) => i.rotulo === '10h')).toEqual({ rotulo: '10h', entradas: 0, saidas: 2 });
    const semana = resumirPeriodo(movimentos, 'semana', QUARTA_20H).intervalos;
    expect(semana.map((i) => i.saidas)).toEqual([0, 5, 2, 0, 0, 0, 0]);
  });

  it('lista os mais vendidos do período', () => {
    const movimentos = [venda(QUARTA_20H, 3), { ...venda(QUARTA_20H, 5), produtoNome: 'Tapioca' }];
    expect(resumirPeriodo(movimentos, 'dia', QUARTA_20H).maisVendidos).toEqual([
      { nome: 'Tapioca', quantidade: 5 },
      { nome: 'Coxinha', quantidade: 3 },
    ]);
  });
});
