import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import * as wkt from "wellknown";

interface SoilLayerProps {
  soilData?: any[]; // Optional soil data prop
  visible?: boolean; // Optional visibility toggle
}

const SoilLayer: React.FC<SoilLayerProps> = ({ soilData, visible = true }) => {
  const [internalSoilData, setInternalSoilData] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);

  useEffect(() => {
    const parseSoilDataToGeoJSON = (data: any[]): FeatureCollection<Geometry, GeoJsonProperties> => {
      const features: Feature<Geometry, GeoJsonProperties>[] = data.map((item) => ({
        type: "Feature",
        geometry: wkt.parse(item.soil_geometry) as Geometry, // Convert WKT to GeoJSON Geometry
        properties: {
          mukey: item.mukey,
          muname: item.muname,
          ssi_farmlndcl: item.ssi_farmlndcl || "N/A", // Fallback if Farm_Rating is null
        },
      }));

      return {
        type: "FeatureCollection",
        features,
      };
    };

    if (!soilData) {
      // Fetch soil data only if not passed as a prop
      fetch("${BACKEND_URL}/api/soil-data")
        .then((res) => res.json())
        .then((data) => {
          setInternalSoilData(parseSoilDataToGeoJSON(data));
        })
        .catch((err) => console.error("Error fetching soil data:", err));
    } else {
      setInternalSoilData(parseSoilDataToGeoJSON(soilData));
    }
  }, [soilData]);

  if (!visible) {
    return null; // Do not render anything if not visible
  }

  return (
    <MapContainer center={[43.75, -87.75]} zoom={12} style={{ height: "100vh", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {internalSoilData && (
        <GeoJSON
          data={internalSoilData}
          style={{ color: "brown", weight: 1 }}
          onEachFeature={(feature, layer) => {
            layer.bindPopup(`
              <div>
                <strong>Soil Name:</strong> ${feature.properties?.muname || "N/A"}<br/>
                <strong>Farm Rating:</strong> ${feature.properties?.ssi_farmlndcl || "N/A"}<br/>
                <strong>Map Unit Key:</strong> ${feature.properties?.mukey || "N/A"}<br/>
              </div>
            `);
          }}
        />
      )}
    </MapContainer>
  );
};

export default SoilLayer;
