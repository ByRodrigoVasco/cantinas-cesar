import type { Autenticacao } from '../aplicacao/acesso/Autenticacao';
import type { CadastrarEstudante } from '../aplicacao/acesso/CadastrarEstudante';
import type { NomeDoIcone } from './icones';
import { icone } from './icones';
import { escapar, htmlMensagem } from './formatacao';
import type { Mensagem, Tela } from './Tela';

interface Credenciais {
  readonly email: string;
  readonly senha: string;
}

type Acesso = 'cesar' | 'cantina' | 'estudante';

export interface DependenciasDoLogin {
  readonly autenticacao: Autenticacao;
  readonly cadastrarEstudante: CadastrarEstudante;
  /** Atalhos da apresentação: entram com as contas de teste sem digitar. */
  readonly contasDeDemonstracao: Readonly<Record<Acesso, Credenciais>>;
  readonly restaurarDemonstracao: () => void;
}

type Modo = 'entrar' | 'criar';

const ATALHOS: [Acesso, NomeDoIcone, string][] = [
  ['estudante', 'estudante', 'Estudante'],
  ['cantina', 'cantina', 'Cantina Imperial'],
  ['cesar', 'cesar', 'Gestão CESAR'],
];

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
      const conta = this.deps.contasDeDemonstracao[elemento.dataset.acesso as Acesso];
      this.deps.autenticacao.entrar(conta.email, conta.senha);
    }
    if (acao === 'restaurar' && confirm('Apagar cantinas criadas, pedidos, avaliações e contas e voltar ao início da demonstração?')) {
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
      this.deps.cadastrarEstudante.executar({ nome: texto('nome'), email: texto('email'), senha: texto('senha') });
    }
  }

  html(): string {
    const entrando = this.modo === 'entrar';
    return `
      <section class="destaque-login">
        <p class="sobretitulo">Cantinas do CESAR</p>
        <h2>Peça antes.<br />Retire pronto.</h2>
        <p>Agende o lanche, acompanhe o pedido e retire no balcão.</p>
      </section>
      <section class="cartao cartao-login">
        <h2 class="titulo-tela">${entrando ? 'Entrar' : 'Criar conta de estudante'}</h2>
        <p class="dica">${entrando
          ? 'Estudantes, cantinas e a gestão do CESAR entram pelo mesmo lugar.'
          : 'Use seu e-mail institucional. Contas de cantina são criadas pela gestão do CESAR.'}</p>
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
          ${entrando ? 'É estudante e ainda não tem conta?' : 'Já tem conta?'}
          <button class="botao-link" data-acao="modo" data-modo="${entrando ? 'criar' : 'entrar'}">${entrando ? 'Criar conta' : 'Entrar'}</button>
        </p>
      </section>
      <section class="cartao cartao-demo">
        <p class="sobretitulo">Modo demonstração</p>
        <div class="botoes-demo">
          ${ATALHOS.map(([acesso, nomeDoIcone, rotulo]) => `
            <button class="botao botao-contorno" data-acao="demo" data-acesso="${acesso}">${icone(nomeDoIcone)}${rotulo}</button>`).join('')}
        </div>
        <p class="dica">Dica: abra o estudante numa aba e a cantina em outra para ver o aviso chegando.</p>
        <button class="botao-link" data-acao="restaurar">Restaurar dados iniciais</button>
      </section>`;
  }
}
