// Inicializa o mapa com Quixadá em destaque
const limitesQuixada = L.latLngBounds(
    [-5.0500, -39.1500],
    [-4.8800, -38.8500]
);


const map = L.map('map', {
    center: [-4.9689, -39.0161],
    zoom: 14,
    minZoom: 13,
    maxBounds: limitesQuixada,
    maxBoundsViscosity: 1.0
});

// Carrega as imagens do mapa do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Função roda sempre que clica no mapa
function aoClicarNoMapa(evento) {
    // Grava latitude e longitude ao clicar no mapa
    const lat = evento.latlng.lat;
    const lng = evento.latlng.lng;

    L.popup()
        .setLatLng(evento.latlng)
        .setContent(`Você clicou nas coordenadas:<br>Lat: ${lat.toFixed(4)}<br>Lng: ${lng.toFixed(4)}`)
        .openOn(map);
}

map.on('click', aoClicarNoMapa);

function aoClicarNoMapa(evento) {
    const lat = evento.latlng.lat;
    const lng = evento.latlng.lng;

    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;

    L.popup()
        .setLatLng(evento.latlng)
        .setContent("Local selecionado! Preencha os dados do alagamento no formulário abaixo.")
        .openOn(map);
}

map.on('click', aoClicarNoMapa);

// Captura o evento de envio do formulário
document.getElementById('form-alagamento').addEventListener('submit', function(evento) {
    // Evita que a página recarregue
    evento.preventDefault();

    // Captura os valores preenchidos nos campos
    const rua = document.getElementById('rua').value;
    const descricao = document.getElementById('descricao').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;

    if (!latitude || !longitude) {
        alert("Por favor, selecione um local no mapa clicando antes de enviar!");
        return;
    }

    const dadosAlagamento = {
        rua: rua,
        descricao: descricao,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
    };

    fetch('http://127.0.0.1:8000/api/alagamentos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosAlagamento)
    })
    .then(resposta => resposta.json())
    .then(dados => {
        if (dados.status === "sucesso") {
            alert("Alerta enviado com sucesso para o servidor!");

            document.getElementById('form-alagamento').reset();
        } else {
            alert("Erro ao enviar o alerta.");
        }
    })
    .catch(erro => {
        console.error("Erro na requisição:", erro);
        alert("Não foi possível conectar ao servidor. O backend está ligado?");
    });
});