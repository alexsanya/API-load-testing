# Create app directory
FROM node:argon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app
COPY ../lib /usr/src/app/lib-src

#compile app
RUN ./node_modules/.bin/babel --presets es2015,stage-2 -d build/ ./
#compile libs
RUN ./node_modules/.bin/babel --presets es2015,stage-2 -d lib-src/ ./lib
RUN cp package.json build/
WORKDIR build
RUN npm install

#start application
CMD [ "npm", "start" ]

