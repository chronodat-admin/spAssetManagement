interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  public constructor(options?: BarcodeDetectorOptions);
  public detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
