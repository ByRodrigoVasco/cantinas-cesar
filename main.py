from abc import ABC, abstractmethod

# --- INVERSÃO DE DEPENDÊNCIA (DIP) ---
# A interface abstrata define o contrato para qualquer meio de pagamento
class FormaPagamento(ABC):
    @abstractmethod
    def processar(self, valor: float) -> bool:
        pass

class PagamentoPix(FormaPagamento):
    def processar(self, valor: float) -> bool:
        print(f"Pagamento de R${valor:.2f} via PIX realizado com sucesso!")
        return True

class PagamentoCartao(FormaPagamento):
    def processar(self, valor: float) -> bool:
        print(f"Pagamento de R${valor:.2f} no cartão aprovado!")
        return True

# --- RESPONSABILIDADE ÚNICA (SRP) ---
# Classe com apenas uma responsabilidade: calcular a estimativa da fila
class CalculadoraFila:
    def calcular_tempo_espera(self, quantidade_pedidos_na_fila: int) -> int:
        # Exemplo: 3 minutos por pedido na fila
        return quantidade_pedidos_na_fila * 3

# --- PRINCÍPIO ABERTO/FECHADO (OCP) ---
# ProcessadorPedido depende da abstração (FormaPagamento) e não de uma classe concreta.
# Para adicionar um novo pagamento (ex: Crédito Estudantil), basta criar uma nova classe.
class ProcessadorPedido:
    def __init__(self, forma_pagamento: FormaPagamento):
        self.forma_pagamento = forma_pagamento

    def finalizar_pedido(self, valor_total: float) -> bool:
        return self.forma_pagamento.processar(valor_total)

# --- EXEMPLO DE USO EM EXECUÇÃO ---
if __name__ == "__main__":
    # Instanciando a calculadora de fila (SRP)
    calc_fila = CalculadoraFila()
    tempo_estimado = calc_fila.calcular_tempo_espera(4)
    print(f"Tempo estimado de espera: {tempo_estimado} minutos.")

    # Processando pedido via PIX (DIP + OCP)
    pagamento = PagamentoPix()
    processador = ProcessadorPedido(forma_pagamento=pagamento)
    processador.finalizar_pedido(25.50)