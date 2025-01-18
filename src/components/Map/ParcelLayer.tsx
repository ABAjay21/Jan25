import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "./ParcelLayer.css";

interface ParcelProperties {
  parcel_id: string;
  field_id: number;
  farmer_name: string;
  tillable_acres: number;
  rent_per_acre: number;
  renewal_date: string;
  classdscrp: string;
}

interface ParcelFeature {
  type: "Feature";
  properties: ParcelProperties;
  geometry: GeoJSON.Geometry;
}

interface ParcelLayerProps {
  parcels: ParcelFeature[];
  highlightParcel: string;
  highlightParcels: string[];
  onNotesClick: (parcelId: string) => void;
  onParcelSelected?: (bounds: L.LatLngBounds) => void; // New prop for zooming
}


const ParcelLayer: React.FC<ParcelLayerProps> = ({
  parcels,
  highlightParcel,
  highlightParcels,
  onNotesClick,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!parcels.length) return;

    const geoJsonData: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
      type: "FeatureCollection",
      features: parcels,
    };
    

    const layer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const parcelId = feature?.properties?.parcel_id || "";
        const isHighlighted = parcelId === highlightParcel || highlightParcels.includes(parcelId);

        return {
          color: isHighlighted ? "red" : "blue",
          weight: isHighlighted ? 3 : 1,
          fillOpacity: 0,
        };
      },
      onEachFeature: (feature, layer) => {
        if (!feature?.properties) return;

        const props = feature.properties;

        const container = document.createElement("div");
        container.className = "parcel-popup-details";

        container.innerHTML = `
          <h3>Parcel Details</h3>
          <table class="details-table">
            <tr>
              <th>Field ID:</th>
              <td>${props.field_id || "N/A"}</td>
            </tr>
            <tr>
              <th>Parcel ID:</th>
              <td>${props.parcel_id || "N/A"}</td>
            </tr>
            <tr>
              <th>Farmer Name:</th>
              <td>${props.farmer_name || "N/A"}</td>
            </tr>
            <tr>
              <th>Tillable Acres for this parcel:</th>
              <td>${props.tillable_acres || "N/A"}</td>
            </tr>
            <tr>
              <th>Rent per Acre:</th>
              <td>$${props.rent_per_acre || "N/A"}</td>
            </tr>
            <tr>
              <th>Renewal Date:</th>
              <td>${props.renewal_date || "N/A"}</td>
            </tr>
            <tr>
              <th>Class Description:</th>
              <td>${props.classdscrp || "N/A"}</td>
            </tr>
          </table>
          <div class="button-box">
            <button class="notes-button">Add Note</button>
            <button class="close-button">Close</button>
          </div>
        `;

        container.querySelector(".notes-button")?.addEventListener("click", () => {
          onNotesClick(props.parcel_id || props.parcel_id);
        });

        container.querySelector(".close-button")?.addEventListener("click", () => {
          layer.closePopup();
        });

        layer.bindPopup(container);
      },
    });

    // ------ ADD THIS BOUNDING LOGIC BACK ------
    const bounds = L.latLngBounds([]);

    parcels.forEach((parcel) => {
      const geometry = parcel.geometry;
      if (!geometry || !geometry.type) return;

      // Check if this parcel is highlighted
      if (
        parcel.properties.parcel_id === highlightParcel ||
        highlightParcels.includes(parcel.properties.parcel_id)
      ) {
        // We only zoom on polygons or multipolygons
        if (geometry.type === "Polygon") {
          geometry.coordinates.forEach((ring: any) => {
            ring.forEach(([lng, lat]: number[]) => {
              bounds.extend([lat, lng]);
            });
          });
        } else if (geometry.type === "MultiPolygon") {
          geometry.coordinates.forEach((polygon: any) => {
            polygon.forEach((ring: any) => {
              ring.forEach(([lng, lat]: number[]) => {
                bounds.extend([lat, lng]);
              });
            });
          });
        }
      }
    });

    if (bounds.isValid()) {
      // The 'maxZoom' is up to you; adjust as needed
      map.fitBounds(bounds, { maxZoom: 16 });
    }


    map.addLayer(layer);

    return () => {
      map.removeLayer(layer);
    };
  }, [parcels, highlightParcel, highlightParcels, map, onNotesClick]);

  return null;
};

export default ParcelLayer;
