import { ErroDeDominio } from '../dominio/ErroDeDominio';
import { Horario } from '../dominio/Horario';
import { Pedido, type ItemPedido } from '../dominio/pedido/Pedido';
import type { Produto } from '../dominio/produto/Produto';
import type { RepositorioDePedidos, RepositorioDeProdutos, Relogio } from './portas';

export interface ItemSolicitado {
  produtoId: string;
  quantidade: number;
}

export interface SolicitacaoDeCompra {
  cliente: string;
  horarioDeRetirada: string;
  itens: ItemSolicitado[];
}

/** Caso de uso do aluno: "Agendar compra" para um horário de retirada. */
export class AgendarCompra {
  constructor(
    private readonly produtos: RepositorioDeProdutos,
    private readonly pedidos: RepositorioDePedidos,
    private readonly relogio: Relogio,
  ) {}

  executar(solicitacao: SolicitacaoDeCompra): Pedido {
    const escolhidos = solicitacao.itens.map(({ produtoId, quantidade }) => ({
      produto: this.produtoDisponivel(produtoId, quantidade),
      quantidade,
    }));
    const pedido = new Pedido(
      this.pedidos.proximoNumero(),
      solicitacao.cliente.trim(),
      escolhidos.map(({ produto, quantidade }) => this.itemDoPedido(produto, quantidade)),
      Horario.de(solicitacao.horarioDeRetirada),
    );
    this.garantirTempoDePreparo(pedido, solicitacao.itens);

    // Só reserva depois de validar tudo: ou o pedido entra inteiro, ou nada muda no estoque.
    for (const { produto, quantidade } of escolhidos) {
      produto.reservar(quantidade);
      this.produtos.salvar(produto);
    }
    this.pedidos.salvar(pedido);
    return pedido;
  }

  /** Usado pela tela para já sugerir um horário possível (prevenir o erro em vez de mostrá-lo). */
  horarioMaisCedo(itens: ItemSolicitado[]): Horario {
    const minutos = itens.reduce(
      (soma, { produtoId, quantidade }) => soma + (this.produtos.buscarPorId(produtoId)?.tempoDePreparoMin ?? 0) * quantidade,
      0,
    );
    return this.relogio.agora().mais(minutos);
  }

  private produtoDisponivel(produtoId: string, quantidade: number): Produto {
    const produto = this.produtos.buscarPorId(produtoId);
    if (!produto) throw new ErroDeDominio('Produto não encontrado.');
    if (!produto.estaDisponivel(quantidade)) {
      throw new ErroDeDominio(`${produto.nome} não está disponível nessa quantidade.`);
    }
    return produto;
  }

  private itemDoPedido(produto: Produto, quantidade: number): ItemPedido {
    return {
      produtoId: produto.id,
      nome: produto.nome,
      quantidade,
      precoUnitarioEmCentavos: produto.precoEmCentavos,
      tempoDePreparoMin: produto.tempoDePreparoMin,
    };
  }

  private garantirTempoDePreparo(pedido: Pedido, itens: ItemSolicitado[]): void {
    const maisCedoPossivel = this.horarioMaisCedo(itens);
    if (pedido.horarioDeRetirada.ehAntesDe(maisCedoPossivel)) {
      throw new ErroDeDominio(`Não dá tempo de preparar: escolha a partir das ${maisCedoPossivel}.`);
    }
  }
}
