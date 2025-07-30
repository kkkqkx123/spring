/**
 * Accessibility audit utilities for WCAG 2.1 compliance checking
 */

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  element?: HTMLElement;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
}

export interface AccessibilityAuditResult {
  issues: AccessibilityIssue[];
  score: number; // 0-100
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Run accessibility audit on a DOM element
 */
export const auditAccessibility = (
  element: HTMLElement = document.body
): AccessibilityAuditResult => {
  const issues: AccessibilityIssue[] = [];

  // Check for missing alt text on images
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        rule: 'img-alt',
        message: 'Image missing alt attribute',
        element: img,
        wcagLevel: 'A',
        wcagCriterion: '1.1.1',
      });
    } else if (img.getAttribute('alt') === '') {
      // Check if decorative image is properly marked
      if (
        !img.hasAttribute('role') ||
        img.getAttribute('role') !== 'presentation'
      ) {
        issues.push({
          type: 'warning',
          rule: 'img-alt-decorative',
          message:
            'Empty alt text should be accompanied by role="presentation"',
          element: img,
          wcagLevel: 'A',
          wcagCriterion: '1.1.1',
        });
      }
    }
  });

  // Check for missing form labels
  const inputs = element.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const hasLabel =
      input.hasAttribute('aria-label') ||
      input.hasAttribute('aria-labelledby') ||
      element.querySelector(`label[for="${input.id}"]`);

    if (!hasLabel) {
      issues.push({
        type: 'error',
        rule: 'form-label',
        message: 'Form control missing accessible label',
        element: input as HTMLElement,
        wcagLevel: 'A',
        wcagCriterion: '1.3.1',
      });
    }
  });

  // Check for proper heading hierarchy
  const headings = Array.from(
    element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  );
  let previousLevel = 0;
  headings.forEach(heading => {
    const currentLevel = parseInt(heading.tagName.charAt(1));
    if (currentLevel > previousLevel + 1) {
      issues.push({
        type: 'warning',
        rule: 'heading-hierarchy',
        message: `Heading level ${currentLevel} skips level ${previousLevel + 1}`,
        element: heading as HTMLElement,
        wcagLevel: 'AA',
        wcagCriterion: '1.3.1',
      });
    }
    previousLevel = currentLevel;
  });

  // Check for color contrast (simplified check)
  const textElements = element.querySelectorAll(
    'p, span, div, a, button, label'
  );
  textElements.forEach(el => {
    const styles = window.getComputedStyle(el as Element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // Only check if both colors are defined and not transparent
    if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      // This is a simplified check - in practice, you'd use a proper color contrast library
      if (color === backgroundColor) {
        issues.push({
          type: 'error',
          rule: 'color-contrast',
          message: 'Text color same as background color',
          element: el as HTMLElement,
          wcagLevel: 'AA',
          wcagCriterion: '1.4.3',
        });
      }
    }
  });

  // Check for keyboard accessibility
  const interactiveElements = element.querySelectorAll(
    'button, a, input, select, textarea, [tabindex]'
  );
  interactiveElements.forEach(el => {
    const tabIndex = el.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push({
        type: 'warning',
        rule: 'tabindex-positive',
        message: 'Avoid positive tabindex values',
        element: el as HTMLElement,
        wcagLevel: 'A',
        wcagCriterion: '2.4.3',
      });
    }
  });

  // Check for ARIA usage
  const ariaElements = element.querySelectorAll(
    '[aria-labelledby], [aria-describedby]'
  );
  ariaElements.forEach(el => {
    const labelledBy = el.getAttribute('aria-labelledby');
    const describedBy = el.getAttribute('aria-describedby');

    if (labelledBy) {
      const labelIds = labelledBy.split(' ');
      labelIds.forEach(id => {
        if (!element.querySelector(`#${id}`)) {
          issues.push({
            type: 'error',
            rule: 'aria-labelledby-valid',
            message: `aria-labelledby references non-existent element: ${id}`,
            element: el as HTMLElement,
            wcagLevel: 'A',
            wcagCriterion: '4.1.2',
          });
        }
      });
    }

    if (describedBy) {
      const descriptionIds = describedBy.split(' ');
      descriptionIds.forEach(id => {
        if (!element.querySelector(`#${id}`)) {
          issues.push({
            type: 'error',
            rule: 'aria-describedby-valid',
            message: `aria-describedby references non-existent element: ${id}`,
            element: el as HTMLElement,
            wcagLevel: 'A',
            wcagCriterion: '4.1.2',
          });
        }
      });
    }
  });

  // Check for focus indicators
  const focusableElements = element.querySelectorAll(
    'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  focusableElements.forEach(el => {
    const styles = window.getComputedStyle(el as Element);
    const outline = styles.outline;
    const outlineWidth = styles.outlineWidth;

    // Check if element has custom focus styles
    if (outline === 'none' || outlineWidth === '0px') {
      // This is a simplified check - ideally you'd test actual focus behavior
      issues.push({
        type: 'warning',
        rule: 'focus-indicator',
        message: 'Element may be missing focus indicator',
        element: el as HTMLElement,
        wcagLevel: 'AA',
        wcagCriterion: '2.4.7',
      });
    }
  });

  // Check for language attribute
  if (element === document.body) {
    const html = document.documentElement;
    if (!html.hasAttribute('lang')) {
      issues.push({
        type: 'error',
        rule: 'html-lang',
        message: 'HTML element missing lang attribute',
        element: html,
        wcagLevel: 'A',
        wcagCriterion: '3.1.1',
      });
    }
  }

  // Check for page title
  if (element === document.body) {
    const title = document.querySelector('title');
    if (!title || !title.textContent?.trim()) {
      issues.push({
        type: 'error',
        rule: 'page-title',
        message: 'Page missing descriptive title',
        wcagLevel: 'A',
        wcagCriterion: '2.4.2',
      });
    }
  }

  // Calculate score
  const errorWeight = 10;
  const warningWeight = 5;
  const infoWeight = 1;

  const totalElements = element.querySelectorAll('*').length;
  const maxPossibleScore = totalElements * errorWeight;

  const deductions = issues.reduce((total, issue) => {
    switch (issue.type) {
      case 'error':
        return total + errorWeight;
      case 'warning':
        return total + warningWeight;
      case 'info':
        return total + infoWeight;
      default:
        return total;
    }
  }, 0);

  const score = Math.max(
    0,
    Math.round(((maxPossibleScore - deductions) / maxPossibleScore) * 100)
  );

  // Generate summary
  const summary = {
    errors: issues.filter(issue => issue.type === 'error').length,
    warnings: issues.filter(issue => issue.type === 'warning').length,
    info: issues.filter(issue => issue.type === 'info').length,
  };

  return {
    issues,
    score,
    summary,
  };
};

