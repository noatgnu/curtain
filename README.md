# Curtain

This project has been created using Angular as graphical user interface web framework and Python as the backend with nginx handling load balancing.

## Deployment
Requires `docker` and `docker-compose`

### Building process
`docker-compose build --no-cache`

The building process will create two docker images, one for the GUI interface and the other for the backend.

### Running process
`docker-compose up -d`

The `docker-compose.yml` exposes two directories within the backend, one containing all user upload data, the other is a sqlite that index the uploaded data.
