"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

interface PropertyLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}

function MapClickHandler({
  onChange,
}: Pick<PropertyLocationPickerProps, "onChange">) {
  useMapEvents({
    click(event) {
      const latitude = Number(event.latlng.lat.toFixed(7));
      const longitude = Number(event.latlng.lng.toFixed(7));

      onChange(latitude, longitude);
    },
  });

  return null;
}

function RecenterMap({
  latitude,
  longitude,
}: Pick<PropertyLocationPickerProps, "latitude" | "longitude">) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function PropertyLocationPicker({
  latitude,
  longitude,
  onChange,
}: PropertyLocationPickerProps) {
  const defaultLatitude = 10.7769;
  const defaultLongitude = 106.7009;

  const center: [number, number] = [
    latitude ?? defaultLatitude,
    longitude ?? defaultLongitude,
  ];

  return (
    <div className="overflow-hidden rounded-md border border-gray-300">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        style={{
          width: "100%",
          height: "380px",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onChange={onChange} />

        <RecenterMap latitude={latitude} longitude={longitude} />

        {latitude !== null && longitude !== null && (
          <CircleMarker center={[latitude, longitude]} radius={9}>
            <Popup>
              Vị trí bất động sản
              <br />
              Vĩ độ: {latitude}
              <br />
              Kinh độ: {longitude}
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
