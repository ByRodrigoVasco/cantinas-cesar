import { ErroDeDominio } from '../../dominio/ErroDeDominio';
import { Usuario } from '../../dominio/usuario/Usuario';
import type { RepositorioDeUsuarios, Sessao } from '../portas';

/** Só quem tem e-mail institucional cria conta sozinho; cantinas são criadas pelo CESAR. */
const DOMINIO_INSTITUCIONAL = '@cesar.school';

export interface DadosDoEstudante {
  nome: string;
  email: string;
  senha: string;
}

export class CadastrarEstudante {
  constructor(
    private readonly usuarios: RepositorioDeUsuarios,
    private readonly sessao: Sessao,
  ) {}

  /** Cria a conta e já deixa o estudante logado (sem passo extra de "agora entre"). */
  executar(dados: DadosDoEstudante): Usuario {
    const email = dados.email.trim().toLowerCase();
    if (!email.endsWith(DOMINIO_INSTITUCIONAL)) {
      throw new ErroDeDominio(`Use seu e-mail institucional (termina com ${DOMINIO_INSTITUCIONAL}).`);
    }
    if (this.usuarios.buscarPorEmail(email)) throw new ErroDeDominio('Já existe uma conta com esse e-mail. Tente entrar.');
    // O perfil vem daqui, nunca do formulário: ninguém se cadastra como cantina ou CESAR.
    const estudante = new Usuario(crypto.randomUUID(), dados.nome.trim(), email, 'estudante', dados.senha);
    this.usuarios.salvar(estudante);
    this.sessao.iniciar(estudante.id);
    return estudante;
  }
}
