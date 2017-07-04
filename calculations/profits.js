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

		for(i=1;i<lines.length-1;i++) {
			var columns = lines[i].split(',');
			var product = new Object();
			product['name'] = columns[0];
			product['price'] = parseInt(columns[2]);
			products.push(product);
			var lastValue = 0;
			var totalDiff = 0;

			for(j=3;j<columns.length;j++) {
				if(columns[j]!=NaN) {
					var value = parseInt(columns[j]);
					if(value < lastValue && value!=0) {
						totalDiff += lastValue - value;
					}
					lastValue = value;
				}
			}
			product['totalMoved'] = totalDiff;
			product['profit'] = product['price'] * totalDiff;
			console.log(product);

		}
		var stream = fs.createWriteStream('calculations_' + fileName);
		stream.once('open', function(fd) {
			stream.write('Product Name, Price, Moved,Profit\n');
			var fullProfit = 0;
			for(var j=0; j<products.length;j++)
			{
				stream.write(products[j]['name'] + ',' + products[j]['price'] + ',' + products[j]['totalMoved'] + ',' + products[j]['profit'] + '\n'); 
				if(products[j]['profit']!=NaN)
					fullProfit += products[j]['profit'];
			}
			stream.write('Total Profit: , ' + fullProfit);
			console.log('first write');
		});
	} 
}
console.log(process.argv[2]);
writeToFile(process.argv.length> 2 ? process.argv[2] : 'data.csv');












