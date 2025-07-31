declare module 'jest-axe' {
  // Based on axe-core's Result interface
  interface AxeViolation {
    id: string;
    impact?: 'minor' | 'moderate' | 'serious' | 'critical';
    tags: string[];
    description: string;
    help: string;
    helpUrl: string;
    nodes: unknown[];
  }

  interface AxeResults {
    violations: AxeViolation[];
  }

  // Based on axe-core's RunOptions interface
  type AxeRunOptions = Record<string, unknown>;

  interface Axe {
    (html: Element | string, options?: AxeRunOptions): Promise<AxeResults>;
  }

  export const axe: Axe;

  export function toHaveNoViolations(results: AxeResults): {
    pass: boolean;
    message: () => string;
  };
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
  // For vitest
  namespace Vi {
    interface JestAssertion<T> {
      toHaveNoViolations(): T;
    }
  }
}
