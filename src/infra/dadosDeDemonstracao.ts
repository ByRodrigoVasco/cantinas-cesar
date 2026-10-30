import type { CadastrarProduto } from '../aplicacao/cantina/CadastrarProduto';
import type { CadastrarCantina } from '../aplicacao/cesar/CadastrarCantina';
import type {
  RepositorioDeCantinas, RepositorioDeMovimentacoes, RepositorioDeProdutos, RepositorioDeUsuarios,
} from '../aplicacao/portas';
import { Usuario } from '../dominio/usuario/Usuario';
import { carregarCardapioDaImperial } from './cardapioInicial';
import { gerarHistoricoDeExemplo } from './historicoDeExemplo';

export interface RepositoriosDaDemonstracao {
  readonly cantinas: RepositorioDeCantinas;
  readonly usuarios: RepositorioDeUsuarios;
  readonly produtos: RepositorioDeProdutos;
  readonly movimentacoes: RepositorioDeMovimentacoes;
}

/*
 * Contas de teste da PoC, uma para cada acesso. Ficam só aqui (e no README) para a apresentação.
 * Não são senhas reais: troque antes de qualquer uso fora da demonstração.
 */
export const CONTAS_DE_DEMONSTRACAO = {
  cesar: { email: 'gestao@cesar.school', senha: 'cesar2026' },
  cantina: { email: 'cantina@imperial.com.br', senha: 'imperial123' },
  estudante: { email: 'estudante@cesar.school', senha: 'cesar123' },
} as const;

export type AcessoDeDemonstracao = keyof typeof CONTAS_DE_DEMONSTRACAO;

/**
 * Na primeira vez que o app abre (ou depois de "restaurar"): cria a conta do CESAR, que abre a
 * Imperial pelo mesmo caso de uso da tela; a Imperial cadastra o próprio cardápio; e um estudante.
 */
export function prepararDadosDeDemonstracao(
  { cantinas, usuarios, produtos, movimentacoes }: RepositoriosDaDemonstracao,
  cadastrarCantina: CadastrarCantina,
  cadastrarProduto: CadastrarProduto,
): void {
  const { cesar, cantina, estudante } = CONTAS_DE_DEMONSTRACAO;
  if (!usuarios.buscarPorEmail(cesar.email)) {
    usuarios.salvar(new Usuario('conta-cesar', 'Gestão CESAR', cesar.email, 'cesar', cesar.senha));
  }
  if (!usuarios.buscarPorEmail(estudante.email)) {
    usuarios.salvar(new Usuario('conta-estudante-demo', 'Ana Souza', estudante.email, 'estudante', estudante.senha));
  }
  if (cantinas.listar().length > 0) return;

  const gestao = usuarios.buscarPorEmail(cesar.email);
  if (!gestao) return;
  cadastrarCantina.executar(gestao, {
    nome: 'Imperial Padaria',
    local: 'Quiosque Brum',
    logo: `${import.meta.env.BASE_URL}marcas/imperial.jpg`,
    cores: { principal: '#f7ae3e', secundaria1: '#4b0a33', secundaria2: '#d23a2f' },
    responsavel: 'Equipe Imperial',
    email: cantina.email,
    senha: cantina.senha,
  });
  const contaDaImperial = usuarios.buscarPorEmail(cantina.email);
  if (!contaDaImperial) return;
  carregarCardapioDaImperial(cadastrarProduto, contaDaImperial);
  gerarHistoricoDeExemplo(movimentacoes, produtos.listar(), new Date());
}
