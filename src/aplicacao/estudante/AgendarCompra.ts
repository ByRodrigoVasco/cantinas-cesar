import { ErroDeDominio } from '../../dominio/ErroDeDominio';
import { Horario } from '../../dominio/Horario';
import { Pedido, type ItemPedido } from '../../dominio/pedido/Pedido';
import type { Produto } from '../../dominio/produto/Produto';
import type { Usuario } from '../../dominio/usuario/Usuario';
import { exigirPerfil } from '../autorizacao';
import type { RepositorioDePedidos, RepositorioDeProdutos, Relogio } from '../portas';

export interface ItemSolicitado {
  produtoId: string;
  quantidade: number;
}

export interface SolicitacaoDeCompra {
  cliente: Usuario;
  cantinaId: string;
  horarioDeRetirada: string;
  itens: ItemSolicitado[];
}

/** Acesso estudante: "Agendar compra" numa cantina, para um horário de retirada. */
export class AgendarCompra {
  constructor(
    private readonly produtos: RepositorioDeProdutos,
    private readonly pedidos: RepositorioDePedidos,
    private readonly relogio: Relogio,
  ) {}

  executar(solicitacao: SolicitacaoDeCompra): Pedido {
    exigirPerfil(solicitacao.cliente, 'estudante');
    const escolhidos = solicitacao.itens.map(({ produtoId, quantidade }) => ({
      produto: this.produtoDisponivel(solicitacao.cantinaId, produtoId, quantidade),
      quantidade,
    }));
    const pedido = new Pedido(
      this.pedidos.proximoNumero(),
      solicitacao.cantinaId,
      solicitacao.cliente.id,
      solicitacao.cliente.primeiroNome,
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

  private produtoDisponivel(cantinaId: string, produtoId: string, quantidade: number): Produto {
    const produto = this.produtos.buscarPorId(produtoId);
    if (!produto) throw new ErroDeDominio('Produto não encontrado.');
    if (produto.cantinaId !== cantinaId) throw new ErroDeDominio('Cada pedido é de uma cantina só.');
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
