/**
 * Created by 77563 on 2016/8/26.
 */


var sever = require( "./server"  )
var router = require( "./router" )
var requestHandlers = require("./requestHandlers");

var handle = {}
handle[ "/" ] = requestHandlers.start
handle[ "/analysis" ] = requestHandlers.analysis
handle[ "/loginIn" ] = requestHandlers.loginIn
handle[ "/signUp" ] = requestHandlers.signUp

sever.start( router.route, handle )