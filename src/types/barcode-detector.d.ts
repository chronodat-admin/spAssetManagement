interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  public constructor(options?: BarcodeDetectorOptions);
  public static getSupportedFormats(): Promise<string[]>;
  public detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format?: string }>>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
