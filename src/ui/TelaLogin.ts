import type { Autenticacao } from '../aplicacao/Autenticacao';
import type { CadastrarAluno } from '../aplicacao/CadastrarAluno';
import { escapar, htmlMensagem } from './formatacao';
import type { Mensagem, Tela } from './Tela';

interface Credenciais {
  readonly email: string;
  readonly senha: string;
}

export interface DependenciasDoLogin {
  readonly autenticacao: Autenticacao;
  readonly cadastrarAluno: CadastrarAluno;
  /** Atalhos da apresentação: entram com as contas de teste sem digitar. */
  readonly contasDeDemonstracao: { readonly aluno: Credenciais; readonly cantina: Credenciais };
  readonly restaurarDemonstracao: () => void;
}

type Modo = 'entrar' | 'criar';

export class TelaLogin implements Tela {
  readonly nome = 'login';
  private modo: Modo = 'entrar';
  private mensagem: Mensagem | null = null;
  // O que já foi digitado volta preenchido depois de um erro (a senha, não).
  private emailDigitado = '';
  private nomeDigitado = '';

  constructor(private readonly deps: DependenciasDoLogin) {}

  mostrarMensagem(mensagem: Mensagem | null): void {
    this.mensagem = mensagem;
  }

  aoDigitar(): void {}

  aoClicar(acao: string, elemento: HTMLElement): void {
    if (acao === 'modo') this.modo = elemento.dataset.modo as Modo;
    if (acao === 'demo') {
      const conta = this.deps.contasDeDemonstracao[elemento.dataset.perfil as 'aluno' | 'cantina'];
      this.deps.autenticacao.entrar(conta.email, conta.senha);
    }
    if (acao === 'restaurar' && confirm('Apagar pedidos, contas criadas e estoque e voltar ao início da demonstração?')) {
      this.deps.restaurarDemonstracao();
      this.mensagem = { tipo: 'sucesso', texto: 'Dados da demonstração restaurados.' };
    }
  }

  aoEnviar(formulario: HTMLFormElement): void {
    const dados = new FormData(formulario);
    const texto = (campo: string) => String(dados.get(campo) ?? '');
    this.emailDigitado = texto('email');
    if (formulario.dataset.form === 'entrar') {
      this.deps.autenticacao.entrar(texto('email'), texto('senha'));
    } else {
      this.nomeDigitado = texto('nome');
      this.deps.cadastrarAluno.executar({ nome: texto('nome'), email: texto('email'), senha: texto('senha') });
    }
  }

  html(): string {
    const entrando = this.modo === 'entrar';
    return `
      <section class="cartao cartao-login">
        <h2 class="titulo-tela">${entrando ? 'Entrar' : 'Criar conta de aluno'}</h2>
        <p class="dica">${entrando ? 'Alunos e equipe da cantina entram pelo mesmo lugar.' : 'Use seu e-mail da escola. Leva 10 segundos.'}</p>
        ${htmlMensagem(this.mensagem)}
        <form class="formulario" data-form="${this.modo}">
          ${entrando ? '' : `<label class="campo"><span>Nome</span><input name="nome" required autocomplete="name" value="${escapar(this.nomeDigitado)}" /></label>`}
          <label class="campo"><span>E-mail</span>
            <input name="email" type="email" required autocomplete="username" placeholder="voce@cesar.school" value="${escapar(this.emailDigitado)}" />
          </label>
          <label class="campo"><span>Senha</span>
            <input name="senha" type="password" required minlength="${entrando ? 1 : 6}" autocomplete="${entrando ? 'current-password' : 'new-password'}" />
            ${entrando ? '' : '<small>Pelo menos 6 caracteres.</small>'}
          </label>
          <button class="botao botao-primario botao-largo" type="submit">${entrando ? 'Entrar' : 'Criar conta e entrar'}</button>
        </form>
        <p class="troca-de-modo">
          ${entrando ? 'Ainda não tem conta?' : 'Já tem conta?'}
          <button class="botao-link" data-acao="modo" data-modo="${entrando ? 'criar' : 'entrar'}">${entrando ? 'Criar conta' : 'Entrar'}</button>
        </p>
      </section>
      <section class="cartao cartao-demo">
        <h3 class="subtitulo">Modo demonstração</h3>
        <div class="botoes-demo">
          <button class="botao botao-contorno" data-acao="demo" data-perfil="aluno">Entrar como aluno</button>
          <button class="botao botao-contorno" data-acao="demo" data-perfil="cantina">Entrar como cantina</button>
        </div>
        <p class="dica">Dica: abra o aluno numa aba e a cantina em outra para ver o aviso chegando.</p>
        <button class="botao-link" data-acao="restaurar">Restaurar dados iniciais</button>
      </section>`;
  }
}
