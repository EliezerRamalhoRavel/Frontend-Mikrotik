import os
import pathlib
import sys
from flask import Flask, render_template_string, request, redirect, url_for, flash
import traceback

try:
    from dotenv import load_dotenv
except ImportError:
    print("AVISO: Biblioteca 'python-dotenv' não encontrada. Instale com: pip install python-dotenv")
    print("       A leitura do arquivo .env não funcionará.")
    load_dotenv = None

MYSQL_AVAILABLE = False
try:
    import mysql.connector
    from mysql.connector import Error
    MYSQL_AVAILABLE = True
except ImportError:
    print("AVISO: Biblioteca 'mysql-connector-python' não encontrada. Instale com: pip install mysql-connector-python")
    print("       A conexão com o banco de dados MySQL não funcionará.")
    mysql = None
    if "Error" not in locals():
        Error = Exception

BASE_DIR = pathlib.Path(__file__).resolve().parent
OUTPUT_FILENAME = "output.txt"
OUTPUT_FILE_PATH = BASE_DIR / OUTPUT_FILENAME
IGNORE_DIRS = {"__pycache__", "venv", ".git", ".idea", "migrations", "instance", "bots", "node_modules", ".vscode"}
IGNORE_FILES = {
    ".env", OUTPUT_FILENAME, ".DS_Store",
    pathlib.Path(__file__).name
}
CONTENT_EXTENSIONS = {
    ".py", ".html", ".css", ".js", ".mjs", ".cjs",
    ".ts", ".tsx", ".jsx",
    ".md", ".txt", ".json", ".yaml", ".yml", ".sql", ".sh",
    ".svg"
}
N_SAMPLE_ROWS = 5

DOTENV_PATH = BASE_DIR / ".env"
if load_dotenv:
    if DOTENV_PATH.exists():
        load_dotenv(dotenv_path=DOTENV_PATH)
        print(f"Arquivo .env carregado de {DOTENV_PATH}")
    else:
        print(f"AVISO: Arquivo .env não encontrado em {DOTENV_PATH}.")
else:
    print("AVISO: python-dotenv não carregado. Variáveis de ambiente do sistema serão usadas se disponíveis.")

