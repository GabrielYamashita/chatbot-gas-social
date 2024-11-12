
// Importando Seetings
const config = require("./config");

// Importando Funções de Ajuda
const { setupGoogleSheetTemplate, appendToGoogleSheet, clearGoogleSheet, backupGoogleSheetToExcel } = require("./utils/GoogleSheetsUtils")

// Importando Biblioteca do Google, para o Google Sheet
const { google } = require('googleapis');
const sheets = google.sheets('v4');
let auth;

// Importando Bibliotecas para o Bot do Whatsapp
const { Client, LocalAuth  } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Criando o Cliente de Uso do Bot
const client = new Client({
    authStrategy: new LocalAuth()
});

// Ativação do Bot
client.on('ready', async () => {
    // Inicializando o Whatsapp Bot
    console.log('[Server] Client is Ready!');
    
    // Inicializando Google Sheets Handler
    const credentials = config.credentials
    auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );
    console.log('[Server] Google Sheets Ready!');

    // Fazendo Backup da planilha antes de iniciar o código
    await backupGoogleSheetToExcel(sheets, auth, config.spreadsheetId, config.sheetName)
        .then(() => console.log("[Workbook] Backup created successfully."))
        .catch(error => console.error(`[Workbook Error] Error creating backup: ${error}`));

    // Limpando Planilha Antiga
    await clearGoogleSheet(sheets, auth, config.spreadsheetId, config.sheetName)  
    
    // Criando Header do Google Sheets
    const questions = config.perguntas.slice(1, config.perguntas.length -1)
    await setupGoogleSheetTemplate(sheets, auth, config.spreadsheetId, config.sheetName, questions)
});

// Retornando QR code para Autenticação do Whatsapp
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// PROVISÓRIO:
let availableUsers = [
    // "11991982436", // Eu
    // "11996081414", // Adriana

    "11995919400", // Rego
    // "34992811301", // Math
    "11999726941", // Ma Meyer

    // "12988478709", // Rod
    // "11969113993", // Nadal
    "11996561627", // Vivs
    // "11989341100",  // Mila
];

let userSessions = {};   // Definindo as Seções dos Usuários
let answerSessions = {}; // Definindo as Respostas dos Usuários

// Endpoint de Mensagens de Perguntas e Respostas
client.on('message', async (msg) => { // message, outras pessoas | message_create, eu mesmo
    const userId = msg.from;
    // const userId = msg.author;
    
    if (availableUsers.some(user => userId.includes(user))) {
        const incomingMsg = msg.body;

        if (userSessions[userId] == config.perguntas.length-2) { // Mensagem Final
            answerSessions[userId][config.perguntas[userSessions[userId]]] = incomingMsg;
            console.log(answerSessions)
            appendToGoogleSheet(answerSessions, sheets, auth, config.spreadsheetId, config.sheetName)
            delete userSessions[userId];
            // delete answerSessions[userId];

            await client.sendMessage(userId, config.perguntas[config.perguntas.length-1]);
        } else if (userId in userSessions) { // Demais Mensagens
            answerSessions[userId][config.perguntas[userSessions[userId]]] = incomingMsg;
            userSessions[userId] += 1;

            await client.sendMessage(userId, config.perguntas[userSessions[userId]]);
        } else if (userSessions[userId] == 0 || !(userId in userSessions)) { // Primeira Mensagem  
            delete answerSessions[userId];
            answerSessions[userId] = {};
            userSessions[userId] = 1;

            await client.sendMessage(userId, config.perguntas[0]);
            await client.sendMessage(userId, config.perguntas[1]);
        }
        
        // console.log(userSessions);
        // console.log(answerSessions);
    }
});

// Inicializando o Cliente
client.initialize();