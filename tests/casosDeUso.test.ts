import { beforeEach, describe, expect, it } from 'vitest';
import { AcompanharPedidos } from '../src/aplicacao/AcompanharPedidos';
import { AgendarCompra } from '../src/aplicacao/AgendarCompra';
import { CadastrarProduto } from '../src/aplicacao/CadastrarProduto';
import { CancelarPedido } from '../src/aplicacao/CancelarPedido';
import type { Aviso, Notificador, Relogio } from '../src/aplicacao/portas';
import { ReporEstoque } from '../src/aplicacao/ReporEstoque';
import { ErroDeDominio } from '../src/dominio/ErroDeDominio';
import { Horario } from '../src/dominio/Horario';
import type { Produto } from '../src/dominio/produto/Produto';
import { RepositorioDePedidosEmMemoria, RepositorioDeProdutosEmMemoria } from '../src/infra/RepositoriosEmMemoria';

/* Dublês: só funcionam porque os casos de uso dependem de portas, não de classes concretas. */
class RelogioParado implements Relogio {
  constructor(private readonly horario: string) {}
  agora(): Horario {
    return Horario.de(this.horario);
  }
}

class NotificadorEspiao implements Notificador {
  readonly avisos: Aviso[] = [];
  notificar(aviso: Aviso): void {
    this.avisos.push(aviso);
  }
}

describe('Fluxo da cantina', () => {
  let produtos: RepositorioDeProdutosEmMemoria;
  let notificador: NotificadorEspiao;
  let agendar: AgendarCompra;
  let acompanhar: AcompanharPedidos;
  let repor: ReporEstoque;
  let tapioca: Produto;
  let refri: Produto;

  beforeEach(() => {
    produtos = new RepositorioDeProdutosEmMemoria();
    const pedidos = new RepositorioDePedidosEmMemoria();
    notificador = new NotificadorEspiao();
    agendar = new AgendarCompra(produtos, pedidos, new RelogioParado('20:00'));
    acompanhar = new AcompanharPedidos(pedidos, notificador);
    repor = new ReporEstoque(produtos);
    const cadastrar = new CadastrarProduto(produtos);
    tapioca = cadastrar.executar({ nome: 'Tapioca', categoria: 'Tapiocas', precoEmCentavos: 1000, tipo: 'perecivel', tempoDePreparoMin: 6 });
    refri = cadastrar.executar({ nome: 'Refri', categoria: 'Bebidas', precoEmCentavos: 800, tipo: 'nao-perecivel', estoqueIdeal: 4 });
  });

  const pedir = (cliente: string, horario: string, itens: [Produto, number][]) =>
    agendar.executar({
      cliente,
      horarioDeRetirada: horario,
      itens: itens.map(([produto, quantidade]) => ({ produtoId: produto.id, quantidade })),
    });

  it('agendar baixa o estoque sozinho', () => {
    pedir('Ana', '20:30', [[tapioca, 1], [refri, 3]]);
    expect(refri.quantidadeEmEstoque).toBe(1);
  });

  it('recusa horário sem tempo de preparo', () => {
    expect(() => pedir('Ana', '20:10', [[tapioca, 2]])).toThrow('a partir das 20:12');
  });

  it('pedido com item esgotado não mexe em nada', () => {
    expect(() => pedir('Ana', '20:30', [[tapioca, 1], [refri, 5]])).toThrow(ErroDeDominio);
    expect(refri.quantidadeEmEstoque).toBe(4);
    expect(acompanhar.filaDaCantina()).toHaveLength(0);
  });

  it('fila da tia vem na ordem de começar o preparo', () => {
    pedir('Ana', '20:40', [[refri, 1]]);
    pedir('Beto', '20:35', [[tapioca, 3]]);
    expect(acompanhar.filaDaCantina().map((p) => p.cliente)).toEqual(['Beto', 'Ana']);
  });

  it('resume o que preparar em lote', () => {
    pedir('Ana', '20:30', [[tapioca, 1]]);
    pedir('Beto', '20:40', [[tapioca, 2]]);
    expect(acompanhar.resumoDoQueFazer()).toEqual([{ nome: 'Tapioca', quantidade: 3 }]);
  });

  it('marcar pronto avisa o aluno sem a tia fazer mais nada', () => {
    const pedido = pedir('Ana', '20:30', [[tapioca, 1]]);
    acompanhar.marcarPronto(pedido.numero);
    expect(notificador.avisos).toEqual([expect.objectContaining({ cliente: 'Ana', numeroDoPedido: pedido.numero })]);
    expect(acompanhar.resumoDoQueFazer()).toEqual([]);
  });

  it('aluno confirma a retirada e o pedido sai da fila', () => {
    const pedido = pedir('Ana', '20:30', [[tapioca, 1]]);
    acompanhar.marcarPronto(pedido.numero);
    acompanhar.confirmarRetirada(pedido.numero);
    expect(acompanhar.filaDaCantina()).toHaveLength(0);
    expect(acompanhar.pedidosDoCliente('ana')).toHaveLength(1);
  });

  it('lista de compras sai pronta e a entrega repõe tudo', () => {
    pedir('Ana', '20:30', [[refri, 3]]);
    expect(repor.listaDeCompras()).toEqual([{ produto: refri, quantidade: 3 }]);
    expect(repor.mensagemParaFornecedor()).toContain('3x Refri');
    repor.registrarEntrega([{ produtoId: refri.id, quantidade: 3 }]);
    expect(refri.quantidadeEmEstoque).toBe(4);
    expect(repor.listaDeCompras()).toEqual([]);
  });
});

