USAGE
```js
import Chastity from 'chastity';

const md = new Chastity();

// Basic usage
console.log(md.parse(`# Hello\n---\n\nworld`));

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

// Terminal help
md.help();              // List all features
md.help('avif-picture'); // Detailed help

// Remove unwanted features
md.unregister('strikethrough');
```