/**
 * Generate accessibility report
 */
export const generateAccessibilityReport = (
  auditResult: AccessibilityAuditResult
): string => {
  const { issues, score, summary } = auditResult;

  let report = `# Accessibility Audit Report\n\n`;
  report += `**Score: ${score}/100**\n\n`;
  report += `## Summary\n`;
  report += `- Errors: ${summary.errors}\n`;
  report += `- Warnings: ${summary.warnings}\n`;
  report += `- Info: ${summary.info}\n\n`;

  if (issues.length === 0) {
    report += `✅ No accessibility issues found!\n`;
    return report;
  }

  report += `## Issues\n\n`;

  const groupedIssues = issues.reduce(
    (groups, issue) => {
      if (!groups[issue.type]) {
        groups[issue.type] = [];
      }
      groups[issue.type].push(issue);
      return groups;
    },
    {} as Record<string, AccessibilityIssue[]>
  );

  ['error', 'warning', 'info'].forEach(type => {
    if (groupedIssues[type]) {
      report += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
      groupedIssues[type].forEach((issue, index) => {
        const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        report += `${icon} **${issue.rule}** (WCAG ${issue.wcagLevel} - ${issue.wcagCriterion})\n`;
        report += `   ${issue.message}\n`;
        if (issue.element) {
          report += `   Element: \`${issue.element.tagName.toLowerCase()}\`\n`;
        }
        report += `\n`;
      });
    }
  });

  return report;
};

/**
 * Accessibility testing helpers for unit tests
 */
export const accessibilityTestHelpers = {
  /**
   * Check if element has proper ARIA attributes
   */
  hasProperAria: (element: HTMLElement): boolean => {
    const interactiveRoles = [
      'button',
      'link',
      'textbox',
      'combobox',
      'listbox',
      'option',
    ];
    const role = element.getAttribute('role');

    if (interactiveRoles.includes(role || element.tagName.toLowerCase())) {
      return (
        element.hasAttribute('aria-label') ||
        element.hasAttribute('aria-labelledby') ||
        element.textContent?.trim() !== ''
      );
    }

    return true;
  },

  /**
   * Check if element is keyboard accessible
   */
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    const isInteractive = [
      'button',
      'a',
      'input',
      'select',
      'textarea',
    ].includes(element.tagName.toLowerCase());

    if (isInteractive) {
      return tabIndex !== '-1';
    }

    if (element.hasAttribute('onclick') || element.hasAttribute('role')) {
      return tabIndex !== null && tabIndex !== '-1';
    }

    return true;
  },

  /**
   * Check if element has sufficient color contrast
   */
  hasSufficientContrast: (element: HTMLElement): boolean => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // This is a simplified check - in practice, you'd use a proper color contrast library
    if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      return color !== backgroundColor;
    }

    return true;
  },

  /**
   * Check if form field has proper labeling
   */
  hasProperLabel: (
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  ): boolean => {
    return (
      element.hasAttribute('aria-label') ||
      element.hasAttribute('aria-labelledby') ||
      document.querySelector(`label[for="${element.id}"]`) !== null
    );
  },
};
