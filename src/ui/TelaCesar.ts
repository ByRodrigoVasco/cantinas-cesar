import type { CadastrarCantina } from '../aplicacao/cesar/CadastrarCantina';
import type { SituacaoDaCantina, VisaoGeralDasCantinas } from '../aplicacao/cesar/VisaoGeralDasCantinas';
import type { Usuario } from '../dominio/usuario/Usuario';
import { escapar, htmlMensagem, htmlNota } from './formatacao';
import { htmlLogo } from './tema';
import type { Mensagem, ReageAFormularios, Tela } from './Tela';

export interface DependenciasDoCesar {
  readonly usuario: Usuario;
  readonly visaoGeral: VisaoGeralDasCantinas;
  readonly cadastrarCantina: CadastrarCantina;
}

const CAMPOS = ['nome', 'local', 'responsavel', 'email'] as const;

/** Acesso CESAR: acompanha as cantinas do campus e abre cantinas novas. */
export class TelaCesar implements Tela, ReageAFormularios {
  readonly nome = 'cesar';
  private mensagem: Mensagem | null = null;
  // Depois de um erro, o formulário volta preenchido (menos a senha).
  private digitado: Partial<Record<(typeof CAMPOS)[number], string>> = {};

  constructor(private readonly deps: DependenciasDoCesar) {}

  mostrarMensagem(mensagem: Mensagem | null): void {
    this.mensagem = mensagem;
  }

  aoEnviar(formulario: HTMLFormElement): void {
    const dados = new FormData(formulario);
    const texto = (campo: string) => String(dados.get(campo) ?? '').trim();
    this.digitado = Object.fromEntries(CAMPOS.map((campo) => [campo, texto(campo)]));
    const cantina = this.deps.cadastrarCantina.executar(this.deps.usuario, {
      nome: texto('nome'),
      local: texto('local'),
      responsavel: texto('responsavel'),
      email: texto('email'),
      senha: String(dados.get('senha') ?? ''),
    });
    this.mensagem = {
      tipo: 'sucesso',
      texto: `${cantina.nome} criada. Passe o acesso para a equipe: ${texto('email')} (e a senha inicial).`,
    };
    this.digitado = {};
  }

  html(): string {
    const situacoes = this.deps.visaoGeral.executar(this.deps.usuario);
    return `
      <header class="cabecalho-tela">
        <p class="sobretitulo">Gestão CESAR</p>
        <h2 class="titulo-tela">Cantinas do campus</h2>
      </header>
      ${htmlMensagem(this.mensagem)}
      <div class="grade-cantinas">${situacoes.map((s) => this.htmlSituacao(s)).join('')}</div>
      ${this.htmlNovaCantina()}`;
  }

  private htmlSituacao({ cantina, produtosNoCardapio, pedidosNaFila, pedidosEntregues, avaliacao }: SituacaoDaCantina): string {
    return `
      <article class="cartao cartao-situacao">
        <header>
          ${htmlLogo(cantina)}
          <div>
            <h3>${escapar(cantina.nome)}</h3>
            <p>${escapar(cantina.local)}</p>
          </div>
        </header>
        <dl class="numeros">
          <div><dt>No cardápio</dt><dd>${produtosNoCardapio}</dd></div>
          <div><dt>Na fila agora</dt><dd>${pedidosNaFila}</dd></div>
          <div><dt>Entregues</dt><dd>${pedidosEntregues}</dd></div>
        </dl>
        <p class="avaliacao-geral">${avaliacao ? `Nota dos estudantes ${htmlNota(avaliacao)}` : 'Ainda sem avaliações'}</p>
      </article>`;
  }

  private htmlNovaCantina(): string {
    const valor = (campo: (typeof CAMPOS)[number]) => escapar(this.digitado[campo] ?? '');
    return `
      <section class="cartao">
        <h3 class="subtitulo">Nova cantina</h3>
        <p class="dica">Cria a cantina e a conta que a equipe dela vai usar. Depois ela cadastra o cardápio e escolhe as cores sozinha.</p>
        <form class="formulario formulario-duas-colunas" data-form="nova-cantina">
          <label class="campo"><span>Nome da cantina</span><input name="nome" required placeholder="Ex.: Café do Térreo" value="${valor('nome')}" /></label>
          <label class="campo"><span>Onde fica no campus</span><input name="local" required placeholder="Ex.: Térreo, ao lado da biblioteca" value="${valor('local')}" /></label>
          <label class="campo"><span>Responsável</span><input name="responsavel" required autocomplete="off" value="${valor('responsavel')}" /></label>
          <label class="campo"><span>E-mail de acesso</span><input name="email" type="email" required autocomplete="off" value="${valor('email')}" /></label>
          <label class="campo"><span>Senha inicial</span><input name="senha" type="password" required minlength="6" autocomplete="new-password" /><small>Pelo menos 6 caracteres.</small></label>
          <div class="acoes-formulario"><button class="botao botao-primario" type="submit">Criar cantina e acesso</button></div>
        </form>
      </section>`;
  }
}
