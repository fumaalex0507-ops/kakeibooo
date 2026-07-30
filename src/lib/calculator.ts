// Small safe arithmetic expression evaluator (+, -, *, /, parentheses) so
// amount fields can double as a calculator (e.g. typing "500+300+120" to add
// up receipt items) without resorting to eval()/Function().

type Token = { type: "num"; value: number } | { type: "op"; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (c === " ") {
      i++;
      continue;
    }
    if ("+-*/()".includes(c)) {
      tokens.push({ type: "op", value: c });
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      const numStr = input.slice(i, j);
      if ((numStr.match(/\./g) ?? []).length > 1) throw new Error("invalid number");
      tokens.push({ type: "num", value: Number(numStr) });
      i = j;
      continue;
    }
    throw new Error(`unexpected character: ${c}`);
  }
  return tokens;
}

function parseExpr(tokens: Token[]): number {
  let value = parseTerm(tokens);
  while (tokens.length && tokens[0].type === "op" && (tokens[0].value === "+" || tokens[0].value === "-")) {
    const op = tokens.shift() as Token & { type: "op" };
    const rhs = parseTerm(tokens);
    value = op.value === "+" ? value + rhs : value - rhs;
  }
  return value;
}

function parseTerm(tokens: Token[]): number {
  let value = parseFactor(tokens);
  while (tokens.length && tokens[0].type === "op" && (tokens[0].value === "*" || tokens[0].value === "/")) {
    const op = tokens.shift() as Token & { type: "op" };
    const rhs = parseFactor(tokens);
    value = op.value === "*" ? value * rhs : value / rhs;
  }
  return value;
}

function parseFactor(tokens: Token[]): number {
  const tok = tokens.shift();
  if (!tok) throw new Error("unexpected end of expression");
  if (tok.type === "num") return tok.value;
  if (tok.value === "(") {
    const value = parseExpr(tokens);
    const close = tokens.shift();
    if (!close || close.value !== ")") throw new Error("expected closing parenthesis");
    return value;
  }
  if (tok.value === "-") return -parseFactor(tokens);
  if (tok.value === "+") return parseFactor(tokens);
  throw new Error(`unexpected token: ${tok.value}`);
}

/**
 * Evaluates a plain number or a basic arithmetic expression (e.g. "500+300",
 * "1200/2", "(500+300)*2"). Returns null if the input isn't a valid
 * expression (blank input evaluates to 0, matching an empty amount field).
 */
export function evaluateExpression(input: string): number | null {
  const cleaned = input.trim();
  if (cleaned === "") return 0;
  if (!/^[0-9+\-*/(). ]+$/.test(cleaned)) return null;

  try {
    const tokens = tokenize(cleaned);
    if (tokens.length === 0) return 0;
    const value = parseExpr(tokens);
    if (tokens.length !== 0) return null; // leftover tokens => malformed input
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
