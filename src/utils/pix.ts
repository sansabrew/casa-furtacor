/**
 * Utilitário de Geração de PIX (Padrão Banco Central / EMVCo) e Dados de Contato Oficiais
 * Casa Furtacor — Espaço Cultural & Afetivo
 */

export const CONTATO_CONFIG = {
  whatsappNumero: '+55 (83) 9148-2353',
  whatsappRaw: '558391482353',
  whatsappLink:
    'https://wa.me/558391482353?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Casa%20Furtacor%20e%20gostaria%20de%20informa%C3%A7%C3%B5es.',
  instagramUser: '@casafurtacor',
  instagramUrl: 'https://www.instagram.com/casafurtacor/',
  endereco: 'Av. São Rafael, 376 - Castelo Branco I, João Pessoa - PB',
  cidade: 'João Pessoa - PB',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Av.+S%C3%A3o+Rafael%2C+376+-+Castelo+Branco+I%2C+Jo%C3%A3o+Pessoa+-+PB%2C+Casa+Furtacor',
};

export const PIX_CONFIG = {
  chave: 'ritamvbraga@hotmail.com',
  tipoChave: 'email',
  beneficiario: 'CASA FURTACOR',
  cidade: 'JOAO PESSOA',
  whatsappOficial: '558391482353',
};

// Função para calcular o CRC16 (Polinômio 0x1021) do padrão Pix
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function gerarPayloadPix(valor: number, codigoReferencia: string): string {
  const valorFormatado = valor.toFixed(2);
  const txid = codigoReferencia.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || 'FURTACOR';

  // ID 26: Merchant Account Information
  const gui = emvField('00', 'br.gov.bcb.pix');
  const chavePix = emvField('01', PIX_CONFIG.chave);
  const infoAdicional = emvField('02', `Ingresso ${codigoReferencia}`);
  const merchantAccountInfo = emvField('26', `${gui}${chavePix}${infoAdicional}`);

  // Montagem básica EMVCo
  const payloadFormat = emvField('00', '01');
  const pointOfInitiation = emvField('01', '12'); // 12 = QR dinâmico / estático com valor
  const merchantCategoryCode = emvField('52', '0000');
  const transactionCurrency = emvField('53', '986'); // BRL
  const transactionAmount = emvField('54', valorFormatado);
  const countryCode = emvField('58', 'BR');
  const merchantName = emvField('59', PIX_CONFIG.beneficiario.slice(0, 25));
  const merchantCity = emvField('60', PIX_CONFIG.cidade.slice(0, 15));

  // Additional Data Field (TxID)
  const txIdField = emvField('05', txid);
  const additionalDataField = emvField('62', txIdField);

  const rawPayload = `${payloadFormat}${pointOfInitiation}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalDataField}6304`;
  const checksum = crc16(rawPayload);

  return `${rawPayload}${checksum}`;
}

export async function gerarQrCodeDataUrl(texto: string): Promise<string> {
  try {
    // Carregada sob demanda: só é preciso na hora de gerar um ingresso.
    const { default: QRCode } = await import('qrcode');
    return await QRCode.toDataURL(texto, {
      width: 320,
      margin: 2,
      color: {
        dark: '#2C241E',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err);
    return '';
  }
}

export function formatarDocumento(doc: string): string {
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 11) {
    // CPF
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (cleaned.length >= 7 && cleaned.length <= 10) {
    // RG simples
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
  }
  return doc;
}

export function formatarTelefone(tel: string): string {
  const cleaned = tel.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return tel;
}
