"use client";

import { useMemo } from "react";
import {
  MapContainer as RLMapContainer,
  TileLayer as RLTileLayer,
  CircleMarker as RLCircleMarker,
  Popup as RLPopup,
  Polyline as RLPolyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LiveDriver = {
  driverId: string;
  fullName: string;
  phone: string;
  status: string;
  ratingAvg: number;
  lastLat: number | null;
  lastLng: number | null;
  lastSeenAt: string | null;
  isOnline: boolean;
  isAvailable?: boolean;
  city?: string | null;
};

type Props = {
  drivers: LiveDriver[];
  selectedId?: string | null;
  routePoints?: { lat: number; lng: number }[];
  densityPoints?: { lat: number; lng: number; count: number }[];
  shipmentPoints?: {
    lat: number;
    lng: number;
    trackingId: string;
    status: string;
    driverName?: string | null;
  }[];
  onSelect?: (id: string) => void;
};

const MapContainer = RLMapContainer as any;
const TileLayer = RLTileLayer as any;
const CircleMarker = RLCircleMarker as any;
const Popup = RLPopup as any;
const Polyline = RLPolyline as any;

const mapCenterFallback: [number, number] = [33.5138, 36.2765];

const markerStyles = {
  onlineAvailable: { color: "#10b981", fillColor: "#10b981" },
  onlineUnavailable: { color: "#f59e0b", fillColor: "#f59e0b" },
  offline: { color: "#64748b", fillColor: "#64748b" },
};

const shipmentStatusColor: Record<string, string> = {
  DRIVER_ASSIGNED: "#f59e0b",
  PICKED_UP: "#38bdf8",
  IN_TRANSIT: "#f97316",
};

function FlyToDriver({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useMemo(() => {
    if (position) {
      map.flyTo(position, 12, { duration: 0.8 });
    }
  }, [map, position]);

  return null;
}

export default function LiveDriverMap({
  drivers,
  selectedId,
  routePoints,
  densityPoints,
  shipmentPoints,
  onSelect,
}: Props) {
  const driversWithCoords = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          typeof driver.lastLat === "number" &&
          typeof driver.lastLng === "number"
      ),
    [drivers]
  );

  const center = useMemo<[number, number]>(() => {
    if (!driversWithCoords.length) return mapCenterFallback;

    const lat =
      driversWithCoords.reduce(
        (sum, driver) => sum + (driver.lastLat ?? 0),
        0
      ) / driversWithCoords.length;

    const lng =
      driversWithCoords.reduce(
        (sum, driver) => sum + (driver.lastLng ?? 0),
        0
      ) / driversWithCoords.length;

    return [lat, lng];
  }, [driversWithCoords]);

  const selectedDriver = selectedId
    ? driversWithCoords.find((driver) => driver.driverId === selectedId) ?? null
    : null;

  return (
    <div className="h-full w-full overflow-hidden rounded-3xl border border-slate-800">
      <MapContainer center={center} zoom={8} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedDriver && (
          <FlyToDriver
            position={[
              selectedDriver.lastLat as number,
              selectedDriver.lastLng as number,
            ]}
          />
        )}

        {densityPoints?.map((point, idx) => (
          <CircleMarker
            key={`density-${idx}`}
            center={[point.lat, point.lng]}
            radius={Math.min(24, 6 + point.count * 2)}
            pathOptions={{
              color: "#38bdf8",
              fillColor: "#38bdf8",
              fillOpacity: 0.15,
              opacity: 0.2,
            }}
          />
        ))}

        {shipmentPoints?.map((shipment) => (
          <CircleMarker
            key={`shipment-${shipment.trackingId}`}
            center={[shipment.lat, shipment.lng]}
            radius={8}
            pathOptions={{
              color: shipmentStatusColor[shipment.status] || "#f97316",
              fillColor: shipmentStatusColor[shipment.status] || "#f97316",
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold">شحنة #{shipment.trackingId}</p>
                <p>الحالة: {shipment.status}</p>
                {shipment.driverName && <p>السائق: {shipment.driverName}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {driversWithCoords.map((driver) => {
          const style = !driver.isOnline
            ? markerStyles.offline
            : driver.isAvailable
              ? markerStyles.onlineAvailable
              : markerStyles.onlineUnavailable;

          return (
            <CircleMarker
              key={driver.driverId}
              center={[driver.lastLat as number, driver.lastLng as number]}
              radius={driver.driverId === selectedId ? 9 : 7}
              pathOptions={style}
              eventHandlers={{
                click: () => onSelect?.(driver.driverId),
              }}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-bold">{driver.fullName}</p>
                  <p>{driver.phone}</p>
                  <p>{driver.isOnline ? "متصل الآن" : "غير متصل"}</p>
                  {typeof driver.isAvailable === "boolean" && (
                    <p>{driver.isAvailable ? "داخل الخدمة" : "خارج الخدمة"}</p>
                  )}
                  <p>التقييم: {driver.ratingAvg.toFixed(1)}</p>
                  {driver.lastSeenAt && (
                    <p>
                      {new Date(driver.lastSeenAt).toLocaleTimeString("ar-SY", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {routePoints && routePoints.length > 1 && (
          <Polyline
            positions={routePoints.map((point) => [point.lat, point.lng])}
            pathOptions={{ color: "#38bdf8", weight: 4, opacity: 0.8 }}
          />
        )}
      </MapContainer>
    </div>
  );
}