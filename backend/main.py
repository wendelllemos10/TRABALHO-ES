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
        alagamento.longitude,
        alagamento.descricao
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
            "latitude": registro[2],
            "longitude": registro[3],
            "quantidade_reportes": registro[4]
        })

    return resultado

@app.get("/api/alagamentos/{alagamento_id}/relatos")
def obter_relatos_do_ponto(alagamento_id: int):
    import sqlite3
    conexao = sqlite3.connect("alagamentos.db")
    cursor = conexao.cursor()
    
    cursor.execute("""
        SELECT descricao, strftime('%d/%m às %H:%M', data_registro, 'localtime') 
        FROM relatos 
        WHERE alagamento_id = ? 
        ORDER BY id DESC
    """, (alagamento_id,))
    
    dados = cursor.fetchall()
    conexao.close()
    
    return [{"descricao": r[0], "data": r[1]} for r in dados]