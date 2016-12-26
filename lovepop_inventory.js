var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();



	//

var url = 'https://www.lovepopcards.com/products';
var cart_url = 'https://www.lovepopcards.com/cart/add.js';

var products = new Array();
var i = 0;
var size = 0;
var exclusion_list = new Object();
exclusion_list['https://www.lovepopcards.com/products/gift-card'] = true;
exclusion_list['https://www.lovepopcards.com/products/monkey-3d-pop-up-chinese-new-year-card'] = true;



function writeToFile()
{
	var date = new Date();
	var current_hour = date.getHours();
	if(fs.existsSync('data.csv'))
	{
		var lines = fs.readFileSync('data.csv').toString().split('\n');

		var stream = fs.createWriteStream('data.csv');
		stream.once('open', function(fd) {
			stream.write(lines[0] + date.toString() + '\n');
			for(var j=0; j<products.length;j++)
				stream.write(lines[j+1] + ',' + products[j].num_items +  '\n'); 
		});		
	} else {
		var stream = fs.createWriteStream('data.csv');
		stream.once('open', function(fd) {
			stream.write('Product Name, ID, Price,' + date.toString() + '\n');
			for(var j=0; j<products.length;j++)
				stream.write(products[j].url.replace('https://www.lovepopcards.com/products/','') + ',' + products[j].id + ',' + products[j].price + ',' + products[j].num_items + '\n'); 
		});
	}
	
}

function popUpCardsPostRequest(product)
{
	return function(error,response,body) {
		try {
			var overfill_response = JSON.parse(body);
			var num_items = overfill_response.description.indexOf('sold out') !== -1 ? 0 : parseInt(overfill_response.description.match(/\d+/)[0]);
			var item_name = overfill_response.description.indexOf('sold out') !== -1 ? overfill_response.description.replace('The product \'','').replace('\' is already sold out.','') :  overfill_response.description.replace('You can only add ' + num_items + ' ','').replace(' to the cart.','');
			product.num_items = num_items;
			product.item_name = item_name;
			i++;
			if(i===size)
			{
				writeToFile();
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
   	

var items = new Object();
var nums = 9;
var itr = 0;

function getInventoryDataOnProducts()
{
	
	for(var item in items)
	{
		if(!(items[item].url in exclusion_list))
			products.push(items[item]);
	}
	products.sort((e1,e2) => {
		if(e1.url < e2.url)
			return -1;
		else if(e1.url === e2.url)
			return 0;
		else
			return 1;
	});
	size = products.length;
	itr = 0;

	for(var j=0; j < products.length;j++)
   	{
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

function loadDataFromLovePop(error,response,html)
{
	if(!error)
	{
		var $ = cheerio.load(html);
    	url = url.replace('/products','');
    	var	urls = $('a.grid__image');
       	var ids = $('div.grid__item.product-item').find('select');
       	var price = $('p.price span');
       	size = urls.length;
       	var price_offset = 0;
       
		for(var j=0; j<urls.length;j++)
		{			
			var un_prod = new Object();
			un_prod.url = url + urls[j].attribs.href;
			un_prod.id = parseInt(ids[j].children[1].attribs['value']);
			if(price[j + price_offset].children.length === 0)
				price_offset++;
			un_prod.price = parseInt(price[j + price_offset].children[0].data.substring(1));
			items[urls[j].attribs.href.replace('/products/','')] = un_prod;
		}
		itr++;
		if(itr===nums)
			getInventoryDataOnProducts();
	}
	
}   		

//request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=1', loadDataFromLovePop);
//request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=2', loadDataFromLovePop);
//request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=3', loadDataFromLovePop);
//request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=4', loadDataFromLovePop);
//request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=5', loadDataFromLovePop);
//request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=6', loadDataFromLovePop);
//request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=7', loadDataFromLovePop);
//request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=8', loadDataFromLovePop);
//request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=9', loadDataFromLovePop);


//request(url, loadProductsFromLovePop);

function startProcess()
{
	for(var j=1; j<10;j++)
		request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=' + j, loadDataFromLovePop);
}


startProcess();











