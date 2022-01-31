FROM node:16-alpine

EXPOSE 80
WORKDIR /app
RUN apk update
RUN apk upgrade
RUN apk add git
RUN apk add nginx
RUN apk add openrc --no-cache
RUN git clone https://github.com/noatgnu/curtain.git
WORKDIR /app/curtain
RUN mkdir /app/nginx
RUN touch /app/nginx/error.log
RUN touch /app/nginx/access.log
RUN cp nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /run/openrc
RUN touch /run/openrc/softlevel

RUN npm install
RUN node_modules/.bin/ng build

CMD ["bash", "/app/curtain/start.sh"]
