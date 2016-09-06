/**
 * Created by 77563 on 2016/8/25.
 */

var http = require( "http" )
var url = require( "url" )


var start = function ( route ,handle ) {
	var onRequest = function( request, response ) {
		var postData = ""
		var pathname = url.parse( request.url ).pathname

		request.addListener( "data", function ( postDataChunk ) {
			postData += decodeURIComponent( postDataChunk )
		} )
		request.addListener( "end", function (  ) {
			route( handle, pathname, response , request ,postData )
		} )
	}
	http.createServer( onRequest ).listen( 8000 )
}

exports.start = start