SELECTOR_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seletor de Itens para Exportar</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.6; padding: 20px; background-color: #f8f9fa; color: #212529; }
        .container { max-width: 900px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-bottom: 20px; color: #343a40; }
        .file-list { margin-bottom: 20px; max-height: 350px; overflow-y: auto; border: 1px solid #ced4da; padding: 15px; border-radius: 4px; background-color: #f8f9fa; }
        .file-item { display: block; margin-bottom: 8px; padding: 5px; border-radius: 3px; transition: background-color 0.2s ease-in-out; }
        .file-item:hover { background-color: #e9ecef; }
        .file-item input[type="checkbox"] { margin-right: 8px; vertical-align: middle; }
        label { vertical-align: middle; cursor: pointer; word-break: break-all; }
        button, .button-like { padding: 8px 15px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 4px; font-size: 0.9em; transition: background-color 0.2s ease-in-out; margin-right: 5px; margin-bottom: 10px; display: inline-block; text-decoration: none; }
        button:hover, .button-like:hover { background-color: #0056b3; }
        button[type="submit"] { background-color: #28a745; padding: 10px 20px; font-size: 1em;}
        button[type="submit"]:hover { background-color: #1e7e34; }
        .action-buttons button, .action-buttons .button-like { background-color: #6c757d; }
        .action-buttons button:hover, .action-buttons .button-like:hover { background-color: #545b62; }
        .section-options { margin-bottom: 20px; padding: 15px; border: 1px solid #ced4da; border-radius: 4px; background-color: #f8f9fa;}
        .section-options h3 { margin-top: 0; font-size: 1.1em; color: #495057;}
        .section-options div { margin-bottom: 10px; }
        .section-options input[type="checkbox"] { margin-right: 5px; }
        .flash-messages { list-style: none; padding: 0; margin: 20px 0; }
        .flash-messages li { padding: 12px 15px; margin-bottom: 10px; border-radius: 4px; border: 1px solid transparent; }
        .flash-success { background-color: #d4edda; color: #155724; border-color: #c3e6cb; }
        .flash-error { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
        .footer-info { margin-top: 30px; text-align: center; font-size: 0.9em; color: #6c757d; }
        .db-sample-option { margin-left: 20px; font-size: 0.9em; }
        .db-sample-option input[type="checkbox"]:disabled + label { color: #6c757d; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Selecione os itens para incluir no <code>{{ output_filename }}</code></h1>

        {% with messages = get_flashed_messages(with_categories=true) %}
          {% if messages %}
            <ul class="flash-messages">
            {% for category, message in messages %}
              <li class="flash-{{ category }}">{{ message }}</li>
            {% endfor %}
            </ul>
          {% endif %}
        {% endwith %}

        <form method="post" action="{{ url_for('export_files') }}">
            <div class="section-options">
                <h3>Seções para Incluir no Output:</h3>
                <div>
                    <input type="checkbox" id="include_structure" name="include_structure" value="true" {% if default_include_structure %}checked{% endif %}>
                    <label for="include_structure">Incluir Estrutura do Projeto</label>
                </div>
                <div>
                    <input type="checkbox" id="include_db_schema" name="include_db_schema" value="true" {% if mysql_available and default_include_db_schema %}checked{% endif %} {% if not mysql_available %}disabled{% endif %} onchange="updateDbSampleCheckboxState()">
                    <label for="include_db_schema" {% if not mysql_available %}style="color: #6c757d;"{% endif %}>Incluir Schema do Banco de Dados {% if not mysql_available %}(MySQL não disponível){% endif %}</label>
                    <div class="db-sample-option">
                        <input type="checkbox" id="include_db_sample" name="include_db_sample" value="true" {% if not mysql_available or not default_include_db_schema %}disabled{% endif %}>
                        <label for="include_db_sample">Incluir amostra de dados ({{ n_sample_rows }} primeiras linhas por tabela)</label>
                    </div>
                </div>
            </div>

            <div class="section-options">
                <h3>Conteúdo dos Arquivos:</h3>
                <p>Selecione os arquivos abaixo para incluir seus conteúdos.</p>
                <div class="action-buttons">
                    <button type="button" onclick="toggleSelectAllFiles(true)">Selecionar Todos Arquivos</button>
                    <button type="button" onclick="toggleSelectAllFiles(false)">Desmarcar Todos Arquivos</button>
                    <span style="margin-left: 20px;">Selecionar por extensão:</span>
                    {% for ext in content_extensions_list %}
                        <button type="button" onclick="selectFilesByExtension('{{ ext }}')">Selecionar {{ ext }}</button>
                    {% endfor %}
                </div>
                 <div class="action-buttons" style="margin-top:10px;">
                    <button type="button" onclick="selectOnlyStructure()">Focar: Apenas Estrutura</button>
                    <button type="button" onclick="selectOnlyDBSchema(false)">Focar: Apenas Schema DB</button>
                    {% if mysql_available %}
                    <button type="button" onclick="selectOnlyDBSchema(true)">Focar: Schema DB + Amostra</button>
                    {% endif %}
                </div>
                <div class="file-list">
                    {% if files %}
                        {% for file in files %}
                            <div class="file-item">
                                <input type="checkbox"
                                       name="selected_files"
                                       value="{{ file }}"
                                       id="file_{{ loop.index }}"
                                       data-extension="{{ file.split('.')[-1] if '.' in file else '' }}"
                                       {% if file in pre_selected_files %}checked{% endif %}>
                                <label for="file_{{ loop.index }}">{{ file }}</label>
                            </div>
                        {% endfor %}
                    {% else %}
                        <p>Nenhum arquivo encontrado para selecionar (verifique as configurações de ignore).</p>
                    {% endif %}
                </div>
            </div>

            {% if files or mysql_available %}
                <button type="submit">Gerar {{ output_filename }} com Selecionados</button>
            {% else %}
                 <p>Nenhum arquivo ou funcionalidade de DB disponível para exportar.</p>
            {% endif %}
        </form>

        <div class="footer-info">
            Script rodando em: {{ base_dir_path }} <br>
            Total de arquivos descobertos (antes de ignorar): {{ all_discovered_files_count }}
        </div>
    </div>

<script>
    function updateDbSampleCheckboxState() {
        const dbSchemaCheckbox = document.getElementById('include_db_schema');
        const dbSampleCheckbox = document.getElementById('include_db_sample');
        if (dbSchemaCheckbox.checked && dbSchemaCheckbox.disabled === false) {
            dbSampleCheckbox.disabled = false;
        } else {
            dbSampleCheckbox.disabled = true;
            dbSampleCheckbox.checked = false;
        }
    }

    function toggleSelectAllFiles(select) {
        const checkboxes = document.querySelectorAll('input[name="selected_files"]');
        checkboxes.forEach(checkbox => checkbox.checked = select);
    }

    function selectFilesByExtension(extension) {
        const checkboxes = document.querySelectorAll('input[name="selected_files"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.dataset.extension.toLowerCase() === extension.toLowerCase().replace('.', '')) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
        });
    }

    function selectOnlyStructure() {
        document.getElementById('include_structure').checked = true;
        document.getElementById('include_db_schema').checked = false;
        document.getElementById('include_db_sample').checked = false;
        toggleSelectAllFiles(false);
        updateDbSampleCheckboxState();
    }

    function selectOnlyDBSchema(includeSample) {
        document.getElementById('include_structure').checked = false;
        if (document.getElementById('include_db_schema').disabled === false) {
            document.getElementById('include_db_schema').checked = true;
            if (document.getElementById('include_db_sample').disabled === false) {
                 document.getElementById('include_db_sample').checked = includeSample;
            }
        } else {
            return;
        }
        toggleSelectAllFiles(false);
        updateDbSampleCheckboxState();
    }

    document.addEventListener('DOMContentLoaded', function() {
        updateDbSampleCheckboxState();
    });
</script>
</body>
</html>
"""

def get_db_connection():
    if not MYSQL_AVAILABLE:
        print("ERRO: mysql.connector não está disponível.")
        return None
    db_host = os.environ.get("MYSQL_HOST")
    db_user = os.environ.get("MYSQL_USER")
    db_pass = os.environ.get("MYSQL_PASSWORD")
    db_name = os.environ.get("MYSQL_DB")

    if not all([db_host, db_user, db_name]):
        print("AVISO: Uma ou mais variáveis de ambiente MySQL (HOST, USER, DB) não estão definidas.")
        return None

    try:
        conn = mysql.connector.connect(
            host=db_host,
            user=db_user,
            password=db_pass,
            database=db_name
        )
        return conn
    except Error as e:
        print(f"!!! ERRO ao conectar ao MySQL: {e} !!!")
        print("Verifique as variáveis MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB no seu .env")
        return None
    except Exception as e:
        print(f"!!! ERRO GERAL ao tentar conectar ao MySQL: {e} !!!")
        return None

def close_connection(conn, cursor=None):
    if cursor:
        try:
            cursor.close()
        except Error as e:
            print(f"Erro ao fechar o cursor: {e}")
        except Exception as e:
            print(f"Erro inesperado ao fechar o cursor: {e}")
    if conn and conn.is_connected():
        try:
            conn.close()
        except Error as e:
            print(f"Erro ao fechar a conexão: {e}")
        except Exception as e:
            print(f"Erro inesperado ao fechar a conexão: {e}")

def discover_project_files():
    discovered_files = []
    try:
        for root, dirs, files in os.walk(BASE_DIR, topdown=True):
            current_path = pathlib.Path(root)
            rel_dir_path = current_path.relative_to(BASE_DIR)

            dirs[:] = sorted([d for d in dirs if d not in IGNORE_DIRS and not d.startswith(".")])
            files_filtered = sorted([f for f in files if f not in IGNORE_FILES and not f.startswith(".")])

            for f_name in files_filtered:
                rel_file_path = rel_dir_path / f_name
                discovered_files.append(str(rel_file_path).replace("\\", "/"))
    except Exception as e:
        print(f"ERRO durante a descoberta de arquivos em {BASE_DIR}: {e}")
        traceback.print_exc()
        return []
    return sorted(discovered_files)

def write_project_structure(outfile, all_files):
    outfile.write("=" * 30 + "\n")
    outfile.write("  ESTRUTURA DO PROJETO (ARQUIVOS)\n")
    outfile.write("=" * 30 + "\n\n")
    outfile.write(f"./{BASE_DIR.name}/\n")

    printed_dirs = set()
    all_files.sort()

    for path_str in all_files:
        try:
            p = pathlib.Path(path_str)
            parts = p.parts

            for i in range(len(parts) - 1):
                current_dir_path_str = "/".join(parts[:i + 1])
                if current_dir_path_str not in printed_dirs:
                    indent = "    " * i + "|-- "
                    outfile.write(f"{indent}{parts[i]}/\n")
                    printed_dirs.add(current_dir_path_str)

            indent = "    " * (len(parts) - 1) + "|-- "
            outfile.write(f"{indent}{p.name}\n")
        except Exception as e:
            outfile.write(f"\n!!! ERRO ao processar estrutura para: {path_str} - {e} !!!\n")
    outfile.write("\n")

def get_db_schema(outfile, include_sample=False):
    outfile.write("\n\n" + "=" * 30 + "\n")
    outfile.write("  DATABASE SCHEMA\n")
    outfile.write("=" * 30 + "\n\n")

    db_name_env = os.environ.get("MYSQL_DB")
    if not db_name_env:
        outfile.write("!!! AVISO: Variável de ambiente MYSQL_DB não definida. Não é possível obter o schema. !!!\n\n")
        return
    if not MYSQL_AVAILABLE:
        outfile.write("!!! ERRO: Biblioteca mysql-connector-python não instalada ou não pôde ser carregada. Não é possível obter o schema. !!!\n\n")
        return

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if not conn:
            outfile.write(
                "!!! ERRO: Não foi possível conectar ao banco de dados para obter o schema. "
                "Verifique as configurações em .env e se o DB está acessível. !!!\n\n"
            )
            return

        cursor = conn.cursor()
        outfile.write(f"Database: {db_name_env}\n\n")

        cursor.execute("SHOW TABLES;")
        tables = cursor.fetchall()

        if not tables:
            outfile.write("Nenhuma tabela encontrada no banco de dados.\n")
        else:
            for (table_name,) in tables:
                outfile.write(f"-- Estrutura Tabela: {table_name} --\n")
                try:
                    cursor.execute(f"SHOW COLUMNS FROM `{table_name}`;")
                    columns = cursor.fetchall()
                    if not columns:
                        outfile.write("  (Não foi possível obter colunas ou tabela vazia)\n")
                    else:
                        headers = [desc[0] for desc in cursor.description]
                        col_widths = {header: len(header) for header in headers}
                        for row in columns:
                            for i, value in enumerate(row):
                                header = headers[i]
                                col_widths[header] = max(col_widths[header], len(str(value if value is not None else "NULL")))

                        header_line = " | ".join(f"{h:<{col_widths[h]}}" for h in headers)
                        outfile.write(header_line + "\n")
                        separator_line = "-+-".join("-" * col_widths[h] for h in headers)
                        outfile.write(separator_line + "\n")

                        for col in columns:
                            col_info = [str(c) if c is not None else "NULL" for c in col]
                            row_line = " | ".join(f"{c:<{col_widths[headers[i]]}}" for i, c in enumerate(col_info))
                            outfile.write(row_line + "\n")
                    outfile.write("\n")

                    if include_sample:
                        outfile.write(f"-- Amostra de Dados (primeiras {N_SAMPLE_ROWS} linhas): {table_name} --\n")
                        try:
                            cursor.execute(f"SELECT * FROM `{table_name}` LIMIT {N_SAMPLE_ROWS};")
                            sample_data = cursor.fetchall()

                            if not sample_data:
                                outfile.write("  (Nenhuma amostra de dados encontrada ou tabela vazia)\n\n")
                            else:
                                sample_headers = [desc[0] for desc in cursor.description]
                                sample_col_widths = {header: len(header) for header in sample_headers}

                                for row in sample_data:
                                    for i, value in enumerate(row):
                                        header = sample_headers[i]
                                        if isinstance(value, bytes):
                                            try:
                                                value_str = value.decode("utf-8", errors="replace")
                                            except Exception:
                                                value_str = str(value)
                                        else:
                                            value_str = str(value if value is not None else "NULL")
                                        sample_col_widths[header] = max(sample_col_widths[header], len(value_str))

                                sample_header_line = " | ".join(f"{h:<{sample_col_widths[h]}}" for h in sample_headers)
                                outfile.write(sample_header_line + "\n")
                                sample_separator_line = "-+-".join("-" * sample_col_widths[h] for h in sample_headers)
                                outfile.write(sample_separator_line + "\n")

                                for row_data in sample_data:
                                    row_values = []
                                    for val in row_data:
                                        if isinstance(val, bytes):
                                            try:
                                                row_values.append(val.decode("utf-8", errors="replace"))
                                            except Exception:
                                                row_values.append(str(val))
                                        else:
                                            row_values.append(str(val) if val is not None else "NULL")

                                    row_line = " | ".join(f"{val:<{sample_col_widths[sample_headers[i]]}}" for i, val in enumerate(row_values))
                                    outfile.write(row_line + "\n")
                                outfile.write("\n")
                        except Error as sample_error:
                            outfile.write(f"  !!! ERRO ao buscar amostra de dados para {table_name}: {sample_error} !!!\n\n")
                        except Exception as e_sample:
                            outfile.write(f"  !!! ERRO INESPERADO ao buscar amostra para {table_name}: {e_sample} !!!\n\n")
                            traceback.print_exc(file=outfile)

                except Error as desc_error:
                    outfile.write(f"  !!! ERRO ao descrever a tabela {table_name}: {desc_error} !!!\n\n")
                except Exception as e_desc:
                    outfile.write(f"  !!! ERRO INESPERADO ao descrever a tabela {table_name}: {e_desc} !!!\n\n")
                    traceback.print_exc(file=outfile)
        outfile.write("\n")
    except Error as conn_error:
        outfile.write(f"!!! ERRO GERAL DE CONEXÃO COM DB: {conn_error} !!!\n\n")
        traceback.print_exc(file=outfile)
    except Exception as e_main:
        outfile.write(f"!!! ERRO INESPERADO AO BUSCAR SCHEMA: {e_main} !!!\n\n")
        traceback.print_exc(file=outfile)
    finally:
        close_connection(conn, cursor)

def write_selected_files_content(outfile, selected_files):
    if not selected_files:
        return

    outfile.write("\n\n" + "=" * 30 + "\n")
    outfile.write("  CONTEÚDO DOS ARQUIVOS SELECIONADOS\n")
    outfile.write("=" * 30 + "\n\n")
    print("  [*] Escrevendo conteúdo dos arquivos selecionados...")

    selected_files.sort()
    for rel_path_str in selected_files:
        try:
            file_path = BASE_DIR / rel_path_str
            if not file_path.is_file():
                print(f"  [!] Aviso: Item selecionado não é um arquivo válido: {rel_path_str}")
                outfile.write(f"\n--- IGNORADO (NÃO É ARQUIVO): {rel_path_str} ---\n\n")
                continue

            if file_path.suffix.lower() in CONTENT_EXTENSIONS:
                separator_line = "-" * (19 + len(rel_path_str))
                outfile.write(f"{separator_line}\n")
                outfile.write(f"--- ARQUIVO: {rel_path_str} ---\n")
                outfile.write(f"{separator_line}\n\n")
                try:
                    try:
                        content = file_path.read_text(encoding="utf-8")
                    except UnicodeDecodeError:
                        print(f"  [!] Aviso: Falha ao ler {rel_path_str} como UTF-8, tentando Latin-1.")
                        content = file_path.read_text(encoding="latin-1", errors="replace")
                    except Exception as read_err:
                        print(f"  [!] ERRO de leitura não tratado para {rel_path_str}: {read_err}")
                        outfile.write(f"\n!!! ERRO AO LER O ARQUIVO {rel_path_str}: {read_err} !!!\n")
                        content = None

                    if content is not None:
                        outfile.write(content)
                except Exception as e_content:
                    outfile.write(f"\n!!! ERRO INESPERADO AO PROCESSAR ARQUIVO {rel_path_str}: {e_content} !!!\n")
                    traceback.print_exc(file=outfile)
                outfile.write("\n\n" + separator_line + "\n\n")
            else:
                print(f"  [i] Ignorando conteúdo de {rel_path_str} (extensão '{file_path.suffix}' não listada em CONTENT_EXTENSIONS).")
        except Exception as e_general_file:
            print(f"ERRO GERAL ao processar o arquivo selecionado {rel_path_str}: {e_general_file}")
            outfile.write(f"\n!!! ERRO GERAL AO PROCESSAR {rel_path_str}: {e_general_file} !!!\n")
            traceback.print_exc(file=outfile)

def generate_project_output(selected_files, all_discovered_files, include_structure, include_db_schema, include_db_sample):
    try:
        with open(OUTPUT_FILE_PATH, "w", encoding="utf-8") as outfile:
            print(f"Iniciando a gravação em {OUTPUT_FILENAME}...")

            generation_started = False
            if include_structure:
                print("  [*] Incluindo estrutura do projeto...")
                write_project_structure(outfile, all_discovered_files)
                generation_started = True

            if include_db_schema:
                print("  [*] Incluindo schema do banco de dados...")
                if MYSQL_AVAILABLE:
                    get_db_schema(outfile, include_sample=include_db_sample)
                else:
                    outfile.write("\n\n" + "=" * 30 + "\n")
                    outfile.write("  DATABASE SCHEMA (INDISPONÍVEL)\n")
                    outfile.write("=" * 30 + "\n\n")
                    outfile.write("!!! AVISO: mysql-connector-python não está instalado ou configurado. Schema do DB não incluído. !!!\n\n")
                generation_started = True

            if selected_files:
                print("  [*] Incluindo conteúdo de arquivos selecionados...")
                write_selected_files_content(outfile, selected_files)
                generation_started = True

            if not generation_started:
                outfile.write("Nenhuma seção foi selecionada para inclusão no output.\n")
                print("Nenhuma seção foi selecionada. Arquivo de output conterá apenas esta mensagem.")

        print(f"Output gerado com sucesso em {OUTPUT_FILE_PATH}")
        return True
    except Exception as e:
        print(f"ERRO GERAL ao gerar o arquivo {OUTPUT_FILENAME}: {e}")
        traceback.print_exc()
        try:
            with open(OUTPUT_FILE_PATH, "a", encoding="utf-8") as errfile:
                errfile.write("\n\n" + "=" * 30 + "\n")
                errfile.write("  ERRO CRÍTICO NA GERAÇÃO DO ARQUIVO\n")
                errfile.write("=" * 30 + "\n\n")
                errfile.write(f"Erro: {e}\n")
                traceback.print_exc(file=errfile)
        except Exception as write_err:
            print(f"Não foi possível nem escrever o erro no arquivo de output: {write_err}")
        return False

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(24))

@app.route("/", methods=["GET"])
def index():
    all_files = discover_project_files()
    pre_selected = [f for f in all_files if pathlib.Path(f).suffix.lower() in CONTENT_EXTENSIONS]
    filter_extensions = sorted(list(set(ext.lstrip(".").lower() for ext in CONTENT_EXTENSIONS if ext)))

    return render_template_string(
        SELECTOR_HTML_TEMPLATE,
        files=all_files,
        pre_selected_files=pre_selected,
        base_dir_name=BASE_DIR.name,
        base_dir_path=str(BASE_DIR),
        output_filename=OUTPUT_FILENAME,
        mysql_available=MYSQL_AVAILABLE,
        n_sample_rows=N_SAMPLE_ROWS,
        all_discovered_files_count=len(all_files),
        content_extensions_list=filter_extensions,
        default_include_structure=True,
        default_include_db_schema=True
    )

@app.route("/export", methods=["POST"])
def export_files():
    selected_files = request.form.getlist("selected_files")
    include_structure = request.form.get("include_structure") == "true"
    include_db_schema = request.form.get("include_db_schema") == "true"
    include_db_sample = request.form.get("include_db_sample") == "true"

    if not include_db_schema:
        include_db_sample = False

    if not selected_files and not include_structure and not include_db_schema:
        flash("Nenhuma seção ou arquivo foi selecionado para exportação.", "error")
        return redirect(url_for("index"))

    print("-" * 50)
    print("Opções de Exportação Recebidas:")
    print(f"  Incluir Estrutura: {include_structure}")
    print(f"  Incluir Schema DB: {include_db_schema}")
    print(f"  Incluir Amostra DB: {include_db_sample}")
    print(f"  Arquivos selecionados para conteúdo ({len(selected_files)}):")
    for f in selected_files:
        print(f"    - {f}")
    print("-" * 50)

    all_discovered_files = discover_project_files()
    success = generate_project_output(selected_files, all_discovered_files, include_structure, include_db_schema, include_db_sample)

    if success:
        flash(f"Output gerado com sucesso em {OUTPUT_FILENAME}!", "success")
    else:
        flash("Ocorreu um erro durante a exportação. Verifique o console para detalhes.", "error")
    return redirect(url_for("index"))

if __name__ == "__main__":
    try:
        import flask
    except ImportError:
        print("\n!!! ERRO CRÍTICO: Flask não está instalado.")
        print("    Execute: pip install Flask")
        sys.exit(1)

    if load_dotenv is None:
        print("AVISO: python-dotenv não instalado. A leitura de .env não funcionará.")
    if not MYSQL_AVAILABLE:
        print("AVISO: mysql-connector-python não instalado ou com erro. Funcionalidades de DB não operarão.")

    host = os.environ.get("FLASK_RUN_HOST", "127.0.0.1")
    port = int(os.environ.get("FLASK_RUN_PORT", 5026))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() in ["true", "1", "t"]

    print("\nIniciando servidor Flask...")
    print(f"Acesse a interface no seu navegador: http://{host}:{port}")
    print(f"Diretório base do projeto: {BASE_DIR}")
    print(f"Arquivo de saída será gerado como: {OUTPUT_FILE_PATH}")
    print("(Pressione CTRL+C no terminal para parar o servidor)")

    app.run(host=host, port=port, debug=debug_mode)
