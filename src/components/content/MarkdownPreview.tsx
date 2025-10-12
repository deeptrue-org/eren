import { FileText } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        <div className="text-center">
          <FileText className="mx-auto mb-4 w-12 h-12 opacity-50" />
          <p>No content to preview</p>
        </div>
      </div>
    );
  }

  // Simple markdown parsing for common elements
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const result: JSX.Element[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle images
      if (trimmedLine.match(/^!\[.*?\]\(.*?\)/)) {
        const imageMatch = trimmedLine.match(
          /^!\[(.*?)\]\((.*?)\s*(?:"(.*?)")?\)/
        );
        if (imageMatch) {
          const [, alt, src, title] = imageMatch;
          result.push(
            <div
              key={i}
              className="p-4 my-6 text-center bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed"
            >
              <div className="flex flex-col gap-2 items-center text-gray-600">
                <div className="flex justify-center items-center w-16 h-16 bg-gray-200 rounded-lg">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">{alt || 'Image'}</div>
                  <div className="text-xs text-gray-500">{src}</div>
                  {title && <div className="text-xs italic">{title}</div>}
                </div>
              </div>
            </div>
          );
          continue;
        }
      }

      // Handle tables
      if (trimmedLine.includes('|') && !trimmedLine.startsWith('#')) {
        if (!inTable) {
          inTable = true;
          tableHeaders = trimmedLine
            .split('|')
            .map((h) => h.trim())
            .filter((h) => h !== '');
        } else if (trimmedLine.match(/^[\|\s\-]+$/)) {
          // Table separator line - skip
          continue;
        } else {
          const row = trimmedLine
            .split('|')
            .map((c) => c.trim())
            .filter((c) => c !== '');
          if (row.length > 0) {
            tableRows.push(row);
          }
        }

        // Check if next line is still part of table
        const nextLine = lines[i + 1];
        if (!nextLine || !nextLine.trim().includes('|')) {
          // End of table
          if (tableHeaders.length > 0 && tableRows.length > 0) {
            result.push(
              <div key={i} className="overflow-x-auto my-6">
                <table className="w-full bg-white rounded-lg border border-gray-300 border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      {tableHeaders.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-2 font-semibold text-left text-gray-900 border border-gray-300"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-4 py-2 text-gray-700 border border-gray-300"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        continue;
      }

      // Reset table state if we encounter non-table content
      if (inTable && !trimmedLine.includes('|')) {
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }

      // Handle headings
      if (trimmedLine.startsWith('#')) {
        const level = trimmedLine.match(/^#+/)?.[0].length || 1;
        const text = trimmedLine.replace(/^#+\s*/, '');
        const headingClasses = {
          1: 'text-3xl font-bold mt-8 mb-4 text-gray-900',
          2: 'text-2xl font-bold mt-6 mb-3 text-gray-800',
          3: 'text-xl font-semibold mt-4 mb-2 text-gray-700',
          4: 'text-lg font-semibold mt-3 mb-2 text-gray-700',
          5: 'text-base font-semibold mt-2 mb-1 text-gray-700',
          6: 'text-sm font-semibold mt-2 mb-1 text-gray-700',
        };
        const className =
          headingClasses[level as keyof typeof headingClasses] ||
          headingClasses[6];
        result.push(
          <div key={i} className={className}>
            {text}
          </div>
        );
        continue;
      }

      // Handle blockquotes
      if (trimmedLine.startsWith('>')) {
        const text = trimmedLine.replace(/^>\s*/, '');
        result.push(
          <blockquote
            key={i}
            className="py-2 pl-4 my-4 italic text-gray-700 bg-blue-50 border-l-4 border-blue-500"
          >
            {text}
          </blockquote>
        );
        continue;
      }

      // Handle bullet points
      if (trimmedLine.match(/^[\*\-\+]\s+/)) {
        const text = trimmedLine.replace(/^[\*\-\+]\s+/, '');
        result.push(
          <div key={i} className="flex gap-2 items-start my-1 ml-4">
            <span className="text-blue-600 mt-1.5 text-xs">•</span>
            <span className="text-gray-700">{text}</span>
          </div>
        );
        continue;
      }

      // Handle numbered lists
      if (trimmedLine.match(/^\d+\.\s+/)) {
        const text = trimmedLine.replace(/^\d+\.\s+/, '');
        const number = trimmedLine.match(/^(\d+)\./)?.[1] || '1';
        result.push(
          <div key={i} className="flex gap-2 items-start my-1 ml-4">
            <span className="text-blue-600 mt-0.5 text-sm font-medium">
              {number}.
            </span>
            <span className="text-gray-700">{text}</span>
          </div>
        );
        continue;
      }

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        const nextCodeEnd = lines.findIndex(
          (l, idx) => idx > i && l.trim() === '```'
        );
        if (nextCodeEnd > i) {
          const codeContent = lines.slice(i + 1, nextCodeEnd).join('\n');
          result.push(
            <pre
              key={i}
              className="overflow-x-auto p-4 my-4 text-gray-100 bg-gray-900 rounded-lg"
            >
              <code>{codeContent}</code>
            </pre>
          );
          i = nextCodeEnd; // Skip to end of code block
          continue;
        }
      }

      // Handle empty lines
      if (!trimmedLine) {
        result.push(<div key={i} className="h-4"></div>);
        continue;
      }

      // Handle regular paragraphs with inline formatting
      let formattedText = trimmedLine;

      // Handle bold text
      formattedText = formattedText.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-gray-900">$1</strong>'
      );

      // Handle italic text
      formattedText = formattedText.replace(
        /\*(.*?)\*/g,
        '<em class="italic">$1</em>'
      );

      // Handle inline code
      formattedText = formattedText.replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>'
      );

      result.push(
        <div
          key={i}
          className="my-2 leading-relaxed text-gray-700"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    }

    return result;
  };

  return (
    <div className="max-w-none prose prose-sm">
      <div className="space-y-2">{parseMarkdown(content)}</div>
    </div>
  );
}
