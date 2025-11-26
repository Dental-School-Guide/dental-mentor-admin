"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Headings
        h1: ({ ...props }) => (
          <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
        ),
        h2: ({ ...props }) => (
          <h2 className="text-xl font-bold mt-3 mb-2" {...props} />
        ),
        h3: ({ ...props }) => (
          <h3 className="text-lg font-semibold mt-2 mb-1" {...props} />
        ),
        // Paragraphs
        p: ({ ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
        // Lists
        ul: ({ ...props }) => (
          <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
        ),
        ol: ({ ...props }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
        ),
        li: ({ ...props }) => <li className="ml-2" {...props} />,
        // Code
        code: ({ inline, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) =>
          inline ? (
            <code
              className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono"
              {...props}
            />
          ) : (
            <code
              className="block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto my-2"
              {...props}
            />
          ),
        pre: ({ ...props }) => (
          <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-2" {...props} />
        ),
        // Links
        a: ({ ...props }) => (
          <a
            className="text-primary underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        // Blockquotes
        blockquote: ({ ...props }) => (
          <blockquote
            className="border-l-4 border-muted-foreground/30 pl-4 italic my-2"
            {...props}
          />
        ),
        // Tables
        table: ({ ...props }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border-collapse border border-border" {...props} />
          </div>
        ),
        th: ({ ...props }) => (
          <th className="border border-border px-3 py-2 bg-muted font-semibold" {...props} />
        ),
        td: ({ ...props }) => (
          <td className="border border-border px-3 py-2" {...props} />
        ),
        // Horizontal rule
        hr: ({ ...props }) => (
          <hr className="my-4 border-border" {...props} />
        ),
        // Strong/Bold
        strong: ({ ...props }) => (
          <strong className="font-bold" {...props} />
        ),
        // Emphasis/Italic
        em: ({ ...props }) => <em className="italic" {...props} />,
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
