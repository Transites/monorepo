// @vitest-environment jsdom

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { SearchResults } from './SearchResults';

describe('SearchResults pagination', () => {
  it('calls onPageChange without forcing a browser scroll when the next and previous buttons are clicked', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const onPageChange = vi.fn();
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(SearchResults, {
            query: 'teste',
            results: {
              submissions: [
                {
                  id: '1',
                  title: 'Artigo de teste',
                  category: 'pessoa',
                  status: 'PUBLISHED',
                  created_at: '2024-01-01',
                  updated_at: '2024-01-02',
                  expires_at: '2025-01-01',
                  summary: 'Resumo',
                  author_name: 'Autor',
                },
              ],
              pagination: {
                page: 2,
                limit: 10,
                total: 25,
                totalPages: 3,
                hasNext: true,
                hasPrev: true,
              },
            },
            onPageChange,
          })
        )
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const prevButton = buttons.find((button) => button.textContent?.includes('Anterior'));
    const nextButton = buttons.find((button) => button.textContent?.includes('Próxima'));

    expect(prevButton).toBeTruthy();
    expect(nextButton).toBeTruthy();

    const prevBlurSpy = vi.spyOn(prevButton as HTMLButtonElement, 'blur');
    const nextBlurSpy = vi.spyOn(nextButton as HTMLButtonElement, 'blur');

    await act(async () => {
      (prevButton as HTMLButtonElement).click();
      (nextButton as HTMLButtonElement).click();
    });

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(prevBlurSpy).toHaveBeenCalledTimes(1);
    expect(nextBlurSpy).toHaveBeenCalledTimes(1);

    scrollToSpy.mockRestore();
    root.unmount();
    document.body.removeChild(container);
  });
});
