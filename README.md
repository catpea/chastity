# Chastity

*For the love of Simplicity and Regular Expressions*

A markdown parser where **every feature is a regular expression**. No hidden complexity, no abstract syntax trees - just beautiful patterns you can see, understand, and customize.

> **Philosophy:** If it can't be expressed through regexp, it doesn't belong in markdown.

## Installation

```bash
npm install chastity
```

## Quick Start

```js
import Chastity from 'chastity';

const md = new Chastity();
const html = md.parse(`# Hello World\n\nThis is **bold** and *italic*.`);
console.log(html);
```

## Why Chastity?

- **Transparent**: Every feature is a named regex pattern you can inspect
- **Customizable**: Add, remove, or replace any feature
- **Educational**: Learn regex through practical markdown parsing
- **Simple**: No complex AST, no tokenizers - just pattern matching
- **Self-documenting**: Each feature includes description, usage, and pattern

## Built-in Features

```js
const md = new Chastity();
md.help(); // See all features with their regex patterns
```

Includes: code blocks, headers, links, images, bold, italic, lists, blockquotes, and more.

## Learning Regular Expressions Through Markdown

Let's learn regex by creating custom markdown features! Each example builds on the last, teaching you regex concepts through real-world use.

### Example 1: WikiText Links (Beginner)

Remember old wikis where `WordsJoinedTogether` automatically became links? Let's build that!

```js
md.register({
  name: 'wiki-links',
  description: 'Automatic links for WikiText (CapitalizedWordsJoinedTogether)',
  usage: 'HelloWorld becomes a link to /wiki/HelloWorld',
  pattern: '(?<![\\w/])(?<word>[A-Z][a-z]+(?:[A-Z][a-z]+)+)(?![\\w/])',
  flags: 'g',
  replacement: ({ word }) => `<a href="/wiki/${word}">${word}</a>`
});

// Now this works:
md.parse('Check out MyAwesomePage and WikiTextLinks!')
// Output: Check out <a href="/wiki/MyAwesomePage">MyAwesomePage</a> and <a href="/wiki/WikiTextLinks">WikiTextLinks</a>!
```

**Regex Breakdown:**
- `(?<![\\w/])` - **Negative lookbehind**: Don't match if preceded by word char or slash
- `(?<word>...)` - **Named capture group**: Save matched text as "word"
- `[A-Z]` - Match one uppercase letter (first letter)
- `[a-z]+` - Match one or more lowercase letters
- `(?:[A-Z][a-z]+)+` - Match one or more repetitions of Capital+lowercase (the "Joined" part)
- `(?![\\w/])` - **Negative lookahead**: Don't match if followed by word char or slash

**Why the lookbehind/lookahead?** So we don't match inside URLs like `http://MyPage` or filenames like `MyPage.js`

### Example 2: Transcludes with Safety (Intermediate)

Let's add a feature to include other markdown files, but **safely** - only child paths, only `.md` files:

```js
md.register({
  name: 'transclude',
  description: 'Include other markdown files safely (child paths only, .md only)',
  usage: '{{include: my-file.md}}',
  pattern: '\\{\\{include:\\s*(?<path>[a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_-]+)*\\.md)\\}\\}',
  flags: 'g',
  replacement: ({ path }) => {
    // Safety checks are built into the regex!
    try {
      const content = fs.readFileSync(path, 'utf-8');
      return md.parse(content); // Recursively parse the included file
    } catch (e) {
      return `<span class="error">Could not include: ${path}</span>`;
    }
  }
});

// Safe usage:
md.parse('{{include: posts/hello.md}}')  // ✅ Works
md.parse('{{include: ../secret.md}}')    // ❌ Won't match (no .. allowed)
md.parse('{{include: /etc/passwd}}')     // ❌ Won't match (no leading slash)
md.parse('{{include: file.txt}}')        // ❌ Won't match (must end in .md)
```

**Regex Breakdown (Safety First!):**
- `\\{\\{include:\\s*` - Match `{{include:` with optional whitespace
- `(?<path>...)` - Named capture group for the file path
- `[a-zA-Z0-9_-]+` - **First path segment**: only letters, numbers, underscore, dash (no dots!)
- `(?:/[a-zA-Z0-9_-]+)*` - **Optional sub-paths**: zero or more `/segment` parts (same safe chars)
- `\\.md` - **Must end in .md** (the `\\` escapes the dot)
- `\\}\\}` - Closing braces

