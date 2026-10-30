import { Cantina, type CoresDoCardapio } from '../../dominio/cantina/Cantina';
import { ErroDeDominio } from '../../dominio/ErroDeDominio';
import { Usuario } from '../../dominio/usuario/Usuario';
import { exigirPerfil } from '../autorizacao';
import type { RepositorioDeCantinas, RepositorioDeUsuarios } from '../portas';

export interface DadosDaCantina {
  nome: string;
  local: string;
  logo?: string;
  cores?: CoresDoCardapio;
  /** Conta de acesso da cantina, criada junto. */
  responsavel: string;
  email: string;
  senha: string;
}

/** Acesso CESAR: abre uma cantina nova no campus, já com a conta que ela vai usar. */
export class CadastrarCantina {
  constructor(
    private readonly cantinas: RepositorioDeCantinas,
    private readonly usuarios: RepositorioDeUsuarios,
  ) {}

  executar(quem: Usuario, dados: DadosDaCantina): Cantina {
    exigirPerfil(quem, 'cesar');
    if (this.usuarios.buscarPorEmail(dados.email.trim().toLowerCase())) {
      throw new ErroDeDominio('Esse e-mail já é usado por outra conta.');
    }
    const cantina = new Cantina(crypto.randomUUID(), dados.nome.trim(), dados.local.trim(), dados.logo, dados.cores);
    // Valida a conta antes de salvar qualquer coisa: ou entram as duas, ou nenhuma.
    const conta = new Usuario(crypto.randomUUID(), dados.responsavel, dados.email, 'cantina', dados.senha, cantina.id);
    this.cantinas.salvar(cantina);
    this.usuarios.salvar(conta);
    return cantina;
  }
}
