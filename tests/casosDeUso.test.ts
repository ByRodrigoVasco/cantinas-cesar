import { beforeEach, describe, expect, it } from 'vitest';
import { ErroDeDominio } from '../src/dominio/ErroDeDominio';
import { montarCenario } from './cenario';

let c: ReturnType<typeof montarCenario>;
beforeEach(() => {
  c = montarCenario();
});

describe('Estudante agenda', () => {
  it('agendar baixa o estoque sozinho', () => {
    c.pedir(c.ana, '20:30', [[c.tapioca, 1], [c.refri, 3]]);
    expect(c.produtos.buscarPorId(c.refri.id)?.quantidadeEmEstoque).toBe(1);
  });

  it('recusa horário sem tempo de preparo e sugere o mais cedo possível', () => {
    expect(() => c.pedir(c.ana, '20:10', [[c.tapioca, 2]])).toThrow('a partir das 20:12');
    expect(c.casos.agendar.horarioMaisCedo([{ produtoId: c.tapioca.id, quantidade: 2 }]).toString()).toBe('20:12');
  });

  it('pedido com item esgotado não mexe em nada', () => {
    expect(() => c.pedir(c.ana, '20:30', [[c.tapioca, 1], [c.refri, 5]])).toThrow(ErroDeDominio);
    expect(c.produtos.buscarPorId(c.refri.id)?.quantidadeEmEstoque).toBe(4);
    expect(c.casos.painel.fila(c.imperial.conta)).toHaveLength(0);
  });

  it('cada pedido é de uma cantina só', () => {
    expect(() => c.pedir(c.ana, '20:30', [[c.tapioca, 1], [c.cafezinho, 1]])).toThrow('uma cantina só');
  });

  it('só estudante agenda', () => {
    expect(() => c.pedir(c.imperial.conta, '20:30', [[c.tapioca, 1]])).toThrow('não tem acesso');
  });
});

describe('Painel da cantina', () => {
  it('fila na ordem de começar o preparo e resumo em lote', () => {
    c.pedir(c.ana, '20:40', [[c.refri, 1]]);
    c.pedir(c.beto, '20:35', [[c.tapioca, 3]]);
    c.pedir(c.ana, '20:50', [[c.tapioca, 1]]);
    expect(c.casos.painel.fila(c.imperial.conta).map((p) => p.cliente)).toEqual(['Beto', 'Ana', 'Ana']);
    expect(c.casos.painel.resumoDoQueFazer(c.imperial.conta)).toEqual([{ nome: 'Tapioca', quantidade: 4 }]);
  });

  it('marcar pronto avisa o estudante sem a cantina fazer mais nada', () => {
    const pedido = c.pedir(c.ana, '20:30', [[c.tapioca, 1]]);
    c.casos.painel.marcarPronto(c.imperial.conta, pedido.numero);
    expect(c.notificador.avisos).toEqual([expect.objectContaining({ clienteId: 'ana', numeroDoPedido: pedido.numero })]);
  });

  it('desfaz um "pronto" tocado por engano', () => {
    const pedido = c.pedir(c.ana, '20:30', [[c.tapioca, 1]]);
    c.casos.painel.marcarPronto(c.imperial.conta, pedido.numero);
    c.casos.painel.desfazerPronto(c.imperial.conta, pedido.numero);
    expect(c.casos.painel.resumoDoQueFazer(c.imperial.conta)).toEqual([{ nome: 'Tapioca', quantidade: 1 }]);
  });

  it('uma cantina não vê nem mexe nos pedidos e produtos da outra', () => {
    const pedido = c.pedir(c.ana, '20:30', [[c.tapioca, 1]]);
    expect(c.casos.painel.fila(c.cafe.conta)).toHaveLength(0);
    expect(() => c.casos.painel.marcarPronto(c.cafe.conta, pedido.numero)).toThrow('não encontrado');
    expect(() => c.casos.cardapio.alternarNoCardapio(c.cafe.conta, c.tapioca.id)).toThrow('não encontrado');
  });

  it('estudante não usa o painel da cantina', () => {
    expect(() => c.casos.painel.fila(c.ana)).toThrow('não tem acesso');
  });
});

