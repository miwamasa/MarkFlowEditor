import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Variable, BlockType, TableData, EmbedData } from '../../types';
import { crossFileVariableService } from '../../services/crossFileVariableService';

export const Preview: React.FC = () => {
  const { state } = useApp();
  const [showMarkdown, setShowMarkdown] = useState(false);
  const currentFile = state.project.files.find(f => f.id === state.currentFileId);

  const resolveVariables = useCallback((content: string, variables: Variable[]): string => {
    let resolved = content;
    
    // First, resolve cross-file variable references if we have a current file
    if (currentFile) {
      resolved = crossFileVariableService.resolveContent(resolved, currentFile.id, state.project);
    }
    
    // Then resolve regular {{variable}} patterns
    // Create a map for quick lookup
    const variableMap = new Map(variables.map(v => [v.key, v.value]));
    
    // Replace {{variable}} patterns
    resolved = resolved.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      
      // Handle global scope explicitly
      if (trimmedKey.startsWith('GLOBAL.')) {
        const globalKey = trimmedKey.substring(7);
        const globalVar = state.project.globalVariables.find(v => v.key === globalKey);
        return globalVar ? globalVar.value : `[Unknown Global: ${globalKey}]`;
      }
      
      return variableMap.get(trimmedKey) || `[Unknown: ${trimmedKey}]`;
    });
    
    return resolved;
  }, [state.project.globalVariables, state.project, currentFile]);

  const markdown = useMemo(() => {
    if (!currentFile) return '';

    // Combine global and local variables
    const allVariables = [
      ...state.project.globalVariables,
      ...currentFile.localVariables
    ];

    let result = '';

    currentFile.blocks.forEach((block) => {
      switch (block.type) {
        case BlockType.Heading1:
          if (typeof block.content === 'string') {
            result += `# ${block.content}\n\n`;
          }
          break;
        case BlockType.Heading2:
          if (typeof block.content === 'string') {
            result += `## ${block.content}\n\n`;
          }
          break;
        case BlockType.Heading3:
          if (typeof block.content === 'string') {
            result += `### ${block.content}\n\n`;
          }
          break;
        case BlockType.Heading4:
          if (typeof block.content === 'string') {
            result += `#### ${block.content}\n\n`;
          }
          break;
        case BlockType.Heading5:
          if (typeof block.content === 'string') {
            result += `##### ${block.content}\n\n`;
          }
          break;
        case BlockType.Heading6:
          if (typeof block.content === 'string') {
            result += `###### ${block.content}\n\n`;
          }
          break;
        case BlockType.Paragraph:
          if (typeof block.content === 'string') {
            result += `${block.content}\n\n`;
          }
          break;
        case BlockType.UnorderedList:
          if (typeof block.content === 'string') {
            const lines = block.content.split('\n').filter(line => line.trim());
            lines.forEach(line => {
              result += `- ${line}\n`;
            });
            result += '\n';
          }
          break;
        case BlockType.OrderedList:
          if (typeof block.content === 'string') {
            const lines = block.content.split('\n').filter(line => line.trim());
            lines.forEach((line, index) => {
              result += `${index + 1}. ${line}\n`;
            });
            result += '\n';
          }
          break;
        case BlockType.Code:
          if (typeof block.content === 'string') {
            result += `\`\`\`\n${block.content}\n\`\`\`\n\n`;
          }
          break;
        case BlockType.Table:
          const tableData = block.content as TableData;
          if (tableData && tableData.headers && tableData.headers.length > 0) {
            const headerRow = `| ${tableData.headers.join(' | ')} |`;
            const separatorRow = `| ${tableData.headers.map((_, idx) => {
              const alignment = tableData.alignments?.[idx] || 'left';
              switch (alignment) {
                case 'center': return ':---:';
                case 'right': return '---:';
                default: return '---';
              }
            }).join(' | ')} |`;
            
            const dataRows = tableData.rows.map(row => 
              `| ${row.join(' | ')} |`
            ).join('\n');
            
            result += `${headerRow}\n${separatorRow}\n${dataRows}`;
          } else {
            result += '[Empty Table]';
          }
          break;
        case BlockType.Quote:
          if (typeof block.content === 'string') {
            const lines = block.content.split('\n');
            lines.forEach(line => {
              result += `> ${line}\n`;
            });
          }
          break;
        case BlockType.Image:
          if (typeof block.content === 'string') {
            result += `![Image](${block.content})`;
          }
          break;
        case BlockType.Link:
          if (typeof block.content === 'string' && block.content.includes('|')) {
            const [text, url] = block.content.split('|');
            result += `[${text}](${url})`;
          }
          break;
        case BlockType.JsonSchema:
          if (typeof block.content === 'string') {
            result += `\`\`\`json\n${block.content}\n\`\`\``;
          }
          break;
        case BlockType.Output:
          if (typeof block.content === 'string') {
            result += `\`\`\`\n${block.content}\n\`\`\``;
          }
          break;
        case BlockType.Embed:
          // Handle embedded blocks
          if (block.content) {
            const embedData = block.content as EmbedData;
            const sourceFile = state.project.files.find(f => f.id === embedData.sourceFileId);
            const sourceBlock = sourceFile?.blocks.find(b => b.id === embedData.sourceBlockId);
            
            if (sourceBlock) {
              // Recursively render the source block's content
              if (typeof sourceBlock.content === 'string') {
                result += `${sourceBlock.content}\n\n`;
              } else if (sourceBlock.type === BlockType.Table) {
                const tableData = sourceBlock.content as TableData;
                if (tableData && tableData.headers && tableData.headers.length > 0) {
                  const headerRow = `| ${tableData.headers.join(' | ')} |`;
                  const separatorRow = `| ${tableData.headers.map((_, idx) => {
                    const alignment = tableData.alignments?.[idx] || 'left';
                    switch (alignment) {
                      case 'center': return ':---:';
                      case 'right': return '---:';
                      default: return '---';
                    }
                  }).join(' | ')} |`;
                  
                  const dataRows = tableData.rows.map(row => 
                    `| ${row.join(' | ')} |`
                  ).join('\n');
                  
                  result += `${headerRow}\n${separatorRow}\n${dataRows}\n\n`;
                } else {
                  result += '[Empty Table]\n\n';
                }
              } else {
                result += `[Embedded ${sourceBlock.type} content]\n\n`;
              }
            } else {
              result += `[Embedded block not found]\n\n`;
            }
          }
          break;
        default:
          result += `[${block.type} Block]`;
      }
    });

    // Replace variables
    return resolveVariables(result, allVariables);
  }, [currentFile, state.project.globalVariables, resolveVariables]);

  const renderedContent = useMemo(() => {
    if (!currentFile) return null;

    // Combine global and local variables
    const allVariables = [
      ...state.project.globalVariables,
      ...currentFile.localVariables
    ];

    // Render blocks as HTML
    return currentFile.blocks.map((block, index) => {
      switch (block.type) {
        case BlockType.Heading1:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return <h1 key={block.id} className="text-3xl font-bold mb-4">{resolvedContent}</h1>;
          }
          break;
        case BlockType.Heading2:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return <h2 key={block.id} className="text-2xl font-bold mb-3">{resolvedContent}</h2>;
          }
          break;
        case BlockType.Heading3:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return <h3 key={block.id} className="text-xl font-bold mb-2">{resolvedContent}</h3>;
          }
          break;
        case BlockType.Heading4:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return <h4 key={block.id} className="text-lg font-bold mb-2">{resolvedContent}</h4>;
          }
          break;
        case BlockType.Heading5:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return <h5 key={block.id} className="text-base font-bold mb-2">{resolvedContent}</h5>;
          }
          break;
        case BlockType.Heading6:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return <h6 key={block.id} className="text-sm font-bold mb-2">{resolvedContent}</h6>;
          }
          break;
        case BlockType.Paragraph:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return <p key={block.id} className="mb-4">{resolvedContent}</p>;
          }
          break;
        case BlockType.UnorderedList:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            const lines = resolvedContent.split('\n').filter(line => line.trim());
            return (
              <ul key={block.id} className="list-disc ml-6 mb-4">
                {lines.map((line, lineIndex) => (
                  <li key={lineIndex}>{line}</li>
                ))}
              </ul>
            );
          }
          break;
        case BlockType.OrderedList:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            const lines = resolvedContent.split('\n').filter(line => line.trim());
            return (
              <ol key={block.id} className="list-decimal ml-6 mb-4">
                {lines.map((line, lineIndex) => (
                  <li key={lineIndex}>{line}</li>
                ))}
              </ol>
            );
          }
          break;
        case BlockType.Code:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return (
              <pre key={block.id} className="bg-gray-100 p-4 rounded-md mb-4 overflow-x-auto">
                <code>{resolvedContent}</code>
              </pre>
            );
          }
          break;
        case BlockType.Table:
          const tableData = block.content as TableData;
          if (tableData && tableData.headers && tableData.headers.length > 0) {
            return (
              <table key={block.id} className="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr>
                    {tableData.headers.map((header, headerIndex) => {
                      const resolvedHeader = resolveVariables(header, allVariables);
                      const alignment = tableData.alignments?.[headerIndex] || 'left';
                      return (
                        <th 
                          key={headerIndex} 
                          className={`border border-gray-300 px-4 py-2 bg-gray-100 text-${alignment}`}
                        >
                          {resolvedHeader}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => {
                        const resolvedCell = resolveVariables(cell, allVariables);
                        const alignment = tableData.alignments?.[cellIndex] || 'left';
                        return (
                          <td 
                            key={cellIndex} 
                            className={`border border-gray-300 px-4 py-2 text-${alignment}`}
                          >
                            {resolvedCell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          } else {
            return <div key={block.id} className="mb-4 text-gray-500">[Empty Table]</div>;
          }
        case BlockType.Quote:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return (
              <blockquote key={block.id} className="border-l-4 border-gray-300 pl-4 italic mb-4">
                {resolvedContent}
              </blockquote>
            );
          }
          break;
        case BlockType.Image:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return (
              <img key={block.id} src={resolvedContent} alt="Image" className="mb-4 max-w-full h-auto" />
            );
          }
          break;
        case BlockType.Link:
          if (typeof block.content === 'string' && block.content.includes('|')) {
            const [text, url] = block.content.split('|');
            const resolvedText = resolveVariables(text, allVariables);
            const resolvedUrl = resolveVariables(url, allVariables);
            return (
              <a key={block.id} href={resolvedUrl} className="text-blue-600 underline mb-4 block">
                {resolvedText}
              </a>
            );
          }
          break;
        case BlockType.JsonSchema:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return (
              <pre key={block.id} className="bg-purple-100 p-4 rounded-md mb-4 overflow-x-auto">
                <code className="text-purple-800">{resolvedContent}</code>
              </pre>
            );
          }
          break;
        case BlockType.Output:
          if (typeof block.content === 'string') {
            const resolvedContent = resolveVariables(block.content, allVariables);
            return (
              <pre key={block.id} className="bg-blue-100 p-4 rounded-md mb-4 overflow-x-auto">
                <code className="text-blue-800">{resolvedContent}</code>
              </pre>
            );
          }
          break;
        case BlockType.Embed:
          // Handle embedded blocks in rendered view
          if (block.content) {
            const embedData = block.content as EmbedData;
            const sourceFile = state.project.files.find(f => f.id === embedData.sourceFileId);
            const sourceBlock = sourceFile?.blocks.find(b => b.id === embedData.sourceBlockId);
            
            if (sourceBlock) {
              // Render based on the source block type
              switch (sourceBlock.type) {
                case BlockType.Heading1:
                  if (typeof sourceBlock.content === 'string') {
                    const resolvedContent = resolveVariables(sourceBlock.content, allVariables);
                    return <h1 key={block.id} className="text-3xl font-bold mb-4 border-l-4 border-blue-500 pl-4">{resolvedContent}</h1>;
                  }
                  break;
                case BlockType.Heading2:
                  if (typeof sourceBlock.content === 'string') {
                    const resolvedContent = resolveVariables(sourceBlock.content, allVariables);
                    return <h2 key={block.id} className="text-2xl font-bold mb-3 border-l-4 border-blue-500 pl-4">{resolvedContent}</h2>;
                  }
                  break;
                case BlockType.Heading3:
                  if (typeof sourceBlock.content === 'string') {
                    const resolvedContent = resolveVariables(sourceBlock.content, allVariables);
                    return <h3 key={block.id} className="text-xl font-bold mb-2 border-l-4 border-blue-500 pl-4">{resolvedContent}</h3>;
                  }
                  break;
                case BlockType.Heading4:
                  if (typeof sourceBlock.content === 'string') {
                    const resolvedContent = resolveVariables(sourceBlock.content, allVariables);
                    return <h4 key={block.id} className="text-lg font-bold mb-2 border-l-4 border-blue-500 pl-4">{resolvedContent}</h4>;
                  }
                  break;
                case BlockType.Heading5:
                  if (typeof sourceBlock.content === 'string') {
                    const resolvedContent = resolveVariables(sourceBlock.content, allVariables);
                    return <h5 key={block.id} className="text-base font-bold mb-2 border-l-4 border-blue-500 pl-4">{resolvedContent}</h5>;
                  }
                  break;
                case BlockType.Heading6:
                  if (typeof sourceBlock.content === 'string') {
                    const resolvedContent = resolveVariables(sourceBlock.content, allVariables);
                    return <h6 key={block.id} className="text-sm font-bold mb-2 border-l-4 border-blue-500 pl-4">{resolvedContent}</h6>;
                  }
                  break;
                case BlockType.Paragraph:
                  if (typeof sourceBlock.content === 'string') {
                    const resolvedContent = resolveVariables(sourceBlock.content, allVariables);
                    return <p key={block.id} className="mb-4 border-l-4 border-blue-500 pl-4">{resolvedContent}</p>;
                  }
                  break;
                case BlockType.Table:
                  const tableData = sourceBlock.content as TableData;
                  if (tableData && tableData.headers && tableData.headers.length > 0) {
                    return (
                      <div key={block.id} className="border-l-4 border-blue-500 pl-4 mb-4">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr>
                              {tableData.headers.map((header, headerIndex) => {
                                const resolvedHeader = resolveVariables(header, allVariables);
                                const alignment = tableData.alignments?.[headerIndex] || 'left';
                                return (
                                  <th 
                                    key={headerIndex} 
                                    className={`border border-gray-300 px-4 py-2 bg-gray-100 text-${alignment}`}
                                  >
                                    {resolvedHeader}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => {
                                  const resolvedCell = resolveVariables(cell, allVariables);
                                  const alignment = tableData.alignments?.[cellIndex] || 'left';
                                  return (
                                    <td 
                                      key={cellIndex} 
                                      className={`border border-gray-300 px-4 py-2 text-${alignment}`}
                                    >
                                      {resolvedCell}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  break;
                default:
                  return (
                    <div key={block.id} className="mb-4 border-l-4 border-blue-500 pl-4 text-gray-600">
                      [Embedded {sourceBlock.type} content]
                    </div>
                  );
              }
            } else {
              return (
                <div key={block.id} className="mb-4 border-l-4 border-red-500 pl-4 text-red-600">
                  [Embedded block not found]
                </div>
              );
            }
          }
          break;
        default:
          return <div key={block.id} className="mb-4 text-gray-500">[{block.type} Block]</div>;
      }
    });
  }, [currentFile, state.project.globalVariables, resolveVariables]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown).then(() => {
      // TODO: Show success toast
      console.log('Markdown copied to clipboard');
    }).catch(() => {
      console.error('Failed to copy markdown');
    });
  };

  if (!currentFile) {
    return (
      <div className="flex-1 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-gray-500 text-lg">
          Select a file to preview
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {currentFile.name} - Preview
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMarkdown(!showMarkdown)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              showMarkdown 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showMarkdown ? '📄 Rendered' : '🔤 Markdown'}
          </button>
          <button
            onClick={handleCopyMarkdown}
            className="bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            📋 Copy Markdown
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {showMarkdown ? (
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {markdown}
          </pre>
        ) : (
          <div className="prose max-w-none">
            {renderedContent}
          </div>
        )}
      </div>
    </div>
  );
};