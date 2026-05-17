const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Ensures contracts directory exists
const contractsDir = path.join(__dirname, '../contracts');
if (!fs.existsSync(contractsDir)) {
  fs.mkdirSync(contractsDir);
}

class PdfService {
  static async generateContract(user, planType) {
    return new Promise((resolve, reject) => {
      try {
        const contractId = uuidv4();
        const hash = crypto.createHash('sha256').update(`${contractId}-${user.email}-${Date.now()}`).digest('hex');
        const filename = `contrato-${contractId}.pdf`;
        const filepath = path.join(contractsDir, filename);
        
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('CAMPAINHA DIGITAL INOVA SIMPLES (I.S.)', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('CNPJ: 65.628.833/0001-47', { align: 'center' });
        doc.moveDown();

        const title = planType === 'trial' ? 'Contrato de Prestação de Serviço de Cortesia' : 'Contrato de Prestação de Serviço Premium';
        doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.moveDown(2);

        // Body
        doc.fontSize(12).font('Helvetica');
        doc.text(`CONTRATANTE: ${user.name}`);
        doc.text(`E-MAIL: ${user.email}`);
        if (user.whatsapp) doc.text(`WHATSAPP: ${user.whatsapp}`);
        doc.moveDown();

        doc.text('CONTRATADA: CAMPAINHA DIGITAL INOVA SIMPLES (I.S.), inscrita no CNPJ sob o nº 65.628.833/0001-47.');
        doc.moveDown();

        if (planType === 'trial') {
          doc.text('CLÁUSULA PRIMEIRA - DO OBJETO: O presente contrato tem como objeto a licença de uso temporário da plataforma em caráter de teste grátis (cortesia) pelo prazo de 15 dias.');
          doc.moveDown();
          doc.text('CLÁUSULA SEGUNDA - DA POLÍTICA DE USO: O uso da plataforma é estritamente para os fins previstos, respeitando a LGPD e privacidade de terceiros. A cortesia será encerrada automaticamente após 15 dias.');
          // Added summarized clauses for trial
        } else {
          doc.text('CLÁUSULA PRIMEIRA - DO OBJETO: O presente contrato tem como objeto a licença de uso da plataforma na modalidade Premium (Assinatura Anual).');
          doc.moveDown();
          doc.text('CLÁUSULA SEGUNDA - DOS DIREITOS E DEVERES: A Contratada se compromete com a disponibilidade do sistema e SLA aplicável. A Contratante deve manter a adimplência sob pena de bloqueio do serviço.');
        }

        doc.moveDown(5);
        
        // Footer & Validation
        doc.fontSize(10).text(`Data da geração: ${new Date().toLocaleString('pt-BR')}`);
        doc.text(`Hash de Autenticidade: ${hash}`);
        doc.text(`ID do Contrato: ${contractId}`);

        doc.on('pageAdded', () => {
          doc.fontSize(9).text('CAMPAINHA DIGITAL INOVA SIMPLES (I.S.) - CNPJ: 65.628.833/0001-47', 50, doc.page.height - 50, { align: 'center' });
        });

        doc.end();

        writeStream.on('finish', () => {
          resolve({
            contractId,
            hash,
            filename,
            filepath,
            url: `/contracts/${filename}`
          });
        });
        
        writeStream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PdfService;
