from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    criar_tabela,
    inserir_alagamento,
    verificar_existente,
    listar_alagamentos
)

app = FastAPI()

criar_tabela()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Alagamento(BaseModel):
    rua: str
    descricao: str
    latitude: float
    longitude: float


@app.get("/")
def index():
    return {
        "status": "sucesso",
        "projeto": "Alagamentos em Quixadá"
    }


@app.post("/api/alagamentos")
def registrar_alagamento(alagamento: Alagamento):

    ja_existe = verificar_existente(
        alagamento.latitude,
        alagamento.longitude
    )

    if not ja_existe:

        inserir_alagamento(
            alagamento.rua,
            alagamento.descricao,
            alagamento.latitude,
            alagamento.longitude
        )

    return {
        "status": "sucesso",
        "mensagem": "Alagamento registrado com sucesso"
    }


@app.get("/api/alagamentos")
def obter_alagamentos():

    registros = listar_alagamentos()

    resultado = []

    for registro in registros:

        resultado.append({
            "id": registro[0],
            "rua": registro[1],
            "descricao": registro[2],
            "latitude": registro[3],
            "longitude": registro[4],
            "quantidade_reportes": registro[5]
        })

    return resultado