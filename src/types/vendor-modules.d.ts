declare module 'jsbarcode' {
  export default function JsBarcode(
    element: SVGSVGElement | HTMLElement | string,
    data: string,
    options?: Record<string, unknown>
  ): void;
}

declare module 'qrcode' {
  interface QRCodeToDataURLOptions {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
}

declare module 'papaparse' {
  export interface ParseError {
    message: string;
  }
  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
  }
  export interface ParseConfig {
    header?: boolean;
    skipEmptyLines?: boolean | 'greedy';
  }
  function parse<T>(input: string, config?: ParseConfig): ParseResult<T>;
  const Papa: { parse: typeof parse };
  export default Papa;
}
