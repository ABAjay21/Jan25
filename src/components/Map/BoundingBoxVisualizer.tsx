import React, { useEffect, useState } from "react";
import "./BoundingBoxVisualizer.css";
import { MapContainer, TileLayer, Rectangle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface BoundingBox {
  lease_id: number;
  bbox_xmin: number;
  bbox_ymin: number;
  bbox_xmax: number;
  bbox_ymax: number;
  siteaddress: string;
  muni: string;
  classdscrp: string;
  leasee_name: string;
  parcel_acres: number;
}

const BoundingBoxVisualizer: React.FC = () => {
  const [data, setData] = useState<BoundingBox[]>([]);

  // Fetch bounding box data from the backend
  useEffect(() => {
    fetch("${BACKEND_URL}api/bounding-box-wfs")
      .then((res) => res.json())
      .then((data) => {
        setData(
          data.features.map((feature: any) => feature.properties)
        );
      })
      .catch((err) => console.error("Error fetching bounding box data:", err));
  }, []);

  return (
    <MapContainer
      center={[43.75, -87.75]}
      zoom={12}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {data.map((item) => (
        <Rectangle
          key={item.lease_id}
          bounds={[
            [item.bbox_ymin, item.bbox_xmin],
            [item.bbox_ymax, item.bbox_xmax],
          ]}
          pathOptions={{ color: "blue" }}
        >
          <Popup>
            <h4>Parcel Details</h4>
            <p><strong>Lease ID:</strong> {item.lease_id}</p>
            <p><strong>Address:</strong> {item.siteaddress}</p>
            <p><strong>Municipality:</strong> {item.muni}</p>
            <p><strong>Class:</strong> {item.classdscrp}</p>
            <p><strong>Leasee Name:</strong> {item.leasee_name}</p>
            <p><strong>Acres:</strong> {item.parcel_acres}</p>
          </Popup>
        </Rectangle>
      ))}
    </MapContainer>
  );
};

export default BoundingBoxVisualizer;
