const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

class WhatsAppService {
  /**
   * Envia mensagem de boas vindas
   */
  static async sendWelcomeMessage(user) {
    if (!user.whatsapp) return;
    
    const message = `Olá ${user.name}, seja bem-vindo(a) à Campainha Digital! 🚀
    
Agradecemos o seu cadastro. Sua conta foi ativada com sucesso.

Aqui você terá acesso a um sistema profissional de portaria digital.
Link de acesso: https://app.campainhadigital.com.br
Suporte: suporte@campainhadigital.com.br

CAMPAINHA DIGITAL INOVA SIMPLES (I.S.)
CNPJ: 65.628.833/0001-47`;

    await this.simulateWhatsAppApiCall(user.whatsapp, message);
    this.logSend('Welcome', user.whatsapp, 'delivered');
  }

  /**
   * Envia contrato e mensagem de ativação de plano
   */
  static async sendContractMessage(user, planType, contractUrl) {
    if (!user.whatsapp) return;

    const planName = planType === 'trial' ? 'Teste Grátis (15 dias)' : 'Assinatura Anual Premium';
    const message = `Olá ${user.name}, seu plano **${planName}** foi ativado! 🎉
    
Enviamos em anexo o seu contrato de prestação de serviços.
Você já pode acessar seu painel e utilizar todos os recursos.

Link de acesso: https://app.campainhadigital.com.br
Link do seu contrato: ${contractUrl}

CAMPAINHA DIGITAL INOVA SIMPLES (I.S.)
CNPJ: 65.628.833/0001-47`;

    await this.simulateWhatsAppApiCall(user.whatsapp, message, contractUrl);
    this.logSend('Contract', user.whatsapp, 'delivered', contractUrl);
  }

  static async simulateWhatsAppApiCall(phone, text, attachment = null) {
    // Simulação de chamada de API (Evolution API ou Meta Cloud API)
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[WhatsApp API] Mensagem enviada para ${phone}: ${text.substring(0, 30)}...`);
        resolve({ success: true, messageId: uuidv4(), timestamp: new Date().toISOString() });
      }, 500);
    });
  }

  static logSend(type, phone, status, attachment = null) {
    const logEntry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      type,
      phone,
      status,
      attachment
    };
    
    const logPath = path.join(logsDir, 'whatsapp-logs.json');
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    logs.push(logEntry);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }
}

module.exports = WhatsAppService;
