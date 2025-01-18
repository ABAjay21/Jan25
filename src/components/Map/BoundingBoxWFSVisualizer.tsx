import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import { Layer } from "leaflet";

// Define the properties for the GeoJSON features
interface BoundingBoxFeature extends Feature<MultiPolygon> {
  properties: {
    lease_id: number;
    siteaddress: string;
    muni: string;
    classdscrp: string;
    leasee_name: string;
    parcel_acres: number;
  };
}

// Helper: parse one <gml:LinearRing> string (like "43.75,-87.79 43.76,-87.78") 
// into an array of [lon, lat] pairs.
function parseLinearRingCoords(coordString: string, fid: string): [number, number][] {
  const coords: [number, number][] = [];

  const coordPairs = coordString.split(" ");
  for (const pair of coordPairs) {
    const [latStr, lonStr] = pair.split(",");
    const lat = Number(latStr);
    const lon = Number(lonStr);
    if (!isNaN(lat) && !isNaN(lon)) {
      // GeoJSON needs [lon, lat]
      coords.push([lon, lat]);
    } else {
      console.warn(`Skipping invalid coordinate in feature ${fid}:`, pair);
    }
  }
  return coords;
}

// A helper component that renders the GeoJSON and auto-fits bounds
const GeoJsonWithBounds: React.FC<{
  data: FeatureCollection<MultiPolygon>;
  onEachFeature: (feature: BoundingBoxFeature, layer: Layer) => void;
}> = ({ data, onEachFeature }) => {
  const map = useMap();

  useEffect(() => {
    if (data) {
      // Create a Leaflet layer just to compute the bounding box of the GeoJSON data
      const geoJsonLayer = L.geoJSON(data);
      const bounds = geoJsonLayer.getBounds();

      console.log(
        "Debug: Fitting bounds for these polygons:",
        data.features.length,
        "feature(s)."
      );

      if (bounds.isValid()) {
        map.fitBounds(bounds);
      }
    }
  }, [data, map]);

  return (
    <GeoJSON
      data={data}
      style={{
        color: "blue",
        weight: 2,
        fillColor: "orange",
        fillOpacity: 0.3,
      }}
      onEachFeature={onEachFeature}
    />
  );
};

