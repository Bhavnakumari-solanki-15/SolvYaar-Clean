export function parseExpression(expression: string): string {
  // Remove all whitespace and invisible characters
  let expr = expression.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
  
  // Convert to lowercase for consistency
  expr = expr.toLowerCase();
  
  // Handle implicit multiplication cases:
  // 1. Number followed by variable: 4x -> 4*x
  expr = expr.replace(/(\d)([a-z])/g, '$1*$2');
  // 2. Number followed by parenthesis: 2(x+1) -> 2*(x+1)
  expr = expr.replace(/(\d)(\()/g, '$1*$2');
  // 3. Variable followed by parenthesis: x(y+1) -> x*(y+1)
  expr = expr.replace(/([a-z])(\()/g, '$1*$2');
  // 4. Closing parenthesis followed by number or variable: (x+1)2 -> (x+1)*2
  expr = expr.replace(/(\))(\d|[a-z])/g, '$1*$2');
  
  // Replace ^ with ** for exponentiation
  expr = expr.replace(/(\d+|\w+|\))\s*\^\s*(-?\d+\.?\d*|\w+|\(.*?\))/g, '$1**$2');
  
  return expr;
}

export function evaluateExpression(expression: string, x: number): number {
  try {
    // Parse the expression first
    const parsedExpr = parseExpression(expression);
    
    // Create a safe evaluation context with only Math functions
    const evalContext = {
      x,
      Math,
      pow: Math.pow,
      sqrt: Math.sqrt,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      abs: Math.abs,
      exp: Math.exp,
      log: Math.log,
      ln: Math.log,  // Natural logarithm
      PI: Math.PI,
      E: Math.E
    };
    
    // Create a function from the expression with the safe context
    const fn = new Function('x', 'Math', `
      try {
        return ${parsedExpr};
      } catch (e) {
        throw new Error('Invalid mathematical expression: ' + e.message);
      }
    `);
    
    // Evaluate the function with the provided x value
    return fn(x, Math);
  } catch (error) {
    console.error('Error evaluating expression:', error);
    throw new Error('Invalid mathematical expression');
  }
}

export function generatePoints(expression: string, range: { start: number; end: number; step: number }): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  
  for (let x = range.start; x <= range.end; x += range.step) {
    try {
      const y = evaluateExpression(expression, x);
      
      // Only add points if y is a finite number and not too large/small
      if (Number.isFinite(y) && Math.abs(y) < 1e10) {
        points.push({ x, y });
      }
    } catch (error) {
      console.warn(`Could not evaluate expression at x = ${x}`);
    }
  }
  
  return points;
} 