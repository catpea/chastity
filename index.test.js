import { describe, test } from 'node:test';
import assert from 'node:assert';
import Chastity from './index.js';

describe('Chastity Markdown Parser', () => {
  describe('Constructor', () => {
    test('should create instance with default features', () => {
      const md = new Chastity();
      assert.ok(md instanceof Chastity);
      assert.ok(md.transforms instanceof Map);
      assert.ok(md.transforms.size > 0);
    });

    test('should have all default features registered', () => {
      const md = new Chastity();
      const expected = [
        'code-blocks',
        'inline-code',
        'images',
        'links',
        'headers',
        'horizontal-rule',
        'bold',
        'italic',
        'strikethrough',
        'unordered-list',
        'ordered-list',
        'blockquote',
        'paragraphs'
      ];
      const features = md.list();
      expected.forEach(name => {
        assert.ok(features.includes(name), `Feature '${name}' should be registered`);
      });
    });
  });

  describe('Headers', () => {
    test('should parse h1 header', () => {
      const md = new Chastity();
      const html = md.parse('# Hello World');
      assert.ok(html.includes('<h1>Hello World</h1>'));
    });

    test('should parse h2-h6 headers', () => {
      const md = new Chastity();
      assert.ok(md.parse('## Level 2').includes('<h2>Level 2</h2>'));
      assert.ok(md.parse('### Level 3').includes('<h3>Level 3</h3>'));
      assert.ok(md.parse('#### Level 4').includes('<h4>Level 4</h4>'));
      assert.ok(md.parse('##### Level 5').includes('<h5>Level 5</h5>'));
      assert.ok(md.parse('###### Level 6').includes('<h6>Level 6</h6>'));
    });
  });

  describe('Text Formatting', () => {
    test('should parse bold text', () => {
      const md = new Chastity();
      const html = md.parse('This is **bold** text');
      assert.ok(html.includes('<strong>bold</strong>'));
    });

    test('should parse italic text', () => {
      const md = new Chastity();
      const html = md.parse('This is *italic* text');
      assert.ok(html.includes('<em>italic</em>'));
    });

    test('should parse strikethrough text', () => {
      const md = new Chastity();
      const html = md.parse('This is ~~deleted~~ text');
      assert.ok(html.includes('<del>deleted</del>'));
    });

    test('should parse combined formatting', () => {
      const md = new Chastity();
      const html = md.parse('**bold** and *italic*');
      assert.ok(html.includes('<strong>bold</strong>'));
      assert.ok(html.includes('<em>italic</em>'));
    });
  });

  describe('Links and Images', () => {
    test('should parse links', () => {
      const md = new Chastity();
      const html = md.parse('[Google](https://google.com)');
      assert.ok(html.includes('<a href="https://google.com">Google</a>'));
    });

    test('should parse images', () => {
      const md = new Chastity();
      const html = md.parse('![Alt text](image.jpg)');
      assert.ok(html.includes('<img src="image.jpg" alt="Alt text">'));
    });

    test('should parse image with empty alt text', () => {
      const md = new Chastity();
      const html = md.parse('![](logo.png)');
      assert.ok(html.includes('<img src="logo.png" alt="">'));
    });
  });

  describe('Code', () => {
    test('should parse inline code', () => {
      const md = new Chastity();
      const html = md.parse('Use `const x = 42;` for constants');
      assert.ok(html.includes('<code>const x = 42;</code>'));
    });

    test('should parse code blocks without language', () => {
      const md = new Chastity();
      const html = md.parse('```\ncode here\n```');
      assert.ok(html.includes('<pre><code'));
      assert.ok(html.includes('code here'));
    });

    test('should parse code blocks with language', () => {
      const md = new Chastity();
      const html = md.parse('```javascript\nconst x = 42;\n```');
      assert.ok(html.includes('<pre><code class="javascript">'));
      assert.ok(html.includes('const x = 42;'));
    });

    test('should escape HTML in code blocks', () => {
      const md = new Chastity();
      const html = md.parse('```\n<script>alert("xss")</script>\n```');
      assert.ok(html.includes('&lt;script&gt;'));
      assert.ok(!html.includes('<script>'));
    });

    test('should escape HTML in inline code', () => {
      const md = new Chastity();
      const html = md.parse('Use `<div>` tag');
      assert.ok(html.includes('&lt;div&gt;'));
      assert.ok(!html.includes('<div>') || html.match(/<div>/g).length === 0);
    });
  });

  describe('Lists', () => {
    test('should parse unordered list with dash', () => {
      const md = new Chastity();
      const html = md.parse('- item one\n- item two\n- item three');
      assert.ok(html.includes('<ul>'));
      assert.ok(html.includes('<li>item one</li>'));
      assert.ok(html.includes('<li>item two</li>'));
      assert.ok(html.includes('</ul>'));
    });

    test('should parse unordered list with asterisk', () => {
      const md = new Chastity();
      const html = md.parse('* item one\n* item two');
      assert.ok(html.includes('<ul>'));
      assert.ok(html.includes('<li>item one</li>'));
    });

    test('should parse ordered list', () => {
      const md = new Chastity();
      const html = md.parse('1. first\n2. second\n3. third');
      assert.ok(html.includes('<ol>'));
      assert.ok(html.includes('<li>first</li>'));
      assert.ok(html.includes('<li>second</li>'));
      assert.ok(html.includes('</ol>'));
    });
  });

  describe('Other Elements', () => {
    test('should parse blockquote', () => {
      const md = new Chastity();
      const html = md.parse('> This is a quote');
      assert.ok(html.includes('<blockquote>This is a quote</blockquote>'));
    });

    test('should parse horizontal rule', () => {
      const md = new Chastity();
      const html = md.parse('---');
      assert.ok(html.includes('<hr>'));
    });

    test('should parse horizontal rule with more dashes', () => {
      const md = new Chastity();
      const html = md.parse('-----');
      assert.ok(html.includes('<hr>'));
    });

    test('should parse paragraphs', () => {
      const md = new Chastity();
      const html = md.parse('This is paragraph one\n\nThis is paragraph two');
      assert.ok(html.includes('<p>'));
    });
  });

  describe('API - register()', () => {
    test('should register custom feature', () => {
      const md = new Chastity();
      md.register({
        name: 'highlight',
        description: 'Highlight text',
        usage: '==text==',
        pattern: '==(?<text>[^=]+)==',
        flags: 'g',
        replacement: ({ text }) => `<mark>${text}</mark>`
      });

      const html = md.parse('This is ==highlighted== text');
      assert.ok(html.includes('<mark>highlighted</mark>'));
    });

    test('should replace existing feature', () => {
      const md = new Chastity();
      md.register({
        name: 'bold',
        description: 'Custom bold',
        usage: '**text**',
        pattern: '\\*\\*(?<text>[^*]+)\\*\\*',
        flags: 'g',
        replacement: ({ text }) => `<b>${text}</b>`
      });

      const html = md.parse('**bold**');
      assert.ok(html.includes('<b>bold</b>'));
      assert.ok(!html.includes('<strong>'));
    });

    test('should throw error if feature missing required properties', () => {
      const md = new Chastity();
      assert.throws(() => {
        md.register({ name: 'test' });
      }, /Feature must have name, pattern, and replacement/);
    });

    test('should chain register calls', () => {
      const md = new Chastity();
      const result = md.register({
        name: 'test',
        description: 'Test',
        usage: 'test',
        pattern: 'test',
        flags: 'g',
        replacement: () => 'TEST'
      });
      assert.strictEqual(result, md);
    });
  });

  describe('API - unregister()', () => {
    test('should unregister feature', () => {
      const md = new Chastity();
      md.unregister('strikethrough');

      const html = md.parse('~~text~~');
      assert.ok(!html.includes('<del>'));
      assert.ok(html.includes('~~text~~'));
    });

    test('should chain unregister calls', () => {
      const md = new Chastity();
      const result = md.unregister('strikethrough');
      assert.strictEqual(result, md);
    });
  });

  describe('API - list()', () => {
    test('should return array of feature names', () => {
      const md = new Chastity();
      const list = md.list();
      assert.ok(Array.isArray(list));
      assert.ok(list.length > 0);
      assert.ok(list.includes('bold'));
      assert.ok(list.includes('italic'));
    });

    test('should reflect registered and unregistered features', () => {
      const md = new Chastity();
      md.register({
        name: 'custom',
        description: 'Custom',
        usage: 'custom',
        pattern: 'custom',
        flags: 'g',
        replacement: () => 'CUSTOM'
      });
      md.unregister('strikethrough');

      const list = md.list();
      assert.ok(list.includes('custom'));
      assert.ok(!list.includes('strikethrough'));
    });
  });

  describe('API - help()', () => {
    test('should return markdown help by default', () => {
      const md = new Chastity();
      const help = md.help();
      assert.ok(typeof help === 'string');
      assert.ok(help.includes('Chastity Markdown Parser'));
      assert.ok(help.includes('Regular Expressions'));
    });

    test('should return help for specific feature', () => {
      const md = new Chastity();
      const help = md.help('bold');
      assert.ok(help.includes('bold'));
      assert.ok(help.includes('**bold text**'));
    });

    test('should return error message for non-existent feature', () => {
      const md = new Chastity();
      const help = md.help('non-existent');
      assert.ok(help.includes('not found'));
    });

    test('should not throw when tty mode enabled', () => {
      const md = new Chastity();
      md.tty = true;
      assert.doesNotThrow(() => {
        md.help();
      });
    });
  });

  describe('Complex Examples', () => {
    test('should parse README quick start example', () => {
      const md = new Chastity();
      const html = md.parse('# Hello World\n\nThis is **bold** and *italic*.');
      assert.ok(html.includes('<h1>Hello World</h1>'));
      assert.ok(html.includes('<strong>bold</strong>'));
      assert.ok(html.includes('<em>italic</em>'));
    });

    test('should parse multiple features in one document', () => {
      const md = new Chastity();
      const markdown = `# Title

This is a [link](https://example.com) and an image:

![Logo](logo.png)

\`\`\`javascript
const x = 42;
\`\`\`

- List item 1
- List item 2

> Quote here

---`;

      const html = md.parse(markdown);
      assert.ok(html.includes('<h1>Title</h1>'));
      assert.ok(html.includes('<a href="https://example.com">link</a>'));
      assert.ok(html.includes('<img src="logo.png" alt="Logo">'));
      assert.ok(html.includes('const x = 42;'));
      assert.ok(html.includes('<ul>'));
      assert.ok(html.includes('<blockquote>'));
      assert.ok(html.includes('<hr>'));
    });

    test('should handle custom feature from README (highlight)', () => {
      const md = new Chastity();
      md.register({
        name: 'highlight',
        description: 'Highlight text with ==double equals==',
        usage: '==important text==',
        pattern: '==(?<text>[^=]+)==',
        flags: 'g',
        replacement: ({ text }) => `<mark>${text}</mark>`
      });

      const html = md.parse('This is ==important== information');
      assert.ok(html.includes('<mark>important</mark>'));
    });

    test('should handle WikiText links example from README', () => {
      const md = new Chastity();
      md.register({
        name: 'wiki-links',
        description: 'Automatic links for WikiText',
        usage: 'HelloWorld becomes a link',
        pattern: '(?<![\\w/])(?<word>[A-Z][a-z]+(?:[A-Z][a-z]+)+)(?![\\w/])',
        flags: 'g',
        replacement: ({ word }) => `<a href="/wiki/${word}">${word}</a>`
      });

      const html = md.parse('Check out MyAwesomePage!');
      assert.ok(html.includes('<a href="/wiki/MyAwesomePage">MyAwesomePage</a>'));
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string', () => {
      const md = new Chastity();
      const html = md.parse('');
      assert.strictEqual(html, '');
    });

    test('should handle plain text without markdown', () => {
      const md = new Chastity();
      const html = md.parse('Just plain text');
      assert.ok(html.includes('Just plain text'));
    });

    test('should handle nested markdown features', () => {
      const md = new Chastity();
      const html = md.parse('[**bold link**](https://example.com)');
      assert.ok(html.includes('<a href="https://example.com">'));
      assert.ok(html.includes('<strong>bold link</strong>'));
    });

    test('should handle special characters in text', () => {
      const md = new Chastity();
      const html = md.parse('Text with & < > " \' characters');
      assert.ok(html.includes('Text with & < > " \' characters'));
    });
  });
});
