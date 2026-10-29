# 🛒 Cantina App - CESAR School (Entrega 1)

Aplicação interativa para gestão e autoatendimento de pedidos em cantina universitária, desenvolvida em Python para a P2 da CESAR School.

---

## 🚀 Funcionalidades

- **Cardápio Interativo:** Escolha de comidas e bebidas com atualização do valor total em tempo real.
- **Opções de Consumo:** Consumo no local ou retirada no balcão.
- **Validação Rigorosa de Horário:** Entrada no formato `HH:MM` para agendamento de retirada.
- **Estimativa de Fila (SRP):** Cálculo automático do tempo de espera com alerta para o horário de pico escolar (`20:30`).
- **Múltiplos Pagamentos (DIP / OCP):** Suporte a PIX, Cartão de Crédito, Cartão de Débito e Dinheiro (com cálculo de troco).

---

## 🛠️ Princípios de Programação Orientada a Objetos & SOLID

- **SRP (Single Responsibility Principle):** A classe `CalculadoraFila` possui responsabilidade única de estimar tempos de espera baseando-se no horário.
- **OCP (Open/Closed Principle) & DIP (Dependency Inversion Principle):** A interface abstrata `FormaPagamento` permite adicionar novas formas de pagamento sem alterar o fluxo principal da aplicação.

---

## 💻 Como Executar o Projeto

1. Certifique-se de ter o Python 3.x instalado.
2. Clone o repositório:
   `git clone https://github.com/luan-arruda/Hackground-Rel-mpago.git`
3. Acesse a pasta e execute a aplicação:
   `python main.py`

---

## 👥 Integrantes do Projeto

- **Luan Arruda**
- **Anderson Campos**
- **Rodrigo Vasco**
- **João Vitor de Medeiros**
- **Laura Brayner**
- **Júlio Lins**
