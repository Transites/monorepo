// @vitest-environment jsdom

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useSearch } from './use-search';
import * as api from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    search: vi.fn(),
  };
});

describe('useSearch pagination flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests the next page using the correct skip offset', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const mockedSearch = vi.mocked(api.search);
    mockedSearch.mockResolvedValue({
      submissions: [],
      pagination: {
        page: 2,
        limit: 10,
        total: 29,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      },
    });

    const TestComponent = () => {
      const { search } = useSearch({ threshold: 0.15, top: 10, debounceMs: 0 });

      return (
        <button
          type="button"
          onClick={() => search('pagu', true, 2)}
        >
          próxima
        </button>
      );
    };

    await act(async () => {
      root.render(<TestComponent />);
    });

    await act(async () => {
      const button = container.querySelector('button');
      button?.click();
    });

    expect(mockedSearch).toHaveBeenCalledWith('pagu', {
      threshold: 0.15,
      top: 10,
      skip: 10,
    });

    root.unmount();
    document.body.removeChild(container);
  });
});
