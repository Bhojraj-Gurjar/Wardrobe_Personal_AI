import ExcelJS from 'exceljs';
import {
  BULK_IMPORT_COLUMNS,
  BULK_IMPORT_DROPDOWNS,
  BULK_IMPORT_SAMPLE_ROW,
  BULK_IMPORT_TEMPLATE_FILENAME,
  BULK_SAMPLE_ROW_MARKER_SKU,
  getBulkTemplateHeaderLabel,
} from '../constants/bulk-import-fields.constants';

const REQUIRED_HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFDE8E8' },
};

const OPTIONAL_HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
};

const SAMPLE_ROW_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFEFF6FF' },
};

function columnLetter(index) {
  let letter = '';
  let current = index;

  while (current > 0) {
    const mod = (current - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    current = Math.floor((current - 1) / 26);
  }

  return letter;
}

function applyListValidation(worksheet, columnIndex, values, maxRows = 500) {
  if (!values?.length) {
    return;
  }

  const letter = columnLetter(columnIndex);
  const escaped = values.map((value) => String(value).replace(/"/g, '""'));
  const formula = `"${escaped.join(',')}"`;

  for (let row = 2; row <= maxRows; row += 1) {
    worksheet.getCell(`${letter}${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [formula],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Choose a value from the dropdown list.',
    };
  }
}

export async function downloadBulkImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Wardrobe AI';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Products', {
    views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
  });

  const headerRow = worksheet.addRow(
    BULK_IMPORT_COLUMNS.map((column) => getBulkTemplateHeaderLabel(column)),
  );

  headerRow.height = 22;
  headerRow.eachCell((cell, colNumber) => {
    const column = BULK_IMPORT_COLUMNS[colNumber - 1];
    const isRequired = column?.required;

    cell.font = { bold: true, color: { argb: isRequired ? 'FF991B1B' : 'FF374151' } };
    cell.fill = isRequired ? REQUIRED_HEADER_FILL : OPTIONAL_HEADER_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };

    if (column?.tooltip) {
      cell.note = column.tooltip;
    }
  });

  const sampleValues = BULK_IMPORT_COLUMNS.map((column) => BULK_IMPORT_SAMPLE_ROW[column.key] ?? '');
  const sampleRow = worksheet.addRow(sampleValues);
  sampleRow.eachCell((cell) => {
    cell.fill = SAMPLE_ROW_FILL;
    cell.font = { italic: true, color: { argb: 'FF1D4ED8' } };
  });
  sampleRow.getCell(1).note = 'Sample row — delete this row before uploading your products.';

  worksheet.columns = BULK_IMPORT_COLUMNS.map((column) => ({
    width: Math.max(column.header.length + (column.required ? 3 : 0), 16),
  }));

  BULK_IMPORT_COLUMNS.forEach((column, index) => {
    const dropdownKey = column.dropdown;
    if (dropdownKey && BULK_IMPORT_DROPDOWNS[dropdownKey]) {
      applyListValidation(worksheet, index + 1, BULK_IMPORT_DROPDOWNS[dropdownKey]);
    }
  });

  const instructions = workbook.addWorksheet('Instructions');
  instructions.addRow(['Wardrobe AI — Bulk Product Import']);
  instructions.addRow([]);
  instructions.addRow(['Required columns are marked with * and highlighted in light red.']);
  instructions.addRow(['Optional columns use a light gray header.']);
  instructions.addRow(['Delete the blue sample row before uploading.']);
  instructions.addRow([`Sample SKU to remove: ${BULK_SAMPLE_ROW_MARKER_SKU}`]);
  instructions.addRow([]);
  instructions.addRow(['Validation matches the Add Single Product wizard:']);
  instructions.addRow(['• MRP must be numeric and greater than 0']);
  instructions.addRow(['• Selling Price must be ≤ MRP']);
  instructions.addRow(['• Stock Quantity must be a positive integer']);
  instructions.addRow(['• SKU must be unique']);
  instructions.addRow(['• Image 1 URL is required and must be a valid URL']);
  instructions.addRow(['• Color and Sizes must use predefined options']);
  instructions.addRow(['• Sizes can be comma-separated (e.g. S,M,L) for multiple variants']);
  instructions.columns = [{ width: 88 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = BULK_IMPORT_TEMPLATE_FILENAME;
  link.click();
  URL.revokeObjectURL(url);
}
