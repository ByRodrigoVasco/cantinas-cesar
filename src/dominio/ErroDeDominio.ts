/** Erro de regra de negócio: a mensagem é pensada para ser mostrada ao usuário. */
export class ErroDeDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeDominio';
  }
}
