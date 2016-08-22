# Create app directory
FROM node:argon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

RUN npm install -g babel-cli babel-core babel-preset-es2015 babel-preset-stage-2
RUN babel --presets es2015,stage-2 -d build/ .
RUN babel --presets es2015,stage-2 -d lib/ ../lib/
WORKDIR /usr/src/app/build
RUN npm install

#start application
CMD [ "npm", "start" ]

