import type { CellValue } from '@sheetflow/shared';

interface SheetCell {
  id: string;
  raw: string;
  value: CellValue;
  error: string | null;
}

interface SheetRow {
  id: string;
  cells: Record<string, SheetCell>;
  isNew?: boolean;
}

export interface CellCoord {
  col: string; // "A", "B", etc.
  row: number; // 1, 2, etc. (1-indexed)
}

/**
 * Converts a column letter (e.g. "A", "AB") to 0-based column index.
 */
export function letterToColIndex(letter: string): number {
  let col = 0;
  const upper = letter.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    col = col * 26 + (upper.charCodeAt(i) - 64);
  }
  return col - 1; // 0-indexed
}

/**
 * Parses a string to a number, handling commas and other formatting.
 */
export function parseNumericValue(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return 0;
  const sanitized = val.replace(/,/g, '').trim();
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parses cell coordinates to col/row
 */
export function parseCellRef(ref: string): CellCoord | null {
  const match = ref.match(/^([A-Z]+)([0-9]+)$/i);
  if (!match) return null;
  return {
    col: match[1].toUpperCase(),
    row: parseInt(match[2], 10),
  };
}

/**
 * Extract dependencies for a cell formula.
 */
export function extractFormulaRefs(formula: string, colKeys: string[], rowIndex: number): string[] {
  if (!formula.startsWith('=')) return [];
  const expr = formula.substring(1);
  const refs = new Set<string>();

  // 1. Find coordinate ranges e.g. A1:B3
  const rangeRegex = /\b([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)\b/gi;
  let match;
  while ((match = rangeRegex.exec(expr)) !== null) {
    const colStart = match[1];
    const rowStart = parseInt(match[2], 10) - 1;
    const colEnd = match[3];
    const rowEnd = parseInt(match[4], 10) - 1;

    const colIndexStart = letterToColIndex(colStart);
    const colIndexEnd = letterToColIndex(colEnd);

    for (let c = Math.min(colIndexStart, colIndexEnd); c <= Math.max(colIndexStart, colIndexEnd); c++) {
      const colKey = colKeys[c];
      if (colKey) {
        for (let r = Math.min(rowStart, rowEnd); r <= Math.max(rowStart, rowEnd); r++) {
          refs.add(`${colKey}-${r}`);
        }
      }
    }
  }

  // 2. Find single coordinate references e.g. A1
  const coordRegex = /\b([A-Z]+)([0-9]+)\b/gi;
  while ((match = coordRegex.exec(expr)) !== null) {
    const colLetter = match[1];
    const rIdx = parseInt(match[2], 10) - 1;
    const colIdx = letterToColIndex(colLetter);
    const colKey = colKeys[colIdx];
    if (colKey) {
      refs.add(`${colKey}-${rIdx}`);
    }
  }

  // 3. Find column variables of the same row e.g. price, quantity
  const wordRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  while ((match = wordRegex.exec(expr)) !== null) {
    const word = match[0];
    const upperWord = word.toUpperCase();
    if (upperWord === 'SUM' || upperWord === 'AVERAGE' || upperWord === 'COUNT') continue;

    if (colKeys.includes(word)) {
      refs.add(`${word}-${rowIndex}`);
    }
  }

  return Array.from(refs);
}

/**
 * Evaluate a formula in its context
 */
export function evaluateFormula(
  formula: string,
  rowData: Record<string, unknown>,
  context?: {
    values: Record<string, unknown>;
    colKeys: string[];
    rowCount: number;
  },
): { value: CellValue; error: string | null } {
  if (!formula.startsWith('=')) {
    return { value: formula, error: null };
  }

  const expr = formula.substring(1).trim();

  // 1. Check for standard aggregations
  const sumMatch = expr.match(/^SUM\(([^)]+)\)$/i);
  if (sumMatch && context) {
    const arg = sumMatch[1].trim();
    return evaluateSum(arg, context.values, context.colKeys, context.rowCount);
  }

  const avgMatch = expr.match(/^AVERAGE\(([^)]+)\)$/i);
  if (avgMatch && context) {
    const arg = avgMatch[1].trim();
    return evaluateAverage(arg, context.values, context.colKeys, context.rowCount);
  }

  // 2. Row-level calculation and Single cell references
  try {
    let resolvedExpr = expr;

    // Resolve coordinate references e.g. A1, B2
    if (context) {
      resolvedExpr = resolvedExpr.replace(/\b([A-Z]+)([0-9]+)\b/gi, (_match, colLetter, rowNumStr) => {
        const colIdx = letterToColIndex(colLetter);
        const rIdx = parseInt(rowNumStr, 10) - 1;
        const colKey = context.colKeys[colIdx];
        if (colKey) {
          const val = context.values[`${colKey}-${rIdx}`];
          return String(parseNumericValue(val));
        }
        return '0';
      });
    }

    // Resolve same-row variables e.g. price, quantity
    const keys = Object.keys(rowData).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      const val = rowData[key];
      const numericVal = parseNumericValue(val);
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      resolvedExpr = resolvedExpr.replace(regex, String(numericVal));
    }

    // Safety check
    if (!/^[0-9+\-*/().\s]+$/.test(resolvedExpr)) {
      return { value: null, error: 'Invalid Characters' };
    }

    const result = safeEval(resolvedExpr);

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return { value: Math.round(result * 100) / 100, error: null };
    }
    return { value: result ?? null, error: null };
  } catch {
    return { value: null, error: 'Calc Error' };
  }
}

