import { describe, expect, it } from 'vitest';
import { ErroDeDominio } from '../src/dominio/ErroDeDominio';
import { ControleDeEstoque } from '../src/dominio/produto/ControleDeEstoque';
import type { PoliticaDeDisponibilidade } from '../src/dominio/produto/PoliticaDeDisponibilidade';
import { PreparoNaHora } from '../src/dominio/produto/PreparoNaHora';
import { Produto } from '../src/dominio/produto/Produto';

const tapioca = () => new Produto('t', 'Tapioca', 'Tapiocas', 1000, new PreparoNaHora(6));
const refri = (quantidade = 4) => new Produto('r', 'Refrigerante', 'Bebidas', 800, new ControleDeEstoque(10, quantidade));

describe('Substituição de Liskov: qualquer política serve no lugar da outra', () => {
  const politicas: [string, () => PoliticaDeDisponibilidade][] = [
    ['PreparoNaHora', () => new PreparoNaHora(5)],
    ['ControleDeEstoque', () => new ControleDeEstoque(10)],
  ];

  it.each(politicas)('%s atende 1 unidade e reserva sem lançar "não suportado"', (_, criar) => {
    const politica = criar();
    expect(politica.podeAtender(1)).toBe(true);
    expect(() => politica.reservar(1)).not.toThrow();
    expect(politica.descricao()).toBeTruthy();
  });

  it.each(politicas)('%s recusa quantidade zero', (_, criar) => {
    expect(criar().podeAtender(0)).toBe(false);
  });
});

describe('Produto feito na hora', () => {
  it('nunca esgota por estoque e informa o tempo de preparo', () => {
    const produto = tapioca();
    produto.reservar(50);
    expect(produto.estaDisponivel(50)).toBe(true);
    expect(produto.tempoDePreparoMin).toBe(6);
    expect(produto.precisaRepor()).toBe(false);
  });

  it('não pode ser reabastecido', () => {
    expect(() => tapioca().reabastecer(3)).toThrow(ErroDeDominio);
  });
});

describe('Produto pronta-entrega', () => {
  it('baixa o estoque sozinho e esgota ao zerar', () => {
    const produto = refri(2);
    produto.reservar(2);
    expect(produto.quantidadeEmEstoque).toBe(0);
    expect(produto.estaDisponivel()).toBe(false);
    expect(produto.descricaoDisponibilidade()).toBe('Esgotado');
  });

  it('não vende mais do que tem', () => {
    expect(() => refri(1).reservar(2)).toThrow(ErroDeDominio);
  });

  it('entra na lista de compras abaixo da metade do ideal e sugere completar', () => {
    expect(refri(5).precisaRepor()).toBe(false);
    expect(refri(4).precisaRepor()).toBe(true);
    expect(refri(4).sugestaoDeReposicao()).toBe(6);
  });
});

describe('Cardápio', () => {
  it('produto fora do cardápio não fica disponível', () => {
    const produto = tapioca();
    produto.tirarDoCardapio();
    expect(produto.estaDisponivel()).toBe(false);
    produto.voltarAoCardapio();
    expect(produto.estaDisponivel()).toBe(true);
  });

  it('rejeita preço inválido', () => {
    expect(() => new Produto('x', 'X', 'Y', 0, new PreparoNaHora(1))).toThrow(ErroDeDominio);
    expect(() => new Produto('x', 'X', 'Y', Number.NaN, new PreparoNaHora(1))).toThrow(ErroDeDominio);
  });
});
