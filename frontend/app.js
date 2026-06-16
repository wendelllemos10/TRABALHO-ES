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

// NOVA FUNÇÃO: Cria o marcador no mapa com um balão de informações (Popup)
function adicionarMarcadorNoMapa(lat, lng, rua, descricao) {
    L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>Alagamento relatado!</b><br><b>Rua:</b> ${rua}<br><b>Descrição:</b> ${descricao}`)
        .openPopup();
}

// Função roda sempre que clica no mapa
function aoClicarNoMapa(evento) {
    const lat = evento.latlng.lat;
    const lng = evento.latlng.lng;

    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;

    const popupCarregando = L.popup()
        .setLatLng(evento.latlng)
        .setContent("Buscando endereço... Por favor, aguarde.")
        .openOn(map);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(resposta => {
            if (!resposta.ok) throw new Error("Erro na requisição do servidor de mapas");
            return resposta.json();
        })
        .then(dados => {
            const nomeRua = dados.address.road || dados.address.pedestrian || dados.address.suburb || "";

            if (nomeRua) {
                document.getElementById('rua').value = nomeRua;
                
                popupCarregando.setContent(`<b>Local selecionado!</b><br>Rua identificada: ${nomeRua}.<br>Por favor, descreva o problema no formulário abaixo.`);
            } else {
                document.getElementById('rua').value = "";
                popupCarregando.setContent("<b>Local selecionado!</b><br>Não encontramos o nome da rua automaticamente. Por favor, digite o nome da rua no formulário abaixo.");
            }
        })
        .catch(erro => {
            console.error("Falha na geocodificação reversa:", erro);
            
            document.getElementById('rua').value = "";
            popupCarregando.setContent("<b>Local selecionado!</b><br>Não foi possível obter o nome da rua automaticamente devido a uma falha de conexão. <u>Por favor, digite o nome da rua manualmente no formulário.</u>");
        });
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

            //Desenha o pin na tela usando os dados que acabaram de ser enviados
            adicionarMarcadorNoMapa(dadosAlagamento.latitude, dadosAlagamento.longitude, dadosAlagamento.rua, dadosAlagamento.descricao);

            document.getElementById('form-alagamento').reset();
        } else {
            alert("Erro ao enviar o alerta.");
        }
    })
    .catch(erro => {
        console.error("Erro na requisição:", erro);
        alert("Não foi possível conectar ao servidor.");
    });
});
//Foca na rua ao digitar o nome
const inputRua = document.getElementById('rua');
const listaSugestoes = document.getElementById('lista-sugestoes');
let timeoutBusca;

inputRua.addEventListener('input', function() {
    clearTimeout(timeoutBusca);
    const termo = this.value.trim();

    // Espera digitar pelo menos 3 letras para procurar a rua
    if (termo.length < 3) {
        listaSugestoes.innerHTML = '';
        listaSugestoes.classList.add('sugestoes-oculta');
        return;
    }

    timeoutBusca = setTimeout(() => {
        // Faz o buscador a focar apenas em Quixadá Ceará
        const query = encodeURIComponent(`${termo}, Quixadá, Ceará`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`;

        fetch(url)
            .then(resposta => resposta.json())
            .then(dados => {
                exibirSugestoesDeRuas(dados);
            })
            .catch(erro => console.error("Erro ao buscar sugestões de rua:", erro));
    }, 500);
});

// Renderiza as opções encontradas na tela
function exibirSugestoesDeRuas(resultados) {
    listaSugestoes.innerHTML = '';

    if (resultados.length === 0) {
        listaSugestoes.classList.add('sugestoes-oculta');
        return;
    }

    resultados.forEach(local => {
        const li = document.createElement('li');
        li.className = 'sugestoes-item';
        
        li.textContent = local.display_name;
        
        // Ao clicar na opçao o mapa se move e o form atualiza
        li.onclick = () => aplicarSelecaoDeRua(local);
        
        listaSugestoes.appendChild(li);
    });

    listaSugestoes.classList.remove('sugestoes-oculta');
}

// Executado quando o usuario clica em uma das sugestões da lista
function aplicarSelecaoDeRua(local) {
    const lat = parseFloat(local.lat);
    const lng = parseFloat(local.lon);

    // 1. Dá um zoom na rua selecionada 
    map.flyTo([lat, lng], 17);

    // 2. Preenche os campos ocultos
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    
    const nomeLimpoRua = local.display_name.split(',')[0];
    inputRua.value = nomeLimpoRua; 

    // 4. Esconde a lista de sugestões
    listaSugestoes.innerHTML = '';
    listaSugestoes.classList.add('sugestoes-oculta');
}

// Fecha a lista de sugestões se o usuário clicar em qualquer outro lugar fora do formulário
document.addEventListener('click', function(evento) {
    if (evento.target !== inputRua && evento.target !== listaSugestoes) {
        listaSugestoes.innerHTML = '';
        listaSugestoes.classList.add('sugestoes-oculta');
    }
});


function carregarMarcadoresDoBanco() {
    fetch('http://127.0.0.1:8000/api/alagamentos')
        .then(resposta => {
            if (!resposta.ok) throw new Error("Erro ao buscar dados do servidor");
            return resposta.json();
        })
        .then(listaDeAlagamentos => {
            listaDeAlagamentos.forEach(ponto => {
                L.marker([ponto.latitude, ponto.longitude])
                    .addTo(map)
                    .bindPopup(`
                        <b>Alagamento na ${ponto.rua}</b><br>
                        <span style="color: #d9534f; font-weight: bold;">⚠️ ${ponto.quantidade_reportes} reportes nesta localização</span><br>
                        <br>
                        <b>Último relato:</b><br>
                        ${ponto.descricao}
                    `);
            });
        })
        .catch(erro => console.error("Erro ao carregar marcadores iniciais:", erro));
}