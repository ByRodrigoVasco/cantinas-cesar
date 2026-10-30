import type { CadastrarProduto } from '../aplicacao/CadastrarProduto';
import type { RepositorioDeProdutos, RepositorioDeUsuarios } from '../aplicacao/portas';
import { Usuario } from '../dominio/usuario/Usuario';
import { carregarCardapioInicial } from './cardapioInicial';

/*
 * Contas de teste da PoC. Ficam só aqui (e no README) para a apresentação.
 * Não são senhas reais: troque antes de qualquer uso fora da demonstração.
 */
export const CONTAS_DE_DEMONSTRACAO = {
  cantina: { email: 'cantina@imperial.com.br', senha: 'imperial123' },
  aluno: { email: 'aluno@cesar.school', senha: 'cesar123' },
} as const;

/** Na primeira vez que o app abre (ou depois de "restaurar"), cria cardápio e contas. */
export function prepararDadosDeDemonstracao(
  produtos: RepositorioDeProdutos,
  usuarios: RepositorioDeUsuarios,
  cadastrarProduto: CadastrarProduto,
): void {
  if (produtos.listar().length === 0) carregarCardapioInicial(cadastrarProduto);

  const { cantina, aluno } = CONTAS_DE_DEMONSTRACAO;
  if (!usuarios.buscarPorEmail(cantina.email)) {
    usuarios.salvar(new Usuario('conta-cantina', 'Tia da cantina', cantina.email, 'cantina', cantina.senha));
  }
  if (!usuarios.buscarPorEmail(aluno.email)) {
    usuarios.salvar(new Usuario('conta-aluno-demo', 'Ana Souza', aluno.email, 'aluno', aluno.senha));
  }
}