describe('Saídas de emergência (controle e liberdade)', () => {
  const produtos = new RepositorioDeProdutosEmMemoria();
  const pedidos = new RepositorioDePedidosEmMemoria();
  const notificador: Notificador = { notificar: () => {} };
  const agendar = new AgendarCompra(produtos, pedidos, new RelogioParado('20:00'));
  const acompanhar = new AcompanharPedidos(pedidos, notificador);
  const cancelar = new CancelarPedido(pedidos, produtos);
  const cadastrar = new CadastrarProduto(produtos);
  const tapioca = cadastrar.executar({ nome: 'Tapioca', categoria: 'Tapiocas', precoEmCentavos: 1000, tipo: 'perecivel', tempoDePreparoMin: 6 });
  const agua = cadastrar.executar({ nome: 'Água', categoria: 'Bebidas', precoEmCentavos: 500, tipo: 'nao-perecivel', estoqueIdeal: 5 });

  it('cancelar devolve o estoque e tira da fila', () => {
    const pedido = agendar.executar({ cliente: 'Ana', horarioDeRetirada: '20:30', itens: [{ produtoId: agua.id, quantidade: 2 }] });
    expect(agua.quantidadeEmEstoque).toBe(3);
    cancelar.executar(pedido.numero);
    expect(agua.quantidadeEmEstoque).toBe(5);
    expect(acompanhar.filaDaCantina()).toHaveLength(0);
  });

  it('não cancela o que a tia já preparou', () => {
    const pedido = agendar.executar({ cliente: 'Ana', horarioDeRetirada: '20:30', itens: [{ produtoId: tapioca.id, quantidade: 1 }] });
    acompanhar.marcarPronto(pedido.numero);
    expect(() => cancelar.executar(pedido.numero)).toThrow('Fale com a tia');
  });

  it('a tia desfaz um "pronto" tocado por engano', () => {
    const pedido = agendar.executar({ cliente: 'Beto', horarioDeRetirada: '20:40', itens: [{ produtoId: tapioca.id, quantidade: 1 }] });
    acompanhar.marcarPronto(pedido.numero);
    acompanhar.desfazerPronto(pedido.numero);
    expect(pedido.status).toBe('agendado');
    expect(acompanhar.resumoDoQueFazer()).toContainEqual({ nome: 'Tapioca', quantidade: 1 });
  });

  it('sugere o horário mais cedo possível antes de o aluno errar', () => {
    expect(agendar.horarioMaisCedo([{ produtoId: tapioca.id, quantidade: 2 }]).toString()).toBe('20:12');
    expect(agendar.horarioMaisCedo([{ produtoId: agua.id, quantidade: 1 }]).toString()).toBe('20:00');
  });
});
