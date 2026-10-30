import type { Relogio } from '../aplicacao/portas';
import { Horario } from '../dominio/Horario';

export class RelogioDoSistema implements Relogio {
  agora(): Horario {
    return Horario.deData(new Date());
  }

  instante(): Date {
    return new Date();
  }
}
