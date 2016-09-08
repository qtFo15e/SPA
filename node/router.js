/**
 * Created by 77563 on 2016/8/26.
 */

var route = function ( handle, pathname, response, require, postData ) {
	console.log("About to route a request for " + pathname);
	if ( pathname.search( / (^\/$)|(^\/bootstrap.?)|(^\/CSS.?)|(^\/JavaScript.?)|(^\/image.?)|(^\/HTML.?)/ )  !== -1 ) {
		handle[ "/" ]( response , require, pathname, postData  )
	}else if ( pathname.search(  ) ){

	} else if ( typeof handle[pathname] === "function" ) {
		 handle[ pathname ]( response , require, pathname, postData )
	} else {
		console.log( "no found" )
		response.writeHead( 404, { "Content-Type": "text/plain" } )
		response.write( "404" )
		response.end()
	}
}

exports.route = route