FROM node:6

ENV user node
# Add our user and group first to make sure their IDs get assigned consistently
RUN groupadd -r $user && useradd -r -g $user $user

# Create app directory
RUN mkdir -p /$user/src/app
WORKDIR /$user/src/app

# Install app dependencies
COPY package.json /$user/src/app/
RUN npm install

# Bundle app source
COPY . /$user/src/app

RUN chown -R $user:$user /$user/src/app/
USER $user
