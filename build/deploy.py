from requests_toolbelt import MultipartEncoder
from requests_toolbelt import MultipartEncoderMonitor
from tqdm import tqdm
import argparse
import base64
import binascii
import configparser
import hashlib
import hmac
import json
import os
import requests
import sys
import urllib

BUFFER = 64 * 1024
CONFIG_FILE = 'deploy.ini'

UPLOAD_API = "/services/api/deploymentUpload"
UNZIP_API = "/services/api/deploymentExpand"
INSTALL_API = "/services/api/deploymentInstall"


def generate_random_hex(length=16):
    return binascii.hexlify(os.urandom(length)).decode()


def prepare_post_values(args):
    ret = ''
    for key, value in sorted(args.items()):
        if ret != '':
            ret += '&'
        ret += key + '=' + urllib.parse.quote_plus(value)

    return ret


def hash_file(file, size):
    sha = hashlib.sha256()
    with open(file, 'rb') as f:
        with tqdm(total=size, unit='B', unit_scale=True, desc="Firmando archivo") as pbar:
            while True:
                data = f.read(BUFFER)
                if not data:
                    break
                sha.update(data)
                pbar.update(BUFFER)

    return sha.hexdigest()


def calculate_hmac(text, key):
    h = hmac.digest(base64.b64decode(key), text.encode(), hashlib.sha256)
    return binascii.hexlify(h).decode()


def get_mime_type(file):
    if file.endswith('.zip'):
        return 'application/zip'
    if file.endswith('.tar.bz2'):
        return 'application/x-tar'
    else:
        sys.exit(f"Tipo de archivo no soportado: {file}")


def upload(url, file, key, verify_ssl=True):
    size = os.path.getsize(file)

    rnd = generate_random_hex()
    file_hash = hash_file(file, size)
    data = {'file_hash': file_hash, 'rnd': rnd}
    data['hmac'] = calculate_hmac(prepare_post_values(data) + rnd, key)

    with open(file, 'rb') as f:
        with tqdm(total=size, unit='B', unit_scale=True, desc="Subiendo archivo") as pbar:
            data["file"] = (os.path.basename(file), f, get_mime_type(file))
            e = MultipartEncoder(fields=data)
            m = MultipartEncoderMonitor(e, lambda monitor: pbar.update(monitor.bytes_read - pbar.n))
            headers = {"Content-Type": m.content_type}
            response = requests.post(url, data=m, headers=headers, verify=verify_ssl)

    process_response(url, response)


def send_request(url, key, verify_ssl=True):
    rnd = generate_random_hex()
    full_url = url + "?rnd=" + rnd
    full_url += '&hmac=' + calculate_hmac(full_url, key)

    response = requests.get(full_url, verify=verify_ssl)
    process_response(url, response)


def process_response(url, response):
    try:
        res = json.loads(response.text)
        if res['Status'] == 'OK':
            print("Respuesta OK")
        else:
            print(f"Falló en servidor {url}")
            print(f"Mensaje: {res['Message']}")
            sys.exit("Saliendo.")
    except Exception:
        print("Error parseando json.")
        print(f"Response: {response.text}.")
        sys.exit("Saliendo.")


def main():
    parser = argparse.ArgumentParser(prog=f"python {sys.argv[0]}", description='Sube e instala releases.')
    parser.add_argument('mode', choices=['upload', 'unzip', 'install', 'all'], help='Modo de funcionamiento del script')
    parser.add_argument('--file', default='release.tar.bz2', help="Opcional archivo a subir (.zip o .tar.bz2), sólo para 'upload' (default: release.tar.bz2).")
    parser.add_argument('--key', help=f"Key en formato base64 tiene que ser la misma que en el servidor, si no está el parámetro se toma de {CONFIG_FILE}.")
    parser.add_argument('--servers', help=f"Lista de servidores para actualizar separada por comas, si no está el parámetro se toma de {CONFIG_FILE}.")
    parser.add_argument('--ignore_cert', action='store_true', help="No valida la conexión SSL. No usar en producción.")
    args = parser.parse_args()

    if os.path.exists(CONFIG_FILE):
        config = configparser.ConfigParser()
        config.read(CONFIG_FILE)
    else:
        config = { 'settings' : { 'key': '', 'servers': '' }}

    verify_ssl = True
    if args.ignore_cert:
        verify_ssl = False

    file = args.file
    if args.key:
        key = args.key
    else:
        key = config['settings']['key']
    if args.servers:
        servers = args.servers.split(',')
    else:
        servers = config['settings']['servers'].split(',')

    if args.mode == "upload" or args.mode == "all":
        for server in servers:
            print(f"Subiendo a {server}")
            upload(server + UPLOAD_API, file, key, verify_ssl)
        print("Fin uploads.")
    if args.mode == "unzip" or args.mode == "all":
        for server in servers:
            print(f"Descomprimiendo en {server}")
            send_request(server + UNZIP_API, key, verify_ssl)
        print("Fin unzips.")
    if args.mode == "install" or args.mode == "all":
        for server in servers:
            print(f"Instalando en {server}")
            send_request(server + INSTALL_API, key, verify_ssl)
        print("Fin installs.")

    print("Fin de ejecución.")


if __name__ == '__main__':
    main()
