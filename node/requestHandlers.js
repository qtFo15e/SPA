/**
 * Created by 77563 on 2016/8/26.
 */

var querystring = require( "querystring" )
var fs = require( "fs" )
var path = require( "path" )
var formidable = require( "formidable" )
var _ = require( "underscore" )
var MongoClient = require( "mongodb" ).MongoClient
var url = 'mongodb://localhost:27017/test';


var formStrToMap = function ( postData ) {
	var inputList = postData.split( "&" )
	var inputMap = {}
	_.each( inputList, function ( item ) {
		//注意，表单输入的值中不能含有 "="  , 未解决？？
		var temp = item.split( "=" )
		inputMap[ temp[0] ] = temp[1]
	} )
	return inputMap
}

var mime = {
	"css": "text/css",

	"gif": "image/gif",

	"html": "text/html",

	"ico": "image/x-icon",

	"jpg": "image/jpeg",

	"js": "text/javascript",

	"json": "application/json",

	"png": "image/png",

	"txt": "text/plain",
}

var signUp = function ( response , require, pathname, postData ) {
	MongoClient.connect( url, function ( err, db ) {
		if ( err ) {
			console.log( err )
		} else {
			db.collection( "user" ).insertOne( formStrToMap( postData ) , function ( err ) {
				db.close()
				response.writeHead( 200,{'Content-Type': 'text/plain'}  )
				response.write( "true" )
				response.end()
			})  
		}
	} )
}


var loginIn = function ( response , require, pathname, postData ) {
	MongoClient.connect( url, function ( err,  db ) {
		if ( err ) {
			console.log( err )
		} else {
			db.collection( "user" ).find( formStrToMap( postData ) ).toArray( function ( err, doc ) {
				if ( doc.length ) {
					db.close()
					response.writeHead( 200, { 'Content-Type': 'text/plain' } )
					response.write( "true" )
					response.end()
				} else  {
					db.close()
					response.writeHead( 200, { 'Content-Type': 'text/plain' } )
					response.write( "false" )
					response.end()
				}
			} )
		}
	} )
}


var start = function ( response , require, pathname ) {
	var realPath
	if ( pathname == "/" ) {
		realPath = "../FrontEnd/HTML/SPA/index.html"
	} else {
		realPath = "../FrontEnd" + pathname
	}

	fs.exists( realPath, function ( err  ) {
		if ( !err ) {
			response.writeHead( 404,{'Content-Type': 'text/plain'}  )
			response.end();
		} else {
			fs.readFile( realPath, "binary", function ( err, file  ) {
				if ( err ) {
					response.writeHead(500, {'Content-Type': 'text/plain'});
					response.end(err);
				} else  {
					var ext = path.extname( realPath )
					ext = ext ? ext.slice( 1 ) : "unknown"
					var contentType = mime[ ext ] || "text/plain";
					response.writeHead(200, {'Content-Type': contentType});
					response.write(file, "binary");
					response.end();
				}
			} )
		}
	} )

}


