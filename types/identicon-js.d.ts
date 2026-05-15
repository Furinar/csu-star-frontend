declare module "identicon.js" {
  type RGBA = [number, number, number, number];

  export type IdenticonOptions = {
    size?: number;
    margin?: number;
    foreground?: RGBA;
    background?: RGBA;
    saturation?: number;
    brightness?: number;
    format?: "png" | "svg";
  };

  export default class Identicon {
    constructor(hash: string, options?: number | IdenticonOptions);
    toString(): string;
  }
}
