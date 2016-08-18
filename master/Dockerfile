# Create app directory
FROM node:argon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

#compile app
RUN ./node_modules/.bin/babel --presets es2015,stage-0 -d build/ ./

#create symLinks


#start application
CMD [ "npm", "start" ]
