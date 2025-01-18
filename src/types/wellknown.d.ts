declare module 'wellknown' {
    import { Geometry } from "geojson";
  
    export function parse(wkt: string): Geometry;
    export function stringify(geojson: Geometry): string;
  }
  