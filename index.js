// chastity.js
export class Chastity {
  constructor() {
    this.transforms = new Map();
    this.initialize();
  }

  initialize() {
    this.register({
      name: 'code-blocks',
      description: 'Fenced code blocks with optional language specification',
      usage: '```javascript\\ncode here\\n```',
      pattern: '```(?<lang>\\w+)?\\n(?<code>[\\s\\S]*?)```',
      flags: 'g',
      replacement: ({ lang, code }) =>
        `<pre><code class="${lang || ''}">${escapeHtml(code)}</code></pre>`
    });

    this.register({
      name: 'inline-code',
      description: 'Inline code wrapped in backticks',
      usage: '`const x = 42;`',
      pattern: '`(?<code>[^`]+)`',
      flags: 'g',
      replacement: ({ code }) => `<code>${escapeHtml(code)}</code>`
    });

    this.register({
      name: 'images',
      description: 'Images with alt text and URL',
      usage: '![alt text](image.jpg)',
      pattern: '!\\[(?<alt>[^\\]]*)\\]\\((?<url>[^)]+)\\)',
      flags: 'g',
      replacement: ({ alt, url }) => `<img src="${url}" alt="${alt}">`
    });

    this.register({
      name: 'links',
      description: 'Hyperlinks with text and URL',
      usage: '[link text](https://example.com)',
      pattern: '\\[(?<text>[^\\]]+)\\]\\((?<url>[^)]+)\\)',
      flags: 'g',
      replacement: ({ text, url }) => `<a href="${url}">${text}</a>`
    });

    this.register({
      name: 'headers',
      description: 'Headers from h1 (# ) to h6 (######)',
      usage: '## Heading Level 2',
      pattern: '^(?<hashes>#{1,6})\\s+(?<text>.+)$',
      flags: 'gm',
      replacement: ({ hashes, text }) =>
        `<h${hashes.length}>${text}</h${hashes.length}>`
    });

    this.register({
      name: 'horizontal-rule',
      description: 'Horizontal rule with three or more dashes',
      usage: '---',
      pattern: '^-{3,}$',
      flags: 'gm',
      replacement: () => '<hr>'
    });

    this.register({
      name: 'bold',
      description: 'Bold text wrapped in double asterisks',
      usage: '**bold text**',
      pattern: '\\*\\*(?<text>[^*]+)\\*\\*',
      flags: 'g',
      replacement: ({ text }) => `<strong>${text}</strong>`
    });

    this.register({
      name: 'italic',
      description: 'Italic text wrapped in single asterisks',
      usage: '*italic text*',
      pattern: '\\*(?<text>[^*]+)\\*',
      flags: 'g',
      replacement: ({ text }) => `<em>${text}</em>`
    });

    this.register({
      name: 'strikethrough',
      description: 'Strikethrough text wrapped in double tildes',
      usage: '~~deleted text~~',
      pattern: '~~(?<text>[^~]+)~~',
      flags: 'g',
      replacement: ({ text }) => `<del>${text}</del>`
    });

    this.register({
      name: 'unordered-list',
      description: 'Unordered list items starting with - or *',
      usage: '- item one\\n- item two',
      pattern: '(?:^[*-]\\s+.+$\\n?)+',
      flags: 'gm',
      replacement: (match) => {
        const items = match[0].split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^[*-]\s+/, ''))
          .map(item => `  <li>${item}</li>`)
          .join('\n');
        return `<ul>\n${items}\n</ul>`;
      }
    });

    this.register({
      name: 'ordered-list',
      description: 'Ordered list items starting with numbers',
      usage: '1. first\\n2. second',
      pattern: '(?:^\\d+\\.\\s+.+$\\n?)+',
      flags: 'gm',
      replacement: (match) => {
        const items = match[0].split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.\s+/, ''))
          .map(item => `  <li>${item}</li>`)
          .join('\n');
        return `<ol>\n${items}\n</ol>`;
      }
    });

    this.register({
      name: 'blockquote',
      description: 'Blockquote lines starting with >',
      usage: '> quoted text',
      pattern: '^>\\s+(?<text>.+)$',
      flags: 'gm',
      replacement: ({ text }) => `<blockquote>${text}</blockquote>`
    });

    this.register({
      name: 'paragraphs',
      description: 'Paragraphs separated by blank lines',
      usage: 'paragraph one\\n\\nparagraph two',
      pattern: '(?<text>[^\\n]+(?:\\n(?!\\n)[^\\n]+)*)',
      flags: 'g',
      replacement: ({ text }) => {
        // Don't wrap if already HTML
        if (text.match(/^<[a-z]/)) return text;
        return `<p>${text.replace(/\n/g, ' ')}</p>`;
      }
    });
  }

  register(feature) {
    if (!feature.name || !feature.pattern || !feature.replacement) {
      throw new Error('Feature must have name, pattern, and replacement');
    }
    this.transforms.set(feature.name, feature);
    return this;
  }

  unregister(name) {
    this.transforms.delete(name);
    return this;
  }

  parse(markdown) {
    let html = markdown;

    for (const [name, feature] of this.transforms) {
      const regex = new RegExp(feature.pattern, feature.flags || 'g');
      html = html.replace(regex, (...args) => {
        // Build named groups object
        const groups = args[args.length - 1];
        return feature.replacement(groups || args);
      });
    }

    return html;
  }


  list() {
    return Array.from(this.transforms.keys());
  }










  help(featureName = null) {
      if (this.tty) {
        return this._helpTerminal(featureName);
      }
      return this._helpMarkdown(featureName);
    }

    _helpTerminal(featureName) {
      const blue = '\x1b[34m';
      const green = '\x1b[32m';
      const yellow = '\x1b[33m';
      const reset = '\x1b[0m';
      const bold = '\x1b[1m';

      if (featureName) {
        const feature = this.transforms.get(featureName);
        if (!feature) {
          console.log(`${yellow}Feature '${featureName}' not found${reset}`);
          return;
        }

        console.log(`\n${bold}${blue}${feature.name}${reset}`);
        console.log(`${feature.description}`);
        console.log(`\n${green}Usage:${reset}`);
        console.log(`  ${feature.usage}`);
        console.log(`\n${green}Pattern:${reset}`);
        console.log(`  ${yellow}/${feature.pattern}/${feature.flags || ''}${reset}`);
        console.log();
        return;
      }

      console.log(`\n${bold}${blue}Chastity Markdown Parser${reset}`);
      console.log(`${yellow}For the love of Simplicity and Regular Expressions${reset}\n`);
      console.log(`${green}Registered Features:${reset}\n`);

      for (const [name, feature] of this.transforms) {
        console.log(`  ${bold}${name}${reset}`);
        console.log(`    ${feature.description}`);
        console.log(`    ${yellow}/${feature.pattern}/${feature.flags || ''}${reset}\n`);
      }

      console.log(`${green}Usage:${reset}`);
      console.log(`  md.help('feature-name')  - detailed help for a feature`);
      console.log(`  md.parse(markdown)       - convert markdown to HTML`);
      console.log(`  md.tty = true            - enable terminal colors\n`);
    }

    _helpMarkdown(featureName) {
      if (featureName) {
        const feature = this.transforms.get(featureName);
        if (!feature) {
          return `Feature '${featureName}' not found`;
        }

        return `## ${feature.name}

  ${feature.description}

  **Usage:**
  \`\`\`
  ${feature.usage}
  \`\`\`

  **Pattern:** \`/${feature.pattern}/${feature.flags || ''}\`
  `;
      }

      let md = `# Chastity Markdown Parser

  *For the love of Simplicity and Regular Expressions*

  ## Registered Features

  `;

      for (const [name, feature] of this.transforms) {
        md += `### ${name}

  ${feature.description}

  **Pattern:** \`/${feature.pattern}/${feature.flags || ''}\`

  **Usage:**
  \`\`\`
  ${feature.usage}
  \`\`\`

  `;
      }

      md += `## Usage

  \`\`\`javascript
  const md = new Chastity();

  // Parse markdown
  md.parse('# Hello World');

  // Get help
  md.help('feature-name');  // Detailed help for a feature

  // Terminal mode
  md.tty = true;
  md.help();  // Colored output for CLI
  \`\`\`
  `;

      return md;
    }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  })[m]);
}

export default Chastity;
