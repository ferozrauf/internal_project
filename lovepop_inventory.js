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
exclusion_list['https://www.lovepopcards.com/products/dragon-pop-up-card'] = true;


function writeToFile()
{
	i = 0;
	var date = new Date();
	if(fs.existsSync('data.csv'))
	{
		var lines = fs.readFileSync('data.csv').toString().split('\n');

		var stream = fs.createWriteStream('data.csv');
		stream.once('open', function(fd) {
			stream.write(lines[0] + ',' + date.toString() + '\n');
			var set_of_dates = lines[0].replace('Product Name, ID, Price,','').split(',');
			var prev_products = new Object();
			for(var k=1;k<lines.length;k++)
			{
				if(lines[k])
				{
					var current_line = lines[k].split(',');
					var prev_product = new Object();
					prev_product.url = 'https://www.lovepopcards.com/products/' + current_line[0];
					prev_product.id = current_line[1];
					prev_product.price = current_line[2];
					for(var j=0;j<set_of_dates.length;j++)
						prev_product[set_of_dates[j]] = parseInt(current_line[j+3]);
					prev_products[prev_product.url] = prev_product;
				}
				
			}
			for(var k=0;k<products.length;k++)
			{
				if(products[k].url in prev_products)
				{
					for(var j=0;j<set_of_dates.length;j++)
					{
						products[k][set_of_dates[j]] = prev_products[products[k].url][set_of_dates[j]];
						if(!(products[k][set_of_dates[j]]))
							products[k][set_of_dates[j]] = 0;
					}
					delete prev_products[products[k].url]
				} else {
					for(var j=0;j<set_of_dates.length;j++)
						products[k][set_of_dates[j]] = 0;
				}
			}
			for(var url in prev_products)
			{
				prev_products[url].num_items = 0;
				products.push(prev_products[url]);
			}
			products.sort((e1,e2) => {
				if(e1.url < e2.url)
					return -1;
				else if(e1.url === e2.url)
					return 0;
				else
					return 1;
			});
			
			for(var j=0; j<products.length;j++)
			{	
				var file_line = products[j].url.replace('https://www.lovepopcards.com/products/','') + ',' + products[j].id + ',' + products[j].price;
				for(var k=0;k<set_of_dates.length;k++)
				{
					file_line += ',' + products[j][set_of_dates[k]];
				}
				file_line += ',' + products[j].num_items;
				stream.write(file_line +  '\n'); 
			}
			console.log('updated file!');
			products = new Array();
			items = new Object();
		});		
	} else {
		var stream = fs.createWriteStream('data.csv');
		stream.once('open', function(fd) {
			products.sort((e1,e2) => {
				if(e1.url < e2.url)
					return -1;
				else if(e1.url === e2.url)
					return 0;
				else
					return 1;
			});
			stream.write('Product Name, ID, Price,' + date.toString() + '\n');
			for(var j=0; j<products.length;j++)
			{
				var file_line = products[j].url.replace('https://www.lovepopcards.com/products/','') + ',' + products[j].id + ',' + products[j].price + ',' + products[j].num_items ;
				stream.write(file_line + '\n'); 
			}
			products = new Array();
			items = new Object();
			console.log('first write');
		});
	}
	
}

function popUpCardsPostRequest(product)
{
	return function(error,response,body) {
		try {
			var overfill_response = JSON.parse(body);
			//console.log(overfill_response.description);
			var num_items = overfill_response.description.indexOf('sold out') !== -1 ? 0 : parseInt(overfill_response.description.match(/\d+/)[0]);
			var item_name = overfill_response.description.indexOf('sold out') !== -1 ? overfill_response.description.replace('The product \'','').replace('\' is already sold out.','') :  overfill_response.description.replace('You can only add ' + num_items + ' ','').replace(' to the cart.','');
			product.num_items = num_items;
			product.item_name = item_name;
			//console.log(overfill_response.description);
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
var nums = 18;
var itr = 0;

function getInventoryDataOnProducts()
{
	for(var item in items)
	{
		if(!(items[item].url in exclusion_list))
			products.push(items[item]);
	}
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


function startProcess()
{
	for(var j=1; j<nums+1;j++)
		request('https://www.lovepopcards.com/collections/shop-greeting-cards-lp?page=' + j, loadDataFromLovePop);
}

startProcess();
if(process.argv.length>2)
{
	var interval_num_hours = parseInt(process.argv[2]);
	setInterval(startProcess,3600000*interval_num_hours);
} 












