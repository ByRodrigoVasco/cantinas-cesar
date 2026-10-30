import { ErroDeDominio } from '../../dominio/ErroDeDominio';
import type { Usuario } from '../../dominio/usuario/Usuario';
import type { RepositorioDeUsuarios, Sessao } from '../portas';

/** Entrar, sair e saber quem está usando o app. Vale para os três acessos. */
export class Autenticacao {
  constructor(
    private readonly usuarios: RepositorioDeUsuarios,
    private readonly sessao: Sessao,
  ) {}

  entrar(email: string, senha: string): Usuario {
    const usuario = this.usuarios.buscarPorEmail(email.trim().toLowerCase());
    // Mesma mensagem nos dois casos: não revela quais e-mails têm conta.
    if (!usuario || !usuario.confereSenha(senha)) throw new ErroDeDominio('E-mail ou senha incorretos.');
    this.sessao.iniciar(usuario.id);
    return usuario;
  }

  sair(): void {
    this.sessao.encerrar();
  }

  usuarioAtual(): Usuario | undefined {
    const id = this.sessao.idDoUsuario();
    return id ? this.usuarios.buscarPorId(id) : undefined;
  }
}
