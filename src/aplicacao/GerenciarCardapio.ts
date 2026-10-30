import { ErroDeDominio } from '../dominio/ErroDeDominio';
import type { Produto } from '../dominio/produto/Produto';
import type { RepositorioDeProdutos } from './portas';

/** Casos de uso "Visualizar cardápio" (aluno) e "Gerenciar cardápio virtual" (tia). */
export class GerenciarCardapio {
  constructor(private readonly produtos: RepositorioDeProdutos) {}

  /** O que o aluno vê: só o que a tia deixou no cardápio hoje (esgotados aparecem marcados). */
  cardapioDoDia(): Produto[] {
    return this.produtos.listar().filter((produto) => produto.estaNoCardapio);
  }

  todosOsProdutos(): Produto[] {
    return this.produtos.listar();
  }

  alternarNoCardapio(produtoId: string): void {
    const produto = this.buscar(produtoId);
    if (produto.estaNoCardapio) produto.tirarDoCardapio();
    else produto.voltarAoCardapio();
    this.produtos.salvar(produto);
  }

  private buscar(produtoId: string): Produto {
    const produto = this.produtos.buscarPorId(produtoId);
    if (!produto) throw new ErroDeDominio('Produto não encontrado.');
    return produto;
  }
}
