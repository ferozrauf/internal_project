var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();



	//

var url = 'https://www.lovepopcards.com/products';
var cart_url = 'https://www.lovepopcards.com/cart/add.js';
var stream = fs.createWriteStream('data.csv');

var products = new Array();

var i = 0;
var size = 0;


function popUpCardsPostRequest(product)
{
	return function(error,response,body) {
		//console.log(body);
		//console.log(product);
		try {
			var overfill_response = JSON.parse(body);
			var num_items = overfill_response.description.indexOf('sold out') !== -1 ? 0 : parseInt(overfill_response.description.match(/\d+/)[0]);
			var item_name = overfill_response.description.indexOf('sold out') !== -1 ? overfill_response.description.replace('The product \'','').replace('\' is already sold out.','') :  overfill_response.description.replace('You can only add ' + num_items + ' ','').replace(' to the cart.','');
			product.num_items = num_items;
			product.item_name = item_name;
			stream.write(product.url.replace('https://www.lovepopcards.com/products/','') + ',' + product.id + ',' + product.num_items + '\n'); 
			i++;
			if(i===size-1)
			{
				stream.close();
				process.exit();
			}
		} catch(e) {
			setTimeout(function() {
				request(
				{
					url:cart_url,
					method:'POST',
					headers: {
						'Accept-Encoding' : 'gzip, deflate, br',
						'Accept-Language' : 'en-US,en;q=0.8',
						'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36', 
						'Content-Type' : 'application/x-www-form-urlencoded',
						'Accept' : 'application/json, text/javascript, */*; q=0.01',
						'Referer' : product.url.toString(),
						'X-Requested-With' : 'XMLHttpRequest',
						'Connection' : 'keep-alive',
						'Origin' : 'https://www.lovepopcards.com'
					},
					body: 'id=' + product.id + '&quantity=9999999999' 
				},popUpCardsPostRequest(product));
			},1000);
		}
	}
	
}
    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html
   	
function loadDataFromLovePop(error,reponse,html)
{
	if(!error)
   	{
       	var $ = cheerio.load(html);
       	url = url.replace('/products','');
       	var	urls = $('a.grid__image');
       	var ids = $('select');
       	size = urls.length;
		for(var j=0; j<urls.length;j++)
		{
			//console.log(x[i].attribs.href);
			var un_prod = new Object();
			un_prod.url = url + urls[j].attribs.href;
			un_prod.id = parseInt(ids[j].children[0].next.attribs.value);
			products.push(un_prod);
		} 
   	}

   	for(j=0; j < products.length;j++)
   	{
   		//console.log(products[j]);
   		request(
		{
			url:cart_url,
			method:'POST',
			headers: {
				'Accept-Encoding' : 'gzip, deflate, br',
				'Accept-Language' : 'en-US,en;q=0.8',
				'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36', 
				'Content-Type' : 'application/x-www-form-urlencoded',
				'Accept' : 'application/json, text/javascript, */*; q=0.01',
				'Referer' : products[j].url.toString(),
				'X-Requested-With' : 'XMLHttpRequest',
				'Connection' : 'keep-alive',
				'Origin' : 'https://www.lovepopcards.com'
			},
			body: 'id=' + products[j].id + '&quantity=9999999999' 
		},popUpCardsPostRequest(products[j]));
   	}
	
}


stream.once('open', function(fd) {
	stream.write('Product Name, ID, Quantity\n');
	request(url, loadDataFromLovePop);
});









