
require("dotenv").config();

module.exports = {
    credentials: JSON.parse(process.env.CREDENTIALS),
    
    spreadsheetId: process.env.SPREADSHEET_ID,
    sheetName: "Respostas",
    perguntas: [
        "Inicio",
        "Qual seu nome?",
        "Qual sua idade?",
        "Em qual cidade você mora?",
        "Final"
    ]
}