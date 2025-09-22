// Variable global para almacenar los datos del archivo procesado
let appState = {
    workbookData: null,
    currentFileName: ""
};

// Elementos del DOM
const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const fileInfo = document.getElementById('file-info');
const previewTable = document.getElementById('preview-table');
const transformButtons = document.querySelectorAll('.transform-btn');

// --- MANEJO DE EVENTOS DRAG & DROP ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
});

dropArea.addEventListener('drop', handleDrop, false);
fileElem.addEventListener('change', handleFileSelect, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFile(files[0]);
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length) {
        handleFile(files[0]);
    }
}

// --- LÓGICA DE PROCESAMIENTO DE ARCHIVOS ---
function handleFile(file) {
    if (!file) return;

    appState.currentFileName = file.name.split('.').slice(0, -1).join('.');
    fileInfo.textContent = `Archivo cargado: ${file.name}`;

    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop().toLowerCase();

    reader.onload = function(e) {
        let workbook;
        try {
            const data = e.target.result;
            // Configuración para leer sin interpretar datos y evitar pérdidas
            const readOptions = {
                type: 'array',
                cellDates: false, // Desactiva la conversión automática de fechas
                raw: true // Mantiene los valores crudos, sin interpretación
            };
            if (fileExtension === 'csv') {
                // Para CSV, se necesita el codepage UTF-8 para evitar caracteres extraños
                readOptions.type = 'string';
                readOptions.codepage = 65001;
            } else {
                readOptions.type = 'array';
            }

            workbook = XLSX.read(data, readOptions);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convertir a JSON, manteniendo los valores como están
            // Usamos { header: 1, raw: false, defval: "" } para obtener un array de arrays
            // y mantener los valores como cadenas de texto, y rellenar celdas vacías con ""
            appState.workbookData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" });
            
            displayPreview(appState.workbookData);
        } catch (error) {
            alert(`Hubo un problema al procesar el archivo. Asegúrate de que el formato sea correcto y que no esté dañado. Error: ${error.message}`);
            console.error("Error al procesar el archivo:", error);
        }
    };

    if (fileExtension === 'csv') {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
}

/**
 * Muestra los datos del archivo en una tabla HTML.
 * Se asegura de que todos los valores se muestren tal como se leen.
 * @param {Array<Array<any>>} data Array de filas para mostrar.
 */
function displayPreview(data) {
    previewTable.innerHTML = '';
    if (!data || data.length === 0) return;

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const previewData = data.slice(0, 200);

    previewData.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const cellElement = document.createElement(rowIndex === 0 ? 'th' : 'td');
            // Usar String(cell) para asegurar que todo se muestre como texto
            cellElement.textContent = String(cell);
            tr.appendChild(cellElement);
        });
        if (rowIndex === 0) {
            thead.appendChild(tr);
        } else {
            tbody.appendChild(tr);
        }
    });

    previewTable.appendChild(thead);
    previewTable.appendChild(tbody);
}

// --- LÓGICA DE EXPORTACIÓN Y ASIGNACIÓN DE EVENTOS ---
import { transformations } from './transformations.js';
import { exportToCsv } from './utils.js';

transformButtons.forEach(button => {
    button.addEventListener('click', async () => {
        if (!appState.workbookData) {
            alert("Por favor, carga un archivo primero.");
            return;
        }
        const structure = button.dataset.structure;
        if (transformations[structure]) {
            try {
                // Se pasa una copia profunda de los datos para no modificar el original en memoria
                const originalDataCopy = JSON.parse(JSON.stringify(appState.workbookData));
                const transformedData = transformations[structure](originalDataCopy);
                exportToCsv(transformedData, `transformado_${appState.currentFileName}.csv`);
            } catch (error) {
                alert(`Hubo un problema al aplicar la transformación. Error: ${error.message}`);
                console.error("Error al transformar los datos:", error);
            }
        }
    });
});