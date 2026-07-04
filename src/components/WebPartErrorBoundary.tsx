import * as React from 'react';
import { DEFAULT_APP_TITLE } from '../constants/spfxComponents';

export interface IWebPartErrorBoundaryProps {
  children: React.ReactNode;
}

interface IWebPartErrorBoundaryState {
  error?: Error;
}

export class WebPartErrorBoundary extends React.Component<
  IWebPartErrorBoundaryProps,
  IWebPartErrorBoundaryState
> {
  public constructor(props: IWebPartErrorBoundaryProps) {
    super(props);
    this.state = {};
  }

  public static getDerivedStateFromError(error: Error): IWebPartErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.error(`[${DEFAULT_APP_TITLE}] render error`, error);
  }

  public render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: 320,
            padding: 24,
            border: '2px solid #d13438',
            borderRadius: 8,
            background: '#fef6f6',
            color: '#201f1e',
            fontFamily: 'Segoe UI, sans-serif'
          }}
        >
          <strong>{DEFAULT_APP_TITLE} failed to render.</strong>
          <p style={{ margin: '8px 0 0' }}>{this.state.error.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
