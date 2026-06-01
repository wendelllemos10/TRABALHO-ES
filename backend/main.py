from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

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
    return {"status": "sucesso", "projeto": "Alagamentos em Quixadá"}

@app.post("/api/alagamentos")
def registrar_alagamento(alagamento: Alagamento):
    print("Dados recebidos do frontend:", alagamento.dict())
    
    return {"status": "sucesso", "mensagem": "Alagamento registrado com sucesso!"}