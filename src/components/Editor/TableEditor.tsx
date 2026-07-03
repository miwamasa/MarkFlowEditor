import React from 'react';
import { TableData } from '../../types';

interface TableEditorProps {
  tableData: TableData;
  onChange: (tableData: TableData) => void;
}

export const TableEditor: React.FC<TableEditorProps> = ({ tableData, onChange }) => {
  const handleHeaderChange = (colIndex: number, value: string) => {
    const newHeaders = [...tableData.headers];
    newHeaders[colIndex] = value;
    onChange({ ...tableData, headers: newHeaders });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = tableData.rows.map(row => [...row]);
    newRows[rowIndex][colIndex] = value;
    onChange({ ...tableData, rows: newRows });
  };

  const handleAddColumn = () => {
    onChange({
      headers: [...tableData.headers, `Column ${tableData.headers.length + 1}`],
      rows: tableData.rows.map(row => [...row, '']),
      alignments: [...(tableData.alignments || []), 'left']
    });
  };

  const handleRemoveLastColumn = () => {
    if (tableData.headers.length <= 1) return;
    onChange({
      headers: tableData.headers.slice(0, -1),
      rows: tableData.rows.map(row => row.slice(0, -1)),
      alignments: (tableData.alignments || []).slice(0, -1)
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    onChange({
      ...tableData,
      rows: tableData.rows.filter((_, i) => i !== rowIndex)
    });
  };

  const handleAddRow = () => {
    onChange({
      ...tableData,
      rows: [...tableData.rows, Array(tableData.headers.length).fill('')]
    });
  };

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      <div className="border border-gray-300 rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {tableData.headers.map((header, colIndex) => (
                <th key={colIndex} className="border-b border-gray-300 p-2">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(colIndex, e.target.value)}
                    className="w-full bg-transparent outline-none font-medium"
                    placeholder={`Header ${colIndex + 1}`}
                  />
                </th>
              ))}
              <th className="border-b border-gray-300 p-2 w-16">
                <div className="flex space-x-1">
                  <button
                    onClick={handleAddColumn}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    title="Add Column"
                  >
                    +
                  </button>
                  {tableData.headers.length > 1 && (
                    <button
                      onClick={handleRemoveLastColumn}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Remove Last Column"
                    >
                      -
                    </button>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border-b border-gray-200 p-2">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="w-full bg-transparent outline-none"
                      placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                    />
                  </td>
                ))}
                <td className="border-b border-gray-200 p-2 w-16">
                  {tableData.rows.length > 1 && (
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Delete Row"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={tableData.headers.length + 1} className="p-2">
                <button
                  onClick={handleAddRow}
                  className="w-full text-blue-600 hover:text-blue-800 text-sm py-1 border-2 border-dashed border-blue-300 rounded hover:border-blue-500"
                >
                  + Add Row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
