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
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            quantidade_reportes INTEGER DEFAULT 1
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS relatos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alagamento_id INTEGER NOT NULL,
            descricao TEXT NOT NULL,
            data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (alagamento_id) REFERENCES alagamentos(id)
        )
    """)

    conexao.commit()
    conexao.close()


def verificar_existente(latitude, longitude, descricao):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("SELECT id, latitude, longitude, quantidade_reportes FROM alagamentos")
    registros = cursor.fetchall()

    for registro in registros:
        id_alagamento = registro[0]
        lat_bd = registro[1]
        lon_bd = registro[2]
        quantidade = registro[3]

        if abs(lat_bd - latitude) < 0.0005 and abs(lon_bd - longitude) < 0.0005:
            cursor.execute("""
                UPDATE alagamentos
                SET quantidade_reportes = ?
                WHERE id = ?
            """, (quantidade + 1, id_alagamento))

            cursor.execute("""
                INSERT INTO relatos (alagamento_id, descricao)
                VALUES (?, ?)
            """, (id_alagamento, descricao))

            conexao.commit()
            conexao.close()
            return True

    conexao.close()
    return False


def inserir_alagamento(rua, descricao, latitude, longitude):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("""
        INSERT INTO alagamentos (rua, latitude, longitude, quantidade_reportes)
        VALUES (?, ?, ?, 1)
    """, (rua, latitude, longitude))
    
    id_novo_alagamento = cursor.lastrowid

    cursor.execute("""
        INSERT INTO relatos (alagamento_id, descricao)
        VALUES (?, ?)
    """, (id_novo_alagamento, descricao))

    conexao.commit()
    conexao.close()


def listar_alagamentos():
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id,
            rua,
            latitude,
            longitude,
            quantidade_reportes
        FROM alagamentos
    """)

    dados = cursor.fetchall()
    conexao.close()
    return dados