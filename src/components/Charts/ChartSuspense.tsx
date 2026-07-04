import * as React from 'react';
import { Spinner } from '@fluentui/react-components';

export interface IChartSuspenseProps {
  children: React.ReactNode;
  /** Minimum height of the fallback so layout doesn't jump while the chart chunk loads. */
  minHeight?: number;
}

/**
 * Suspense boundary with a lightweight fallback for lazily-loaded chart
 * components. Charts pull in the heavy `recharts` dependency, so loading them
 * via React.lazy keeps that code out of the main web part bundle.
 */
export const ChartSuspense: React.FC<IChartSuspenseProps> = ({ children, minHeight = 260 }) => (
  <React.Suspense
    fallback={
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight
        }}
      >
        <Spinner size="small" label="Loading chart…" />
      </div>
    }
  >
    {children}
  </React.Suspense>
);
