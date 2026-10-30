import { ErroDeDominio } from '../dominio/ErroDeDominio';
import type { Perfil, Usuario } from '../dominio/usuario/Usuario';

/*
 * As permissões ficam nos casos de uso, não na tela: mesmo que alguém monte uma requisição
 * "na mão", uma cantina não mexe nos pedidos de outra e um estudante não cria cantinas.
 */

export function exigirPerfil(usuario: Usuario, perfil: Perfil): void {
  if (usuario.perfil !== perfil) throw new ErroDeDominio('Você não tem acesso a essa ação.');
}

/** Id da cantina de quem está logado como cantina. */
export function cantinaDe(usuario: Usuario): string {
  exigirPerfil(usuario, 'cantina');
  if (!usuario.cantinaId) throw new ErroDeDominio('Conta de cantina sem cantina.');
  return usuario.cantinaId;
}
