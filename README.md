# Minify Solidity Code

This is a simple node.js application to minify solidity code.

## Installation
This is a node.js package you can install through npm

Open up your command line or console and run the following 2 commands:
```
> node -v
> npm -v
```
If either of these commands go unrecognized, go to Nodejs.org and download the appropriate installer and install it

Once finished, close and reload console and re-run the above commands. They should now provide you with version numbers.

```
> npm install -g minify-solidity
```

If you want to install locally you can use

```
> npm install minify-solidity
```

## Running
Now you can use it like any other npm package

```
var solidity = require("minify-solidity");
solidity.minify();
```

On command prompt run command like this
```
node project_name input_file_name.sol
```

In above line "project_name" is the name of project from where the package is used
And "input_file_name.sol" is the name of the solidity file to b eminified
The code will save a file in the same location from where it is called
For the above command we will have a file with name "input_file_name.min.sol" in the same location

## License

* [GNU General Public License](http://www.gnu.org/licenses/)
