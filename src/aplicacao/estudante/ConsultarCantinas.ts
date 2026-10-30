import type { Cantina } from '../../dominio/cantina/Cantina';
import { ErroDeDominio } from '../../dominio/ErroDeDominio';
import { resumirAvaliacoes, type ResumoDeAvaliacao } from '../../dominio/pedido/resumirAvaliacoes';
import type { Produto } from '../../dominio/produto/Produto';
import type { RepositorioDeCantinas, RepositorioDePedidos, RepositorioDeProdutos } from '../portas';

/** Acesso estudante: "Visualizar cardápio" de cada cantina, com a nota que os colegas deram. */
export class ConsultarCantinas {
  constructor(
    private readonly cantinas: RepositorioDeCantinas,
    private readonly produtos: RepositorioDeProdutos,
    private readonly pedidos: RepositorioDePedidos,
  ) {}

  listar(): Cantina[] {
    return this.cantinas.listar();
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
