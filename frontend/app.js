// Inicializa o mapa e define o foco inicial nas coordenadas de Quixadá
const map = L.map('map').setView([-4.9689, -39.0161], 14);

// Carrega as imagens do mapa do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);