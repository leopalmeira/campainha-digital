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
    const cleanPhone = phone.replace(/\D/g, ''); // Remove máscara

    // Se tiver configurado CallMeBot API Key
    const callmeBotKey = process.env.CALLMEBOT_API_KEY;
    if (callmeBotKey) {
      try {
        const axios = require('axios');
        let fullText = text;
        if (attachment) fullText += `\n\nLink do Contrato: ${attachment}`;
        const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(fullText)}&apikey=${callmeBotKey}`;
        await axios.get(url);
        console.log(`[WhatsApp] CallMeBot API - Mensagem enviada com sucesso para ${cleanPhone}`);
        return { success: true };
      } catch (err) {
        console.error(`[WhatsApp] CallMeBot API Erro:`, err.message);
        return { success: false, error: err.message };
      }
    }

    // Se tiver configurado Evolution API
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE || 'campainha';

    if (evolutionUrl && evolutionKey) {
      try {
        const axios = require('axios');
        // Mensagem de Texto
        await axios.post(`${evolutionUrl}/message/sendText/${instanceName}`, {
          number: cleanPhone,
          options: { delay: 1200, presence: "composing" },
          textMessage: { text }
        }, { headers: { 'apikey': evolutionKey } });

        // Se tiver PDF, envia como documento
        if (attachment) {
          await axios.post(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
            number: cleanPhone,
            options: { delay: 1200, presence: "composing" },
            mediaMessage: {
              mediatype: "document",
              caption: "Contrato Campainha Digital",
              media: attachment, // URL do PDF
              fileName: "Contrato_CampainhaDigital.pdf"
            }
          }, { headers: { 'apikey': evolutionKey } });
        }
        console.log(`[WhatsApp] Evolution API - Mensagem enviada para ${cleanPhone}`);
        return { success: true };
      } catch (err) {
        console.error(`[WhatsApp] Evolution API Erro:`, err.message);
        return { success: false, error: err.message };
      }
    }

    // Fallback Simulação se nenhuma API gratuita estiver configurada
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[WhatsApp SIMULADO] Mensagem para ${cleanPhone}: ${text.substring(0, 30)}...`);
        if (attachment) console.log(`[WhatsApp SIMULADO] Anexo: ${attachment}`);
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