**Security through Regex:**
- ❌ No `..` (can't go up directories)
- ❌ No leading `/` (can't use absolute paths)
- ❌ No `.` in filenames except `.md` (can't do `file.txt` or `../../secret.md`)
- ✅ Only `a-z`, `A-Z`, `0-9`, `_`, `-` in paths
- ✅ Only `.md` files

This pattern makes **path traversal attacks impossible** - the regex simply won't match malicious input!

### Example 3: Custom Syntax (Advanced)

Want to add highlight syntax? `==highlighted text==`

```js
md.register({
  name: 'highlight',
  description: 'Highlight text with ==double equals==',
  usage: '==important text==',
  pattern: '==(?<text>[^=]+)==',
  flags: 'g',
  replacement: ({ text }) => `<mark>${text}</mark>`
});
```

**Regex Breakdown:**
- `==` - Two literal equals signs
- `(?<text>...)` - Named capture group
- `[^=]+` - Match one or more of **anything except equals signs** (the `^` inside `[]` means "not")
- `==` - Closing equals signs

The `[^=]+` is key - it means "grab everything until you hit another `=`"

### Example 4: Advanced - Attributes on Images

Let's add CSS classes to images: `![alt](url){.center .shadow}`

```js
md.register({
  name: 'images-with-classes',
  description: 'Images with CSS classes',
  usage: '![alt](url){.class1 .class2}',
  pattern: '!\\[(?<alt>[^\\]]*)\\]\\((?<url>[^)]+)\\)\\{(?<classes>(?:\\.[a-z-]+\\s*)+)\\}',
  flags: 'g',
  replacement: ({ alt, url, classes }) => {
    const classList = classes.trim().split(/\s+/).map(c => c.slice(1)).join(' ');
    return `<img src="${url}" alt="${alt}" class="${classList}">`;
  }
});

// Usage:
md.parse('![Logo](logo.png){.center .shadow}')
// Output: <img src="logo.png" alt="Logo" class="center shadow">
```

**Regex Breakdown:**
- `!\\[(?<alt>[^\\]]*)\\]\\((?<url>[^)]+)\\)` - Standard image syntax
- `\\{` - Opening brace
- `(?<classes>...)` - Named group for classes
- `(?:\\.[a-z-]+\\s*)+` - One or more of: dot + letters/dashes + optional space
  - `(?:...)` - **Non-capturing group** (groups pattern but doesn't save it separately)
  - `\\.` - Literal dot
  - `[a-z-]+` - Class name (letters and dashes)
  - `\\s*` - Optional whitespace
  - `+` - One or more repetitions
- `\\}` - Closing brace

## Basic Usage

```js
import Chastity from 'chastity';
const md = new Chastity();

// Parse markdown
const html = md.parse(`# Hello\n---\n\nworld`);

// Add custom AVIF picture feature
md.register({
  name: 'avif-picture',
  description: 'AVIF images with fallback',
  usage: '![alt](image.jpg){avif}',
  pattern: '!\\[(?<alt>[^\\]]*)\\]\\((?<url>[^)]+)\\)\\{avif\\}',
  flags: 'g',
  replacement: ({ alt, url }) => {
    const avifUrl = url.replace(/\.(jpg|png)$/i, '.avif');
    return `<picture>
  <source srcset="${avifUrl}" type="image/avif">
  <img src="${url}" alt="${alt}">
</picture>`;
  }
});

// See all features
md.help();              // List all features
md.help('avif-picture'); // Detailed help for one feature

// Remove unwanted features
md.unregister('strikethrough');
```

## Terminal Mode

```js
import Chastity from 'chastity';
const md = new Chastity();

// For documentation/README (default)
console.log(md.help());  // Returns formatted markdown string

// For CLI tools
md.tty = true;
md.help();  // Prints beautiful colored terminal output

// Save documentation
fs.writeFileSync('FEATURES.md', md.help());
```

## API

### `new Chastity()`
Create a new parser instance with all default features registered.

### `md.register(feature)`
Add or replace a feature. Feature object requires:
- `name` (string): Unique identifier
- `description` (string): What this feature does
- `usage` (string): Example syntax
- `pattern` (string): Regular expression pattern
- `flags` (string): Regex flags ('g', 'gm', etc.)
- `replacement` (function): Receives named capture groups, returns HTML

### `md.unregister(name)`
Remove a feature by name.

### `md.parse(markdown)`
Convert markdown string to HTML.

### `md.help(featureName?)`
Get help documentation. Returns markdown by default, or prints colored output if `md.tty = true`.

### `md.list()`
Get array of all registered feature names.

## Philosophy

**Regular expressions are beautiful** when used for what they're good at: pattern matching in text. Chastity embraces this by:

1. **Making every feature a regex** - no hidden complexity
2. **Using named capture groups** - self-documenting patterns
3. **Teaching through examples** - learn regex by doing
4. **Keeping it simple** - if it needs a parser, it's too complex

Markdown was meant to be simple. Let's keep it that way.

## Contributing

Have a great regex pattern for a markdown feature? Share it! The best regular expressions deserve to be celebrated and reused.

## License

MIT

---

*"For the love of Simplicity and Regular Expressions"*
