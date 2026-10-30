import { ErroDeDominio } from '../../dominio/ErroDeDominio';
import type { Produto } from '../../dominio/produto/Produto';
import type { Usuario } from '../../dominio/usuario/Usuario';
import { cantinaDe } from '../autorizacao';
import type { RepositorioDeProdutos } from '../portas';

/** Acesso cantina: "Gerenciar estoque/cardápio virtual" — só os próprios produtos. */
export class GerenciarCardapio {
  constructor(private readonly produtos: RepositorioDeProdutos) {}

  todosOsProdutos(quem: Usuario): Produto[] {
    const cantinaId = cantinaDe(quem);
    return this.produtos.listar().filter((produto) => produto.cantinaId === cantinaId);
  }

  alternarNoCardapio(quem: Usuario, produtoId: string): void {
    const produto = this.produtos.buscarPorId(produtoId);
    // Produto de outra cantina responde como inexistente: não revela o que não é seu.
    if (!produto || produto.cantinaId !== cantinaDe(quem)) throw new ErroDeDominio('Produto não encontrado.');
    if (produto.estaNoCardapio) produto.tirarDoCardapio();
    else produto.voltarAoCardapio();
    this.produtos.salvar(produto);
  }
}
