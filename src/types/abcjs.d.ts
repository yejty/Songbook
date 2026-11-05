declare module 'abcjs' {
  export interface RenderAbcOptions {
    responsive?: 'resize' | 'scroll';
    scale?: number;
    staffwidth?: number;
    add_classes?: boolean;
    foregroundColor?: string;
    selectionColor?: string;
    [key: string]: any;
  }

  export function renderAbc(
    target: string | HTMLElement,
    abcString: string,
    visualOptions?: RenderAbcOptions
  ): any[];

  export const signature: string;
}
