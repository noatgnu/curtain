FROM node:16-bullseye-slim

EXPOSE 80
WORKDIR /app
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install git
RUN apt-get -y install nginx

RUN git clone https://github.com/noatgnu/curtain.git
WORKDIR /app/curtain
RUN mkdir /app/nginx
RUN touch /app/nginx/error.log
RUN touch /app/nginx/access.log
RUN cp nginx.conf /etc/nginx/nginx.conf
RUN service nginx reload


RUN npm install

RUN node_modules/.bin/ng build

CMD ["bash", "/app/curtain/start.sh"]
