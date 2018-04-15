/**
 * Copyright 2017, Muhammad Abid
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * @title Minify Solidity - This application minify solidity code.
 * @author Muhammad Abid - <mohdabid.aks@gmail.com>
*/

"use strict"
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

function minify(){
	var argv = process.argv;
	if(typeof argv[2] !== 'undefined' && argv[2] !== ''){
		var fileName = argv[2];
		if(fs.existsSync('./'+fileName)){
			minify_solidity(fileName);
		}else{
			console.log('"'+fileName+ '" not exists.');
		}
	}else{
		console.log('Input file name as argument! e.g "node minsol filename.sol"');
	}
}

function minify_solidity(fileName){
	var modifiers = ['public', 'private', 'external', 'internal', 'memory'];
	var varTypes = ['bool', 'int', 'int8', 'int256', 'uint', 'uint8', 'uint256', 'fixed', 'ufixed', 'address', 'bytes', 'string'];
	
	var instream = fs.createReadStream('./'+fileName),
	outstream = new (stream)(),
	rl = readline.createInterface(instream, outstream);

	var finalCode = '',
		skip = false,
		ended = false,
		fnEnd = false,
		fnSt = false,
		lineEnd = false,
		varBeforeFn = false,
		codeStarted = false,
		libStart = 0,
		functID = 0,
		counter = 0,
		brktCnt = -1,
		varInBrCnt = 0,
		usedVNm = [],
		usedFnctn = [],
		varInBrkt = [];

	Array.prototype.clean = function() {
		for (var i = 0; i < this.length; i++) {
			if (this[i] === '' || this[i] === undefined) {         
				this.splice(i, 1);
				i--;
			}
		}
		return this;
	};

	Array.prototype.checkByKey = function(search) {
		var found = false;
		var val = '';
		this.forEach( function(variable, index){
			if(variable.key == search){
				found = true;
				val = variable.use;
			}
		});
		return [found, val];
	};

	String.prototype.replaceAll = function(search, replacement) {
		var target = this;
		return target.split(search).join(replacement);
	};

	String.prototype.cleanStr = function() {
		var target = this;
		return target.replace(/  +/g, ' ');
	};

	String.prototype.chkIfEx = function(val) {
		if(this.indexOf(val) != -1){
			return true;
		}
		return false;
	};

	String.prototype.addSpacing = function() {
		var ret = this;
		if(ret.chkIfEx("(")){
			ret = ret.replaceAll('(', ' ( ').cleanStr();
		}
		if(ret.chkIfEx(")")){
			ret = ret.replaceAll(')', ' ) ').cleanStr();
		}
		if(ret.chkIfEx(";")){
			ret = ret.replaceAll(';', ' ; ').cleanStr();
		}
		if(ret.chkIfEx("=")){
			ret = ret.replaceAll('=', ' = ').cleanStr();
		}
		if(ret.chkIfEx(",")){
			ret = ret.replaceAll(',', ' , ').cleanStr();
		}
		
		ret = ' '+ret+' ';
		
		return ret;
	};

	String.prototype.removeSpacing = function() {
		var ret = this;
		if(ret.chkIfEx("(")){
			ret = ret.replaceAll(' ( ', '(').cleanStr();
		}
		if(ret.chkIfEx(")")){
			ret = ret.replaceAll(' ) ', ') ').cleanStr();
		}
		if(ret.chkIfEx(";")){
			ret = ret.replaceAll(' ; ', ';').cleanStr();
		}
		if(ret.chkIfEx("=")){
			ret = ret.replaceAll(' = ', '=').cleanStr();
		}
		if(ret.chkIfEx(",")){
			ret = ret.replaceAll(' , ', ',').cleanStr();
		}
		return ret;
	};

	String.prototype.finalize = function() {
		var ret = this;
		ret = ret.cleanStr().trim();
		if(ret.chkIfEx("function()")){
			ret = ret.replaceAll('function()', 'function ()').cleanStr();
		}
		return ret;
	};

	rl.on('line', function (line) {
		
		lineEnd = false;
		if(line.chkIfEx("/*")){
			skip = true;
		}
		
		if(line.chkIfEx("//")){
			var ln = line.split('//');
			line = ln[0];
		}
		
		if(!skip && !ended){
			
			var keywords = line.trim().addSpacing();
			var liner = keywords;
			
			keywords = keywords.split(' ');
			keywords = keywords.clean();
			if(keywords.length  > 0){
				keywords.forEach( function(keyword, index){
					if(keyword === 'contract' || keyword === 'library'){
						libStart = 1;
					}
					
					if(keyword === 'function' || keyword === 'modifier'){
						functID = brktCnt;
						fnEnd = false;
						fnSt = true;
					}
					
					if(varTypes.indexOf(keyword) != -1 && line.chkIfEx(";") && (index == 0 || functID === brktCnt-1)){
						var name = keywords[index+1];
						name.replace(';', ' ');
						if(modifiers.indexOf(name) != -1){
							name = keywords[index+2];
							name.replace(';', ' ');
						}
						var usethis = getVariable();
						liner = ' '+liner.trim()+' ';
						liner = liner.replaceAll(' '+name+' ', ' '+usethis+' ');
						liner = liner.replaceAll(name+'.', usethis+'.');
						
						varInBrkt[brktCnt][varInBrCnt] = [];
						varInBrkt[brktCnt][varInBrCnt].key = name;
						varInBrkt[brktCnt][varInBrCnt].status = 1;
						varInBrkt[brktCnt][varInBrCnt].use = usethis;
						varInBrCnt++;
					}
					
					if(!fnEnd && fnSt){
						if (varTypes.indexOf(keyword) != -1 && !lineEnd) {
							lineEnd = true;
							var start = liner.indexOf("(")+1;
							var end = liner.indexOf(")");
							var vNames = [];
							if(line.chkIfEx("(") && line.chkIfEx(")") && start < end){
								var str = liner.substring(liner.indexOf("(")+1, liner.indexOf(")")).trim();
								if(str != ''){
									vNames = str.split(',').clean();
								}
								fnEnd = true;
								fnSt = false;
							}else if(line.chkIfEx("(") && !line.chkIfEx(")")){
								var v = liner.split('(').clean();
								vNames = v[1];
								vNames = vNames.cleanStr().split(',').clean();
							}else if((!line.chkIfEx("(") || start > end) && line.chkIfEx(")")){
								var v = liner.split(')').clean();
								vNames = v[0];
								vNames = vNames.cleanStr().split(',').clean();
							}else{
								vNames = [];
								vNames = liner.split(',').clean();
							}
							
							vNames.forEach( function(vName){
								vName = vName.trim().split(' ').clean();
								vName = vName[1];
								if(vName !== undefined){
									if(varInBrkt[brktCnt+1] === undefined){
										varInBrkt[brktCnt+1] = [];
									}
									
									var usethis = getVariable();
									liner = ' '+liner.trim()+' ';
									liner = liner.replaceAll(' '+vName+' ', ' '+usethis+' ');
									liner = liner.replaceAll(vName+'.', usethis+'.');
									
									varInBrkt[brktCnt+1][varInBrCnt] = [];
									varInBrkt[brktCnt+1][varInBrCnt].key = vName;
									varInBrkt[brktCnt+1][varInBrCnt].status = 1;
									varInBrkt[brktCnt+1][varInBrCnt].use = usethis;
									varInBrCnt++;
									varBeforeFn = true;
								}
							});
						}
						
						if(keyword == ')'){
							fnEnd = true;
							fnSt = false;
						}
					}
					
					if(brktCnt > 0){
						var ret = varInBrkt[0].checkByKey(keyword);
						if(ret[0]){
							liner = ' '+liner.trim()+' ';
							liner = liner.replaceAll(' '+keyword+' ', ' '+ret[1]+' ');
							liner = liner.replaceAll(keyword+'.', ret[1]+'.');
						}
						if(functID === brktCnt-1){
							var ret = varInBrkt[brktCnt].checkByKey(keyword);
							if(ret[0]){
								liner = ' '+liner.trim()+' ';
								liner = liner.replaceAll(' '+keyword+' ', ' '+ret[1]+' ');
								liner = liner.replaceAll(keyword+'.', ret[1]+'.');
							}
						}
					}
				});
			}
			
			if(libStart == 1 && line.chkIfEx("{") ){
				libStart = 2;
			}
			
			if(libStart == 2 && line.chkIfEx("{")){
				counter++;
				brktCnt++;
				if(!varBeforeFn){
					varInBrCnt = 0;
				}
				if(varInBrkt[brktCnt] === undefined){
					varInBrkt[brktCnt] = [];
				}
				
				if(functID == brktCnt-1){
					varInBrkt[brktCnt].parent = 0;
				}
				varBeforeFn = false;
				
			}
			
			finalCode += " " + liner.removeSpacing().trim();
			
			if(!codeStarted && finalCode.trim() !== ''){
				if(keywords[0] !== 'pragma' && counter == 0){
					console.log("-----------------------------------------");
					console.log("Provided file not contains solidity code");
					console.log('Please check file and try again as file has to start with keywork "pragma"');
					console.log("-----------------------------------------");
					process.exit();
				}
				codeStarted = true;
			}
			
			if(line.chkIfEx("}")){
				counter--;
				if(counter == 0){
					//flush the variabels before using them on the next contract or library
					skip = false,
					ended = false,
					fnEnd = false,
					fnSt = false,
					lineEnd = false,
					varBeforeFn = false,
					libStart = 0,
					functID = 0,
					counter = 0,
					brktCnt = -1,
					varInBrCnt = 0,
					usedVNm = [],
					usedFnctn = [],
					varInBrkt = [];
				}
			}
		}
		
		if(line.chkIfEx("*/")){
			skip = false;
		}
		
	});

	rl.on('close', function () {
		var newNm = fileName;
		newNm = newNm.split('.').join('.min.');
		fs.writeFileSync('./'+newNm, finalCode.finalize());
		console.log("-----------------------------------------");
		console.log('Completed! and saved file by name "'+newNm+'"');
		console.log('Please verify the changes before publishing contract');
		console.log("-----------------------------------------");
	});

	function getVariable(){
		var r = getChar();
		while(usedVNm.indexOf(r) != -1){
			if(usedVNm.length >= 27){
				r = getChar()+''+getChar();
			}else{
				r = getChar();
			}
		}
		
		usedVNm.push(r);
		return r;
	}

	function getChar() {
		var text = "";
		var possible = "abcdefghijklmnopqrstuvwxyz";

		for (var i = 0; i < 1; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}
}

exports.minify = minify;