const BoundingBoxWFSVisualizer: React.FC = () => {
  const [data, setData] = useState<FeatureCollection<MultiPolygon> | null>(null);

  // Function to bind popup data
  const onEachFeature = (feature: BoundingBoxFeature, layer: Layer) => {
    if (feature.properties) {
      const {
        lease_id,
        siteaddress,
        muni,
        classdscrp,
        leasee_name,
        parcel_acres,
      } = feature.properties;

      layer.bindPopup(`
        <div>
          <h4>Parcel Details</h4>
          <p><strong>Lease ID:</strong> ${lease_id}</p>
          <p><strong>Address:</strong> ${siteaddress}</p>
          <p><strong>Municipality:</strong> ${muni}</p>
          <p><strong>Class:</strong> ${classdscrp}</p>
          <p><strong>Leasee Name:</strong> ${leasee_name}</p>
          <p><strong>Acres:</strong> ${parcel_acres}</p>
        </div>
      `);
    }
  };

  useEffect(() => {
    // Change this URL to your correct endpoint
    fetch("http://localhost:3001/api/bounding-box-wfs")
      .then((res) => res.json())
      .then((response) => {
        console.log("Debug: Raw WFS response:", response);

        // 1) Extract the featureMember array
        const featureMembers =
          response?.[0]?.["wfs:FeatureCollection"]?.["gml:featureMember"] || [];
        console.log(
          "Debug: Number of featureMember items in the response:",
          featureMembers.length
        );

        const features: BoundingBoxFeature[] = featureMembers
          .map((member: any) => {
            const properties = member["ms:mapunitpoly"];
            const fid: string = properties?.["$"]?.["fid"] || "unknownFID";

            // Example property reading - these might differ if you have actual parcel data
            // Not all "ms:mapunitpoly" entries have these fields, so adapt as needed:
            const {
              areasymbol = "",
              musym = "",
              mukey = "",
              muareaacres = "0",
              // etc...
            } = properties;

            // 2) Access the geometry under ms:multiPolygon -> gml:MultiPolygon
            const geometry =
              properties?.["ms:multiPolygon"]?.["gml:MultiPolygon"];
            if (!geometry) {
              console.warn(`Skipping feature ${fid}: no gml:MultiPolygon.`);
              return null;
            }

            // 3) The polygonMember could be a single object or an array
            let polygonMembers = geometry["gml:polygonMember"];
            if (!polygonMembers) {
              console.warn(`Skipping feature ${fid}: no polygonMember.`);
              return null;
            }
            // Normalize to array
            if (!Array.isArray(polygonMembers)) {
              polygonMembers = [polygonMembers];
            }

            // 4) For each polygonMember, extract the <gml:coordinates> of the outer boundary
            const polygons: [number, number][][][] = []; // For storing each ring: [ [ [lon, lat], ... ] ]

            polygonMembers.forEach((pmObj: any, idx: number) => {
              const polygon = pmObj?.["gml:Polygon"];
              if (!polygon) {
                console.warn(`Skipping polygonMember #${idx} in feature ${fid}: no gml:Polygon.`);
                return;
              }

              const outerBoundaryIs = polygon["gml:outerBoundaryIs"];
              if (!outerBoundaryIs) {
                console.warn(`Skipping polygon #${idx} in feature ${fid}: no gml:outerBoundaryIs.`);
                return;
              }

              const linearRing = outerBoundaryIs["gml:LinearRing"];
              if (!linearRing) {
                console.warn(`Skipping polygon #${idx} in feature ${fid}: no gml:LinearRing.`);
                return;
              }

              const coordString = linearRing["gml:coordinates"];
              if (!coordString) {
                console.warn(`Skipping polygon #${idx} in feature ${fid}: no gml:coordinates.`);
                return;
              }

              // Parse all coordinates in this ring
              const ringCoords = parseLinearRingCoords(coordString, fid);

              if (ringCoords.length > 0) {
                polygons.push([ringCoords]); 
                // Note: 
                //  MultiPolygon geometry: coordinates = [ [ [ [lon, lat], ... ] ] ]
                //                         [ Polygons => [ Rings => [ Points ] ] ] 
              } else {
                console.warn(
                  `Skipping empty ring in polygon #${idx} for feature ${fid}.`
                );
              }
            });

            console.log(
              `Debug: Feature ${fid} has ${polygons.length} polygonMember(s).`
            );

            if (polygons.length === 0) {
              console.warn(`Skipping feature ${fid}: all polygons empty or invalid.`);
              return null;
            }

            // 5) Build a GeoJSON Feature
            const feature: BoundingBoxFeature = {
              type: "Feature",
              geometry: {
                type: "MultiPolygon",
                coordinates: polygons,
              },
              properties: {
                // If you have actual parcel fields, adjust these accordingly
                lease_id: parseInt(fid.replace(/\D+/g, ""), 10) || 0,
                siteaddress: properties.siteaddress || areasymbol || "N/A",
                muni: properties.muni || musym || "N/A",
                classdscrp: properties.classdscrp || mukey || "N/A",
                leasee_name: properties.leasee_name || "N/A",
                parcel_acres: parseFloat(properties.parcel_acres ?? muareaacres) || 0,
              },
            };

            return feature;
          })
          // Filter out any null features (invalid geometry or missing coords)
          .filter((f: BoundingBoxFeature | null) => f !== null);

        console.log(
          "Debug: Created GeoJSON features (before final cast):",
          features.length
        );

        // Create a valid GeoJSON FeatureCollection
        const geoJson: FeatureCollection<MultiPolygon> = {
          type: "FeatureCollection",
          features: features as BoundingBoxFeature[],
        };

        console.log(
          "Debug: Final FeatureCollection has",
          geoJson.features.length,
          "feature(s)."
        );

        setData(geoJson);
      })
      .catch((err) => console.error("Error fetching bounding box data:", err));
  }, []);

  return (
    <MapContainer
      center={[43.75, -87.75]} // Adjust if needed
      zoom={12}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {data && <GeoJsonWithBounds data={data} onEachFeature={onEachFeature} />}
    </MapContainer>
  );
};

export default BoundingBoxWFSVisualizer;