/**
 * Safe arithmetic expression evaluator using recursive descent parser.
 * Supports +, -, *, /, parentheses, and decimal numbers.
 */
function safeEval(expr: string): number | null {
  let pos = 0;
  const input = expr.trim();

  function peek(): string {
    while (pos < input.length && input[pos] === ' ') pos++;
    return pos < input.length ? input[pos] : '\0';
  }

  function consume(): string {
    const ch = peek();
    if (ch !== '\0') pos++;
    return ch;
  }

  function parseNumber(): number {
    let numStr = '';
    while (pos < input.length && /[0-9.]/.test(input[pos])) {
      numStr += input[pos];
      pos++;
    }
    if (numStr === '') return 0;
    return parseFloat(numStr);
  }

  function parseFactor(): number {
    const ch = peek();
    if (ch === '(') {
      consume();
      const val = parseExpression();
      consume();
      return val;
    }
    if (ch === '-') {
      consume();
      return -parseFactor();
    }
    if (ch === '+') {
      consume();
      return parseFactor();
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (true) {
      const ch = peek();
      if (ch === '*') {
        consume();
        left *= parseFactor();
      } else if (ch === '/') {
        consume();
        const right = parseFactor();
        if (right === 0) throw new Error('Division par zéro');
        left /= right;
      } else break;
    }
    return left;
  }

  function parseExpression(): number {
    let left = parseTerm();
    while (true) {
      const ch = peek();
      if (ch === '+') {
        consume();
        left += parseTerm();
      } else if (ch === '-') {
        consume();
        left -= parseTerm();
      } else break;
    }
    return left;
  }

  try {
    const result = parseExpression();
    if (peek() !== '\0') return null;
    return result;
  } catch {
    return null;
  }
}

function evaluateSum(
  arg: string,
  values: Record<string, unknown>,
  colKeys: string[],
  rowCount: number,
): { value: CellValue; error: string | null } {
  // Check coordinate range e.g. A1:B3
  const rangeMatch = arg.match(/^([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)$/i);
  if (rangeMatch) {
    const colStart = rangeMatch[1];
    const rowStart = parseInt(rangeMatch[2], 10) - 1;
    const colEnd = rangeMatch[3];
    const rowEnd = parseInt(rangeMatch[4], 10) - 1;

    let total = 0;
    const colIndexStart = letterToColIndex(colStart);
    const colIndexEnd = letterToColIndex(colEnd);

    for (let c = Math.min(colIndexStart, colIndexEnd); c <= Math.max(colIndexStart, colIndexEnd); c++) {
      const colKey = colKeys[c];
      if (!colKey) continue;
      for (let r = Math.min(rowStart, rowEnd); r <= Math.max(rowStart, rowEnd); r++) {
        const val = parseNumericValue(values[`${colKey}-${r}`]);
        total += val;
      }
    }
    return { value: total, error: null };
  }

  // Column name sum e.g. SUM(price)
  if (colKeys.includes(arg)) {
    let total = 0;
    for (let r = 0; r < rowCount; r++) {
      const val = parseNumericValue(values[`${arg}-${r}`]);
      total += val;
    }
    return { value: total, error: null };
  }

  return { value: null, error: 'Unknown Field' };
}

function evaluateAverage(
  arg: string,
  values: Record<string, unknown>,
  colKeys: string[],
  rowCount: number,
): { value: CellValue; error: string | null } {
  const rangeMatch = arg.match(/^([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)$/i);
  if (rangeMatch) {
    const colStart = rangeMatch[1];
    const rowStart = parseInt(rangeMatch[2], 10) - 1;
    const colEnd = rangeMatch[3];
    const rowEnd = parseInt(rangeMatch[4], 10) - 1;

    let total = 0;
    let count = 0;
    const colIndexStart = letterToColIndex(colStart);
    const colIndexEnd = letterToColIndex(colEnd);

    for (let c = Math.min(colIndexStart, colIndexEnd); c <= Math.max(colIndexStart, colIndexEnd); c++) {
      const colKey = colKeys[c];
      if (!colKey) continue;
      for (let r = Math.min(rowStart, rowEnd); r <= Math.max(rowStart, rowEnd); r++) {
        const val = parseNumericValue(values[`${colKey}-${r}`]);
        total += val;
        count++;
      }
    }
    return { value: count > 0 ? total / count : 0, error: count > 0 ? null : 'DIV/0' };
  }

  if (colKeys.includes(arg)) {
    let total = 0;
    let count = 0;
    for (let r = 0; r < rowCount; r++) {
      const val = parseNumericValue(values[`${arg}-${r}`]);
      total += val;
      count++;
    }
    return { value: count > 0 ? total / count : 0, error: count > 0 ? null : 'DIV/0' };
  }

  return { value: null, error: 'Unknown Field' };
}

/**
 * Topologically recalculates all formula cells across the entire sheet
 */
export function recalculateSheet(columns: { id: string; name: string }[], rows: SheetRow[]): SheetRow[] {
  const colKeys = columns.map((c) => c.id);

  // 1. Build formulas map and static values map
  const formulas: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const errors: Record<string, string | null> = {};

  rows.forEach((row, rIdx) => {
    colKeys.forEach((colId) => {
      const cellKey = `${colId}-${rIdx}`;
      const cell = row.cells[colId];
      if (cell) {
        const rawStr = cell.raw !== null && cell.raw !== undefined ? String(cell.raw) : '';
        if (rawStr.startsWith('=')) {
          formulas[cellKey] = rawStr;
        } else {
          const rawTrimmed = rawStr.trim();
          const num = parseNumericValue(rawTrimmed);
          // If it looks like a number (after stripping commas), use the numeric value
          const isNumeric = /^-?[\d,]+(\.\d+)?$/.test(rawTrimmed);
          values[cellKey] = isNumeric ? num : cell.raw || null;
        }
        errors[cellKey] = null;
      }
    });
  });

  // 2. Build Dependency Graph
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const allNodes = new Set<string>();

  rows.forEach((_, rIdx) => {
    colKeys.forEach((colId) => {
      const cellKey = `${colId}-${rIdx}`;
      adj[cellKey] = [];
      inDegree[cellKey] = 0;
      allNodes.add(cellKey);
    });
  });

  Object.keys(formulas).forEach((cellKey) => {
    const sep = cellKey.lastIndexOf('-');
    if (sep === -1) return;
    const rIdxStr = cellKey.slice(sep + 1);
    const rIdx = parseInt(rIdxStr, 10);
    if (isNaN(rIdx)) return;
    const formula = formulas[cellKey];
    const deps = extractFormulaRefs(formula, colKeys, rIdx);

    deps.forEach((dep) => {
      if (allNodes.has(dep)) {
        adj[dep].push(cellKey);
        inDegree[cellKey] = (inDegree[cellKey] || 0) + 1;
      }
    });
  });

  // 3. Topological Sort (Kahn's Algorithm)
  const queue: string[] = [];
  allNodes.forEach((node) => {
    if ((inDegree[node] || 0) === 0) {
      queue.push(node);
    }
  });

  const order: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    order.push(u);
    (adj[u] || []).forEach((v) => {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        queue.push(v);
      }
    });
  }

  // Detect circular references
  const orderedSet = new Set(order);
  allNodes.forEach((node) => {
    if (!orderedSet.has(node)) {
      errors[node] = 'Circular Ref';
      values[node] = null;
    }
  });

  // 4. Evaluate in topological order
  order.forEach((cellKey) => {
    if (!formulas[cellKey]) return; // Static cell

    const sep = cellKey.lastIndexOf('-');
    const rIdx = sep === -1 ? NaN : parseInt(cellKey.slice(sep + 1), 10);
    const formula = formulas[cellKey];

    // Build same-row values context
    const rowData: Record<string, unknown> = {};
    colKeys.forEach((key) => {
      rowData[key] = values[`${key}-${rIdx}`] ?? null;
    });

    const res = evaluateFormula(formula, rowData, {
      values,
      colKeys,
      rowCount: rows.length,
    });
    values[cellKey] = res.value;
    errors[cellKey] = res.error || errors[cellKey];
  });

  // 5. Map values back to rows
  return rows.map((row, rIdx) => {
    const newCells = { ...row.cells };
    colKeys.forEach((colId) => {
      const cellKey = `${colId}-${rIdx}`;
      if (newCells[colId]) {
        newCells[colId] = {
          ...newCells[colId],
          value: (values[cellKey] ?? null) as CellValue,
          error: errors[cellKey] ?? null,
        };
      }
    });
    return {
      ...row,
      cells: newCells,
    };
  });
}
