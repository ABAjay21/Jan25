// MapView.tsx

// Part 1: Imports and State Initialization
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";
import ParcelLayer from "./ParcelLayer";

// Interfaces
interface ParcelProperties {
  parcel_id: string; // Updated from PARCELID
  field_id: number;
  farmer_name: string; // Updated from FARMER_NAME
  tillable_acres: number;
  rent_per_acre: number;
  renewal_date: string; // Ensure this is a string format
  classdscrp: string; // Updated from CLASSDSCRP
}

interface Parcel {
  properties: ParcelProperties;
  geometry: GeoJSON.Geometry;
}

interface ParcelFeature {
  type: "Feature";
  properties: ParcelProperties;
  geometry: GeoJSON.Geometry;
}

// Updated FarmerSummary Interface to match new API response
interface FarmerSummary {
  farmer_name: string;
  leasee_name: string; // Added from new API
  total_acres: number;
  price_per_acre: number;
  parcels: string[]; // Added from new API
}

interface Lease {
  farmer_name: string;
  parcelid: string;
  muni: string;
}

interface Field {
  field_id: number;
  leasee_name: string; // Farmer Name
  parcel_ids: string;
  tillable_acres: number;
  rent_per_acre: number;
  productivity_rating: number;
  renewal_date: string; // Ensure this is a string format
}

// Use the environment variable for backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
console.log("Using BACKEND_URL:", BACKEND_URL);

