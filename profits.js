var express = require('express');
var fs = require('fs');
var app     = express();

function writeToFile(fileName)
{
	var i,j = 0;
	if(fs.existsSync(fileName))
	{
		var lines = fs.readFileSync(fileName).toString().split('\n');
		var products = new Array();
		for(i=0;i<lines.length();i++) {
			var product = new Object();
			product['name'] = lines[0];
			product['price'] = parseInt(lines[2]);
			products.push(product);
		}
		for(i=1;i<lines.length();i++) {
			var columns = lines[i].split(',');
			var lastValue,totalDiff = 0;
			for(j=3;j<columns.length();j++) {
				if(columns[j]!=NaN) {
					var value = parseInt(columns[j]);
					if(value < lastValue && value!=0) {
						totalDiff += lastValue - value;
					}
					lastValue = value;
				}
			}
			products[i]['totalMoved'] = totalDiff;
			producst[i]['profit'] = products[i]['price'] * totalDiff;
		}
		var stream = fs.createWriteStream('calculations.csv');
		stream.once('open', function(fd) {
			stream.write('Product Name, Price, Moved,Profit');
			var fullProfit = 0;
			for(var j=0; j<products.length;j++)
			{
				stream.write(products['name'] + ',' + products['price'] + ',' + products['totalMoved'] + ',' + products['profit'] + '\n'); 
				fullProfit += products['profit'];
			}
			stream.write('Total Profit: , ' + fullProfit);
			console.log('first write');
		});
	} 
}



function startProcess()
{
	writeToFile(process.argv.length> 2 ? process.argv[2] : 'data.csv');
}












