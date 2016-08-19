#! /bin/sh
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -d "build" ]; then 
  echo "Compiling code..."
  ./node_modules/.bin/babel --presets es2015,stage-2 -d build/ .
fi

if [ ! -d "lib" ]; then
  echo "Compiling libraries..."
  ./node_modules/.bin/babel --presets es2015,stage-2 -d lib/ ../lib
fi

cd build
echo "Starting process..."
npm start

