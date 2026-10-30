import type { Autenticacao } from '../aplicacao/Autenticacao';
import { ErroDeDominio } from '../dominio/ErroDeDominio';
import type { Usuario } from '../dominio/usuario/Usuario';
import { escapar } from './formatacao';
import { icone } from './icones';
import type { Tela } from './Tela';

const INTERVALO_DE_ATUALIZACAO_MS = 30_000;

export interface DependenciasDoApp {
  readonly autenticacao: Autenticacao;
  /** Decide a tela pelo perfil de quem entrou (ninguém → login). */
  readonly criarTela: (usuario: Usuario | undefined) => Tela;
  readonly aoMudarEmOutraAba: (ouvinte: () => void) => void;
}

/**
 * Casca do app: topo com a marca e o usuário, e a tela atual no meio. Repassa os eventos do
 * navegador para a tela e troca de tela quando alguém entra ou sai. Não tem regra de negócio.
 */
export class App {
  private tela!: Tela;
  private idDoUsuarioDaTela: string | undefined | null = null;

  constructor(
    private readonly raiz: HTMLElement,
    private readonly deps: DependenciasDoApp,
  ) {
    this.montar();
    this.ouvirEventos();
    this.atualizar();
    // "Começar agora" depende do relógio, e a outra aba pode ter mudado algo: redesenha sem atrapalhar quem digita.
    setInterval(() => this.atualizarSeNinguemDigitando(), INTERVALO_DE_ATUALIZACAO_MS);
    deps.aoMudarEmOutraAba(() => this.atualizarSeNinguemDigitando());
  }

  private montar(): void {
    this.raiz.innerHTML = `
      <header class="topo">
        <div class="marca">
          <h1><span>Cantina</span> CESAR</h1>
          <p>com <strong>Imperial</strong> Padaria</p>
        </div>
        <div class="topo-direita" data-area="usuario"></div>
      </header>
      <main class="conteudo" data-area="tela"></main>`;
  }

  private ouvirEventos(): void {
    this.raiz.addEventListener('click', (evento) => {
      const alvo = (evento.target as HTMLElement).closest<HTMLElement>('[data-acao]');
      if (!alvo) return;
      if (alvo.dataset.acao === 'sair') {
        this.deps.autenticacao.sair();
        this.atualizar();
        return;
      }
      this.executar(() => this.tela.aoClicar(alvo.dataset.acao ?? '', alvo));
    });
    this.raiz.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const formulario = evento.target as HTMLFormElement;
      this.executar(() => this.tela.aoEnviar(formulario));
    });
    this.raiz.addEventListener('input', (evento) => {
      const campo = evento.target as HTMLInputElement;
      if (campo.dataset.campo) this.tela.aoDigitar(campo.dataset.campo, campo.value);
    });
  }

  private executar(acao: () => void): void {
    this.tela.mostrarMensagem(null);
    try {
      acao();
    } catch (erro) {
      if (!(erro instanceof ErroDeDominio)) throw erro;
      this.tela.mostrarMensagem({ tipo: 'erro', texto: erro.message });
    }
    this.atualizar();
  }

  private atualizar(): void {
    const usuario = this.deps.autenticacao.usuarioAtual();
    const trocouDeUsuario = usuario?.id !== this.idDoUsuarioDaTela;
    if (trocouDeUsuario) {
      this.tela = this.deps.criarTela(usuario);
      this.idDoUsuarioDaTela = usuario?.id;
    }
    this.area('usuario').innerHTML = usuario
      ? `<span class="saudacao">${icone(usuario.perfil)}Olá, <strong>${escapar(usuario.primeiroNome)}</strong></span>
         <button class="botao botao-sair" data-acao="sair">${icone('sair')}Sair</button>`
      : `<p class="slogan">15 minutos de intervalo.<br />Zero minutos de fila.</p>`;

    const rolagem = trocouDeUsuario ? 0 : window.scrollY;
    this.area('tela').innerHTML = `<div class="tela tela-${this.tela.nome}">${this.tela.html()}</div>`;
    window.scrollTo(0, rolagem);
  }

  private atualizarSeNinguemDigitando(): void {
    if (!(document.activeElement instanceof HTMLInputElement)) this.atualizar();
  }

  private area(nome: string): HTMLElement {
    const elemento = this.raiz.querySelector<HTMLElement>(`[data-area="${nome}"]`);
    if (!elemento) throw new Error(`Área "${nome}" não encontrada.`);
    return elemento;
  }
}
