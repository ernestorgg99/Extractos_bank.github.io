import { cleanLabel, parseAmount, excelDateToJSDate, formatDate } from './utils.js';
export const transformations = {
    // Estructura 1: Exterior Jurídico
"1": (data) => {
    let result = JSON.parse(JSON.stringify(data));

    // Paso 1: eliminar la primera fila.
    result.shift();

    // Paso 2: el signo de la columna 5 (índice 4) utilizarlo como prefijo de la columna 4 (índice 3).
    // Nota: El archivo original puede tener la columna 4 y 5 como una sola, pero la
    // descripción del usuario sugiere que la columna 5 (índice 4) contiene el signo.
    // La descripción original de la transformación fusionaba ambas, esta es una interpretación
    // literal de la nueva solicitud.
    result = result.map(row => {
        const amount = String(row[3] || '');
        const sign = String(row[4] || '');
        if (sign.trim() === '-') {
            row[3] = '-' + amount;
        } else {
            row[3] = amount;
        }
        return row;
    });

    // Paso 3: eliminar las columnas 5 (índice 4) y 6 (índice 5).
    result = result.map(row => {
        row.splice(4, 2);
        return row;
    });

    // Paso 4: transformar la columna 2 (índice 1) y 4 (índice 3).
    result.forEach(row => {
        // Transformar fecha de dd/mm/aa a dd/mm/aaaa
        row[1] = formatDate(row[1]);
        // Transformar importe a número decimal con '.' como delimitador
        row[3] = parseAmount(row[3]);
        // Limpiar la etiqueta
        row[0] = cleanLabel(row[0]);
    });

    // Paso 3 (parte 2): insertar fila con los encabezados.
    const finalHeaders = ['ETIQUETA', 'FECHA', 'REFERENCIA', 'IMPORTE'];
    result.unshift(finalHeaders);

    return result;
},

    // Estructura 2: Exterior Personales
    "2": (data) => {
        let result = JSON.parse(JSON.stringify(data));
        const finalHeaders = ['ETIQUETA', 'FECHA', 'REFERENCIA', 'IMPORTE'];

        // Eliminar columnas y limpiar datos
        result = result.map(row => {
            let newRow = [];
            // Eliminar columnas 1 (índice 0), 3 (índice 2), 7 (índice 6)
            newRow[0] = row[1]; // FECHA
            newRow[1] = row[3]; // ETIQUETA
            newRow[2] = row[5]; // REFERENCIA
            newRow[3] = row[6]; // IMPORTE
            return newRow;
        });

        // Asegurarse de que los encabezados son los esperados
        const headers = ['FECHA', 'ETIQUETA', 'REFERENCIA', 'IMPORTE'];
        if (result[0][0] !== 'Fecha') { // Manejar el caso de que la primera fila no sea el encabezado
            result.unshift(headers);
        }

        // Reordenar columnas y aplicar transformaciones
        result = result.map((row, index) => {
            const oldIndices = {
                ETIQUETA: headers.indexOf('ETIQUETA'),
                FECHA: headers.indexOf('FECHA'),
                REFERENCIA: headers.indexOf('REFERENCIA'),
                IMPORTE: headers.indexOf('IMPORTE')
            };

            const transformedRow = [
                row[oldIndices.ETIQUETA],
                row[oldIndices.FECHA],
                row[oldIndices.REFERENCIA],
                index > 0 ? parseAmount(row[oldIndices.IMPORTE]) : row[oldIndices.IMPORTE]
            ];
            transformedRow[0] = cleanLabel(transformedRow[0]);
            return transformedRow;
        });

        result[0] = finalHeaders;
        return result;
    },

    // Estructura 3: Venezuela
    "3": (data) => {
        let result = JSON.parse(JSON.stringify(data));
        const finalHeaders = ['ETIQUETA', 'FECHA', 'REFERENCIA', 'IMPORTE'];
        let headers = result[0].map(h => {
            if (typeof h === 'string') {
                if (h.toLowerCase() === 'monto') return 'IMPORTE';
                if (h.toLowerCase() === 'concepto') return 'ETIQUETA';
                return h.toUpperCase();
            }
            return h;
        });
        result[0] = headers;

        // Eliminar columnas específicas
        result = result.map(row => {
            row.splice(7, 2); // Eliminar columnas 8 y 9
            row.splice(5, 1); // Eliminar columna 6
            row.splice(3, 1); // Eliminar columna 4
            return row;
        });

        const oldIndices = {
            ETIQUETA: headers.indexOf('ETIQUETA'),
            FECHA: headers.indexOf('FECHA'),
            REFERENCIA: headers.indexOf('REFERENCIA'),
            IMPORTE: headers.indexOf('IMPORTE')
        };
        result = result.map((row, index) => {
            const transformedRow = [
                row[oldIndices.ETIQUETA],
                row[oldIndices.FECHA],
                row[oldIndices.REFERENCIA],
                index > 0 ? parseAmount(row[oldIndices.IMPORTE]) : row[oldIndices.IMPORTE]
            ];
            transformedRow[0] = cleanLabel(transformedRow[0]);
            return transformedRow;
        });

        result[0] = finalHeaders;
        return result;
    },

// Estructura 4: Bancaribe
"4": (data) => {
    // Función de conversión de fecha para números de serie de Excel (aislada)
    const excelSerialToDate = (serial) => {
        if (typeof serial !== 'number' || isNaN(serial)) {
            return null;
        }
        const daysSince1900 = serial - 25569;
        const millisecondsInDay = 24 * 60 * 60 * 1000;
        const correctedDays = serial > 60 ? daysSince1900 - 0 : daysSince1900;
        const date = new Date(correctedDays * millisecondsInDay);
        return date;
    };

    // Función de conversión para el importe (aislada)
    const parseBancaribeAmount = (amount) => {
        if (typeof amount === 'number') {
            return amount;
        }
        let cleaned = String(amount).replace(/\./g, ''); // Elimina los puntos (separadores de miles)
        cleaned = cleaned.replace(',', '.'); // Reemplaza la coma por un punto
        return parseFloat(cleaned) || 0;
    };

    let result = JSON.parse(JSON.stringify(data));
    result.shift();

    const transformedRows = result.map(row => {
        const originalDateSerial = row[0];
        const originalReference = String(row[1] || '');
        const originalLabel = row[2];
        const originalSign = row[3];
        const originalAmount = row[4];

        let finalDate = originalDateSerial;
        if (typeof originalDateSerial === 'number') {
            const dateObj = excelSerialToDate(originalDateSerial);
            if (dateObj) {
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 2).padStart(2, '0');
                const year = dateObj.getFullYear();
                finalDate = `${day}/${month}/${year}`;
            }
        }

        let amountWithSign = originalAmount;
        if (originalSign === 'D') {
            amountWithSign = '-' + originalAmount;
        }

        let finalReference = originalReference;
        if ((originalLabel || '').includes("TDD - ADMINISTRACION")) {
            if (originalReference.length >= 11) {
                finalReference = originalReference.substring(7, 10);
            }
        }

        const finalLabel = cleanLabel(originalLabel);
        const finalAmount = parseBancaribeAmount(amountWithSign);

        return [finalLabel, finalDate, finalReference, finalAmount];
    });

    transformedRows.unshift(['ETIQUETA', 'FECHA', 'REFERENCIA', 'IMPORTE']);
    return transformedRows;
},
    // Estructura 5: Banesco
