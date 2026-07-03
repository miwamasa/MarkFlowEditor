import { Block, BlockType, EmbedData, FileData, TableData } from '../types';

const HEADING_PREFIXES: Partial<Record<BlockType, string>> = {
  [BlockType.Heading1]: '#',
  [BlockType.Heading2]: '##',
  [BlockType.Heading3]: '###',
  [BlockType.Heading4]: '####',
  [BlockType.Heading5]: '#####',
  [BlockType.Heading6]: '######'
};

export const tableToMarkdown = (tableData: TableData): string => {
  if (!tableData || !tableData.headers || tableData.headers.length === 0) {
    return '[Empty Table]';
  }

  const headerRow = `| ${tableData.headers.join(' | ')} |`;
  const separatorRow = `| ${tableData.headers.map((_, idx) => {
    const alignment = tableData.alignments?.[idx] || 'left';
    switch (alignment) {
      case 'center': return ':---:';
      case 'right': return '---:';
      default: return '---';
    }
  }).join(' | ')} |`;
  const dataRows = tableData.rows.map(row => `| ${row.join(' | ')} |`).join('\n');

  return `${headerRow}\n${separatorRow}\n${dataRows}`;
};

export const findEmbedSource = (embedData: EmbedData, files: FileData[]): Block | undefined => {
  const sourceFile = files.find(f => f.id === embedData.sourceFileId);
  return sourceFile?.blocks.find(b => b.id === embedData.sourceBlockId);
};

const blockToMarkdown = (block: Block, files: FileData[]): string => {
  const content = block.content;
  const headingPrefix = HEADING_PREFIXES[block.type];

  if (headingPrefix) {
    return typeof content === 'string' ? `${headingPrefix} ${content}\n\n` : '';
  }

  switch (block.type) {
    case BlockType.Paragraph:
      return typeof content === 'string' ? `${content}\n\n` : '';

    case BlockType.UnorderedList:
      if (typeof content !== 'string') return '';
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => `- ${line}\n`)
        .join('') + '\n';

    case BlockType.OrderedList:
      if (typeof content !== 'string') return '';
      return content
        .split('\n')
        .filter(line => line.trim())
        .map((line, index) => `${index + 1}. ${line}\n`)
        .join('') + '\n';

    case BlockType.Code:
      return typeof content === 'string' ? `\`\`\`\n${content}\n\`\`\`\n\n` : '';

    case BlockType.Table:
      return tableToMarkdown(content as TableData);

    case BlockType.Quote:
      if (typeof content !== 'string') return '';
      return content.split('\n').map(line => `> ${line}\n`).join('');

    case BlockType.Image:
      return typeof content === 'string' ? `![Image](${content})` : '';

    case BlockType.Link:
      if (typeof content === 'string' && content.includes('|')) {
        const [text, url] = content.split('|');
        return `[${text}](${url})`;
      }
      return '';

    case BlockType.JsonSchema:
      return typeof content === 'string' ? `\`\`\`json\n${content}\n\`\`\`` : '';

    case BlockType.Output:
      return typeof content === 'string' ? `\`\`\`\n${content}\n\`\`\`` : '';

    case BlockType.Embed: {
      if (!content) return '';
      const sourceBlock = findEmbedSource(content as EmbedData, files);
      if (!sourceBlock) {
        return '[Embedded block not found]\n\n';
      }
      if (typeof sourceBlock.content === 'string') {
        return `${sourceBlock.content}\n\n`;
      }
      if (sourceBlock.type === BlockType.Table) {
        return `${tableToMarkdown(sourceBlock.content as TableData)}\n\n`;
      }
      return `[Embedded ${sourceBlock.type} content]\n\n`;
    }

    default:
      return `[${block.type} Block]`;
  }
};

/** Convert a file's blocks to a single markdown document (variables unresolved). */
export const fileToMarkdown = (file: FileData, files: FileData[]): string =>
  file.blocks.map(block => blockToMarkdown(block, files)).join('');
