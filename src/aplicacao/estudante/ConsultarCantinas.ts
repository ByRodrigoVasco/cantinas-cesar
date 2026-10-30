import type { Cantina } from '../../dominio/cantina/Cantina';
import { ErroDeDominio } from '../../dominio/ErroDeDominio';
import { mediaGeral, resumirAvaliacoes, type ResumoDeAvaliacao } from '../../dominio/pedido/resumirAvaliacoes';
import type { Produto } from '../../dominio/produto/Produto';
import type { RepositorioDeCantinas, RepositorioDePedidos, RepositorioDeProdutos } from '../portas';

/** Uma cantina como o estudante a vê na hora de escolher. */
export interface CantinaNaVitrine {
  readonly cantina: Cantina;
  readonly itensHoje: number;
  readonly avaliacao?: ResumoDeAvaliacao;
}

/** Acesso estudante: "Visualizar cardápio" de cada cantina, com a nota que os colegas deram. */
export class ConsultarCantinas {
  constructor(
    private readonly cantinas: RepositorioDeCantinas,
    private readonly produtos: RepositorioDeProdutos,
    private readonly pedidos: RepositorioDePedidos,
  ) {}

  /**
   * As cantinas já com o que o estudante precisa para escolher: quantos itens têm hoje e a nota
   * média. A tela não precisa saber como cada número é calculado.
   */
  vitrine(): CantinaNaVitrine[] {
    const produtos = this.produtos.listar();
    const pedidos = this.pedidos.listar();
    return this.cantinas.listar().map((cantina) => ({
      cantina,
      itensHoje: produtos.filter((p) => p.cantinaId === cantina.id && p.estaNoCardapio).length,
      avaliacao: mediaGeral(resumirAvaliacoes(pedidos.filter((p) => p.cantinaId === cantina.id)).values()),
    }));
  }

  buscar(cantinaId: string): Cantina {
    const cantina = this.cantinas.buscarPorId(cantinaId);
    if (!cantina) throw new ErroDeDominio('Cantina não encontrada.');
    return cantina;
  }

  /** Só o que a cantina deixou no cardápio hoje (esgotados aparecem marcados). */
  cardapioDoDia(cantinaId: string): Produto[] {
    return this.produtos.listar().filter((p) => p.cantinaId === cantinaId && p.estaNoCardapio);
  }

  avaliacoesDoCardapio(cantinaId: string): Map<string, ResumoDeAvaliacao> {
    return resumirAvaliacoes(this.pedidos.listar().filter((p) => p.cantinaId === cantinaId));
  }
}
