import { describe, expect, it } from 'vitest';
import { Cantina } from '../src/dominio/cantina/Cantina';
import { Horario } from '../src/dominio/Horario';
import { Pedido } from '../src/dominio/pedido/Pedido';
import { ControleDeEstoque } from '../src/dominio/produto/ControleDeEstoque';
import { PreparoNaHora } from '../src/dominio/produto/PreparoNaHora';
import { Produto } from '../src/dominio/produto/Produto';
import { Usuario } from '../src/dominio/usuario/Usuario';

/*
 * O armazenamento do navegador guarda só dados (JSON). Estes testes garantem que salvar e
 * restaurar não perde nada, inclusive o estado privado (status, estoque, cardápio).
 */
const ida_e_volta = <T>(dados: T): T => JSON.parse(JSON.stringify(dados));

describe('Salvar e restaurar', () => {
  it('produto pronta-entrega mantém estoque, foto e se está no cardápio', () => {
    const original = new Produto('r', 'c1', 'Coca-Cola lata', 'Bebidas', 800, new ControleDeEstoque(12, 12), '/produtos/coca.jpg');
    original.reservar(5);
    original.tirarDoCardapio();
    const restaurado = Produto.deDados(ida_e_volta(original.paraDados()));
    expect(restaurado.quantidadeEmEstoque).toBe(7);
    expect(restaurado.estaNoCardapio).toBe(false);
    expect(restaurado.foto).toBe('/produtos/coca.jpg');
    expect(restaurado.reposicaoNecessaria()).toBe(0);
  });

  it('produto feito na hora volta como feito na hora', () => {
    const restaurado = Produto.deDados(ida_e_volta(new Produto('t', 'c1', 'Tapioca', 'Tapiocas', 1000, new PreparoNaHora(6)).paraDados()));
    expect(restaurado.nivelDeEstoque()).toBe('sem-controle');
    expect(restaurado.tempoDePreparoMin).toBe(6);
  });

  it('pedido mantém status, horário e itens', () => {
    const original = new Pedido(7, 'c1', 'ana', 'Ana', [
      { produtoId: 't', nome: 'Tapioca', quantidade: 2, precoUnitarioEmCentavos: 1000, tempoDePreparoMin: 6 },
    ], Horario.de('20:30'));
    original.marcarPronto();
    const restaurado = Pedido.deDados(ida_e_volta(original.paraDados()));
    expect(restaurado.status).toBe('pronto');
    expect(restaurado.horarioParaComecar().toString()).toBe('20:18');
    expect(restaurado.totalEmCentavos()).toBe(2000);
    expect(() => restaurado.marcarPronto()).toThrow();
  });

  it('usuário restaurado continua conferindo a senha', () => {
    const restaurado = Usuario.deDados(ida_e_volta(new Usuario('a', 'Ana', 'ana@cesar.school', 'estudante', 'senha123').paraDados()));
    expect(restaurado.confereSenha('senha123')).toBe(true);
    expect(restaurado.confereSenha('outra')).toBe(false);
  });
});

describe('Salvar e restaurar: cantina e avaliações', () => {
  it('cantina mantém logo e cores', () => {
    const original = new Cantina('c1', 'Imperial', 'Quiosque', '/marcas/imperial.jpg', { principal: '#f7ae3e', secundaria1: '#4b0a33', secundaria2: '#d23a2f' });
    const restaurada = Cantina.deDados(ida_e_volta(original.paraDados()));
    expect(restaurada.cores).toEqual(original.cores);
    expect(restaurada.logo).toBe('/marcas/imperial.jpg');
  });

  it('pedido mantém as notas por item', () => {
    const original = new Pedido(8, 'c1', 'ana', 'Ana', [
      { produtoId: 't', nome: 'Tapioca', quantidade: 1, precoUnitarioEmCentavos: 1000, tempoDePreparoMin: 6 },
    ], Horario.de('20:30'));
    original.marcarPronto();
    original.confirmarRetirada();
    original.avaliarItem('t', 4);
    expect(Pedido.deDados(ida_e_volta(original.paraDados())).notaDoItem('t')).toBe(4);
  });
});
