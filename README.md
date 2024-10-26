# Curtain Frontend

This project is an Angular-based frontend application that can be built and run using Docker. This guide will help you set up, build, and run the application in a Docker container.

## Prerequisites

- Docker installed on your machine
- Git installed on your machine
- Ansible installed on your machine

## Building and Running the Application

1. **Clone the repository:**

   ```sh
   git clone https://github.com/noatgnu/curtain.git
   cd curtain
   ```

2. **Build the Docker image:**

   You can customize the backend URL and ORCID APPID by passing them as build arguments. Replace `YOUR_BACKEND_URL` and `YOUR_ORCID_TOKEN` with your own values.

   ```sh
   docker build --build-arg API_HOST=YOUR_BACKEND_URL --build-arg ORCID_APPID=YOUR_ORCID_APPID -t curtain-app .
   ```

   Example:

   ```sh
   docker build --build-arg API_HOST=https://example.com/ --build-arg ORCID_APPID=APP-EXAMPLE123 -t curtain-app .
   ```

3. **Run the Docker container:**

   ```sh
   docker run -p 80:80 curtain-app
   ```

   This will start the application and make it accessible at `http://localhost`.

## Running the Application with Ansible Playbook

1. **Clone the repository:**

   ```sh
   git clone https://github.com/noatgnu/curtain.git
   cd curtain
   ```

2. **Run the Ansible playbook:**

   Replace `your-email@example.com` and `your-domain.com` with your actual email and domain.

   ```sh
   ansible-playbook -i hosts ansible.playbook.yml --extra-vars "email=your-email@example.com domain=your-domain.com"
   ```

   This playbook will:
  - Install Docker and Docker Compose using their official installation scripts.
  - Clone the repository.
  - Set up necessary directories.
  - Start Docker Compose.
  - Obtain SSL certificates using Certbot.

## Dockerfile Explanation

The `Dockerfile` is set up to:

1. Use the `node:18-bullseye-slim` image as the base image.
2. Install necessary dependencies (`git`, `nginx`).
3. Clone the repository.
4. Replace the backend URL and ORCID token in the `environment.prod.ts` file with the provided build arguments.
5. Install Angular CLI and project dependencies.
6. Build the Angular application.
7. Use the `nginx:latest` image to serve the built application.

## Customization

To customize the backend URL and ORCID token, you can edit the `Dockerfile` directly or pass the values as build arguments as shown in the build step.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