var analysis = function ( response , require, pathname, postData ) {
	if ( formStrToMap( postData ).level === "watershed" ) {
		response.writeHead( 200,{'Content-Type': 'text/plain'}  )
		response.write( JSON.stringify( {
			songhuajiang: {
				"neimenggu_hulunbeier_heishantou": {
					"2016/8/16": {
						"pH"              : "7.28",
						"dissolvedOxygen" : "9.70",
						"ammoniaNitrogen" : "0.74",
						"mineralChameleon": "4.56"
					},
					"2016/8/17": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/18": {
						"pH"              : "11",
						"dissolvedOxygen" : "0.5",
						"ammoniaNitrogen" : "7",
						"mineralChameleon": "2"
					},
					"2016/8/19": {
						"pH"              : "4",
						"dissolvedOxygen" : "8",
						"ammoniaNitrogen" : "9.5",
						"mineralChameleon": "10"
					},
					"2016/8/20": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/21": {
						"pH"              : "5",
						"dissolvedOxygen" : "14",
						"ammoniaNitrogen" : "15",
						"mineralChameleon": "28"
					},
					"2016/8/22": {
						"pH"              : "7",
						"dissolvedOxygen" : "8",
						"ammoniaNitrogen" : "9",
						"mineralChameleon": "1"
					},
					"2016/8/23": {
						"pH"              : "77",
						"dissolvedOxygen" : "8.5",
						"ammoniaNitrogen" : "9.9",
						"mineralChameleon": "2.8"
					},
					"2016/8/24": {
						"pH"              : "15.8",
						"dissolvedOxygen" : "14.8",
						"ammoniaNitrogen" : "17.99",
						"mineralChameleon": "8.8"
					}
				},
				"heilongjiang_heihe"             : {
					"2016/8/16": {
						"pH"              : "5",
						"dissolvedOxygen" : "7",
						"ammoniaNitrogen" : "9",
						"mineralChameleon": "11"
					},
					"2016/8/17": {
						"pH"              : "12",
						"dissolvedOxygen" : "11",
						"ammoniaNitrogen" : "18",
						"mineralChameleon": "14"
					},
					"2016/8/18": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/19": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/20": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/21": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/22": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/23": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/24": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					}
				},
				"heilongjiang_tongjiang"             : {
					"2016/8/16": {
						"pH"              : "5",
						"dissolvedOxygen" : "7",
						"ammoniaNitrogen" : "9",
						"mineralChameleon": "11"
					},
					"2016/8/17": {
						"pH"              : "12",
						"dissolvedOxygen" : "11",
						"ammoniaNitrogen" : "13",
						"mineralChameleon": "14"
					},
					"2016/8/18": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/19": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/20": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/21": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/22": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/23": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/24": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					}

				}
			},
			liaohe      : {
				"liaoning_tieling_zhuershan": {
					"2016/8/16": {
						"pH"              : "7.28",
						"dissolvedOxygen" : "9.70",
						"ammoniaNitrogen" : "0.74",
						"mineralChameleon": "4.56"
					},
					"2016/8/17": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/18": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/19": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/20": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/21": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/22": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/23": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/24": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					}
				}
			},
			haihe: {
				beijingbeigukou: {
					"2016/8/16": {
						"pH"              : "7.28",
						"dissolvedOxygen" : "9.70",
						"ammoniaNitrogen" : "0.74",
						"mineralChameleon": "4.56"
					},
					"2016/8/17": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/18": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/19": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/20": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/21": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/22": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/23": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					},
					"2016/8/24": {
						"pH"              : "17",
						"dissolvedOxygen" : "18",
						"ammoniaNitrogen" : "19",
						"mineralChameleon": "20"
					}
				}
			}
		} ) )
		response.end()
	} else  {
		response.writeHead( 200,{'Content-Type': 'text/plain'}  )
		response.write( JSON.stringify( {
			"neimenggu_hulunbeier_heishantou": {
				"2016/8/16": {
					"pH"              : "7.28",
					"dissolvedOxygen" : "9.70",
					"ammoniaNitrogen" : "0.74",
					"mineralChameleon": "4.56"
				},
				"2016/8/17": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/18": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/19": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/20": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/21": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/22": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/23": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/24": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				}
			},
			"heilongjiang_heihe"             : {
				"2016/8/16": {
					"pH"              : "5",
					"dissolvedOxygen" : "7",
					"ammoniaNitrogen" : "9",
					"mineralChameleon": "11"
				},
				"2016/8/17": {
					"pH"              : "12",
					"dissolvedOxygen" : "11",
					"ammoniaNitrogen" : "18",
					"mineralChameleon": "14"
				},
				"2016/8/18": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/19": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/20": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/21": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/22": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/23": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/24": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				}
			},
			"heilongjiang_tongjiang"             : {
				"2016/8/16": {
					"pH"              : "5",
					"dissolvedOxygen" : "7",
					"ammoniaNitrogen" : "9",
					"mineralChameleon": "11"
				},
				"2016/8/17": {
					"pH"              : "12",
					"dissolvedOxygen" : "11",
					"ammoniaNitrogen" : "18",
					"mineralChameleon": "14"
				},
				"2016/8/18": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/19": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/20": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/21": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/22": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/23": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/24": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				}

			},
			"liaoning_tieling_zhuershan":{
				"2016/8/16": {
					"pH"              : "5",
					"dissolvedOxygen" : "7",
					"ammoniaNitrogen" : "9",
					"mineralChameleon": "11"
				},
				"2016/8/17": {
					"pH"              : "12",
					"dissolvedOxygen" : "11",
					"ammoniaNitrogen" : "18",
					"mineralChameleon": "14"
				},
				"2016/8/18": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/19": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/20": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/21": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/22": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/23": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/24": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				}

			},
			"beijinggubeikou":{
				"2016/8/16": {
					"pH"              : "5",
					"dissolvedOxygen" : "7",
					"ammoniaNitrogen" : "9",
					"mineralChameleon": "11"
				},
				"2016/8/17": {
					"pH"              : "12",
					"dissolvedOxygen" : "11",
					"ammoniaNitrogen" : "18",
					"mineralChameleon": "14"
				},
				"2016/8/18": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/19": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/20": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/21": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/22": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/23": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				},
				"2016/8/24": {
					"pH"              : "17",
					"dissolvedOxygen" : "18",
					"ammoniaNitrogen" : "19",
					"mineralChameleon": "20"
				}

			}
		} ) )
		response.end()
	}
}




exports.start= start
exports.loginIn = loginIn
exports.signUp = signUp
exports.analysis = analysis

