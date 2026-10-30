import { ErroDeDominio } from '../ErroDeDominio';

export type Perfil = 'aluno' | 'cantina';

export interface UsuarioSalvo {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly perfil: Perfil;
  readonly senha: string;
}

const TAMANHO_MINIMO_DA_SENHA = 6;
const FORMATO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Quem usa o app: aluno ou equipe da cantina. A senha é privada e só é conferida aqui dentro.
 * PoC: a senha é guardada sem criptografia. Num sistema real, isso fica num backend com hash.
 */
export class Usuario {
  readonly email: string;

  constructor(
    readonly id: string,
    readonly nome: string,
    email: string,
    readonly perfil: Perfil,
    private readonly senha: string,
  ) {
    if (!nome.trim()) throw new ErroDeDominio('Informe seu nome.');
    this.email = email.trim().toLowerCase();
    if (!FORMATO_DE_EMAIL.test(this.email)) throw new ErroDeDominio('E-mail inválido.');
    if (senha.length < TAMANHO_MINIMO_DA_SENHA) {
      throw new ErroDeDominio(`A senha precisa ter pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`);
    }
  }

  get primeiroNome(): string {
    return this.nome.trim().split(/\s+/)[0];
  }

  confereSenha(tentativa: string): boolean {
    return tentativa === this.senha;
  }

  paraDados(): UsuarioSalvo {
    return { id: this.id, nome: this.nome, email: this.email, perfil: this.perfil, senha: this.senha };
  }

  static deDados(dados: UsuarioSalvo): Usuario {
    return new Usuario(dados.id, dados.nome, dados.email, dados.perfil, dados.senha);
  }
}
