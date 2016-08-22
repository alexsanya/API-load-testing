#! /bin/sh
if [ ! -d "build" ]; then 
  echo "Compiling code..."
  babel --presets es2015,stage-2 -d build/ .
fi

if [ ! -d "lib" ]; then
  echo "Compiling libraries..."
  babel --presets es2015,stage-2 -d lib/ ../lib/
fi

cp package.json build/
cp npm-shrinkwrap.json build/
cd build
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi
echo "Starting process..."
npm start
