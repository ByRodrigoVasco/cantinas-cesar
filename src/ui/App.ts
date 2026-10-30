import { ErroDeDominio } from '../dominio/ErroDeDominio';
import type { Tela } from './Tela';

const INTERVALO_DE_ATUALIZACAO_MS = 30_000;

/**
 * Monta as duas telas lado a lado e repassa os eventos do navegador para a tela certa.
 * Não conhece regra de negócio nenhuma: só desenha e trata ErroDeDominio como mensagem.
 */
export class App {
  private readonly telas: Record<string, Tela>;

  constructor(
    private readonly raiz: HTMLElement,
    aluno: Tela,
    cantina: Tela,
  ) {
    this.telas = { aluno, cantina };
    this.montar();
    this.ouvirEventos();
    this.atualizar();
    // O "Começar agora" depende do relógio; só redesenha se ninguém estiver digitando.
    setInterval(() => this.ninguemDigitando() && this.atualizar(), INTERVALO_DE_ATUALIZACAO_MS);
  }

  private montar(): void {
    this.raiz.innerHTML = `
      <header class="topo">
        <h1>Cantina CESAR</h1>
        <p>15 minutos de intervalo. Zero minutos de fila.</p>
      </header>
      <main class="paineis">
        <section class="painel painel-aluno" aria-labelledby="titulo-aluno">
          <header class="painel-topo">
            <span class="painel-icone" aria-hidden="true">📱</span>
            <div><h2 id="titulo-aluno">App do aluno</h2><p>Peça antes, retire sem fila</p></div>
          </header>
          <div class="painel-corpo" data-tela="aluno"></div>
        </section>
        <section class="painel painel-cantina" aria-labelledby="titulo-cantina">
          <header class="painel-topo">
            <span class="painel-icone" aria-hidden="true">🧑‍🍳</span>
            <div><h2 id="titulo-cantina">Painel da cantina</h2><p>Um toque por pedido</p></div>
          </header>
          <div class="painel-corpo" data-tela="cantina"></div>
        </section>
      </main>`;
  }

  private ouvirEventos(): void {
    this.raiz.addEventListener('click', (evento) => {
      const alvo = (evento.target as HTMLElement).closest<HTMLElement>('[data-acao]');
      const tela = alvo && this.telaDe(alvo);
      if (alvo && tela) this.executar(tela, () => tela.aoClicar(alvo.dataset.acao ?? '', alvo));
    });
    this.raiz.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const formulario = evento.target as HTMLFormElement;
      const tela = this.telaDe(formulario);
      if (tela) this.executar(tela, () => tela.aoEnviar(formulario));
    });
    this.raiz.addEventListener('input', (evento) => {
      const campo = evento.target as HTMLInputElement;
      if (campo.dataset.campo) this.telaDe(campo)?.aoDigitar(campo.dataset.campo, campo.value);
    });
    // Ao sair do campo de nome, "Meus pedidos" é redesenhado para o aluno certo.
    this.raiz.addEventListener('change', (evento) => {
      if ((evento.target as HTMLElement).dataset.campo === 'nome') this.atualizar();
    });
  }

  private telaDe(elemento: Element): Tela | undefined {
    const nome = elemento.closest<HTMLElement>('[data-tela]')?.dataset.tela;
    return nome ? this.telas[nome] : undefined;
  }

  private executar(tela: Tela, acao: () => void): void {
    tela.mostrarMensagem(null);
    try {
      acao();
    } catch (erro) {
      if (!(erro instanceof ErroDeDominio)) throw erro;
      tela.mostrarMensagem({ tipo: 'erro', texto: erro.message });
    }
    this.atualizar();
  }

  private atualizar(): void {
    for (const [nome, tela] of Object.entries(this.telas)) {
      const corpo = this.raiz.querySelector<HTMLElement>(`[data-tela="${nome}"]`);
      if (!corpo) continue;
      const rolagem = corpo.scrollTop;
      corpo.innerHTML = tela.html();
      corpo.scrollTop = rolagem;
    }
  }

  private ninguemDigitando(): boolean {
    return !(document.activeElement instanceof HTMLInputElement);
  }
}
