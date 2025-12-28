import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import { full as emoji } from 'markdown-it-emoji';
import anchor from 'markdown-it-anchor';
import attrs from 'markdown-it-attrs';
import imageFigures from 'markdown-it-image-figures';
import hljs from 'highlight.js';

export function createMarkdownRenderer() {
  const md: MarkdownIt = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str: string, lang: string): string {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs language-${lang}"><code>` +
                 hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                 '</code></pre>';
        } catch (__) {}
      }
      return `<pre class="hljs language-text"><code>` + md.utils.escapeHtml(str) + '</code></pre>';
    }
  });

  // Plugins
  md.use(taskLists);
  md.use(footnote);
  md.use(emoji);
  md.use(anchor, {
    permalink: anchor.permalink.headerLink()
  });
  md.use(attrs);
  md.use(imageFigures, {
    figcaption: true,
    copyAttrs: 'class',
  });

  // Custom Containers (VuePress/Plume style)
  md.use(container as any, 'tip', {
    render: function (tokens: any[], idx: number) {
      const token = tokens[idx];
      const info = token.info.trim().slice('tip'.length).trim();
      if (token.nesting === 1) {
        return `<div class="custom-container tip"><p class="custom-container-title">${info || 'TIP'}</p>\n`;
      } else {
        return '</div>\n';
      }
    }
  });

  md.use(container as any, 'warning', {
    render: function (tokens: any[], idx: number) {
      const token = tokens[idx];
      const info = token.info.trim().slice('warning'.length).trim();
      if (token.nesting === 1) {
        return `<div class="custom-container warning"><p class="custom-container-title">${info || 'WARNING'}</p>\n`;
      } else {
        return '</div>\n';
      }
    }
  });

  md.use(container as any, 'danger', {
    render: function (tokens: any[], idx: number) {
      const token = tokens[idx];
      const info = token.info.trim().slice('danger'.length).trim();
      if (token.nesting === 1) {
        return `<div class="custom-container danger"><p class="custom-container-title">${info || 'DANGER'}</p>\n`;
      } else {
        return '</div>\n';
      }
    }
  });

  md.use(container as any, 'details', {
    render: function (tokens: any[], idx: number) {
      const token = tokens[idx];
      const info = token.info.trim().slice('details'.length).trim();
      if (token.nesting === 1) {
        return `<details class="custom-container details"><summary class="custom-container-title">${info || 'Details'}</summary>\n`;
      } else {
        return '</details>\n';
      }
    }
  });

  md.use(container as any, 'note', {
    render: function (tokens: any[], idx: number) {
      const token = tokens[idx];
      const info = token.info.trim().slice('note'.length).trim();
      if (token.nesting === 1) {
        return `<div class="custom-container note"><p class="custom-container-title">${info || 'NOTE'}</p>\n`;
      } else {
        return '</div>\n';
      }
    }
  });

  // Custom Code Group Container (simplified)
  md.use(container as any, 'code-group', {
    render: function (tokens: any[], idx: number) {
      if (tokens[idx].nesting === 1) {
        return `<div class="code-group">\n`;
      } else {
        return '</div>\n';
      }
    }
  });

  // Custom Code Group Item Container
  md.use(container as any, 'code-group-item', {
    render: function (tokens: any[], idx: number) {
        const token = tokens[idx];
        const info = token.info.trim().slice('code-group-item'.length).trim();
        if (tokens[idx].nesting === 1) {
            return `<div class="code-group-item" data-title="${info}">\n`;
        } else {
            return '</div>\n';
        }
    }
  });

  return md;
}
