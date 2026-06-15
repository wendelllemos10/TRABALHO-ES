import sqlite3

def conectar():
    return sqlite3.connect("alagamentos.db")

def criar_tabela():
    conexao = conectar()

    cursor = conexao.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alagamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rua TEXT NOT NULL,
            descricao TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            quantidade_reportes INTEGER DEFAULT 1
        )
    """)

    conexao.commit()
    conexao.close()


def verificar_existente(latitude, longitude):

    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id,
            latitude,
            longitude,
            quantidade_reportes
        FROM alagamentos
    """)

    registros = cursor.fetchall()

    for registro in registros:

        id_alagamento = registro[0]
        lat_bd = registro[1]
        lon_bd = registro[2]
        quantidade = registro[3]

        if (
            abs(lat_bd - latitude) < 0.0005
            and
            abs(lon_bd - longitude) < 0.0005
        ):

            cursor.execute("""
                UPDATE alagamentos
                SET quantidade_reportes = ?
                WHERE id = ?
            """, (
                quantidade + 1,
                id_alagamento
            ))

            conexao.commit()
            conexao.close()

            return True

    conexao.close()

    return False


def inserir_alagamento(
    rua,
    descricao,
    latitude,
    longitude
):

    conexao = conectar()

    cursor = conexao.cursor()

    cursor.execute("""
        INSERT INTO alagamentos (
            rua,
            descricao,
            latitude,
            longitude
        )
        VALUES (?, ?, ?, ?)
    """, (
        rua,
        descricao,
        latitude,
        longitude
    ))

    conexao.commit()
    conexao.close()


def listar_alagamentos():

    conexao = conectar()

    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id,
            rua,
            descricao,
            latitude,
            longitude,
            quantidade_reportes
        FROM alagamentos
    """)

    dados = cursor.fetchall()

    conexao.close()

    return dados