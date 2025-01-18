import { Map } from "leaflet";

declare global {
  interface Window {
    map: Map;
  }
}
