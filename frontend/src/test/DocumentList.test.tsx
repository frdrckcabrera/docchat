import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DocumentList } from '../components/DocumentList';
import type { Document } from '../types';

const sample: Document[] = [
  {
    id: 1,
    filename: 'handbook.pdf',
    content_type: 'application/pdf',
    size_bytes: 12345,
    chunk_count: 8,
    created_at: '2025-01-01T00:00:00',
  },
  {
    id: 2,
    filename: 'notes.md',
    content_type: 'text/markdown',
    size_bytes: 567,
    chunk_count: 2,
    created_at: '2025-01-02T00:00:00',
  },
];

describe('DocumentList', () => {
  it('renders an empty state when there are no documents', () => {
    render(
      <DocumentList
        documents={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
  });

  it('renders each document by filename', () => {
    render(
      <DocumentList
        documents={sample}
        selectedId={null}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('handbook.pdf')).toBeInTheDocument();
    expect(screen.getByText('notes.md')).toBeInTheDocument();
  });

  it('shows chunk count and file size', () => {
    render(
      <DocumentList
        documents={sample}
        selectedId={null}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/8 chunks/)).toBeInTheDocument();
    expect(screen.getByText(/2 chunks/)).toBeInTheDocument();
  });
});
