# Curtain

This project has been created using Angular as graphical user interface web framework and Python as the backend with nginx handling load balancing.

- Backend: https://github.com/noatgnu/cactus
- Frontend: https://github.com/noatgnu/curtain

## Deployment
### Docker deployment
Requires `docker` and `docker-compose`

#### Building process
`docker-compose build --no-cache`

The building process will create two docker images, one for the GUI interface and the other for the backend.

#### Running process
`docker-compose up -d`

The `docker-compose.yml` exposes two directories within the backend, one containing all user upload data, the other is a sqlite that index the uploaded data.

### Manual installation

#### Requirements

- Node 8

#### GUI installation process

`npm install -g @angular/cli@latest`

Within the package folder, `npm install`

#### GUI Building process

Modify values of `apiURL` property in the following file `src/environments/environment.prod.ts` to the web url path of your `cactus` backend.

`ng build`

You can now find the GUI package under the `dist` folder. This can be upload onto any webhosting service to be server at the root of the domain or subdomain.

#### Backend setup

Follow the manual backend setup here https://github.com/noatgnu/cactus
