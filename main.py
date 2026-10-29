from abc import ABC, abstractmethod
from datetime import datetime

# ==============================================================================
# 1. DOMÍNIO E CARDÁPIO
# ==============================================================================
class ItemCardapio:
    def __init__(self, nome: str, preco: float, categoria: str):
        self.nome = nome
        self.preco = preco
        self.categoria = categoria

class Cardapio:
    def __init__(self):
        self.itens = [
            # Comidas
            ItemCardapio("Coxinha de frango", 8.90, "Comida"),
            ItemCardapio("Coxinha de frango com catupiry", 13.00, "Comida"),
            ItemCardapio("Empada de frango", 9.50, "Comida"),
            ItemCardapio("Pão de queijo", 5.00, "Comida"),
            # Bebidas
            ItemCardapio("Refrigerante Lata 350ml", 6.50, "Bebida"),
            ItemCardapio("Suco Natural 400ml", 8.00, "Bebida"),
            ItemCardapio("Café Expresso", 4.50, "Bebida"),
            ItemCardapio("Água Mineral 500ml", 3.50, "Bebida")
        ]

    def exibir(self):
        print("\n--- CARDÁPIO CESAR CANTINA ---")
        for i, item in enumerate(self.itens, 1):
            print(f"[{i}] {item.nome} - R$ {item.preco:.2f} ({item.categoria})")


# ==============================================================================
# 2. PRINCÍPIO DA RESPONSABILIDADE ÚNICA (SRP)
# Calculadora do tempo de fila baseada no horário estipulado
# ==============================================================================
class CalculadoraFila:
    @staticmethod
    def calcular_tempo_espera(horario_str: str) -> int:
        """Determina o tempo estimado de fila (em minutos) com base no horário."""
        horario = datetime.strptime(horario_str, "%H:%M").time()
        pico_inicio = datetime.strptime("20:15", "%H:%M").time()
        pico_fim = datetime.strptime("20:45", "%H:%M").time()

        # Horário de pico centralizado às 20:30 (intervalo das turmas)
        if pico_inicio <= horario <= pico_fim:
            return 25
        return 8


# ==============================================================================
# 3. PRINCÍPIO ABERTO/FECHADO (OCP) & INVERSÃO DE DEPENDÊNCIA (DIP)
# ==============================================================================
class FormaPagamento(ABC):
    @abstractmethod
    def processar(self, valor: float) -> bool:
        pass

class PagamentoPix(FormaPagamento):
    def processar(self, valor: float) -> bool:
        print(f"\n[PIX] Chave gerada! Escaneie o QR Code para pagar R$ {valor:.2f}")
        print("[PIX] Pagamento confirmado com sucesso!")
        return True

class PagamentoCartaoCredito(FormaPagamento):
    def processar(self, valor: float) -> bool:
        print(f"\n[Cartão de Crédito] Processando valor de R$ {valor:.2f}...")
        print("[Cartão de Crédito] Transação aprovada!")
        return True

class PagamentoCartaoDebito(FormaPagamento):
    def processar(self, valor: float) -> bool:
        print(f"\n[Cartão de Débito] Aproxime ou insira o cartão para R$ {valor:.2f}...")
        print("[Cartão de Débito] Transação aprovada!")
        return True

class PagamentoDinheiro(FormaPagamento):
    def processar(self, valor: float) -> bool:
        try:
            troco = float(input(f"[Dinheiro] Total: R$ {valor:.2f}. Informe o valor entregue para o troco: R$ "))
            if troco >= valor:
                print(f"[Dinheiro] Troco: R$ {troco - valor:.2f}. Pagamento recebido!")
                return True
            else:
                print("[Dinheiro] Valor insuficiente! Operação cancelada.")
                return False
        except ValueError:
            print("[Dinheiro] Valor inválido digitado! Operação cancelada.")
            return False


# ==============================================================================
# 4. GESTÃO DO PEDIDO E FLUXO INTERATIVO
# ==============================================================================
class Pedido:
    def __init__(self):
        self.itens = []
        self.opcao_consumo = ""
        self.horario_retirada = ""

    def adicionar_item(self, item: ItemCardapio):
        self.itens.append(item)

    def calcular_total(self) -> float:
        return sum(item.preco for item in self.itens)


