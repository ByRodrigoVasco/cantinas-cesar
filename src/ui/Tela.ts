export interface Mensagem {
  readonly tipo: 'sucesso' | 'erro';
  readonly texto: string;
}

/** Contrato que o App usa para desenhar e repassar eventos; cada tela cuida do próprio estado. */
export interface Tela {
  /** Identifica a tela no HTML (classe tela-<nome>) para o estilo. */
  readonly nome: string;
  html(): string;
  aoClicar(acao: string, elemento: HTMLElement): void;
  aoEnviar(formulario: HTMLFormElement): void;
  aoDigitar(campo: string, valor: string): void;
  mostrarMensagem(mensagem: Mensagem | null): void;
  /** Só para telas com envio de arquivo (ex.: foto do produto). Ler um arquivo é assíncrono. */
  aoEscolherArquivo?(campo: string, arquivo: File): Promise<void>;
}
