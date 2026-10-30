import { ErroDeDominio } from '../dominio/ErroDeDominio';
import { Usuario } from '../dominio/usuario/Usuario';
import type { RepositorioDeUsuarios, Sessao } from './portas';

/** Só quem tem e-mail da escola cria conta; a conta da cantina já vem pronta. */
const DOMINIO_INSTITUCIONAL = '@cesar.school';

export interface DadosDoAluno {
  nome: string;
  email: string;
  senha: string;
}

export class CadastrarAluno {
  constructor(
    private readonly usuarios: RepositorioDeUsuarios,
    private readonly sessao: Sessao,
  ) {}

  /** Cria a conta e já deixa o aluno logado (sem passo extra de "agora entre"). */
  executar(dados: DadosDoAluno): Usuario {
    const email = dados.email.trim().toLowerCase();
    if (!email.endsWith(DOMINIO_INSTITUCIONAL)) {
      throw new ErroDeDominio(`Use seu e-mail da escola (termina com ${DOMINIO_INSTITUCIONAL}).`);
    }
    if (this.usuarios.buscarPorEmail(email)) throw new ErroDeDominio('Já existe uma conta com esse e-mail. Tente entrar.');
    const aluno = new Usuario(crypto.randomUUID(), dados.nome.trim(), email, 'aluno', dados.senha);
    this.usuarios.salvar(aluno);
    this.sessao.iniciar(aluno.id);
    return aluno;
  }
}
