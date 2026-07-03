import React from 'react';
import { Block, BlockType, EmbedData, FileData, TableData } from '../../types';
import { findEmbedSource } from '../../utils/markdown';

type Resolver = (content: string) => string;

interface BlockRendererProps {
  block: Block;
  resolve: Resolver;
  files: FileData[];
}

const HEADING_STYLES: Partial<Record<BlockType, { Tag: React.ElementType; className: string }>> = {
  [BlockType.Heading1]: { Tag: 'h1', className: 'text-3xl font-bold mb-4' },
  [BlockType.Heading2]: { Tag: 'h2', className: 'text-2xl font-bold mb-3' },
  [BlockType.Heading3]: { Tag: 'h3', className: 'text-xl font-bold mb-2' },
  [BlockType.Heading4]: { Tag: 'h4', className: 'text-lg font-bold mb-2' },
  [BlockType.Heading5]: { Tag: 'h5', className: 'text-base font-bold mb-2' },
  [BlockType.Heading6]: { Tag: 'h6', className: 'text-sm font-bold mb-2' }
};

const EMBED_BORDER = 'border-l-4 border-blue-500 pl-4';

const RenderedTable: React.FC<{ tableData: TableData; resolve: Resolver; className: string }> = ({
  tableData,
  resolve,
  className
}) => (
  <table className={className}>
    <thead>
      <tr>
        {tableData.headers.map((header, headerIndex) => {
          const alignment = tableData.alignments?.[headerIndex] || 'left';
          return (
            <th
              key={headerIndex}
              className={`border border-gray-300 px-4 py-2 bg-gray-100 text-${alignment}`}
            >
              {resolve(header)}
            </th>
          );
        })}
      </tr>
    </thead>
    <tbody>
      {tableData.rows.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((cell, cellIndex) => {
            const alignment = tableData.alignments?.[cellIndex] || 'left';
            return (
              <td
                key={cellIndex}
                className={`border border-gray-300 px-4 py-2 text-${alignment}`}
              >
                {resolve(cell)}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
);

const renderLines = (content: string) =>
  content.split('\n').filter(line => line.trim());

/**
 * Render a block for the preview pane. `embedded` blocks (rendered through an
 * Embed block) get a blue left border marking their origin.
 */
const renderBlock = (
  block: Block,
  resolve: Resolver,
  files: FileData[],
  embedded: boolean
): React.ReactNode => {
  const content = block.content;
  const heading = HEADING_STYLES[block.type];

  if (heading && typeof content === 'string') {
    const { Tag, className } = heading;
    return (
      <Tag key={block.id} className={embedded ? `${className} ${EMBED_BORDER}` : className}>
        {resolve(content)}
      </Tag>
    );
  }

  switch (block.type) {
    case BlockType.Paragraph:
      if (typeof content === 'string') {
        return (
          <p key={block.id} className={embedded ? `mb-4 ${EMBED_BORDER}` : 'mb-4'}>
            {resolve(content)}
          </p>
        );
      }
      break;

    case BlockType.UnorderedList:
      if (typeof content === 'string') {
        return (
          <ul key={block.id} className="list-disc ml-6 mb-4">
            {renderLines(resolve(content)).map((line, lineIndex) => (
              <li key={lineIndex}>{line}</li>
            ))}
          </ul>
        );
      }
      break;

    case BlockType.OrderedList:
      if (typeof content === 'string') {
        return (
          <ol key={block.id} className="list-decimal ml-6 mb-4">
            {renderLines(resolve(content)).map((line, lineIndex) => (
              <li key={lineIndex}>{line}</li>
            ))}
          </ol>
        );
      }
      break;

    case BlockType.Code:
      if (typeof content === 'string') {
        return (
          <pre key={block.id} className="bg-gray-100 p-4 rounded-md mb-4 overflow-x-auto">
            <code>{resolve(content)}</code>
          </pre>
        );
      }
      break;

    case BlockType.Table: {
      const tableData = content as TableData;
      if (tableData && tableData.headers && tableData.headers.length > 0) {
        if (embedded) {
          return (
            <div key={block.id} className={`${EMBED_BORDER} mb-4`}>
              <RenderedTable
                tableData={tableData}
                resolve={resolve}
                className="w-full border-collapse border border-gray-300"
              />
            </div>
          );
        }
        return (
          <RenderedTable
            key={block.id}
            tableData={tableData}
            resolve={resolve}
            className="w-full border-collapse border border-gray-300 mb-4"
          />
        );
      }
      if (!embedded) {
        return <div key={block.id} className="mb-4 text-gray-500">[Empty Table]</div>;
      }
      break;
    }

    case BlockType.Quote:
      if (typeof content === 'string') {
        return (
          <blockquote key={block.id} className="border-l-4 border-gray-300 pl-4 italic mb-4">
            {resolve(content)}
          </blockquote>
        );
      }
      break;

    case BlockType.Image:
      if (typeof content === 'string') {
        return (
          <img key={block.id} src={resolve(content)} alt="" className="mb-4 max-w-full h-auto" />
        );
      }
      break;

    case BlockType.Link:
      if (typeof content === 'string' && content.includes('|')) {
        const [text, url] = content.split('|');
        return (
          <a key={block.id} href={resolve(url)} className="text-blue-600 underline mb-4 block">
            {resolve(text)}
          </a>
        );
      }
      break;

    case BlockType.JsonSchema:
      if (typeof content === 'string') {
        return (
          <pre key={block.id} className="bg-purple-100 p-4 rounded-md mb-4 overflow-x-auto">
            <code className="text-purple-800">{resolve(content)}</code>
          </pre>
        );
      }
      break;

    case BlockType.Output:
      if (typeof content === 'string') {
        return (
          <pre key={block.id} className="bg-blue-100 p-4 rounded-md mb-4 overflow-x-auto">
            <code className="text-blue-800">{resolve(content)}</code>
          </pre>
        );
      }
      break;

    case BlockType.Embed: {
      if (!content) break;
      const sourceBlock = findEmbedSource(content as EmbedData, files);
      if (!sourceBlock) {
        return (
          <div key={block.id} className={`mb-4 border-l-4 border-red-500 pl-4 text-red-600`}>
            [Embedded block not found]
          </div>
        );
      }

      const isRenderableEmbed =
        HEADING_STYLES[sourceBlock.type] !== undefined ||
        sourceBlock.type === BlockType.Paragraph ||
        sourceBlock.type === BlockType.Table;

      if (isRenderableEmbed) {
        // Key on the embed block's id so multiple embeds of one source stay unique
        return renderBlock({ ...sourceBlock, id: block.id }, resolve, files, true);
      }
      return (
        <div key={block.id} className={`mb-4 ${EMBED_BORDER} text-gray-600`}>
          [Embedded {sourceBlock.type} content]
        </div>
      );
    }

    default:
      return <div key={block.id} className="mb-4 text-gray-500">[{block.type} Block]</div>;
  }

  return null;
};

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, resolve, files }) => (
  <>{renderBlock(block, resolve, files, false)}</>
);
