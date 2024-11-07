
const { google } = require('googleapis');

// functions.js
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

    console.log("Template headers have benn created.");
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

    console.log("Data appended to Google Sheets successfully.");
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
    module.exports = { setupGoogleSheetTemplate, appendToGoogleSheet };
}

