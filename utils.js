/**
 * Convierte un número de serie de fecha de Excel a un objeto Date de JavaScript.
 * @param {number} serial El número de serie de Excel.
 * @returns {Date} Un objeto Date de JavaScript.
 */
export const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
};

/**
 * Función auxiliar para normalizar importes a número decimal.
 * @param {string|number} amount El valor del importe.
 * @returns {number} El importe como número decimal.
 */
export const parseAmount = (amount) => {
    if (typeof amount !== 'string') return amount;
    const hasNegativeSign = amount.startsWith('-');
    let cleaned = amount.replace(/[^\d,]/g, '');
    cleaned = cleaned.replace(',', '.');
    return parseFloat(hasNegativeSign ? '-' + cleaned : cleaned) || 0;
};

/**
 * Función auxiliar para formatear fechas de dd/mm/aa a dd/mm/aaaa.
 * @param {string} dateStr La cadena de fecha.
 * @returns {string} La fecha formateada.
 */
export const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        let [day, month, year] = parts;
        if (year.length === 2) {
            year = parseInt(year, 10) < 50 ? '20' + year : '19' + year;
        }
        return `${day}/${month}/${year}`;
    }
    return dateStr;
};

/**
 * Función auxiliar para limpiar comas de una cadena.
 * @param {string} label La cadena a limpiar.
 * @returns {string} La cadena sin comas.
 */
export const cleanLabel = (label) => {
    if (typeof label === 'string') {
        return label.replace(/,/g, '');
    }
    return label;
};

/**
 * Convierte un array de arrays a un archivo CSV y lo descarga.
 * @param {Array<Array<any>>} data Los datos a exportar.
 * @param {string} filename El nombre del archivo CSV.
 */
export function exportToCsv(data, filename) {
    const csvContent = data.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}