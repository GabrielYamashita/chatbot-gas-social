
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { google } = require('googleapis');

// functions.js
async function backupGoogleSheetToExcel(sheets, auth, spreadsheetId, sheetName) {
    await auth.authorize();

    // Puxando dados da Planilha do Google Sheet
    const res = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: sheetName,
    });
    const rows = res.data.values;

    if (!rows || rows.length <= 1) {
        console.log("[Workbook] No data found in the sheet beyond headers. Skipping backup.");
        return;
    }

    // Criando Novo Arquivo de Excel
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Salvando Arquivo com Data e Horário Atual
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.-]/g, '_').slice(0, 19);  // Format: YYYY_MM_DDTHH_MM_SS

    const fileName = `${sheetName}_backup_${timestamp}.xlsx`;
    const filePath = path.join(__dirname, '..', 'src', 'backup', fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Escrevendo Excel
    xlsx.writeFile(workbook, filePath);
    console.log(`[Workbook] Backup saved successfully at ${filePath}`);
}



async function clearGoogleSheet(sheets, auth, spreadsheetId, sheetName) {
    await auth.authorize();

    await sheets.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range: sheetName,  // Specify only the sheet name to clear the entire sheet
    });

    console.log(`[Workbook] All data cleared from sheet: ${sheetName}`);
}



async function setupGoogleSheetTemplate(sheets, auth, spreadsheetId, sheetName, questions) {
    const headers = ["Cellphone", ...questions];

    await auth.authorize();

    await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [headers],
        },
    });

    console.log(`[Workbook] Template headers have been created in ${sheetName}.`);
}



async function appendToGoogleSheet(answers, sheets, auth, spreadsheetId, sheetName) {
    await auth.authorize();

    const headerRes = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: `${sheetName}!A1:Z1`  // Adjust range if you have more columns
    });

    const headers = headerRes.data.values[0];  // Assuming the first row contains headers

    // Step 2: Map each answer entry to a row
    const rows = Object.entries(answers).map(([numberId, userData]) => {
        const row = [numberId];
        headers.slice(1).forEach(header => {  // Skip the first header "Cellphone"
            row.push(userData[header] || "No answer");  // Insert answer or empty if no match
        });

        return row;
    });

    // Step 3: Append data to the next empty row
    await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: sheetName,  // Just the sheet name to append at the next empty row
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: rows,
        },
    });

    console.log("[Workbook] Data appended to Google Sheets successfully.");
}



// Call setup function with your questions array to set up the template headers
if (require.main == module) {
    const config = require('./config')

    // Initializing Google Settings
    const { google } = require('googleapis');
    const sheets = google.sheets('v4');

    const credentials = config.credentials; // Path to your downloaded Google credentials file
    const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );

    
    numbersOfHeaders = config.perguntas.slice(1, config.perguntas.length-1)
    setupGoogleSheetTemplate(sheets, auth, config.spreadsheetId, config.sheetName, numbersOfHeaders);

    answers = {
        '5511995919400@c.us': {
            'Qual seu nome?': 'Edu',
            'Qual sua idade?': '12',
            'Em qual cidade você mora?': 'Santos',
            'Qual a sua ocupação?': 'Nada',
            'Que time você torce?': 'Santos'
        }
    }

    appendToGoogleSheet(answers, sheets, auth, config.spreadsheetId, config.sheetName)

} else {
    module.exports = { setupGoogleSheetTemplate, appendToGoogleSheet, clearGoogleSheet, backupGoogleSheetToExcel };
}