"5": (data) => {
    let result = JSON.parse(JSON.stringify(data));
    let headers = result[0].map(h => {
        if (typeof h === 'string') {
            if (h.toLowerCase() === 'monto') return 'IMPORTE';
            if (h.toLowerCase().includes('descripci')) return 'ETIQUETA';
            return h.toUpperCase();
        }
        return h;
    });
    result[0] = headers;

    // Eliminar columna 5 (índice 4)
    result = result.map(row => {
        row.splice(4, 1);
        return row;
    });

    const finalHeaders = ['ETIQUETA', 'FECHA', 'REFERENCIA', 'IMPORTE'];
    const headerRow = result[0];
    const oldIndices = {
        ETIQUETA: headerRow.indexOf('ETIQUETA'),
        FECHA: headerRow.indexOf('FECHA'),
        REFERENCIA: headerRow.indexOf('REFERENCIA'),
        IMPORTE: headerRow.indexOf('IMPORTE')
    };
    
    // Función auxiliar para transformar el formato de fecha de Banesco
    const formatDateBanesco = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return dateStr;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
        }
        return dateStr;
    };

    result = result.map((row, index) => {
        const transformedRow = [
            cleanLabel(row[oldIndices.ETIQUETA]),
            // Aplicar la nueva función de formato de fecha
            index > 0 ? formatDateBanesco(row[oldIndices.FECHA]) : row[oldIndices.FECHA],
            row[oldIndices.REFERENCIA],
            index > 0 ? parseAmount(row[oldIndices.IMPORTE]) : row[oldIndices.IMPORTE]
        ];
        return transformedRow;
    });

    result[0] = finalHeaders;
    return result;
}}