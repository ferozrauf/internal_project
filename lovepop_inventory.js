var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();



	

var url = 'https://www.lovepopcards.com/products';

    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html
var products = new Array();
   	
request(url, function(error, response, html)
{
	//console.log(error || response || html);
   	if(!error)
   	{
       	var $ = cheerio.load(html);
       	var	urls = $('a.grid__image');
       	var ids = $('select');
		for(var i=0; i<urls.length;i++)
		{
			//console.log(x[i].attribs.href);
			var un_prod = new Object();
			un_prod.url = url + urls[i].attribs.href;
			un_prod.id = parseInt(ids[i].children[0].next.attribs.value);
			products.push(un_prod);
		} 
   	}
   	for(var i=0; i< products.length;i++)
	{
		console.log(products[i]);

	}
   	request.post({url:products[0].url,form:{id:products[0].id,quantity:99999999}},function(sub_err,sub_response,sub_body) {
   		console.log(sub_err);
   		console.log(sub_response);
   		console.log(sub_body);

   	})
   	
})







