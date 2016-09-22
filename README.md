[ ![Codeship Status for mystaff/api-load-test](https://codeship.com/projects/07ed0220-62c9-0134-f105-5657dd5154b0/status?branch=master)](https://codeship.com/projects/175161)

## Structure
- /master - master process
- /worker-creator - Sign-up, Create company, Create workspace, Invite users
- /worker-activity - Emulate user activity
- /worker-screenshots - Send screenshots

## Running tests
- npm test

## Launch in cluster
- docker-compose up --build
- docker-compose scale master=1 worker-creator-sync=1 worker-activity=5 worker-screenshots=5

## Note
There are two execution scripts for worker-creator: worker-creator and worker-creator-sync. Worker-creator sends all invitation requests asyncronously and worker-creator-sync do in one-by-one. It takes much longer, but helps to avoid backend overloading