var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();



	

var url = 'https://www.google.com';

    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html
var product = new Array();
   	
request(url, function(error, response, html)
{
	console.log(error || response || html);
   	if(!error)
   	{
       	var $ = cheerio.load(html),
       		x = $('a.grid__image').html();
       	console.log(x);
		for(var i=0; i<x.length;i++)
		{
			console.log(x[i]);	
			product.push(x[i].href);
		} 
   	}
})





