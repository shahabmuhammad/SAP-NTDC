import ExcelJS from "exceljs";
import { EQUIPMENT_GROUPS, STATUS_ROWS } from "./sap-data";

export interface HeaderInfo {
  stationName: string;
  date: string; // yyyy-mm-dd (native <input type="date"> value)
  shift: "Morning" | "Evening" | "Night";
  time: string; // HH:mm, stepped by 30 minutes
  employeeName: string;
  employeeId: string;
  version: string;
}

/** Map of measuring point (as string) -> resolved export value. */
export type MpValues = Record<string, string>;

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF808080" } },
  left: { style: "thin", color: { argb: "FF808080" } },
  bottom: { style: "thin", color: { argb: "FF808080" } },
  right: { style: "thin", color: { argb: "FF808080" } },
};

function formatDateDMY(dateStr: string, sep: "-" | "."): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}${sep}${m}${sep}${y}`;
}

function formatTimeHMS(time: string): string {
  if (!time) return "";
  return `${time}:00`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function tryLoadLogo(): Promise<{ base64: string; extension: "png" | "jpeg" } | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo.png`);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size === 0) return null;
    const buffer = await blob.arrayBuffer();
    return { base64: arrayBufferToBase64(buffer), extension: "png" };
  } catch {
    return null;
  }
}

export async function generateShiftLogWorkbook(header: HeaderInfo, mpValues: MpValues): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(header.stationName || "Shift Log", {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  const COLS = 10;
  sheet.columns = [
    { width: 38 }, // Equipment Description
    { width: 12 }, // Units of Measure
    { width: 26 }, // Measuing point Description
    { width: 16 }, // Measuring Point
    { width: 10 }, // Values
    { width: 12 }, // Date
    { width: 10 }, // Time
    { width: 14 }, // Valuation code
    { width: 42 }, // Text
    { width: 12 }, // Remarks
  ];

  // ---- Header block ----
  sheet.mergeCells(1, 1, 5, 2); // logo placeholder A1:B5
  const logoCell = sheet.getCell(1, 1);
  logoCell.alignment = { vertical: "middle", horizontal: "center" };
  logoCell.border = THIN_BORDER;

  const logo = await tryLoadLogo();
  if (logo) {
    const imageId = workbook.addImage({ base64: logo.base64, extension: logo.extension });
    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      br: { col: 2, row: 5 },
    } as ExcelJS.ImageRange);
  } else {
    logoCell.value = "LOGO";
    logoCell.font = { italic: true, color: { argb: "FFAAAAAA" } };
  }

  sheet.mergeCells(1, 3, 1, 5);
  const titleCell = sheet.getCell(1, 3);
  titleCell.value = header.stationName;
  titleCell.font = { bold: true, size: 16 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6E0B4" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  for (let c = 3; c <= 5; c++) sheet.getCell(1, c).border = THIN_BORDER;

  const labelValue = (
    row: number,
    labelCol: number,
    label: string,
    valueCol: number,
    value: string,
    highlight = true
  ) => {
    const l = sheet.getCell(row, labelCol);
    l.value = label;
    l.font = { bold: true };
    l.border = THIN_BORDER;

    const v = sheet.getCell(row, valueCol);
    v.value = value;
    v.border = THIN_BORDER;
    if (highlight) v.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
  };

  labelValue(2, 3, "Date:", 4, formatDateDMY(header.date, "-"));
  labelValue(2, 6, "Shift:", 7, header.shift);
  labelValue(3, 3, "Time:", 4, formatTimeHMS(header.time));
  labelValue(3, 6, "Version:", 7, header.version);
  labelValue(4, 3, "Employee No:", 4, `${header.employeeName}_${header.employeeId}`);

  // ---- Column header row ----
  const headerRowIndex = 6;
  const headers = [
    "Equipment Description",
    "Units of Measure",
    "Measuing point Description",
    "Measuring Point",
    "Values",
    "Date",
    "Time",
    "Valuation code",
    "Text",
    "Remarks",
  ];
  const headerRow = sheet.getRow(headerRowIndex);
  headers.forEach((text, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = text;
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4B183" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 30;

  // ---- Data rows ----
  const rowDate = formatDateDMY(header.date, ".");
  const rowTime = formatTimeHMS(header.time);
  const text = `${header.employeeName}_${header.employeeId}_${header.shift}_`;

  let r = headerRowIndex + 1;
  const writeDataRow = (
    equipment: string,
    unit: string,
    mpDescription: string,
    mp: string,
    value: string | number,
    valuationCode: number
  ) => {
    const row = sheet.getRow(r);
    const cells = [equipment, unit, mpDescription, mp, value, rowDate, rowTime, valuationCode, text, ""];
    cells.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: "middle" };
    });
    r++;
  };

  for (const group of EQUIPMENT_GROUPS) {
    for (const dataRow of group.rows) {
      const value = mpValues[dataRow.mp] ?? dataRow.fixedValue ?? "";
      writeDataRow(dataRow.equipment, dataRow.unit, dataRow.mpDescription, dataRow.mp, value, dataRow.valuationCode);
    }
  }

  for (const statusRow of STATUS_ROWS) {
    writeDataRow(
      statusRow.equipment,
      statusRow.unit,
      statusRow.mpDescription,
      statusRow.mp,
      statusRow.fixedValue ?? "",
      statusRow.valuationCode
    );
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
