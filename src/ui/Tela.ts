export interface Mensagem {
  readonly tipo: 'sucesso' | 'erro';
  readonly texto: string;
}

/** O mínimo que toda tela faz: se desenhar e mostrar uma mensagem. */
export interface Tela {
  /** Identifica a tela no HTML (classe tela-<nome>) para o estilo. */
  readonly nome: string;
  html(): string;
  mostrarMensagem(mensagem: Mensagem | null): void;
}

/*
 * Cada tela implementa só o tipo de interação que tem (Segregação de Interfaces): a tela do
 * CESAR só tem formulário e não é obrigada a ter métodos de clique ou digitação vazios.
 */

export interface ReageACliques {
  aoClicar(acao: string, elemento: HTMLElement): void;
}

export interface ReageAFormularios {
  aoEnviar(formulario: HTMLFormElement): void;
}

/** Guarda o que está sendo digitado, para não perder o texto quando a tela é redesenhada. */
export interface ReageADigitacao {
  aoDigitar(campo: string, valor: string): void;
}

/** Ler um arquivo (ex.: a foto do produto) é assíncrono. */
export interface ReageAArquivos {
  aoEscolherArquivo(campo: string, arquivo: File): Promise<void>;
}

export const reageACliques = (tela: Tela): tela is Tela & ReageACliques => 'aoClicar' in tela;
export const reageAFormularios = (tela: Tela): tela is Tela & ReageAFormularios => 'aoEnviar' in tela;
export const reageADigitacao = (tela: Tela): tela is Tela & ReageADigitacao => 'aoDigitar' in tela;
export const reageAArquivos = (tela: Tela): tela is Tela & ReageAArquivos => 'aoEscolherArquivo' in tela;
