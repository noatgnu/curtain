FROM node:16-bullseye-slim

WORKDIR /app
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install git
RUN apt-get -y install nginx

RUN git clone https://github.com/noatgnu/curtain.git

WORKDIR /app/curtain

RUN npm install

RUN node_modules/.bin/ng build

CMD ["bash"]
