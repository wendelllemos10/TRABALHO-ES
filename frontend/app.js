let marcadores = [];

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
document.getElementById('form-alagamento').addEventListener('submit', function (evento) {
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

inputRua.addEventListener('input', function () {
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
document.addEventListener('click', function (evento) {
    if (evento.target !== inputRua && evento.target !== listaSugestoes) {
        listaSugestoes.innerHTML = '';
        listaSugestoes.classList.add('sugestoes-oculta');
    }
});


function carregarMarcadoresDoBanco() {
    fetch('http://127.0.0.1:8000/api/alagamentos')
        .then(resposta => {
            if (!resposta.ok) throw new Error("Erro ao buscar dados do servidor.");
            return resposta.json();
        })
        .then(listaDeAlagamentos => {
            marcadores.forEach(m => map.removeLayer(m));
            marcadores = [];

            listaDeAlagamentos.forEach(ponto => {
                const marker = L.marker([ponto.latitude, ponto.longitude]).addTo(map);
                
                const popupContent = `
                    <div style="font-family: sans-serif; min-width: 160px;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">${ponto.rua || "Região Registrada"}</h4>
                        <p style="margin: 0 0 10px 0; font-size: 13px; color: #666;">
                            ⚠️ Alertas: <strong>${ponto.quantidade_reportes}</strong>
                        </p>
                        <button onclick="focarPontoNoHistorico(${ponto.id})" 
                                style="width: 100%; background: #007bff; color: white; border: none; 
                                       padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Ver relatos deste local
                        </button>
                    </div>
                `;

                marker.bindPopup(popupContent);
                marcadores.push(marker);
            });
        })
        .catch(erro => console.error("Erro ao carregar marcadores:", erro));
}


function focarPontoNoHistorico(id) {
    const painel = document.getElementById('painel-historico');
    
    // Se o painel estiver oculto, usa a sua própria função existente para abrir
    if (painel && painel.classList.contains('painel-oculto')) {
        alternarHistorico();
    }

    // Aguarda a renderização dos elementos na lista
    setTimeout(() => {
        const itemHistorico = document.querySelector(`.item-reporte[data-id="${id}"]`);
        
        if (itemHistorico) {
            itemHistorico.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            if (!itemHistorico.classList.contains('aberto')) {
                itemHistorico.click();
            }

            itemHistorico.style.backgroundColor = '#e6f2ff';
            setTimeout(() => {
                itemHistorico.style.backgroundColor = '';
            }, 2000);
        }
    }, 300);
}

window.focarPontoNoHistorico = focarPontoNoHistorico;

function alternarHistorico() {
    const painel = document.getElementById('painel-historico');
    const estaOculto = painel.classList.contains('painel-oculto');

    painel.classList.toggle('painel-oculto');

    if (estaOculto) {
        carregarListaHistoricoGeral();
    }
}

function carregarListaHistoricoGeral() {
    const listaContainer = document.getElementById('lista-reportes');

    // Busca as regiões agrupadas do backend
    fetch('http://127.0.0.1:8000/api/alagamentos')
        .then(resposta => {
            if (!resposta.ok) throw new Error("Erro ao buscar histórico");
            return resposta.json();
        })
        .then(listaDeAlagamentos => {
            listaContainer.innerHTML = '';

            if (listaDeAlagamentos.length === 0) {
                listaContainer.innerHTML = '<p style="color:#888; text-align:center;">Nenhum relato encontrado.</p>';
                return;
            }

            listaDeAlagamentos.forEach(ponto => {
                const item = document.createElement('div');
                item.className = 'item-reporte';

                item.dataset.id = ponto.id;
                item.dataset.carregado = "false";

                item.innerHTML = `
                    <h4>${ponto.rua || "Rua não identificada"}</h4>
                    <span class="contador-votos">⚠️ ${ponto.quantidade_reportes} alertas nesta região</span>
                    <div class="detalhes-reporte">
                        <div class="conteudo-relatos" style="margin-top: 5px;">Carregando relatos...</div>
                    </div>
                `;

                item.onclick = function () {
                    const estaAberto = this.classList.contains('aberto');

                    if (!estaAberto && this.dataset.carregado === "false") {
                        const containerRelatos = this.querySelector('.conteudo-relatos');
                        const alagamentoId = this.dataset.id;

                        fetch(`http://127.0.0.1:8000/api/alagamentos/${alagamentoId}/relatos`)
                            .then(res => res.json())
                            .then(relatos => {
                                containerRelatos.innerHTML = '';

                                relatos.forEach(relato => {
                                    const divRelato = document.createElement('div');
                                    divRelato.style.marginBottom = "8px";
                                    divRelato.style.paddingBottom = "8px";
                                    divRelato.style.borderBottom = "1px dashed #eee";

                                    divRelato.innerHTML = `
                                        <small style="color: #999; display:block;">Relatado em: ${relato.data}</small>
                                        <p style="margin: 4px 0 0 0; color: #555;">${relato.descricao}</p>
                                    `;
                                    containerRelatos.appendChild(divRelato);
                                });

                                this.dataset.carregado = "true";
                            })
                            .catch(erro => {
                                console.error("Erro ao buscar relatos:", erro);
                                containerRelatos.innerHTML = '<span style="color:#d9534f;">Erro ao carregar relatos.</span>';
                            });
                    }

                    this.classList.toggle('aberto');
                };

                listaContainer.appendChild(item);
            });
        })
        .catch(erro => {
            console.error("Erro ao carregar histórico:", erro);
            listaContainer.innerHTML = '<p style="color:#d9534f; text-align:center;">Erro ao carregar dados.</p>';
        });
}

carregarMarcadoresDoBanco();