describe('Pedidos do estudante', () => {
  it('cancelar devolve o estoque e tira da fila', () => {
    const pedido = c.pedir(c.ana, '20:30', [[c.refri, 2]]);
    c.casos.meusPedidos.cancelar(c.ana, pedido.numero);
    expect(c.produtos.buscarPorId(c.refri.id)?.quantidadeEmEstoque).toBe(4);
    expect(c.casos.painel.fila(c.imperial.conta)).toHaveLength(0);
  });

  it('não cancela o que a cantina já preparou, nem pedido de outro estudante', () => {
    const pedido = c.pedir(c.ana, '20:30', [[c.tapioca, 1]]);
    expect(() => c.casos.meusPedidos.cancelar(c.beto, pedido.numero)).toThrow('não encontrado');
    c.casos.painel.marcarPronto(c.imperial.conta, pedido.numero);
    expect(() => c.casos.meusPedidos.cancelar(c.ana, pedido.numero)).toThrow('Fale com a cantina');
  });

  it('retirada entra no histórico como venda do app, com o valor', () => {
    const pedido = c.pedir(c.ana, '20:30', [[c.tapioca, 2], [c.refri, 1]]);
    c.casos.painel.marcarPronto(c.imperial.conta, pedido.numero);
    c.casos.meusPedidos.confirmarRetirada(c.ana, pedido.numero);
    const resumo = c.casos.resumo.doPeriodo(c.imperial.conta, 'dia');
    expect(resumo.faturamentoEmCentavos).toBe(2800);
    expect(resumo.pedidosDoApp).toBe(1);
  });
});

describe('Avaliação por item', () => {
  const retirarPedido = () => {
    const pedido = c.pedir(c.ana, '20:30', [[c.tapioca, 1], [c.refri, 1]]);
    c.casos.painel.marcarPronto(c.imperial.conta, pedido.numero);
    c.casos.meusPedidos.confirmarRetirada(c.ana, pedido.numero);
    return pedido;
  };

  it('cada item recebe a sua nota e a média aparece no cardápio', () => {
    const pedido = retirarPedido();
    c.casos.meusPedidos.avaliarItem(c.ana, pedido.numero, c.tapioca.id, 5);
    c.casos.meusPedidos.avaliarItem(c.ana, pedido.numero, c.refri.id, 3);
    const notas = c.casos.consultar.avaliacoesDoCardapio(c.imperial.cantina.id);
    expect(notas.get(c.tapioca.id)).toEqual({ media: 5, quantidade: 1 });
    expect(notas.get(c.refri.id)).toEqual({ media: 3, quantidade: 1 });
  });

  it('só avalia depois de retirar, e só o próprio pedido', () => {
    const pedido = c.pedir(c.ana, '20:30', [[c.tapioca, 1]]);
    expect(() => c.casos.meusPedidos.avaliarItem(c.ana, pedido.numero, c.tapioca.id, 5)).toThrow('depois de retirar');
    const retirado = retirarPedido();
    expect(() => c.casos.meusPedidos.avaliarItem(c.beto, retirado.numero, c.tapioca.id, 5)).toThrow('não encontrado');
  });

  it('o CESAR vê a nota média de cada cantina', () => {
    const pedido = retirarPedido();
    c.casos.meusPedidos.avaliarItem(c.ana, pedido.numero, c.tapioca.id, 4);
    c.casos.meusPedidos.avaliarItem(c.ana, pedido.numero, c.refri.id, 5);
    const imperial = c.casos.visaoGeral.executar(c.gestao).find((s) => s.cantina.id === c.imperial.cantina.id);
    expect(imperial?.avaliacao).toEqual({ media: 4.5, quantidade: 2 });
    expect(imperial?.pedidosEntregues).toBe(1);
  });
});

describe('Configurações da cantina', () => {
  it('cada cantina escolhe as cores do próprio cardápio', () => {
    c.casos.configurar.mudarCores(c.imperial.conta, { principal: '#F7AE3E', secundaria1: '#4b0a33', secundaria2: '#d23a2f' });
    expect(c.casos.consultar.buscar(c.imperial.cantina.id).cores.principal).toBe('#f7ae3e');
    expect(c.casos.consultar.buscar(c.cafe.cantina.id).cores.principal).toBe('#ff6002');
  });

  it('recusa cor fora do formato', () => {
    expect(() => c.casos.configurar.mudarCores(c.imperial.conta, { principal: 'laranja', secundaria1: '#000000', secundaria2: '#ffffff' }))
      .toThrow('#RRGGBB');
  });
});