def solicitar_horario_valido() -> str:
    """Valida a digitação do horário no formato correto HH:MM."""
    while True:
        horario_input = input("Qual horário você planeja retirar seu pedido? (Ex: 20:30): ").strip()
        try:
            # Valida se o texto bate com o formato de hora válido (00:00 até 23:59)
            datetime.strptime(horario_input, "%H:%M")
            return horario_input
        except ValueError:
            print("⚠️ Formato de horário inválido! Por favor, digite no formato HH:MM (ex: 20:30, 09:15).")


def executar_app():
    cardapio = Cardapio()
    pedido = Pedido()

    print("==========================================")
    print("      BEM-VINDO À CANTINA CESAR SCHOOL     ")
    print("==========================================")

    # Seleção de Itens
    while True:
        cardapio.exibir()
        print("\n[0] Finalizar seleção e ir para o carrinho")
        escolha = input("Digite o número do item que deseja adicionar: ").strip()

        if escolha == "0":
            if not pedido.itens:
                print("\n⚠️ O seu carrinho está vazio! Escolha pelo menos um item.")
                continue
            break

        if escolha.isdigit() and 1 <= int(escolha) <= len(cardapio.itens):
            item_selecionado = cardapio.itens[int(escolha) - 1]
            pedido.adicionar_item(item_selecionado)
            print(f"✅ {item_selecionado.nome} adicionado! Total atual: R$ {pedido.calcular_total():.2f}")
        else:
            print("❌ Opção inválida. Tente novamente.")

    # Escolha de Consumo / Retirada com Validação
    print("\n--- OPÇÃO DE CONSUMO ---")
    print("[1] Consumir no local")
    print("[2] Retirada no balcão")
    
    opcao_local = ""
    while opcao_local not in ["1", "2"]:
        opcao_local = input("Escolha a opção (1 ou 2): ").strip()
        if opcao_local not in ["1", "2"]:
            print("❌ Opção inválida. Digite 1 ou 2.")

    if opcao_local == "2":
        pedido.opcao_consumo = "Retirada no balcão"
        pedido.horario_retirada = solicitar_horario_valido()
    else:
        pedido.opcao_consumo = "Consumir no local"
        pedido.horario_retirada = datetime.now().strftime("%H:%M")

    # Cálculo da Fila (SRP)
    tempo_fila = CalculadoraFila.calcular_tempo_espera(pedido.horario_retirada)

    # Escolha da Forma de Pagamento (DIP / OCP)
    print("\n--- FORMA DE PAGAMENTO ---")
    print("[1] PIX")
    print("[2] Cartão de Crédito")
    print("[3] Cartão de Débito")
    print("[4] Dinheiro")
    
    opcoes_pagamento = {
        "1": PagamentoPix(),
        "2": PagamentoCartaoCredito(),
        "3": PagamentoCartaoDebito(),
        "4": PagamentoDinheiro()
    }

    metodo_pagamento = None
    while not metodo_pagamento:
        escolha_pag = input("Escolha a forma de pagamento (1-4): ").strip()
        metodo_pagamento = opcoes_pagamento.get(escolha_pag)
        if not metodo_pagamento:
            print("❌ Opção de pagamento inválida. Escolha de 1 a 4.")

    # Processamento e Resumo
    total = pedido.calcular_total()
    pagamento_sucesso = metodo_pagamento.processar(total)

    if pagamento_sucesso:
        print("\n==========================================")
        print("          RESUMO DO SEU PEDIDO            ")
        print("==========================================")
        for item in pedido.itens:
            print(f"- {item.nome}: R$ {item.preco:.2f}")
        print(f"TOTAL: R$ {total:.2f}")
        print(f"Tipo: {pedido.opcao_consumo}")
        print(f"Horário Previsto: {pedido.horario_retirada}")
        print(f"⏱️ Tempo Estimado na Fila: {tempo_fila} minutos")
        if tempo_fila >= 20:
            print("⚠️ ATENÇÃO: Horário de pico escolar (20:30)! Chegue com antecedência.")
        print("==========================================")
        print("Obrigado pelo pedido! Acompanhe o painel da cantina.")


if __name__ == "__main__":
    executar_app()