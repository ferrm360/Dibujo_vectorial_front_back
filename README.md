# VectorDraw - Editor Vectorial Web

Proyecto de dibujo vectorial basado en arquitectura de microservicios (.NET 9 + MongoDB) orquestado con Docker.

## Prerrequisitos

* **Docker Desktop** (debe estar instalado y corriendo).
* **Git** (opcional, para clonar el código).

## Cómo ejecutar el proyecto

1.  Clona el repositorio y entra a la carpeta del proyecto:
    ```bash
    git clone https://github.com/ferrm360/Dibujo_vectorial_front_back.git
    cd proyecto-web-dibujo
    ```

2.  Asegúrate de estar en la carpeta donde se encuentra el archivo `docker-compose.yml` y ejecuta:
    ```bash
    docker-compose up -d --build
    ```
    *(El parámetro `--build` es importante para asegurar que se compilen los servicios correctamente).*

## Cómo acceder

Una vez que terminen de levantarse los contenedores:

1.  Abre tu navegador web.
2.  Ingresa a: **http://localhost:8080**

3.  Crea una cuenta nueva desde la opción "Registrarse" y comienza a crear dibujos.

