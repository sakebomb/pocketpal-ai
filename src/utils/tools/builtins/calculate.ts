import type {RegisteredTool} from '../types';

/**
 * Safe math expression evaluator using a hand-rolled recursive descent parser.
 * Does not execute arbitrary code — only supports a fixed set of operators,
 * functions, and constants.
 *
 * Operators: +  -  *  /  %  ^  ()
 * Functions: sqrt, cbrt, abs, floor, ceil, round, log, ln, log2, exp,
 *            sin, cos, tan, asin, acos, atan, sinh, cosh, tanh
 * Constants: pi, e, tau, inf
 */

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: 2 * Math.PI,
  inf: Infinity,
};

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  log: Math.log10,
  ln: Math.log,
  log2: Math.log2,
  exp: Math.exp,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
};

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i++];
      }
      // optional scientific notation
      if (i < expr.length && /[eE]/.test(expr[i])) {
        num += expr[i++];
        if (i < expr.length && /[+-]/.test(expr[i])) {
          num += expr[i++];
        }
        while (i < expr.length && /[0-9]/.test(expr[i])) {
          num += expr[i++];
        }
      }
      tokens.push(num);
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let word = '';
      while (i < expr.length && /[a-zA-Z_0-9]/.test(expr[i])) {
        word += expr[i++];
      }
      tokens.push(word);
      continue;
    }
    if ('+-*/%^()'.includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    throw new Error(`Unexpected character: "${ch}"`);
  }
  return tokens;
}

class Parser {
  private tokens: string[];
  private pos = 0;

  constructor(tokens: string[]) {
    this.tokens = tokens;
  }

  private peek(): string | undefined {
    return this.tokens[this.pos];
  }

  private consume(): string {
    return this.tokens[this.pos++];
  }

  parse(): number {
    const val = this.parseExpr();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token: "${this.peek()}"`);
    }
    return val;
  }

  private parseExpr(): number {
    let val = this.parseTerm();
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.consume();
      const right = this.parseTerm();
      val = op === '+' ? val + right : val - right;
    }
    return val;
  }

  private parseTerm(): number {
    let val = this.parsePower();
    while (
      this.peek() === '*' ||
      this.peek() === '/' ||
      this.peek() === '%'
    ) {
      const op = this.consume();
      const right = this.parsePower();
      if (op === '*') {
        val = val * right;
      } else if (op === '/') {
        val = val / right;
      } else {
        val = val % right;
      }
    }
    return val;
  }

  private parsePower(): number {
    const base = this.parseUnary();
    if (this.peek() === '^') {
      this.consume();
      return Math.pow(base, this.parsePower()); // right-associative
    }
    return base;
  }

  private parseUnary(): number {
    if (this.peek() === '-') {
      this.consume();
      return -this.parseUnary();
    }
    if (this.peek() === '+') {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const tok = this.peek();
    if (tok === undefined) {
      throw new Error('Unexpected end of expression');
    }

    if (tok === '(') {
      this.consume();
      const val = this.parseExpr();
      if (this.peek() !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      this.consume();
      return val;
    }

    if (/^[0-9.]/.test(tok)) {
      this.consume();
      return parseFloat(tok);
    }

    if (/^[a-zA-Z_]/.test(tok)) {
      this.consume();
      const lower = tok.toLowerCase();

      if (lower in CONSTANTS) {
        return CONSTANTS[lower];
      }

      if (lower in FUNCTIONS) {
        if (this.peek() !== '(') {
          throw new Error(`Expected "(" after function "${tok}"`);
        }
        this.consume();
        const arg = this.parseExpr();
        if (this.peek() !== ')') {
          throw new Error(`Missing closing parenthesis after "${tok}("`);
        }
        this.consume();
        return FUNCTIONS[lower](arg);
      }

      throw new Error(`Unknown identifier: "${tok}"`);
    }

    throw new Error(`Unexpected token: "${tok}"`);
  }
}

function safeEvaluate(expression: string): number {
  const tokens = tokenize(expression);
  if (tokens.length === 0) {
    throw new Error('Empty expression');
  }
  return new Parser(tokens).parse();
}

export const calculateTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'calculate',
      description:
        'Evaluate a mathematical expression and return the numeric result. ' +
        'Supports +, -, *, /, %, ^ (power), parentheses, and functions: ' +
        'sqrt, cbrt, abs, floor, ceil, round, log (base-10), ln, log2, exp, ' +
        'sin, cos, tan, asin, acos, atan, sinh, cosh, tanh. ' +
        'Constants: pi, e, tau. Example: "sqrt(2) * pi"',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'The mathematical expression to evaluate.',
          },
        },
        required: ['expression'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const expression = String(args.expression ?? '').trim();
    try {
      const result = safeEvaluate(expression);
      if (!isFinite(result)) {
        const display =
          result === Infinity
            ? 'Infinity'
            : result === -Infinity
              ? '-Infinity'
              : 'NaN';
        return JSON.stringify({expression, result: display});
      }
      return JSON.stringify({expression, result});
    } catch (err) {
      return JSON.stringify({expression, error: String(err)});
    }
  },
};
