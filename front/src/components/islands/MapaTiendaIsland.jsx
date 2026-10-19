import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const TIENDA = [20.7027, -103.3935];

export default function MapaTiendaIsland() {
  return (
    <div className="main-container">
      <main className="content">
        <h3 className="section-title">Nuestra ubicación</h3>
        <MapContainer
          center={TIENDA}
          zoom={16}
          style={{ height: '420px', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CircleMarker center={TIENDA} radius={12} pathOptions={{ color: '#be185d', fillOpacity: 0.7 }}>
            <Popup>Peluches Crochet — CETI Colomos</Popup>
          </CircleMarker>
        </MapContainer>
      </main>
    </div>
  );
}