const MapView: React.FC = () => {
  const [parcelData, setParcelData] = useState<Parcel[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [farmerSummary, setFarmerSummary] = useState<FarmerSummary[]>([]);
  const [fields, setFields] = useState<Field[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [highlightParcel, setHighlightParcel] = useState<string>("");
  const [highlightParcels, setHighlightParcels] = useState<string[]>([]);

  const [selectedFarmer, setSelectedFarmer] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [mapType, setMapType] = useState<string>("satellite");
  const [orthoVisible, setOrthoVisible] = useState<boolean>(false);

  const [firstDropdownSelection, setFirstDropdownSelection] = useState<string>("");
  const [secondDropdownSelection, setSecondDropdownSelection] = useState<string>("");

  const [popupInfo, setPopupInfo] = useState<ParcelFeature | Field | null>(null);

  const [showNotes, setShowNotes] = useState(false); // Controls whether the notes sidebar is visible
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null); // Stores the selected parcel ID
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);

  // Part 2: Data Fetching

  // Fetch parcels data
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/parcels_data`)
      .then((res) => res.json())
      .then((data) => setParcelData(data.features || []))
      .catch((err) => console.error("Error fetching parcels:", err));
  }, []);

  // Fetch leases data
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/leases`)
      .then((res) => res.json())
      .then((data) => setLeases(data))
      .catch((err) => console.error("Error fetching leases:", err));
  }, []);

  // **Updated Fetch for Farmer Summary to use the new API endpoint**
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/all_farmers_details`) // Changed from /api/farmer_summary
      .then((res) => res.json())
      .then((data) => {
        // Map the fetched data to match the FarmerSummary interface
        const formattedData: FarmerSummary[] = data.map((item: any) => ({
          farmer_name: item.farmer_name,
          leasee_name: item.leasee_name,
          total_acres: Number(item.total_acres), // Ensure it's a number
          price_per_acre: Number(item.price_per_acre),
          parcels: item.parcels || [],
        }));
        setFarmerSummary(formattedData);
      })
      .catch((err) => console.error("Error fetching farmer details:", err));
  }, []);

  // Fetch fields data
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/fields`)
      .then((res) => res.json())
      .then((data) => setFields(data))
      .catch((err) => console.error("Error fetching fields:", err));
  }, []);

  // Part 3: Handlers for Search and Dropdowns

  const handleSearch = () => {
    const trimmedSearchTerm = searchTerm.trim();
    const parcelFound = parcelData.find(
      (parcel) => parcel.properties.parcel_id.trim() === trimmedSearchTerm
    );

    if (parcelFound) {
      setHighlightParcel(trimmedSearchTerm);
      setHighlightParcels([]);
    } else {
      alert("Parcel ID not found");
    }
  };

  const handleFirstDropdownChange = (value: string) => {
    setFirstDropdownSelection(value);
    setSecondDropdownSelection(""); // Reset second dropdown when first changes
  };

  const handleSecondDropdownChange = (value: string) => {
    setSecondDropdownSelection(value);

    if (firstDropdownSelection === "Farmer") {
      handleFarmerChange(value);
    } else if (firstDropdownSelection === "Field") {
      handleFieldChange(value);
    } else if (firstDropdownSelection === "Parcel") {
      handleDropdownChange(value);
    }
  };

  const handleFarmerChange = async (farmerName: string) => {
    setSelectedFarmer(farmerName);
    setHighlightParcel("");
  
    try {
      // Fetch all farmer details
      const response = await fetch(`${BACKEND_URL}/api/all_farmers_details`);
      const farmerDetails = await response.json();
  
      // Find the selected farmer's details
      const selectedFarmerDetails = farmerDetails.find(
        (farmer: FarmerSummary) => farmer.farmer_name === farmerName
      );
  
      if (selectedFarmerDetails) {
        const { parcels, total_acres, price_per_acre } = selectedFarmerDetails;
  
        // Highlight parcels related to the farmer
        setHighlightParcels(parcels);
  
        // Set PopupInfo for the farmer
        setPopupInfo({
          type: "Feature",
          properties: {
            parcel_id: parcels[0] || "N/A", // Show the first parcel ID or "N/A"
            field_id: 0, // No specific field ID for the farmer
            farmer_name: farmerName,
            tillable_acres: parseFloat(total_acres) || 0,
            rent_per_acre: parseFloat(price_per_acre) || 0,
            renewal_date: "N/A", // No specific renewal date
            classdscrp: "Farmer Details", // Description for farmer
          },
          geometry: {
            type: "Point",
            coordinates: [0, 0], // Placeholder geometry
          },
        });
      } else {
        alert("No details found for the selected farmer.");
      }
    } catch (error) {
      console.error("Error fetching farmer details:", error);
      alert("Failed to fetch farmer details.");
    }
  };

  
  // Part 4: Handlers for Parcel Dropdown and Details
  const handleFieldChange = (fieldId: string) => {
    setSelectedField(fieldId);
    const field = fields.find((field) => field.field_id === parseInt(fieldId, 10));
    if (field) {
      const parcelIds = field.parcel_ids.split(",").map((id) => id.trim());
      setHighlightParcels(parcelIds);
      setPopupInfo(field);
    }
  };

  const parcelFeatures: ParcelFeature[] = parcelData
    .filter((parcel) => parcel.geometry && parcel.properties)
    .map((parcel) => ({
      type: "Feature",
      properties: parcel.properties,
      geometry: parcel.geometry,
    }));

  const handleDropdownChange = (parcelId: string) => {
    const selectedParcel = parcelData.find(
      (parcel) => parcel.properties.parcel_id === parcelId
    );

    if (selectedParcel) {
      setHighlightParcel(parcelId);
      setHighlightParcels([]);
      setPopupInfo({
        type: "Feature",
        properties: selectedParcel.properties,
        geometry: selectedParcel.geometry,
      });
    } else {
      alert("Parcel not found");
    }
  };

  const handleDetailsClick = () => {
    if (!highlightParcels.length && !highlightParcel) {
      alert("No highlighted field to show details for!");
      return;
    }

    const selectedField = parcelFeatures.find(
      (feature) => feature.properties.parcel_id === highlightParcel
    );

    if (selectedField) {
      setPopupInfo(selectedField);
    } else {
      setPopupInfo({
        type: "Feature",
        properties: {
          parcel_id: "N/A",
          field_id: 0,
          farmer_name: "No Info",
          tillable_acres: 0,
          rent_per_acre: 0,
          renewal_date: "No Info",
          classdscrp: "No Info",
        },
        geometry: { type: "Point", coordinates: [0, 0] } as GeoJSON.Geometry,
      });
    }
  };

  const handleReset = () => {
    setFirstDropdownSelection("");
    setSecondDropdownSelection("");
    setHighlightParcel("");
    setHighlightParcels([]);
    setPopupInfo(null);
  };

  const ResetViewButton: React.FC = () => {
    const map = useMap();

    const resetView = () => {
      map.setView([43.75, -87.71], 12);
    };

    return (
      <button className="reset-view-button-independent" onClick={resetView}>
        Reset View
      </button>
    );
  };

  // Part 5: PopupDetails Component
  const PopupDetails: React.FC = () => {
    if (!popupInfo) return null;

    const handleNotesClick = () => {
      if (!popupInfo) return;

      if ("field_id" in popupInfo) {
        const { field_id } = popupInfo as Field;
        setShowNotes(true);
        setSelectedParcelId(null);
        setSelectedFieldId(field_id);
      } else if ("parcel_id" in popupInfo.properties) {
        const { parcel_id } = popupInfo.properties;
        setShowNotes(true);
        setSelectedParcelId(parcel_id);
        setSelectedFieldId(null);
      }
    };

    const handleCloseClick = () => {
      setPopupInfo(null);
    };

    if ("field_id" in popupInfo) {
      const {
        field_id,
        leasee_name,
        parcel_ids,
        tillable_acres,
        rent_per_acre,
        productivity_rating,
        renewal_date,
      } = popupInfo as Field;

      return (
        <div className="mapview-popup-details">
          <h3>Field Details</h3>
          <table className="details-table">
            <tbody>
              <tr>
                <th>Field ID:</th>
                <td>{field_id || "N/A"}</td>
              </tr>
              <tr>
                <th>Farmer Name:</th>
                <td>{leasee_name || "N/A"}</td>
              </tr>
              <tr>
                <th>Parcel IDs:</th>
                <td>{parcel_ids || "N/A"}</td>
              </tr>
              <tr>
                <th>Tillable Acres for field #{field_id}:</th>
                <td>{tillable_acres || "N/A"}</td>
              </tr>
              <tr>
                <th>Rent per Acre:</th>
                <td>${rent_per_acre || "N/A"}</td>
              </tr>
              <tr>
                <th>Productivity Rating:</th>
                <td>{productivity_rating || "N/A"}</td>
              </tr>
              <tr>
                <th>Renewal Date:</th>
                <td>{renewal_date || "N/A"}</td>
              </tr>
            </tbody>
          </table>
          <div className="button-box">
            <button className="notes-button" onClick={handleNotesClick}>
              Add Note
            </button>
            <button className="close-button" onClick={handleCloseClick}>
              Close
            </button>
          </div>
        </div>
      );
    }

    const {
      parcel_id,
      field_id,
      farmer_name,
      tillable_acres,
      rent_per_acre,
      renewal_date,
      classdscrp,
    } = (popupInfo as ParcelFeature).properties;

    return (
      <div className="mapview-popup-details">
        <h3>Parcel Details</h3>
        <table className="details-table">
          <tbody>
            <tr>
              <th>Parcel ID:</th>
              <td>{parcel_id || "N/A"}</td>
            </tr>
            <tr>
              <th>Field ID:</th>
              <td>{field_id || "N/A"}</td>
            </tr>
            <tr>
              <th>Farmer Name:</th>
              <td>{farmer_name || "N/A"}</td>
            </tr>
            <tr>
              <th>Tillable Acres:</th>
              <td>{tillable_acres || "N/A"}</td>
            </tr>
            <tr>
              <th>Rent per Acre:</th>
              <td>${rent_per_acre || "N/A"}</td>
            </tr>
            <tr>
              <th>Renewal Date:</th>
              <td>{renewal_date || "N/A"}</td>
            </tr>
            <tr>
              <th>Class Description:</th>
              <td>{classdscrp || "N/A"}</td>
            </tr>
          </tbody>
        </table>
        <div className="button-box">
          <button className="notes-button" onClick={handleNotesClick}>
            Add Note
          </button>
          <button className="close-button" onClick={handleCloseClick}>
            Close
          </button>
        </div>
      </div>
    );
  };

  // Part 6: JSX Rendering and Final Return
  return (
    <div className="map-container">
      <MapContainer center={[43.75, -87.71]} zoom={12} style={{ height: "100vh" }}>
        <TileLayer
          url={
            mapType === "standard"
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          }
          attribution="&copy; OpenStreetMap contributors"
        />

        {orthoVisible && (
          <TileLayer
            url="${BACKEND_URL}/api/tiles/{z}/{x}/{y}"
            attribution="&copy; Your Ortho Imagery"
          />
        )}

        <ParcelLayer
          parcels={parcelFeatures as any[]} // Type casting to bypass TypeScript error
          highlightParcel={highlightParcel}
          highlightParcels={highlightParcels}
          onNotesClick={(parcelId) => {
            setSelectedParcelId(parcelId); // Update the selected parcel ID
            setShowNotes(true); // Show the notes sidebar
          }}
        />

        <ResetViewButton />
      </MapContainer>

      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter Parcel ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Search
          </button>
        </div>
        <button onClick={() => setMapType(mapType === "standard" ? "satellite" : "standard")}>
          Toggle to {mapType === "standard" ? "Satellite" : "Standard"} View
        </button>
        <button onClick={() => setOrthoVisible(!orthoVisible)}>
          {orthoVisible ? "Hide Ortho Imagery" : "Show Ortho Imagery"}
        </button>
      </div>

      <div className="dropdown-container dropdown-right">
        <label htmlFor="first-dropdown">Select Option:</label>
        <select
          id="first-dropdown"
          value={firstDropdownSelection}
          onChange={(e) => handleFirstDropdownChange(e.target.value)}
        >
          <option value="">Select</option>
          <option value="Farmer">Farmer</option>
          <option value="Field">Field</option>
          <option value="Parcel">Parcel</option>
        </select>

        {firstDropdownSelection && (
          <div>
            <label htmlFor="second-dropdown">
              {firstDropdownSelection === "Farmer"
                ? "Select Farmer"
                : firstDropdownSelection === "Field"
                ? "Select Field"
                : "Select Parcel"}
              :
            </label>
            <select
              id="second-dropdown"
              value={secondDropdownSelection}
              onChange={(e) => handleSecondDropdownChange(e.target.value)}
            >
              <option value="">Select</option>
              {firstDropdownSelection === "Farmer" &&
                farmerSummary.map((farmer) => (
                  <option key={farmer.farmer_name} value={farmer.farmer_name}>
                    {farmer.farmer_name} ({farmer.total_acres} acres)
                  </option>
                ))}
              {firstDropdownSelection === "Field" &&
                fields.map((field) => (
                  <option key={field.field_id} value={field.field_id}>
                    Field {field.field_id} - {field.leasee_name} ({field.tillable_acres} acres)
                  </option>
                ))}
              {firstDropdownSelection === "Parcel" &&
                leases.map((lease) => (
                  <option key={lease.parcelid} value={lease.parcelid}>
                    {lease.farmer_name} - ({lease.parcelid})
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="button-group">
          <button className="reset-view-button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {popupInfo && <PopupDetails />}

      {/* Conditional rendering for the notes sidebar */}
      {showNotes && (
        <div className="notes-sidebar">
          <iframe
            src={`/notes?embedded=true${
              selectedFieldId
                ? `&field_id=${selectedFieldId}`
                : selectedParcelId
                ? `&parcel_id=${selectedParcelId}`
                : ""
            }`}
            title="Notes"
            className="notes-iframe"
          />
          <button className="close-notes-button" onClick={() => setShowNotes(false)}>
            ✖ Close Notes
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;
