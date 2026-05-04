# Campainha-Digital 🔔

> O sistema de interfonia inteligente via QR Code que une segurança, economia e mobilidade.

![Preview](https://i.imgur.com/your-mockup-here.png)

## 🌟 O que é a Campainha-Digital?
A Campainha-Digital substitui os antigos e caros sistemas de interfone por uma solução moderna baseada em software. Com uma simples placa de QR Code no seu portão, seus visitantes podem te chamar diretamente no seu celular, onde quer que você esteja.

### 🚀 Principais Diferenciais:
- **Atendimento Remoto:** Atenda seu portão mesmo estando na rua ou em viagem.
- **Segurança Furtiva:** Veja quem está no portão sem ser visto (Modo Monitoramento).
- **Assinatura Única Anual:** Sem mensalidades pesadas, sem taxas de manutenção de fiação.
- **Instalação Instantânea:** Sem quebra-quebra, sem fios. Apenas a placa QR Code.
- **PWA (Progressive Web App):** Instale o painel como um aplicativo nativo no seu iOS ou Android.

---

## 🏗️ Estrutura do Projeto

O sistema é dividido em três interfaces principais:

1.  **Landing Page:** Portal de vendas e apresentação ultra-premium.
2.  **Painel do Cliente (Admin):** Onde o morador ou síndico gerencia suas placas e unidades.
3.  **Resident Dashboard (PWA):** O "receptor" da campainha, onde o morador recebe chamadas em tempo real.
4.  **Visitor Experience:** Interface otimizada para quem está na porta.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React.js, Vite, Lucide React (Ícones).
- **Backend:** Node.js, Express, Socket.io (Sinalização em tempo real).
- **PWA:** Vite PWA Plugin para suporte offline e instalação.
- **Design:** CSS Customizado com Glassmorphism e Mesh Gradients.

---

## 🚀 Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/leopalmeira/campainha-digital.git
   ```

2. **Instale as dependências (Frontend):**
   ```bash
   cd frontend
   npm install
   ```

3. **Instale as dependências (Backend):**
   ```bash
   cd ../backend
   npm install
   ```

4. **Inicie o Servidor:**
   ```bash
   npm start
   ```

5. **Inicie o Frontend:**
   ```bash
   cd ../frontend
   npm run dev
   ```

---

## 📈 Roadmap de Desenvolvimento

- [x] Design Ultra-Premium e Responsivo.
- [x] Fluxo de Chamadas via WebSockets.
- [x] Suporte PWA e Instalação Mobile.
- [ ] Implementação de Banco de Dados Relacional (PostgreSQL).
- [ ] Painel Administrativo de Vendas e Vendedores.
- [ ] Integração com Gateways de Pagamento.

---

## 📄 Licença
Distribuído sob a licença de propriedade de **Campainha-Digital**.

---
*Desenvolvido com foco em segurança e praticidade.*
