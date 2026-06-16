import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ className, children, ...rest }: any) => {
      const restAttrs = Object.keys(rest).reduce((a: any, k: string) => {
        if (!k.startsWith('on') && k !== 'animate' && k !== 'transition') a[k] = rest[k];
        return a;
      }, {});
      return <div className={className} {...restAttrs}>{children}</div>;
    },
  },
}));

import SkeletonLoader from '../SkeletonLoader.js';

describe('SkeletonLoader', () => {
  it('renders card variant with correct count', () => {
    const { container } = render(<SkeletonLoader variant="card" count={2} />);
    const cards = container.querySelectorAll('.grid > .glass-panel');
    expect(cards).toHaveLength(2);
  });

  it('renders table-row variant', () => {
    const { container } = render(<SkeletonLoader variant="table-row" count={3} />);
    expect(container.querySelectorAll('.grid')).toHaveLength(3);
  });

  it('returns null for unknown variant', () => {
    const { container } = render(<SkeletonLoader variant={'unknown' as any} />);
    expect(container.innerHTML).toBe('');
  });
});
