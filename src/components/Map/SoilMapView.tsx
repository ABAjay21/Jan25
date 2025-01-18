import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import SoilLayer from "./SoilLayer"; // A separate component to render soil data

const SoilMapView: React.FC = () => {
  const [soilData, setSoilData] = useState([]); // State to hold soil data
  const [showSoilLayer, setShowSoilLayer] = useState(false); // Toggle for the soil layer

  // Fetch soil data from the backend
  useEffect(() => {
    fetch("http://localhost:5000/api/soil_data") // Ensure this endpoint works in your backend
      .then((res) => res.json())
      .then((data) => setSoilData(data.features || []))
      .catch((err) => console.error("Error fetching soil data:", err));
  }, []);

  return (
    <div className="map-container">
      <MapContainer center={[43.75, -87.71]} zoom={12} style={{ height: "100vh" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Soil Layer */}
        <SoilLayer soilData={soilData} visible={showSoilLayer} />

        {/* Toggle Button */}
        <div className="controls">
          <button onClick={() => setShowSoilLayer(!showSoilLayer)}>
            {showSoilLayer ? "Hide Soil Layer" : "Show Soil Layer"}
          </button>
        </div>
      </MapContainer>
    </div>
  );
};

export default SoilMapView;
