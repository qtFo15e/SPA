/**
 * Created by abcd on 2016-3-17.
 */


$( function () {
	"use strict"

	/* custom */

	//职责链模式
	Function.prototype.after = function ( afterFunc ) {
		var self = this
		return function ( value, waterlevel ) {
			var rel = self.apply( this, arguments )
			if ( rel ) {
				return rel
			} else {
				return afterFunc.apply( this, arguments )
			}
		}
	}

	var formList_to_object = function ( formEle ) {
		var relMap = {}
		_.each( $( formEle )
			.serializeArray(), function ( ele ) {
			relMap[ ele.name ] = ele.value
		} )
		return relMap
	}

	var accumulate = function ( pre, cur ) {
		return pre + parseFloat( cur )
	}

	var roundAverage = function ( list ) {
		var value = _.reduce( list, accumulate, 0 ) / _.size( list )
		return Math.round( value * 1000 ) / 1000
	}

	var idCounter = 0
	var myUniqeId = function ( left, right ) {
		var id = "" + left + idCounter + right
		idCounter++
		return id
	};

	/* 模板加载器 */
	var tmpl_map = (function () {
		var relMap = {}
		$( "script[type='tmpl']" )
			.each( function ( index, ele ) {
				var $ele                    = $( ele )
				relMap[ $ele.attr( "id" ) ] = $ele.html()
			} )
		return relMap
	})()

	var updateWaterLevel = function (  ) {
		var template = _.template( tmpl_map[ "topWaterlevel" ], { variable: 'data' } )
		var $ele = $( "#waterStandard, #waterlevel"  )

		$ele.empty()
		waterlevel_collection.each( function ( item ) {
			var temp = item.get( "name" ).slice( -2 )
			if ( temp  == "标准" ) {
				item.set("nameSliced", item.get( "name" ).slice( 0, item.get( "name" ).length - 2 ) )
			}else {
				item.set("nameSliced", item.get( "name" ))
			}

			$ele.append( template( {
				HTMLname: item.get( "id" ),
				name: item.get( "name" ),
				nameSliced: item.get( "nameSliced" )
			} )  )
		} )

		$('.selectpicker').selectpicker('refresh')

	}


	//用户信息
	var make_userName_model = Backbone.Model.extend( {} )

	var userName_model = new make_userName_model()

	/*  signUp  */
	var make_signUp_view = Backbone.View.extend( {

		el:"#loginInAndSignUpPage",

		events: {
			// 仅在初次检验过后开启功能
			"keyup #signUpFormContainer input": function keyUpCheckValidity( event ) {
				this.debounceInput( this, event )
			},

			"focus #signUpFormContainer input": function updatePromptMessage( event ) {
				var $ele = $( event.target )
				if ( $ele.next()
						 .hasClass( "glyphicon-remove" ) ) {
					this.updateMessageToInvalid( $ele )
				}
			},

			"submit #signUpFormContainer #signUpForm": function checkAndTologinInView( event ) {
				event.preventDefault()
				// 遍历检查所有元素
				var isAllSuccess = true
				var self         = this
				_.each( $( "#signUpForm input" ), function ( ele ) {
					self.checkInputValidity( ele )
					isAllSuccess = isAllSuccess && ele.checkValidity()
				} )

				// 提交表单并跳转页面
				if ( isAllSuccess && $( "#password" )
						.val() === $( "#password" )
						.val() ) {
					self.model.set( _.omit( formList_to_object( $( "#signUpForm" ) ), "passwordRepeat" ) )
					$.post( "./signUp", self.model.toJSON(), function (  ) {
						self.$el.empty()
						work_space.navigate( "#loginIn", { trigger: true } )
					})

				} else {
					self.openKeyup = true
					$( "#promptMassage" )
						.text( "请按提示正确完成注册" )
				}

			}
		},

		openKeyup: false,

		debounceInput: _.debounce( function ( self , event) {
			if ( self.openKeyup ) {
				self.checkInputValidity( event.target )
			}
		}, 800 ),

		updateUIToValid: function ( $ele ) {
			$ele.next()
				.removeClass( "glyphicon-remove" )
				.addClass( "glyphicon-ok" )
				.end()
				.parent()
				.parent()
				.removeClass( "has-error" )
				.addClass( "has-success" )

			this.updateMessageToValid( $ele )
		},

		updateUIToInvalid: function ( $ele ) {
			$ele.next()
				.removeClass( "glyphicon-ok" )
				.addClass( "glyphicon-remove" )
				.end()
				.parent()
				.parent()
				.removeClass( "has-success" )
				.addClass( "has-error" )

			this.updateMessageToInvalid( $ele )
		},

		updateMessageToInvalid: function ( $ele ) {
			var prompt_msg = "请输入" + $ele.attr( "placeholder" )
			$( "#promptMassage" )
				.text( prompt_msg )
		},

		updateMessageToValid: function ( $ele ) {
			$( "#promptMassage" )
				.text( "" )
		},

		isPasswordEquel: function ( ele ) {
			var isEquel = false
			var $ele    = $( ele )
			if ( $ele.attr( "id" ) === "passwordRepeat" ) {
				if ( ele.checkValidity() && $ele.val() === $( "#password" )
						.val() ) {
					this.updateUIToValid( $ele )
				} else {
					this.updateUIToInvalid( $ele )
				}
				isEquel = true
			}
			return isEquel
		},

		checkNormalInputValidity: function ( ele ) {
			var $ele = $( ele )
			if ( ele.checkValidity() ) {
				//证件号码元素同时渲染证件类型元素
				if ( $ele.attr( "id" ) === "cardNumber" ) {
					$( "#paperType" )
						.parent()
						.parent()
						.removeClass( "has-error" )
						.addClass( "has-success" )
				}

				this.updateUIToValid( $ele )
			} else {
				if ( $ele.attr( "id" ) === "cardNumber" ) {
					$( "#paperType" )
						.parent()
						.parent()
						.removeClass( "has-success" )
						.addClass( "has-error" )
				}
				this.updateUIToInvalid( $ele )
			}
		},

		checkInputValidity: function ( ele ) {
			if ( this.isPasswordEquel( ele ) ) {
				return
			}
			this.checkNormalInputValidity( ele )
		},

		template: _.template( tmpl_map[ "primaryHeader" ] + tmpl_map[ "signUp" ] + tmpl_map[ "footer" ] ),

		render: function () {
			this.$el.html( this.template() )
			return this
		}
	} )

	var signUp_view = new make_signUp_view( { model: userName_model } )


	/*  login */

	var make_loginIn_view = Backbone.View.extend( {

		el: "#loginInAndSignUpPage",

		storeUserMsg: function (  ) {
			if ( $( "#storePassword" ).is( ":checked" ) ) {
				// $.cookie( $( "#account" ).val() , {
				// 	level: $( "level" ).val(),
				// 	account: $( "#account" ).val(),
				// 	password: $( "#password" ).val(),
				// } ,  { expires: 7 })

				//？？？由于不支持直接储存对象，只保存密码值，待深入研究
				$.cookie( $( "#account" ).val() , $( "#password" ).val(), { expires: 7 } )
			}
		},

		events  : {
			"blur #account": function ( e ) {
				var account = $( e.target ).val()
				if ( account )  {
					$( "#password" ).val( $.cookie( account ) )
				}
			},

			"submit #loginInFormContainer #loginInForm": function checkAndToHome( event ) {
				var self = this
				//??? 如果阻止事件,则 autocomplete不会生效，猜测成功submit后会触发保存，待深入研究
				//???考虑提交表单和用ajax同步的优缺点： SPA以片段区分路径，适合使用ajax
				event.preventDefault()
				var isAllSuccess = true
				_.each( $( "#loginInForm input" ), function ( ele ) {
					isAllSuccess = isAllSuccess && ele.checkValidity()
				} )


				//登录成功后的渲染处理
				if ( isAllSuccess ) {
					var obj = { account: $( "#account" ).val(), password: $( "#password" ).val()  }
					$.post( "./loginIn", obj, function ( data ) {
						if ( data === "true" ) {
							self.storeUserMsg()
							self.$el.empty()
							work_space.navigate( "#home", { trigger: true } )
						} else {
							$( "#promptMassage" )
								.text( "账号与密码不匹配" )
								.addClass( "text-danger" )
						}
					} )

				} else {
					$( "#promptMassage" )
						.text( "账号与密码不匹配" )
						.addClass( "text-danger" )
				}
			}
		},

		template: _.template( tmpl_map[ "primaryHeader" ] + tmpl_map[ "loginIn" ] + tmpl_map[ "footer" ], { variable: 'data' } ),

		render  : function ( renderDataMap ) {
			this.$el.html( this.template( renderDataMap ) )

			return this
		}
	} )

	var loginIn_view = new make_loginIn_view( {} )


	//数据分析

	var make_database_model = Backbone.Model.extend( {
		defaults: {
			database: {}
		}
	} )

	//var database_model = new make_database_model( {
	//	database: {
	//		"neimenggu_hulunbeier_heishantou": {
	//			"2016-03-16": {
	//				"pH"              : "7.28",
	//				"dissolvedOxygen" : "9.70",
	//				"ammoniaNitrogen" : "0.74",
	//				"mineralChameleon": "4.56"
	//			},
	//			"2016-03-17": {
	//				"pH"              : "17",
	//				"dissolvedOxygen" : "18",
	//				"ammoniaNitrogen" : "19",
	//				"mineralChameleon": "20"
	//			},
	//			"2016-03-18": {
	//				"pH"              : "7",
	//				"dissolvedOxygen" : "8",
	//				"ammoniaNitrogen" : "9",
	//				"mineralChameleon": "2"
	//			}
	//
	//		},
	//		"heilongjiang_heihe"             : {
	//			"2016-03-16": {
	//				"pH"              : "5",
	//				"dissolvedOxygen" : "7",
	//				"ammoniaNitrogen" : "9",
	//				"mineralChameleon": "11"
	//			},
	//			"2016-03-17": {
	//				"pH"              : "12",
	//				"dissolvedOxygen" : "11",
	//				"ammoniaNitrogen" : "13",
	//				"mineralChameleon": "14"
	//			},
	//			"2016-03-18": {
	//				"pH"              : "2",
	//				"dissolvedOxygen" : "1",
	//				"ammoniaNitrogen" : "3",
	//				"mineralChameleon": "4"
	//			}
	//
	//		}
	//	}
	//})

	var database_model = new make_database_model( {} )

	var make_asidelist_model = Backbone.Model.extend( {
		defaults: {
			tableHead     : {
				watershed: {
					name    : "流域",
					HTMLname: "watershed"
				},

				detectedStation: {
					name    : "监测站",
					HTMLname: "detectedStation"
				},

				detectedItem: {
					name    : "监测项目",
					HTMLname: "detectedItem"
				},

				waterStandard: {
					name    : "水质标准",
					HTMLname: "waterStandard"
				}
			},
			tableBody     : {
				watershed: {
					songhuajiang: {
						name           : "松花江流域",
						HTMLname       : "songhuajiang",
						watershedArea  : 10000,
						province       : "黑龙江，吉林",
						detail         : "。点位坐标东经119度18分23秒；北纬50度09分27秒。属于松花江流域，额尔古纳河（国界），为中俄界河。由呼伦贝尔市环境监测中心站托管，距呼伦贝尔市200公里。建于2004年12月。",
						detectedStation: {
							neimenggu_hulunbeier_heishantou: {
								name         : "内蒙古呼伦贝尔黑山头",
								HTMLname     : "neimenggu_hulunbeier_heishantou",
								imgCoordinate: [ 67, 83 ],
								section      : "南水北调中线取水",
								detail       : "点位坐标东经119度18分23秒；北纬50度09分27秒。属于松花江流域，额尔古纳河（国界），为中俄界河。由呼伦贝尔市环境监测中心站托管，距呼伦贝尔市200公里。建于2004年12月",
							},
							heilongjiang_heihe             : {
								name         : "黑龙江黑河",
								HTMLname     : "heilongjiang_heihe",
								imgCoordinate: [ 194, 90 ],
								section      : "松花江干流",
								detail       : "点位坐标东经119度18分23秒；北纬50度09分27秒。属于松花江流域，额尔古纳河（国界），为中俄界河。由呼伦贝尔市环境监测中心站托管，距呼伦贝尔市200公里。建于2004年12月。"
							},
							heilongjiang_tongjiang         : {
								name    : "黑龙江同江",
								HTMLname: "heilongjiang_tongjiang",
								imgCoordinate: [ 272, 127 ],
								section      : "松花江干流",
								detail       : "点位坐标东经119度18分23秒；北纬50度09分27秒。属于松花江流域，额尔古纳河（国界），为中俄界河。由呼伦贝尔市环境监测中心站托管，距呼伦贝尔市200公里。建于2004年12月。"
							},
							// heilongjiang_fuyuan_wusuzhen   : {
							// 	name    : "黑龙江抚远乌苏镇",
							// 	HTMLname: "heilongjiang_fuyuan_wusuzhen"
							// },
							// heilongjiang_zhaoyuan          : {
							// 	name    : "黑龙江肇源",
							// 	HTMLname: "heilongjiang_zhaoyuan"
							// },
							//
							// jilin_baicheng_baishatan       : {
							// 	name    : "吉林白城白沙滩",
							// 	HTMLname: "jilin_baicheng_baishatan"
							// },
							// jilin_changchun_songhuajiangcun: {
							// 	name    : "吉林长春松花江村",
							// 	HTMLname: "jilin_changchun_songhuajiangcun"
							// },
							// jilin_yanji_quanshuihe         : {
							// 	name    : "吉林延边圈河水",
							// 	HTMLname: "jilin_yanji_quanshuihe"
							// }
						}
					},
					liaohe      : {
						name           : "辽河流域",
						HTMLname       : "liaohe",
						watershedArea  : 20000,
						province       : "辽宁",
						detail         : "。点位坐标东经119度18分23秒；北纬50度09分27秒。属于松花江流域，额尔古纳河（国界），为中俄界河。由呼伦贝尔市环境监测中心站托管，距呼伦贝尔市200公里。建于2004年12月。",
						detectedStation: {
							liaoning_tieling_zhuershan     : {
								name    : "辽宁铁岭朱尔山",
								HTMLname: "liaoning_tieling_zhuershan"
							},
							// liaoning_fushun_dahuofang      : {
							// 	name    : "辽宁抚顺大伙房水库",
							// 	HTMLname: "liaoning_fushun_dahuofang"
							// },
							// liaoning_liaowang_tangheshuiku : {
							// 	name    : "辽宁辽阳汤河水库",
							// 	HTMLname: "liaoning_liaowang_tangheshuiku"
							// },
							// liaoning_panjin_xingan         : {
							// 	name    : "辽宁盘锦兴安",
							// 	HTMLname: "liaoning_panjin_xingan"
							// },
							// liaoning_yingkou_liaohegongyuan: {
							// 	name    : "辽宁营口辽河公园",
							// 	HTMLname: "liaohe_yingkou_liaohegongyuan"
							// },
							// liaoning_dongyalujiangqiao     : {
							// 	name    : "辽宁丹东鸭绿江桥",
							// 	HTMLname: "liaoning_dongyalujiangqiao"
							// }
						}
					},
					haihe: {
						name           : "海河流域",
						HTMLname       : "haihe",
						watershedArea  : 10000,
						province       : "北京",
						detail         : "北京（国界），为中俄界河。由呼伦贝尔市环境监测中心站托管，距呼伦贝尔市200公里。建于2004年12月。",
						detectedStation: {
							beijinggubeikou: {
								name         : "北京古北口",
								HTMLname     : "beijinggubeikou",
								imgCoordinate: [ 67, 83 ],
								section      : "北京南水北调中线取水",
								detail       : "北京点位坐标东经119度18分23秒；北纬50度09分27秒。属于松花江流域，额尔古纳河（国界），为中俄界河。由呼伦贝尔市环境监测中心站托管，距呼伦贝尔市200公里。建于2004年12月",
							}
						}
					},
				},

				detectedItem: {

					dissolvedOxygen : {
						name    : "溶解氧",
						HTMLname: "dissolvedOxygen"
					},
					ammoniaNitrogen : {
						name    : "氨氮",
						HTMLname: "ammoniaNitrogen"
					},
					mineralChameleon: {
						name    : "高锰酸钾",
						HTMLname: "mineralChameleon"
					},
					pH              : {
						name    : "pH",
						HTMLname: "pH"
					}
				}
			},
			selected      : {
				watershed      : [],
				detectedStation: []
			},
			preSeleceted  : {},
			partialStation: {},
			requestDataMap: {}
		}
	} )

	var asideList_Model = new make_asidelist_model()

	var make_asidelist_view = Backbone.View.extend( {
		initialize: function () {
			//格式化时间
			var today = _.map( ( new Date().toLocaleDateString() ).split( "/" ), function ( item ) {
							 if ( +item < 10 ) {
								 return "0" + String( item )
							 } else {
								 return item
							 }
						 } )
						 .join( "-" )

			$( "#startTime" )
				.prop( "max", today )
			$( "#endTime" )
				.prop( "max", today )
		},

		el: "#asideFormwraper",

		template: _.template( tmpl_map[ "rightList" ], { variable: "data" } ),

		render: function ( renderDataMap ) {
			$( "#rightListTable" )
				.html( this.template( renderDataMap ) )

			//初始化复选框样式
			//$('input').iCheck({
			//    checkboxClass: 'icheckbox_flat-blue',
			//    radioClass: 'iradio_flat-blue'
			//});

			return this
		},

		//记录上一次的被选项
		recordSelectedCheckbox: function () {


			if ( $( ".asideForm input:checkbox" ).length ) {
				var tempSelectdList = []

				if ( $( ".asideForm input:checkbox" )[ 0 ].checked ) {
					_.chain( $( ".asideForm input:checkbox" ) )
					 .each( function ( ele ) {
						 tempSelectdList.push( $( ele )
							 .attr( "name" ) )
					 } )
				} else {
					_.chain( $( ".asideForm input:checkbox" ) )
					 .each( function ( ele ) {
						 if ( ele.checked ) {
							 tempSelectdList.push( $( ele )
								 .attr( "name" ) )
						 }
					 } )
				}

				this.model.get( "selected" )[ $( ".asideForm thead input" )
					.attr( "id" ) ] = tempSelectdList

			}

		},

		// 待重新组织代码结构
		deleteInvalidSelected: function ( event, self ) {
			if ( $( event.target )
					.attr( "id" ) === "showdetectedStation" ) {
				// 根据 watershed 和 showdetectedItem 的逻辑关系， 先监测站，后流域时，消除不属于的流域的监测站
				// 仅在点击监测站时消除， 最后提交时再消除
				var selectedWatershedList = _.reject( self.model.get( "selected" )[ "watershed" ], function ( item ) {
					if ( item === "watershed" ) {
						return true
					}
				} )

				var selectedDetectedStationList = self.model.get( "selected" )[ "detectedStation" ]
				var hasIDdetectedStation        = false
				if ( _.indexOf( selectedDetectedStationList, "detectedStation" ) > -1 ) {
					hasIDdetectedStation = true
				}

				var tableBodyWatershedMap = self.model.get( "tableBody" ).watershed
				if ( _.size( selectedWatershedList ) ) {
					self.model.get( "selected" )[ "detectedStation" ] = _.reduce( selectedWatershedList, function ( accu, item ) {
						var tableBodyDetectedStationList = _.chain( tableBodyWatershedMap[ item ].detectedStation )
															.values()
															.pluck( "HTMLname" )
															.value()
						return accu.concat( _.intersection( selectedDetectedStationList, tableBodyDetectedStationList ) )
					}, [] )
				}

				if ( hasIDdetectedStation && _.size( self.model.get( "selected" )[ "detectedStation" ] ) !== 0 ) {
					self.model.get( "selected" )[ "detectedStation" ].push( "detectedStation" )
				}

				//选择性渲染, 先流域，后监测站时，消除不属于的流域的监测站
				if ( selectedWatershedList.length > 0 && selectedWatershedList.length < _.size( tableBodyWatershedMap ) ) {
					_.each( selectedWatershedList, function ( item, index ) {
						self.model.set( "partialStation", {} )
						self.model.get( "partialStation" )[ tableBodyWatershedMap[ item ].HTMLname ] = tableBodyWatershedMap[ item ]
					} )
				} else {
					self.model.set( "partialStation", tableBodyWatershedMap )
				}

			}

		},

		selectedListToMap: function ( selectedList, str ) {
			var checkedAttrList = _.times( _.size( selectedList ), function () {
				return str
			} )
			return _.object( selectedList, checkedAttrList )
		},

		checkItemAndLocationAndTime: function ( self, selectedMap ) {
			var allDetectedStation = _.chain( self.model.get( "tableBody" ).watershed )
									  .map( function ( item ) {
										  return _.keys( item.detectedStation )
									  } )
									  .flatten()
									  .value()
			var allWatershed       = _.keys( self.model.get( "tableBody" ).watershed )
			var hasWatershed       = !!_.size( _.intersection( _.values( selectedMap.watershed ), allWatershed ) )
			var hasDetectedStation = !!_.size( _.intersection( _.values( selectedMap.detectedStation ), allDetectedStation ) )


			var allDetectedItem = _.keys( self.model.get( "tableBody" ).detectedItem )
			var hasDetectedItem = _.size( _.intersection( _.values( selectedMap.detectedItem ), allDetectedItem ) )

			if ( !hasDetectedItem ) {
				$( "#showdetectedItem" ).popover( "show" )
				return false
			} else {
				$( "#showdetectedItem" ).popover( "hide" )
			}


			if ( !hasDetectedStation && !hasWatershed ) {
				$( "#locationPopover" ).popover( "show" )
				return false
			} else {
				$( "#locationPopover" ).popover( "hide" )
				if ( !hasDetectedStation ) {
					return "watershed"
				} else {
					return "detectedStation"
				}
			}
		},

		debounceLoad: _.debounce( function ( event, self ) {

			// 时间检查
			self.model.set( "preSeleceted", self.model.get( "selected" ) )

			var selectedMap = _.mapObject( self.model.get( "selected" ), function ( val ) {
				return _.difference( val, [ "detectedItem", "detectedStation", 'waterStandard', 'watershed' ] )
			} )
			self.model.set( "preSeleceted", selectedMap )


			var locationLevel = self.checkItemAndLocationAndTime( self, selectedMap )
			if ( !locationLevel ) {
				return false
			} else {
				self.model.get( "preSeleceted" ).locationLevel = locationLevel
			}


			self.model.get( "preSeleceted" ).time = {}
			$( ".asideForm #endTime,#startTime" ) //,#cycle
				.each( function ( index, item ) {
					self.model.get( "preSeleceted" ).time[ $( item )
						.attr( "id" ) ] = $( item )
						.val()
				} )
			// self.model.get( "preSeleceted" ).view = $( ".asideForm #viewInput" )
			// 	.val()

			asideSelected_model.clear()
			asideSelected_model.attributes = _.clone( self.model.get( "preSeleceted" ) )

		}, 2000, true ),

		events: {
			"reset .asideForm": function resetAndDeleteSelectedMap() {
				this.model.set( "selected", {} )
			},

			"blur #startTime": function endTimeBehindStarTime( event ) {
				$( "#endTime" )
					.prop( "min", $( event.target )
						.val() )

			},

			"blur #endTime": function ( event ) {
				$( "#startTime" )
					.prop( "max", $( event.target )
						.val() )
			},

			//？？？  thead input 点击存在一个bug
			//点击input 先选中 后触发事件
			//点击label 先事件 后选中
			"click thead ": function checkAllCheckbox() {
				if ( $( "thead input:checkbox" ).is( ":checked" ) ) {
					$( "input:checkbox" )
						.prop( "checked", false )
				} else {
					$( "input:checkbox" )
						.prop( "checked", true )
				}
			},

			// 记录checked选项
			// 待调整事件委任

			//"click #showwaterStandard,#showdetectedItem,#showwatershed,#showdetectedStation,#loadData"
			"click #showdetectedItem,#showdetectedStation,#showwatershed,#loadData": function updateSelectedCheckbox( event ) {
				var self = this
				this.recordSelectedCheckbox( self )
				this.deleteInvalidSelected( event, self )
			},

			//"click #showwaterStandard,#showdetectedItem,#showwatershed"
			"click #showdetectedItem,#showwatershed": function showCheckboxList( event ) {
				var tableIndex    = $( event.target )
					.attr( "id" )
					.slice( 4 )
				var renderDataMap = {
					titleObject    : this.model.get( "tableHead" )[ tableIndex ],
					itemlistObject : this.model.get( "tableBody" )[ tableIndex ],
					seletedCheckbox: this.selectedListToMap( this.model.get( "selected" )[ tableIndex ], "checked" )
				}
				this.render( renderDataMap )
			},

			"click #showdetectedStation": function showvalidDetectedStation( event ) {
				var tableIndex    = $( event.target )
					.attr( "id" )
					.slice( 4 )
				var renderDataMap = {
					titleObject    : this.model.get( "tableHead" ).detectedStation,
					itemlistObject : _.chain( this.model.get( "partialStation" ) )
									  .values()
									  .map( function ( item ) {
										  return _.chain( item.detectedStation )
												  .values()
												  .value()
									  } )
									  .flatten()
									  .value(),
					seletedCheckbox: this.selectedListToMap( this.model.get( "selected" )[ tableIndex ], "checked" )
				}

				this.render( renderDataMap )
			},

			"submit .asideForm": function ( event ) {
				event.preventDefault()
				var self = this

				var checkvalid = function ( event, self ) {

					// 时间检查
					self.model.set( "preSeleceted", self.model.get( "selected" ) )

					var selectedMap = _.mapObject( self.model.get( "selected" ), function ( val ) {
						return _.difference( val, [ "detectedItem", "detectedStation", 'waterStandard', 'watershed' ] )
					} )
					self.model.set( "preSeleceted", selectedMap )


					var locationLevel = self.checkItemAndLocationAndTime( self, selectedMap )
					if ( !locationLevel ) {
						return false
					} else {
						self.model.get( "preSeleceted" ).locationLevel = locationLevel
					}


					self.model.get( "preSeleceted" ).time = {}
					$( ".asideForm #endTime,#startTime" )
						.each( function ( index, item ) {
							self.model.get( "preSeleceted" ).time[ $( item )
								.attr( "id" ) ] = $( item )
								.val()
						} )

					return true
				}

				if ( checkvalid( event, this ) ) {
					asideSelected_model.clear()
					asideSelected_model.attributes = _.clone( self.model.get( "preSeleceted" ) )

					$( "#startAnalyse" ).prop( "diabled", true )
					$.post( "./analysis", { level: asideSelected_model.attributes.locationLevel }, function ( data ) {
						database_model.set( "database", JSON.parse( data )  )
						$( "#startAnalyse" ).prop( "diabled", false )
					} )
				}

				//载入数据功能待实现
				// this.debounceLoad( event, this )


			}

		}
	} )

	var asideList_View = new make_asidelist_view( {
		model: asideList_Model
	} )


	var asideSelected_model = new Backbone.Model()

	var make_topForm_model = Backbone.Model.extend( {} )

	var topForm_model = new make_topForm_model( {} )

	var make_topForm_view = Backbone.View.extend( {
		el: "#topFormWrapper",

		template: _.template( tmpl_map[ "topWaterlevel" ], { variable: 'data' } ) ,

		events: {
			"submit #topForm": function ( event ) {
				event.preventDefault()

				if ( !_.size( asideList_Model.get( "preSeleceted" ) ) ) {
					$( "#startAnalyse" ).popover( "show" )
				} else {
					$( "#startAnalyse" ).popover( "hide" )
				}

				this.model.attributes = _.clone( formList_to_object( event.target ) )
				this.model.set( "waterlevel", _.map( $( "#multipeSelect ul li.selected a" ), function ( ele ) {
					return {
						name    : $( ele )
							.find( ".text" )
							.text(),
						HTMLname: $( ele )
							.prop( "dataset" )[ "tokens" ]
					}
				} ) )


				var root_view = root_view_extend.selectedUIView()
				root_model.get( "returnprimaryDataMap" ).call( root_model )
				root_view.render()
			},
			"change #viewInput": function ( event ) {
				var $ele = $(event.target)
				if ( $ele.val() === "front" ) {
					$( "#cycle" ).prop( "disabled", false )
				} else {
					$( "#cycle" ).prop( "disabled", true )
				}
			},
		},
	} )

	var topForm_view = new make_topForm_view( {
		model: topForm_model
	} )

	var make_waterlevel_model = Backbone.Model.extend( {} )

	var make_waterlevel_collection = Backbone.Collection.extend( {
		model: make_waterlevel_model
	} )

	var waterlevel_collection = new make_waterlevel_collection( [
		{
			"pH"              : {
				relation: "6-7",
				min     : 6,
				max     : 7
			},
			"dissolvedOxygen" : {
				relation: "≥",
				value   : 7.5
			},
			"ammoniaNitrogen" : {
				relation: "≤",
				value   : 0.155
			},
			"mineralChameleon": {
				relation: "≤",
				value   : 2
			},
			id                : "waterlevel1",
			name              : "I类标准"
		}, {

			"pH"              : {
				relation: "6-7",
				min     : 6,
				max     : 7
			},
			"dissolvedOxygen" : {
				relation: "≥",
				value   : 4
			},
			"ammoniaNitrogen" : {
				relation: "≤",
				value   : 0.12
			},
			"mineralChameleon": {
				relation: "≤",
				value   : 7
			},
			id                : "waterlevel2",
			name              : "II类标准"
		}, {

			"pH"              : {
				relation: "6-9",
				min     : 6,
				max     : 9
			},
			"dissolvedOxygen" : {
				relation: "≥",
				value   : 8
			},
			"ammoniaNitrogen" : {
				relation: "≤",
				value   : 2
			},
			"mineralChameleon": {
				relation: "≤",
				value   : 10
			},
			id                : "waterlevel3",
			name              : "III类标准"
		}
	] )

	_.extend( waterlevel_collection, Backbone.Events )
	waterlevel_collection.on( "add", function (  ) {
		updateWaterLevel( )
	} )

	//待取消
	//多个标准共用的单位
	var make_unit_model = Backbone.Model.extend( {
		defaults: {
			"pH"              : "",
			"dissolvedOxygen" : "ml/L",
			"ammoniaNitrogen" : "mg/L",
			"mineralChameleon": "mg/L"
		}
	} )

	var unit_model = new make_unit_model()


	var make_root_model = Backbone.Model.extend( {

		defaults: {
			unit         : unit_model,
			waterlevel   : waterlevel_collection,
			asideSelected: asideSelected_model,
			topSelected  : topForm_model,
			database     : database_model,
			asideList    : asideList_Model,

			//不能放到initialize中,大多数数据是需要用户选择才能计算的
			returnprimaryDataMap: function () {
				var self = this

				self.set( "primaryDataMap", {
					database                : self.get( "database" )
												  .get( "database" ),
					tableWaterlevelList     : _.sortBy( self.get( "topSelected" )
															.get( "waterlevel" ) ),
					startTime               : self.get( "asideSelected" )
												  .get( 'time' ).startTime,
					endTime                 : self.get( "asideSelected" )
												  .get( "time" ).endTime,
					tableSelectedItemList   : _.sortBy( _.map( self.get( "asideSelected" )
																   .get( "detectedItem" ), function ( item ) {
						return _.find( self.get( "asideList" )
										   .get( "tableBody" ).detectedItem, function ( innerItem, key ) {
							if ( key === item ) {
								return true
							}
						} )
					} ), "HTMLname" ),
					tableDetectedStationList: _.sortBy( _.map( self.get( "asideSelected" )
																   .get( "detectedStation" ), function ( item ) {
						var rel
						//不能直接使用 find 或者 pick
						//find ，返回的是item的值 不是其属性的值
						//pick , underscore 中 pick 参数不支持带路径的操作
						_.some( self.get( "asideList" )
									.get( "tableBody" ).watershed, function ( innerItem ) {
							rel = _.find( innerItem.detectedStation, function ( value, key ) {
								if ( key === item ) {
									return true
								}
							} )
							if ( rel ) {
								return true
							}
						} )
						return rel
					} ) ),
					assisIntervalDayInt     : self.get( "topSelected" )
												  .get( "interval" ),
					maxIntervalDayInt       : (function ( startTime, endTime ) {
						var convert = function ( time ) {
							time = time.replace( /-/g, "/" )
							return Date.parse( time )
						}
						endTime     = convert( endTime )
						startTime   = convert( startTime )

						var intervalInt = endTime - startTime
						//return intervalInt/ (1000 * 60 * 60 * 24 )
						return intervalInt / 86400000
					})( self.get( "asideSelected" )
							.get( 'time' ).startTime, self.get( "asideSelected" )
														  .get( "time" ).endTime ),
					locationLevel           : self.get( "asideSelected" )
												  .get( "locationLevel" ) === "detectedStation" ? "detectedStation" : "watershed",
					mainColor               : [
						{
							fillColor  : "rgba(255,232,145, 0.5)",
							strokeColor: "rgba(255,232,145, 1)"
						}, {
							fillColor  : "rgba(57,112,154, 0.5)",
							strokeColor: "rgba(57,112,154, 1)"
						}
					],
					cycle                   : parseInt( self.get( "topSelected" )
															.get( "cycle" ) ),

					chartType               : "",
					allUIData: [],
					header   : {}
				} )
			}

		}
	} )

	var root_model = new make_root_model()

	var root_view_extend = {

		selectedUIView: function () {
			var pattern   = root_model.get( "topSelected" )
									  .get( "pattern" )
			var viewAngle = root_model.get( "topSelected" )
									  .get( "viewAngle" )
			var template
			if ( pattern === "table" ) {
				template = { template: _.template( tmpl_map[ "table" ], { variable: "data" } ) }
			} else {
				template = {
					template: _.template( tmpl_map[ viewAngle + "Chart" ], { variable: "data" } )
				}
			}

			return _.extendOwn( root_view, this.UIViewStrategy[ viewAngle ].common, this.UIViewStrategy[ viewAngle ][ pattern ], template )

		},

		UIViewStrategy: {

			left: {

				common: {

					//监测站--时间——监测项 --->  监测站-监测项
					getAverageDataMap: function ( database ) {

						var detectedItemList = this.model.get( "asideSelected" )
												   .get( "detectedItem" )
						return _.mapObject( database, function ( detectedStationItem ) {
							var detectedItemValueAverage = _.map( detectedItemList, function ( item ) {
								return roundAverage( _.pluck( detectedStationItem, item ) )
							} )
							return _.object( detectedItemList, detectedItemValueAverage )
						} )
					},

					//流域-监测站-时间-监测项 --》流域-时间-监测项
					getWatershedAverageDataMap: function ( database ) {
						var self = this

						return this.getAverageDataMap( _.mapObject( database, function ( Item ) {
							return self.getAverageDataMap( Item )
						} ) )
					},

					pickData: function () {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						if ( primaryDataMap.locationLevel === "detectedStation" ) {
							var detectedStationAverageDataMap = self.getAverageDataMap( primaryDataMap.database )
							var tableDetectedStationList      = primaryDataMap.tableDetectedStationList
							return {
								averageDataMap      : detectedStationAverageDataMap,
								tableMainContentList: tableDetectedStationList
							}
						} else {
							var tableWatershedList      = _.sortBy( _.map( self.model.get( "asideSelected" )
																			   .get( "watershed" ), function ( item ) {
								return _.omit( self.model.get( "asideList" )
												   .get( "tableBody" ).watershed[ item ], "detectedStation" )
							} ) )
							var watershedAverageDataMap = self.getWatershedAverageDataMap( primaryDataMap.database )


							return {
								averageDataMap      : watershedAverageDataMap,
								tableMainContentList: tableWatershedList
							}
						}

					},

					addWaterlevelToData: function ( tableMainContentList, averageDataMap ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						_.each( primaryDataMap.tableWaterlevelList, function ( waterlevelItem ) {
							tableMainContentList.push( waterlevelItem )
							averageDataMap[ waterlevelItem.HTMLname ] = _.object( _.pluck( primaryDataMap.tableSelectedItemList, "HTMLname" ), _.map( primaryDataMap.tableSelectedItemList, function ( selectedItem ) {
								return self.model.get( "waterlevel" )
										   .get( waterlevelItem.HTMLname )
										   .get( selectedItem.HTMLname ).value
							} ) )
						} )
						return {
							tableMainContentList: tableMainContentList,
							averageDataMap      : averageDataMap
						}
					}

				},

				chart: {

					returnMainCanvasData: function ( tableSelectedItemList, data, colorWithMainContentList ) {
						var mainCanvasData      = {}
						mainCanvasData.datasets = []
						mainCanvasData.labels   = _.pluck( tableSelectedItemList, "name" )

						for ( var i = 0, len = _.size( colorWithMainContentList ); i < len; i++ ) {
							mainCanvasData.datasets[ i ] = {
								fillColor  : colorWithMainContentList[ i ].color.fillColor,
								strokeColor: colorWithMainContentList[ i ].color.strokeColor,
								//dataset中的元素 和 tableSelectedItemList 顺序保持一致
								data       : _.map( tableSelectedItemList, function ( selectedItem ) {
									return data[ i ][ selectedItem.HTMLname ]
								} )
							}
						}
						return mainCanvasData
					},

					returnAssitCanvasData: function ( labels, data, i ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var colorMap
						switch ( i ) {
							case 0:
								colorMap = primaryDataMap.mainColor[ 0 ]
								break
							case 1:
								colorMap = primaryDataMap.mainColor[ 1 ]
								break
							case 2:
								colorMap = primaryDataMap.mainColor[ 1 ]
								break
							case 3:
								colorMap = primaryDataMap.mainColor[ 0 ]
								break
						}
						return {
							labels  : labels,
							datasets: [
								{
									fillColor  : colorMap.fillColor,
									strokeColor: colorMap.strokeColor,
									data       : data
								}
							]
						}
					},

					calMainData: function ( tableMainContentList, averageDataMap ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var colorWithMainContentList = self.returnColorWithMainContentList( tableMainContentList )
						// 调整顺序，使dataset 的顺序 与 tableMainContentList一致
						var dataList = _.map( tableMainContentList, function ( item ) {
							return averageDataMap[ item.HTMLname ]
						} )

						primaryDataMap
							.allUIData
							.push( {
								canvasData: self.returnMainCanvasData( primaryDataMap.tableSelectedItemList, dataList, colorWithMainContentList ),
								caption   : colorWithMainContentList
							} )

					},

					calAssitData: function ( averageDataMap, tableMainContentList, averageDataWithoutWaterlevelMap ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var canvasNumber = _.size( primaryDataMap.tableSelectedItemList )
						for ( var i = 0; i < canvasNumber; i++ ) {
							var dataWithoutWaterlevel = _.map( averageDataWithoutWaterlevelMap, function ( item ) {
								return item[ primaryDataMap.tableSelectedItemList[ i ].HTMLname ]
							} )

							var dataAndlevel = _.map( tableMainContentList, function ( item ) {
								return averageDataMap[ item.HTMLname ][ primaryDataMap.tableSelectedItemList[ i ].HTMLname ]
							} )
							primaryDataMap
								.allUIData
								.push( {
									canvasData: self.returnAssitCanvasData( _.pluck( tableMainContentList, "name" ), dataAndlevel, i ),
									caption   : primaryDataMap.tableSelectedItemList[ i ].name,
									id        : "canvas" + i,
									aside     : {
										waterlevel : _.map( primaryDataMap.tableWaterlevelList, function ( waterlevelItem ) {
											var waterlevelItemMap = self.model.get( "waterlevel" )
																		.get( waterlevelItem.HTMLname )
																		.get( primaryDataMap.tableSelectedItemList[ i ].HTMLname )
											return {
												value   : waterlevelItemMap.value,
												relation: waterlevelItemMap.relation,
												name    : self.model.get( "waterlevel" )
															  .get( waterlevelItem.HTMLname )
															  .get( "name" )
											}
										} ),
										average    : roundAverage( dataWithoutWaterlevel ),
										intervalDay: self.intervalDay( primaryDataMap.startTime, primaryDataMap.endTime ),
										unit       : self.model.get( "unit" )
														 .get( primaryDataMap.tableSelectedItemList[ i ].HTMLname )
									}
								} )
						}

					},

					calUIData: function ( locationLevelData ) {
						var self = this

						//标题
						this.calHeaderData( locationLevelData.tableMainContentList )

						var averageDataWithoutWaterlevelMap = _.clone( locationLevelData.averageDataMap )
						//添加标准
						var temp                               = this.addWaterlevelToData( locationLevelData.tableMainContentList, locationLevelData.averageDataMap )
						locationLevelData.tableMainContentList = temp.tableMainContentList
						locationLevelData.averageDataMap       = temp.averageDataMap


						//主视图部分
						self.calMainData( locationLevelData.tableMainContentList, locationLevelData.averageDataMap )

						//子视图部分
						this.calAssitData( locationLevelData.averageDataMap, locationLevelData.tableMainContentList, averageDataWithoutWaterlevelMap )


					}
				},

				table: {
					calUIData: function ( locationLevelData ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						primaryDataMap.allUIData = {
							header: self.calHeaderData( locationLevelData.tableMainContentList ),
							theadList: _.map( primaryDataMap.tableSelectedItemList, function ( item ) {
								var unit = self.model.get( "unit" )
											   .get( item.HTMLname )
								return unit ? item.name + "(" + unit + ")" : item.name
							} ),

							tbodyList: _.map( locationLevelData.tableMainContentList, function ( location ) {
								return _.chain( primaryDataMap.tableSelectedItemList )
										.map( function ( item ) {
											return locationLevelData.averageDataMap[ location.HTMLname ][ item.HTMLname ]
										} )
										.unshift( location.name )
										.value()
							} ),
							tfootList: _.chain( primaryDataMap.tableWaterlevelList )
										.map( function ( item ) {
											return _.chain( primaryDataMap.tableSelectedItemList )
													.map( function ( innerItem ) {
														var temp = self.model.get( "waterlevel" )
																	   .get( item.HTMLname )
																	   .get( innerItem.HTMLname )
														return temp.value ? temp.relation + temp.value : temp.relation
													} )
													.unshift( item.name )
													.value()
										} )
										.unshift( _.chain( primaryDataMap.tableSelectedItemList )
												   .map( function ( item ) {
													   return roundAverage( _.pluck( locationLevelData.averageDataMap, item.HTMLname ) )

												   } )
												   .unshift( "平均值" )
												   .value() )
										.value()


						}

					}
				}
			},

			front: {

				common: {
					//监测站-时间-监测项 ——》监测项-时间-value
					getAverageDataMap: function ( database ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var dateList                                = self.returnDateList( primaryDataMap.startTime, primaryDataMap.endTime )
						primaryDataMap.dateList = dateList
						var selectedItemList                        = _.pluck( primaryDataMap.tableSelectedItemList, "HTMLname" )

						var temp = _.map( selectedItemList, function ( selectedItem ) {
							var detectedItemAverageList = _.map( dateList, function ( date ) {
								return roundAverage( _.pluck( _.pluck( database, date ), selectedItem ) )
							} )
							return _.object( dateList, detectedItemAverageList )
						} )

						return _.object( selectedItemList, temp )
					},

					//流域-监测项-时间-value  —— 》 监测项-时间-value
					getWatershedAverageDataMap: function ( database ) {
						var self        = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var primaryData = _.mapObject( database, function ( Item ) {
							return self.getAverageDataMap( Item )
						} )

						var selectedItemList = _.pluck( primaryDataMap.tableSelectedItemList, "HTMLname" )
						var dateList         = primaryDataMap.dateList

						var temp = _.map( selectedItemList, function ( item ) {
							var watershedAverage = _.map( dateList, function ( date ) {
								return roundAverage( _.pluck( _.pluck( primaryData, item ), date ) )
							} )
							return _.object( dateList, watershedAverage )
						} )

						return _.object( selectedItemList, temp )
					},

					pickData: function () {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var detectedItemAverageDataMap = primaryDataMap.locationLevel === "detectedStation" ? self.getAverageDataMap( primaryDataMap.database ) : self.getWatershedAverageDataMap( primaryDataMap.database )
						var tableSelectedItemList      = primaryDataMap.tableSelectedItemList

						return {
							averageDataMap      : detectedItemAverageDataMap,
							tableMainContentList: tableSelectedItemList
						}
					},

					returnMainInterval: function () {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var startTime = primaryDataMap.startTime
						var endTime   = primaryDataMap.endTime

						//临时变量label个数
						var sliceNumber    = 7
						var intervalDayInt = self.intervalDay( startTime, endTime )

						return Math.ceil( intervalDayInt / (sliceNumber - 1) )
					},

					//待整合到流程的上一层，
					//考虑是否有格式化的数据后，是否要依赖前端的数据
					//重大问题
					orderData: function ( label, mainDataMap, tableMainContentList ) {
						return _.map( tableMainContentList, function ( item ) {
							return _.map( label, function ( innerItem ) {
								return mainDataMap[ item.HTMLname ][ innerItem ]
							} )
						} )
					},

					returnLabel: function ( interval ) {
						var dateList = _.clone( this.model.get( "primaryDataMap" ).dateList )

                        if ( interval === 1 ) {
                            return dateList
                        }

                        var rel = []
                        for ( ; dateList.length !== 0; ) {
                        	if ( dateList.length === 1 )  {
								rel.push( dateList[ 0 ] + "-" + dateList[ 0 ] )
								break
							} else {
								rel.push( dateList[ 0 ] + "-" + dateList[ interval - 1 ] )
							}

							dateList.splice( 0, interval )
						}
						return rel
					}

				},

				chart: {

					returnAssisLableList: function ( cycle ) {
						var dateList = _.clone( this.model.get( "primaryDataMap" ).dateList )

						var labelKeys = []
						if ( cycle === 1 ) {
							labelKeys = dateList
						} else {
							for ( ; dateList.length !== 0; ) {
								if ( dateList.length === 1 ) {
									labelKeys.push( dateList[ 0 ] + " - " + dateList[ 0 ] )
								} else {
									labelKeys.push( dateList[ 0 ] + " - " + dateList[ cycle - 1 ] )
								}
								dateList.splice( 0, cycle )
							}
						}

						//切分成多个子视图
						var relKeys = []
						for ( ; labelKeys.length !== 0; ) {
							relKeys.push( labelKeys.splice( 0, 7 ) )
						}
						return relKeys

					},

					addUIData: function ( label, dataList, tableMainContentList ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var colorWithMainContentList = self.returnColorWithMainContentList( tableMainContentList )

						primaryDataMap
							.allUIData
							.push( {
								canvasData: self.returnCanvasData( label, dataList, tableMainContentList ),
								aside     : {
									caption: {
										colorWithMainContentList: colorWithMainContentList,
										startTime               : _.first( label ),
										endTime                 : _.last( label )
									},

									thead: _.chain( [ "平均值" ] )
											.concat( _.pluck( primaryDataMap.tableWaterlevelList, "name" ) )
											.value(),
									tbody: _.chain( tableMainContentList )
											.map( function ( selectedItem, index ) {
												return _.chain( [ selectedItem.name ] )
														.push( roundAverage( dataList[ index ] ) )
														.concat( _.chain( primaryDataMap.tableWaterlevelList )
																  .map( function ( waterlevelItem ) {
																	  return self.model.get( "waterlevel" )
																				 .get( waterlevelItem.HTMLname )
																				 .get( [ selectedItem.HTMLname ] )
																  } )
																  .value()
														)
														.value()
											} )
											.value()

								}
							} )
					},

					calMainData: function ( tableMainContentList, averageDataMap ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var mainInterval = self.returnMainInterval( primaryDataMap.dateList )
						var label        = self.returnLabel( mainInterval )

						var mainDataMap = _.chain( averageDataMap )
										   .mapObject( function ( detectedItem ) {
											   var values    = _.values( detectedItem )
											   var keys      = _.keys( detectedItem )
											   var relKeys   = []
											   var relValues = []

											   if ( mainInterval === 1 ) {
												   return detectedItem
											   }
											   for ( ; values.length !== 0; ) {


												   if (   values.length === 1 ) {
													   relValues.push( roundAverage( values.splice( 0, mainInterval ) ) )

													   relKeys.push( keys[ 0 ] + "-" + keys[ 0 ] )
												   } else {
													   relValues.push( roundAverage( values.splice( 0, mainInterval ) ) )

													   relKeys.push( keys[ 0 ] + "-" + keys[ mainInterval - 1 ] )
												   }
												   keys.splice( 0, mainInterval )
											   }

											   return _.object( relKeys, relValues )
										   } )
										   .value()

						var mainDataList = self.orderData( label, mainDataMap, tableMainContentList )

						self.addUIData( label, mainDataList, tableMainContentList )
					},

					calAssitData: function ( tableMainContentList, averageDataMap ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var cycle     = primaryDataMap.cycle
						var labelList = self.returnAssisLableList( cycle )

						//压缩数据
						var compressDataList = _.chain( averageDataMap )
												.mapObject( function ( detectedItem ) {

													var values = _.values( detectedItem )

													var labelValues = []

													if ( cycle === 1 ) {
														labelValues = values
													} else {
														for ( ; values.length !== 0; ) {
															labelValues.push( roundAverage( values.splice( 0, cycle ) ) )
														}
													}

													var relValues = []
													for ( ; labelValues.length !== 0; ) {
														//7为临时变量
														relValues.push( labelValues.splice( 0, 7 ) )
													}

													return relValues
												} )
												.value()


						var assisDataList = []
						for ( var i = 0, len = _.size( labelList ); i < len; i++ ) {
							assisDataList.push( _.pluck( compressDataList, i ) )
						}
						_.each( assisDataList, function ( assisData, index ) {
							self.addUIData( labelList[ index ], assisData, tableMainContentList )
						} )

					},

					returnCanvasData: function ( label, dataList, colorWithMainContentList ) {
						var mainCanvasData      = {}
						mainCanvasData.datasets = []
						mainCanvasData.labels   = label

						for ( var i = 0, len = _.size( colorWithMainContentList ); i < len; i++ ) {
							mainCanvasData.datasets[ i ] = {
								fillColor  : colorWithMainContentList[ i ].color.fillColor,
								strokeColor: colorWithMainContentList[ i ].color.strokeColor, //dataset中的元素 和 tableSelectedItemList 顺序保持一致
								data       : _.values( dataList[ i ] )
							}
						}
						return mainCanvasData
					},

					calUIData: function ( locationLevelData ) {
						var self = this

						this.calHeaderData( locationLevelData.tableMainContentList )

						//主视图部分
						self.calMainData( locationLevelData.tableMainContentList, locationLevelData.averageDataMap )

						//子视图部分
						self.calAssitData( locationLevelData.tableMainContentList, locationLevelData.averageDataMap )
					}

				},

				table: {

					addWaterlevelToData: function ( tableMainContentList, averageDataMap ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						//hook
						if ( !tableMainContentList ) {
							tableMainContentList = []
						}
						if ( !averageDataMap ) {
							averageDataMap = {}
						}

						_.each( primaryDataMap.tableWaterlevelList, function ( waterlevelItem ) {
							tableMainContentList.push( waterlevelItem )
							averageDataMap[ waterlevelItem.HTMLname ] = _.object(
								_.pluck( primaryDataMap.tableSelectedItemList, "HTMLname" ),
								_.map( primaryDataMap.tableSelectedItemList, function ( selectedItem ) {
									var temp = self.model.get( "waterlevel" )
												   .get( waterlevelItem.HTMLname )
												   .get( selectedItem.HTMLname )
									return temp.value ?  temp.relation +  temp.value : temp.relation
								} )
							)
						} )

						return {
							tableMainContentList: tableMainContentList,

							averageDataMap: averageDataMap
						}
					},


					calUIData: function ( locationLevelData ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var label           = self.returnLabel( primaryDataMap.cycle )

						var mainDataMap = _.chain( locationLevelData.averageDataMap )
										   .mapObject( function ( detectedItem ) {
											   var values    = _.values( detectedItem )
											   var keys      = _.keys( detectedItem )
											   var relKeys   = []
											   var relValues = []

											   if ( primaryDataMap.cycle === 1 ) {
												   return detectedItem
											   }
											   for ( ; values.length !== 0; ) {


												   if (   values.length === 1 ) {
													   relValues.push( roundAverage( values.splice( 0, primaryDataMap.cycle ) ) )

													   relKeys.push( keys[ 0 ] + "-" + keys[ 0 ] )
												   } else {
													   relValues.push( roundAverage( values.splice( 0, primaryDataMap.cycle ) ) )

													   relKeys.push( keys[ 0 ] + "-" + keys[ primaryDataMap.cycle - 1 ] )
												   }
												   keys.splice( 0, primaryDataMap.cycle )
											   }

											   return _.object( relKeys, relValues )
										   } )
										   .value()

						var averageDataList = self.orderData( label, mainDataMap, locationLevelData.tableMainContentList )
						//考虑直接改成List
						var waterLevelValueMap = _.chain( self.addWaterlevelToData().averageDataMap )
												  .values()
												  .map( function ( item ) {
													  return _.values( item )
												  } )
												  .value()


						primaryDataMap.allUIData = {

							theadList: _.map( primaryDataMap.tableSelectedItemList, function ( item ) {
								var unit = self.model.get( "unit" )
											   .get( item.HTMLname )
								return unit ? item.name + "(" + unit + ")" : item.name
							} ),


							tbodyList: _.chain( label )
										.zip( _.unzip( averageDataList ) )
										.map( function ( item ) {
											return _.flatten( item )
										} )
										.value(),

							tfootList: _.chain( _.pluck( primaryDataMap.tableWaterlevelList, "name" ) )
										.map( function ( item, index ) {

											return [ item ].concat( waterLevelValueMap[ index ] )
										} )
										.unshift( _.chain( averageDataList )
												   .map( function ( item ) {
													   return roundAverage( item )
												   } )
												   .unshift( "平均值" )
												   .value() )
										.value()


						}

					}
				}

			},

			over: {

				common: {

					//监测站-时间-监测项-value ---》时间—监测站--value
					getAverageDataMap: function ( database ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var dateList                                       = self.returnDateList( primaryDataMap.startTime, primaryDataMap.endTime )
						primaryDataMap.dateList        = dateList
						var polluteItemList                                = self.pickPolluteItem()
						primaryDataMap.polluteItemList = polluteItemList

						var temp = _.map( dateList, function ( date ) {
							return _.mapObject( database, function ( detectedStation ) {
								return _.chain( polluteItemList )
										.map( function ( item ) {
											return detectedStation[ date ][ item.HTMLname ]
										} )
										// 各污染物累积含量
										.reduce( accumulate, 0 )
										.value()
							} )
						} )

						return _.object( dateList, temp )
					},

					//流域-监测站—时间-监测项-value  —— 》 时间-流域-value
					getWatershedAverageDataMap: function ( database ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						//流域-监测站—时间-监测项-value ——》流域—时间—监测站--value
						var primaryData = _.mapObject( database, function ( watershed ) {
							return self.getAverageDataMap( watershed )
						} )

						var dateList = primaryDataMap.dateList

						var temp = _.map( dateList, function ( date ) {
							return _.mapObject( primaryData, function ( watershed ) {
								return _.reduce( watershed[ date ], accumulate, 0 )
							} )
						} )

						return _.object( dateList, temp )
					},

					pickData: function () {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var detectedItemAverageDataMap = primaryDataMap.locationLevel === "detectedStation" ? self.getAverageDataMap( primaryDataMap.database ) : self.getWatershedAverageDataMap( primaryDataMap.database )
						var dateList                   = primaryDataMap.dateList

						return {
							averageDataMap : detectedItemAverageDataMap,
							mainContentList: dateList
						}
					},

					addWaterlevelToData: function ( tableMainContentList, averageDataList ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						//hook
						if ( arguments.length === 0 ) {
							tableMainContentList = []
							averageDataList      = []
						}

						_.each( primaryDataMap.tableWaterlevelList, function ( waterlevelItem ) {

							tableMainContentList.push( waterlevelItem )

							//可以增加缓存功能
							var polluteItemAccu = _.chain( primaryDataMap.polluteItemList )
												   .map( function ( selectedItem ) {
													   return self.model.get( "waterlevel" )
																  .get( waterlevelItem.HTMLname )
																  .get( selectedItem.HTMLname ).value
												   } )
												   .reduce( accumulate , 0 )
												   .value()

							var temp = _.map( new Array( primaryDataMap.locationCount ), function () {
								return polluteItemAccu
							} )
							averageDataList.push( temp )

						} )
						return {
							mainContentList: tableMainContentList,
							averageDataList: averageDataList
						}
					},

					pickPolluteItem: function () {
						var omitItem = [ "pH", "dissolvedOxygen" ]
						return _.filter( this.model.get( "primaryDataMap" ).tableSelectedItemList, function ( item ) {
							return !_.contains( omitItem, item.HTMLname )
						} )
					},

					returnOrderData: function ( mainContentList, averageDataWithoutWaterlevelMap ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var label
						if ( this.model.get( "primaryDataMap" ).locationLevel === "detectedStation" ) {
							label = primaryDataMap.tableDetectedStationList
						} else {
							label = _.sortBy( _.map( self.model.get( "asideSelected" )
														 .get( "watershed" ), function ( item ) {
								return _.omit( self.model.get( "asideList" )
												   .get( "tableBody" ).watershed[ item ], "detectedStation" )
							} ) )

						}
						this.model.get( "primaryDataMap" ).locationCount = _.size( label )

						//调整X轴顺序
						var temp = _.mapObject( averageDataWithoutWaterlevelMap, function ( item ) {
							return _.map( label, function ( lableItem ) {
								return item[ lableItem.HTMLname ]
							} )
						} )

						//调整时间上对应顺序
						var dataWithoutWaterlevelList = _.map( mainContentList, function ( item ) {
							return temp[ item ]
						} )

						return {
							tableLabel               : label,
							dataWithoutWaterlevelList: dataWithoutWaterlevelList
						}
					}


				},

				chart: {

					returnCanvasData: function ( label, dataList, colorWithMainContentList ) {
						var canvasData      = {}
						canvasData.datasets = []
						canvasData.labels   = label

						for ( var i = 0, len = _.size( colorWithMainContentList ); i < len; i++ ) {
							canvasData.datasets[ i ] = {
								fillColor  : colorWithMainContentList[ i ].color.fillColor,
								strokeColor: colorWithMainContentList[ i ].color.strokeColor,
								data       : _.values( dataList[ i ] )
							}
						}

						return canvasData
					},

					calMainData: function ( mainContentList, dataWithoutWaterlevelList, tableLabel ) {
						var self = this

						var data = _.chain( dataWithoutWaterlevelList )
									.unzip()
									.map( function ( item ) {
										return _.reduce( item, accumulate, 0 )
									} )
									.value()

						self.addData( _.first( mainContentList ) + "至" + _.last( mainContentList ), dataWithoutWaterlevelList, tableLabel, data )
					},

					calAssistData: function ( mainContentList, dataWithoutWaterlevelList, tableLabel ) {
						var self = this

						_.each( dataWithoutWaterlevelList, function ( data, index ) {
							self.addData( mainContentList[ index ], dataWithoutWaterlevelList, tableLabel, data )
						} )

					},

					addData: function ( assitContentList, dataWithoutWaterlevelList, tableLabel, data ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						//添加标准
						var dataWithWaterlevel = self.addWaterlevelToData( [
							{
								name: assitContentList
							}
						], [ data ] )
						var dataList           = dataWithWaterlevel.averageDataList
						assitContentList       = dataWithWaterlevel.mainContentList

						//附加颜色
						var colorWithMainContentList = self.returnColorWithMainContentList( assitContentList )

						var UIdata = {
							canvasData: self.returnCanvasData( _.pluck( tableLabel, "name" ), dataList, colorWithMainContentList ),
							aside     : {
								caption: {
									time        : _.first( assitContentList ).name,
									accuItemList: _.pluck( primaryDataMap.polluteItemList, "name" ),
									colorWithMainContentList: colorWithMainContentList
								},

								waterlevel: _.chain( assitContentList )
											 .rest()
											 .map( function ( waterlevelItem, index ) {
												 return {
													 name    : waterlevelItem.name,
													 relation: "≤",
													 value   : dataList[ index + 1 ][ 0 ]
												 }
											 } )
											 .value(),
								average   : roundAverage( _.values( data ) )
							}
						}

						primaryDataMap
							.allUIData
							.push( UIdata )
					},

					calUIData: function ( locationLevelData ) {
						var self = this

						//标题
						this.calHeaderData( locationLevelData.mainContentList )

						//调整顺序
						var orderedData = self.returnOrderData( locationLevelData.mainContentList, locationLevelData.averageDataMap )

						self.calMainData( locationLevelData.mainContentList, orderedData.dataWithoutWaterlevelList, orderedData.tableLabel )
						self.calAssistData( locationLevelData.mainContentList, orderedData.dataWithoutWaterlevelList, orderedData.tableLabel )

					}

				},

				table: {
					calUIData: function ( locationLevelData ) {
						var self = this
						var primaryDataMap = self.model.get( "primaryDataMap" )

						var orderedData = self.returnOrderData( locationLevelData.mainContentList, locationLevelData.averageDataMap )

						var waterLevelValueList = self.addWaterlevelToData().averageDataList

						primaryDataMap.allUIData = {

							theadList: _.chain( orderedData.tableLabel )
										.pluck( "name" )
										.push( "平均累积值" )
										.value(),

							tbodyList: _.chain( locationLevelData.mainContentList )
										.values()
										.zip( orderedData.dataWithoutWaterlevelList )
										.map( function ( item, index ) {
											return _.chain( item )
													.flatten()
													.push( roundAverage( orderedData.dataWithoutWaterlevelList[ index ] ) )
													.value()
										} )
										.value(),

							tfootList: _.chain( primaryDataMap.tableWaterlevelList )
										.map( function ( item, index ) {
											return _.chain( waterLevelValueList[ index ] )
													.map( function ( item ) {
														return "≤" + item
													} )
													.push(  "≤" + waterLevelValueList[ index ][ 0 ] )
													.unshift( item.name )
													.value()
										} )
										.unshift( (function () {
											var temp = _.chain( orderedData.dataWithoutWaterlevelList )
														.unzip()
														.map( function ( item ) {
															return _.reduce( item, accumulate, 0 )
														} )
														.value()
											temp.push( roundAverage( temp ) )
											temp.unshift( "累积值" )
											return temp
										})() )
										.value()
						}
					}
				}
			}
		}

	}

	var make_root_view = Backbone.View.extend( {
		el: "#contentContainer",

		model: root_model,

		calHeaderData: function ( tableMainContentList ) {
			var self                                  = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			this.model.get( "primaryDataMap" ).header = {
				startTime       : primaryDataMap.startTime,
				endTime         : primaryDataMap.endTime,
				detectedItmeList: _.pluck( primaryDataMap.tableSelectedItemList, "name" ),
				detectedStation : _.map( tableMainContentList, function ( item ) {
					return item[ "name" ] || item
				} )
			}
		},

		renderCanvas: function ( viewAngle ) {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )
			var type

			if ( viewAngle === "left" ) {
				type = "Bar"
			} else if ( viewAngle === "front" ) {
				type = "Line"
			} else {
				type = "Radar"
			}

			_.each( primaryDataMap.allUIData, function ( item, index ) {
				var chartContext = document.getElementById( "canvas" + index )
										   .getContext( "2d" )
				new Chart( chartContext )[ type ]( item.canvasData )
			} )
		},

		makeColorList: function ( number ) {

			var range = function ( start, stop, number ) {
				if ( number === 1 ) {
					return [ start ]
				}
				var step    = Math.floor( ( stop - start ) / (number - 1) )
				var relList = []
				for ( var i = 0; i < number; i++ ) {
					relList[ i ] = step * i
				}
				return relList
			}

			var len            = Math.ceil( number / 3 )
			var changeItemList = range( 0, 255, len )
			var relList        = []

			for ( var changeItemIndex = 0; changeItemIndex < len; changeItemIndex++ ) {
				var changeColor = changeItemList[ changeItemIndex ]
				for ( var threeColorIndex = 0; threeColorIndex < 3; threeColorIndex++ ) {
					var temp = relList [ changeItemIndex * 3 + threeColorIndex ] = {}
					switch ( threeColorIndex % 3 ) {
						case 0:
							temp.fillColor   = "rgba(" + changeColor + ", 255, 0, 0.3)"
							temp.strokeColor = "rgba(" + changeColor + ", 255, 0, 1)"
							break
						case 1:
							temp.fillColor   = "rgba(0, " + changeColor + ", 255, 0.3)"
							temp.strokeColor = "rgba(0, " + changeColor + ", 255, 1)"
							break
						case 2:
							temp.fillColor   = "rgba(255, 0, " + changeColor + ", 0.3)"
							temp.strokeColor = "rgba(255, 0, " + changeColor + ", 1)"
							break
					}
				}
			}
			return _.first( relList, number )
		},

		returnColorWithMainContentList: function ( tableMainContentList ) {
			var self = this

			var len       = _.size( tableMainContentList )
			var colorList = self.makeColorList( len )
			//data 和 colorWithMainContentList 顺序是一样的
			return _.map( tableMainContentList, function ( item, index ) {
				item.color = colorList[ index ]
				return item
			} )
		},

		intervalDay: function ( startTime, endTime ) {
			var convert = function ( time ) {
				time = time.replace( /-/g, "/" )
				return Date.parse( time )
			}
			endTime     = convert( endTime )
			startTime   = convert( startTime )

			var intervalInt = endTime - startTime
			//return intervalInt/ (1000 * 60 * 60 * 24 )
			return intervalInt / 86400000
		},

		returnDateList: function ( startTime, endTime ) {
			var self = this

			var iterateDay = new Date( startTime )
			var dateList   = []

			dateList.push( iterateDay.toLocaleDateString() )
			_.times( self.intervalDay( startTime, endTime ), function () {
				iterateDay.setDate( +iterateDay.getDate() + 1 )
				dateList.push( iterateDay.toLocaleDateString() )
			} )

			return dateList
		},

		render: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			var pattern   = root_model.get( "topSelected" )
									  .get( "pattern" )
			var viewAngle = root_model.get( "topSelected" )
									  .get( "viewAngle" )

			self.calUIData( self.pickData() )

			$( this.el )
				.html( this.template( {
					allUIData: primaryDataMap.allUIData,
					header   : primaryDataMap.header
				} ) )

			//渲染canvas
			if ( pattern !== "table" ) {
				self.renderCanvas( viewAngle )
			}
		}
	} )

	var root_view = new make_root_view()


	//实时分析


	//动态推送数据,考虑是否有和数据分析数据模型合并的可能
	var make_now_database_model = Backbone.Model.extend( {
		defaults: {
			database: {
				songhuajiang: {
					"neimenggu_hulunbeier_heishantou": {
						"2016/8/11": {
							"pH"              : "7.28",
							"dissolvedOxygen" : "9.70",
							"ammoniaNitrogen" : "0.74",
							"mineralChameleon": "4.56"
						}
					},
					"heilongjiang_heihe"             : {
						"2016/8/11": {
							"pH"              : "5",
							"dissolvedOxygen" : "7",
							"ammoniaNitrogen" : "9",
							"mineralChameleon": "11"
						}
					},
					"heilongjiang_tongjiang" :{
						"2016/8/11": {
							"pH"              : "3",
							"dissolvedOxygen" : "2",
							"ammoniaNitrogen" : "9",
							"mineralChameleon": "18"
						},
					}
				},
			}
		}
	} )
	var now_database_model      = new make_now_database_model()

	//监测站model,后端交互
	var make_locationState_model = Backbone.Model.extend( {
		defaults: {
			songhuajiang: {
				//维护
				neimenggu_hulunbeier_heishantou: 0,
				//正常
				heilongjiang_heihe             : 1,
				//损坏
				heilongjiang_tongjiang         : -1
			}
		}
	} )
	var locationState_model      = new make_locationState_model()

	//专家级用户可编写
	//私人备注在用户模型中保存
	var make_detectedStationRemarkAndAdvice_model = Backbone.Model.extend( {
		defaults: {
			neimenggu_hulunbeier_heishantou: {
				remark: "abc",
				advice: "状态良好"
			},
			heilongjiang_heihe             : {
				remark: "qwe",
				advice: "注意监控"
			},
			heilongjiang_tongjiang: {
				remark: "dasdas",
				advice: "加强监管"
			}
		}
	} )
	var detectedStationRemarkAndAdvice_model      = new make_detectedStationRemarkAndAdvice_model()

	var make_watershedRemarkAndAdvice_model = Backbone.Model.extend( {
		defaults: {
			songhuajiang: {
				remark: "dasdas",
				advice: "cvcx"
			},
			liaohe      : {
				remark: "cxvxcv",
				advive: "oip"
			}

		}
	} )
	var watershedRemarkAndAdvice_model      = new make_watershedRemarkAndAdvice_model()


	var make_realTime_model = Backbone.Model.extend( {
		initialize: function () {
			var self = this

			self.set( "primaryDataMap", {

				allUIData            : [],
				stateColor           : {
					init    : {
						fillColor  : "#007DFF",
						strokeColor: "#0000FF"
					},
					normal  : {
						fillColor  : "#00FF00",
						strokeColor: "#7DFF00",
					},
					innormal: {
						fillColor  : "#FF0000",
						strokeColor: "#FF007D",
					}
				},
				database             : self.get( "database" )
										   .get( "database" ),
				//time: (new Date).toLocaleDateString(),
				//临时数据
				time                 : "2016/8/11",
				tableDetectedItemList: _.sortBy( self.get( "asideList" )
													 .get( "tableBody" ).detectedItem ),
				tableWatershedList   : self.get( "asideList" )
										   .get( "tableBody" ).watershed,
				whichTable           : "brief",


				tableSelectedDetectedStation: "",
				tableSelectedWatershed      : "",
				//默认为水体动画
				tableOldSelectedWatershed   : "",
				tableSelecetdWaterlevel     : "",
				locationLevel               : "",
				valueStateMap               : ""
			} )
		},

		defaults: {
			database                      : now_database_model,
			asideList                     : asideList_Model,
			waterlevel                    : waterlevel_collection,
			watershedRemarkAndAdvice      : watershedRemarkAndAdvice_model,
			detectedStationRemarkAndAdvice: detectedStationRemarkAndAdvice_model,
			locationState                 : locationState_model
			//ajaxCommon: {
			//	startTime: new Date().toLocaleDateString(),
			//	endTime: new Date().toLocaleDateString(),
			//	detectedItem: _.keys( make_asidelist_model.get( "tableBody" ).detectedItem ),
			//},
			////直接加载本日的数据，不用ajax请求
			//var ajax = _.extendOwn( self.model.get( "primaryDataMap" ).ajaxCommon, {
			//	locationLevel: "watershed",
			//	detectedStation: "",
			//	watershed: $ele.attr( "id" ),
			//} )
			////ajax数据
			//var ajax = _.extendOwn( self.model.get( "primaryDataMap" ).ajaxCommon,  {
			//	locationLevel: "detectedStation",
			//	detectedStation: $ele.attr( "id" ),
			//	//提高后端查询速率
			//	watershed: self.model.get( "primaryDataMap" ).selectedWatershed,
			//})
		}
	} )
	var realTime_model      = new make_realTime_model()

	var make_brief_view = Backbone.View.extend( {

		el: "#briefTable_view",

		template: _.template( tmpl_map[ "briefTable" ], { variable: "data" } ),

		returnDetectedStationValueMap: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			return primaryDataMap.database[ primaryDataMap.tableSelectedWatershed.HTMLname ]
				[ primaryDataMap.tableSelectedDetectedStation.HTMLname ]
				[ self.model.get( 'primaryDataMap' ).time ]
		},

		returnWatershedValueMap: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			var valueAvarageList = _.chain( primaryDataMap.database[ primaryDataMap.tableSelectedWatershed.HTMLname ] )
									.pluck( self.model.get( 'primaryDataMap' ).time )
									.map( function ( item ) {
										return _.values( item )
									} )
									.unzip()
									.map( function ( item ) {
										return roundAverage( item )
									} )
									.value()

			return primaryDataMap.watershedValueMap = _.object( _.pluck( primaryDataMap.tableDetectedItemList, "HTMLname" ), valueAvarageList )
		},

		returnWatershedData: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			return {
				detectedItemValueMap: self.returnWatershedValueMap(),
				caption             : primaryDataMap.tableSelectedWatershed.name,
				advice              : self.model.get( "watershedRemarkAndAdvice" )
										  .get( primaryDataMap.tableSelectedWatershed.HTMLname ).advice
			}
		},

		returnDetectedStationData: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			return {
				detectedItemValueMap: self.returnDetectedStationValueMap(),
				caption             : primaryDataMap.tableSelectedDetectedStation.name,
				advice              : self.model.get( "detectedStationRemarkAndAdvice" )
										  .get( primaryDataMap.tableSelectedDetectedStation.HTMLname ).advice
			}
		},

		whichWaterlevel: function ( value, detectedItem ) {
			var self = this
			var rel
			//注意遍历顺序，要从严格到不严格
			//有自定义标准时，需要从新排序
			self.model.get( 'waterlevel' )
				.some( function ( watershedItem ) {
					if ( watershedItem.get( detectedItem ).relation === "≥" && value >= watershedItem.get( detectedItem ).value ) {
						rel = watershedItem.get( "name" )
						return true
					} else if ( watershedItem.get( detectedItem ).relation === "≤" && value <= watershedItem.get( detectedItem ).value ) {
						rel = watershedItem.get( "name" )
						return true
					} else if ( value <= watershedItem.get( detectedItem ).max && value >= watershedItem.get( detectedItem ).min ) {
						rel = watershedItem.get( "name" )
						return true
					}
					return false
				} )
			return rel ? rel : "未达标"
		},

		returnRenderData: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			var tbody
			var thead = [ "#", "测量值", "所处级别" ]

			var locationData         = primaryDataMap.locationLevel === "detectedStation" ? self.returnDetectedStationData() : self.returnWatershedData()
			var detectedItemValueMap = locationData.detectedItemValueMap

			tbody = _.map( primaryDataMap.tableDetectedItemList, function ( detectedItem ) {
				var rel = []
				rel.push( detectedItem.name )
				rel.push( detectedItemValueMap[ detectedItem.HTMLname ] )
				rel.push( self.whichWaterlevel( detectedItemValueMap[ detectedItem.HTMLname ], detectedItem.HTMLname ) )
				return rel
			} )

			if ( self.model.get( "markSelected" ) ) {
				var waterlevelItem = self.model.get( 'primaryDataMap' ).tableSelecetdWaterlevel

				thead.splice( 2, 0, waterlevelItem.get( "name" ) )
				thead.splice( 3, 0, "对比结果" )

				_.each( primaryDataMap.tableDetectedItemList, function ( detectedItem, index ) {
					var state = markSelected_view.returnState( primaryDataMap.tableSelectedDetectedStation.HTMLname, detectedItemValueMap[ detectedItem.HTMLname ], detectedItem.HTMLname )

					tbody[ index ].splice( 2, 0, waterlevelItem.get( detectedItem.HTMLname ).relation + ( waterlevelItem.get( detectedItem.HTMLname ).value || "" ) )
					tbody[ index ].splice( 3, 0, state.name )
				} )
			}

			return {
				thead  : thead,
				tbody  : tbody,
				time   : primaryDataMap.time,
				caption: locationData.caption,
				advice : locationData.advice
			}
		},

		render: function () {

			this.$el.html( this.template( this.returnRenderData() ) )
		},

		events: {
			// ？？？除去上下跳转的功能：原因， 没必要
			//

			// "click #toDetailTable": function () {
			//
			// 	if ( this.model.get( "primaryDataMap" ).whichTable === "brief" ) {
			// 		$( "#toDetailTable" )
			// 			.text( "查看简讯" )
			// 		$( ".nano-content" )
			// 			.scrollTop( 1000 )
			// 		this.model.get( "primaryDataMap" ).whichTable = "detail"
			// 	} else {
			// 		$( "#toDetailTable" )
			// 			.text( "查看详情" )
			// 		$( ".nano-content" )
			// 			.scrollTop( 0 )
			// 		this.model.get( "primaryDataMap" ).whichTable = "brief"
			// 	}
			//
			// }
		}
	} )

	var brief_view = new make_brief_view( { model: realTime_model } )

	var make_detail_view = Backbone.View.extend( {

		el: "#detailTable_view",

		detectedStationTemplate: _.template(
			tmpl_map[ "leftDetailTable" ]
			+ tmpl_map[ "detectedStationDetailTable" ]
			+ tmpl_map[ "rightDetailTable" ]
			, { variable: "data" }
		),

		watershedTemplate: _.template(
			tmpl_map[ "leftDetailTable" ]
			+ tmpl_map[ "watershedDetailTable" ]
			+ tmpl_map[ "rightDetailTable" ]
			, { variable: "data" }
		),

		returnDetectedStationValueMap: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			return primaryDataMap.database[ primaryDataMap.tableSelectedWatershed.HTMLname ]
				[ primaryDataMap.tableSelectedDetectedStation.HTMLname ]
				[ self.model.get( 'primaryDataMap' ).time ]
		},

		returnLeftRenderData: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			var thead = [ "#", "测量值" ]
			self.model.get( 'waterlevel' )
				.each( function ( waterlevelItem ) {
					thead.push( waterlevelItem.get( "name" ) )
				} )

			var tbody                = []
			var detectedItemValueMap = primaryDataMap.locationLevel === "detectedStation" ? self.returnDetectedStationValueMap() : primaryDataMap.watershedValueMap
			_.each( primaryDataMap.tableDetectedItemList, function ( detectedItem ) {
				var tr = []
				tr.push( detectedItem.name )
				tr.push( detectedItemValueMap[ detectedItem.HTMLname ] )

				self.model.get( 'waterlevel' )
					.each( function ( waterlevelItem ) {
						var temp = waterlevelItem.get( detectedItem.HTMLname )
						tr.push( temp.relation + ( temp.value || "" ) )
					} )

				tbody.push( tr )
			} )

			return {
				thead: thead,
				tbody: tbody
			}
		},

		returnMiddleDetectedStationRenderData: (function () {
			var StateMap = {
				"1" : "正常",
				"-1": "故障",
				"0" : "维修"
			}

			return function () {
				var self                = this
				var primaryDataMap = self.model.get( "primaryDataMap" )

				var detectedStationData = self.model.get( "asideList" )
											  .get( "tableBody" ).watershed[ primaryDataMap.tableSelectedWatershed.HTMLname ].detectedStation[ primaryDataMap.tableSelectedDetectedStation.HTMLname ]
				return {
					time         : primaryDataMap.time,
					state        : StateMap[ self.model.get( "locationState" )
												 .get( primaryDataMap.tableSelectedWatershed.HTMLname )[ primaryDataMap.tableSelectedDetectedStation.HTMLname ] ],
					watershedName: primaryDataMap.tableSelectedWatershed.name,
					section      : detectedStationData.section,
					detail       : detectedStationData.detail
				}
			}
		})(),

		returnMiddleWatershedRenderData: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			var watershed            = self.model.get( "asideList" )
										   .get( "tableBody" ).watershed[ primaryDataMap.tableSelectedWatershed.HTMLname ]
			var normalStateCount     = _.countBy( self.model.get( "locationState" )
													  .get( primaryDataMap.tableSelectedWatershed.HTMLname ), function ( state ) {
				return state === 1 ? "normal" : "innormal"
			} ).normal
			var detectedStationCount = _.size( watershed.detectedStation )

			return {
				time                : primaryDataMap.time,
				normalStateCount    : normalStateCount,
				detectedStationCount: detectedStationCount,
				province            : watershed.province,
				watershedArea       : watershed.watershedArea,
				detail              : watershed.detail
			}
		},

		returnRightRenderData: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			return {
				remark        : primaryDataMap.locationLevel === "detectedStation" ? self.model.get( "detectedStationRemarkAndAdvice" )
																											 .get( primaryDataMap.tableSelectedDetectedStation.HTMLname ).remark : self.model.get( "watershedRemarkAndAdvice" )
																																																		   .get( primaryDataMap.tableSelectedWatershed.HTMLname ).remark, // user_model获取数据
				personalRemark: ""
			}
		},

		returnOtherRenderData: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			return {
				caption: primaryDataMap.locationLevel === "detectedStation" ? primaryDataMap.tableSelectedDetectedStation.name : primaryDataMap.tableSelectedWatershed.name
			}
		},

		render: function () {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			var data = {
				other : self.returnOtherRenderData(),
				left  : self.returnLeftRenderData(),
				middle: primaryDataMap.locationLevel === "detectedStation" ? self.returnMiddleDetectedStationRenderData() : self.returnMiddleWatershedRenderData(),
				right : self.returnRightRenderData()
			}

			if ( primaryDataMap.locationLevel === "detectedStation" ) {
				this.$el.html( this.detectedStationTemplate( data ) )
			} else {
				this.$el.html( this.watershedTemplate( data ) )
			}
		}
	} )
	var detail_view      = new make_detail_view( { model: realTime_model } )

	var make_watershedMap_view = Backbone.View.extend( {

		el: "#watershedMap_view",

		renderMark: function () {
			var container = document.getElementById( 'detectedStationPotMap' )
			var params    = {
				width : 311,
				height: 259
			}

			$( container )
				.empty()
			var two = new Two( params ).appendTo( container )

			two = this.markDetectedStation( this.markSelectedDetectedStation( two ) )

			two.update()
		},

		markSelectedDetectedStation: function ( SVGContext ) {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			var detectedStation
			//初始化和点击的分叉点
			if ( !(detectedStation = primaryDataMap.tableSelectedDetectedStation.HTMLname) ) {
				return SVGContext
			}
			var watershed     = primaryDataMap.tableSelectedWatershed
			var imgCoordinate = self.model.get( "asideList" )
									.get( "tableBody" ).watershed[ watershed.HTMLname ].detectedStation[ detectedStation ].imgCoordinate

			var diameter = 10
			var sides    = 5

			var star       = SVGContext.makeStar.apply( SVGContext, imgCoordinate.concat( diameter, sides ) )
			star.linewidth = 1;
			self.selectColor( star, detectedStation )

			return SVGContext

		},

		markDetectedStation: function ( SVGContext ) {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			var watershed          = primaryDataMap.tableSelectedWatershed
			var detectedStationMap = _.mapObject( self.model.get( "asideList" )
													  .get( "tableBody" ).watershed[ watershed.HTMLname ].detectedStation, function ( item ) {
				return item.imgCoordinate
			} )
			var detectedStation
			//初始化和点击的分叉点
			if ( detectedStation = primaryDataMap.tableSelectedDetectedStation.HTMLname ) {
				detectedStationMap = _.omit( detectedStationMap, detectedStation )
			}

			var diameter = 4

			_.mapObject( detectedStationMap, function ( item, key ) {
                if ( _.isUndefined( item ) ) {
                    return
                }
                var circle       = SVGContext.makeCircle.apply( SVGContext, item.concat( diameter ) )
				circle.linewidth = 1;
				self.selectColor( circle, key )
			} )

			return SVGContext
		},

		selectColor: function ( graph, detectedStation ) {
			var self = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			if ( self.model.get( "markSelected" ) ) {
				//根据状态设置颜色
				var state    = primaryDataMap.valueStateMap[ detectedStation ]
				graph.fill   = primaryDataMap.stateColor[ state.HTMLname ].fillColor
				graph.stroke = primaryDataMap.stateColor[ state.HTMLname ].strokeColor

			} else {
				//默认
				graph.fill   = primaryDataMap.stateColor[ "init" ].fillColor
				graph.stroke = primaryDataMap.stateColor[ "init" ].strokeColor
			}
		},

		showWatershedImg: function () {
			$( "." + this.model.get( "primaryDataMap" ).tableOldSelectedWatershed.HTMLname )
				.addClass( "none" )
			$( "." + this.model.get( "primaryDataMap" ).tableSelectedWatershed.HTMLname )
				.removeClass( "none" )
		},

		render: function () {
			this.showWatershedImg()
			this.renderMark()
		},

		events: {
			"click area": function ( event ) {
				var self = this
				var primaryDataMap = self.model.get( "primaryDataMap" )
				var $ele = $( event.target )

				primaryDataMap.tableSelectedDetectedStation = primaryDataMap.tableSelectedWatershed.detectedStation[ $ele.attr( "id" ) ]
				primaryDataMap.locationLevel = "detectedStation"

				countryMap_view.renderUIList()
			}
		}
	} )
	var watershedMap_view      = new make_watershedMap_view( { model: realTime_model } )

	var make_markSelected_view = Backbone.View.extend( {

		el: "#markSelected_view",

		calValueStateMap: function () {
			var self                 = this
			var primaryDataMap = self.model.get( "primaryDataMap" )

			var watershed            = primaryDataMap.tableSelectedWatershed.HTMLname
			var detectedItemValueMap = _.mapObject( self.model.get( 'primaryDataMap' ).database[ watershed ], function ( value ) {
				return value[ primaryDataMap.time ][ self.model.get( "markSelected" ).detectedItem ]
			} )

			self.model.get( 'primaryDataMap' ).tableSelecetdWaterlevel = self.model.get( 'waterlevel' )
																			 .get( self.model.get( "markSelected" ).waterlevel )

			primaryDataMap.valueStateMap = _.mapObject( detectedItemValueMap, function ( value, key ) {
				return self.returnState( key, value, self.model.get( "markSelected" ).detectedItem)
			} )
		},

		returnState: (function () {
			var relMap = {
				normal  : {
					name    : "正常",
					HTMLname: "normal"
				},
				innormal: {
					name    : "未达标",
					HTMLname: "innormal"
				}
			}

			var strategy = {
				bigRelation      : {
					list      : [ "dissolvedOxygen" ],
					whichState: (function () {

						var isNormal = function ( value, standard ) {
							if ( value > standard ) {
								return relMap.normal
							}
						}

						var isOver = function ( value, standard ) {
							if ( value <= standard ) {
								return relMap.innormal
							}
						}

						return isNormal.after( isOver )

					})(),
				},
				smallRelationList: {
					list      : [ "ammoniaNitrogen", "mineralChameleon" ],
					whichState: (function () {
						var isOver = function ( value, standard ) {
							if ( value >= standard ) {
								return relMap.innormal
							}
						}

						var isNormal = function ( value, standard ) {
							if ( value < standard ) {
								return relMap.normal
							}
						}

						return isNormal.after( isOver )
					})()
				},
				rangeRelationList: {
					list      : [ "pH" ],
					whichState: (function () {
						var isOver   = function ( value, range ) {
							var min = range[0]
							var max = range[1]
							if ( value <= min || value >= max ) {
								return relMap.innormal
							}
						}
						var isNormal = function ( value, range ) {
							var min = range[0]
							var max = range[1]
							if ( value > min || value < max ) {
								return relMap.normal
							}
						}

						return isNormal.after( isOver )
					})()
				}
			}

			return function ( detectedStation, value, detectedItem ) {
				var self              = this
				var rel
				var waterlevel = self.model.get( 'primaryDataMap' ).tableSelecetdWaterlevel

				//状态模式， 根据状态自动选择相应的算法， 而不是主动切换算法。。变量名待修改
				_.some( strategy, function ( strategyItem ) {
					if ( _.contains( strategyItem.list, detectedItem ) ) {
						var standard = (function () {
							var standard
							if ( standard = self.model.get( "waterlevel" )
												.get( waterlevel )
												.get( detectedItem ).value ) {
								return standard
							} else {
								return self.model.get( "waterlevel" )
										   .get( waterlevel )
										   .get( detectedItem )
										   .relation
										   .split( "-" )
							}
						})()

						rel = strategyItem.whichState( value, standard )
						return true
					} else {
						return false
					}
				} )

				return rel
			}
		})(),

		events: {
			"click  button[type='reset']": function () {
				this.model.unset( "markSelected" )
				countryMap_view.renderUIList()
			},
			"submit #markSelected"       : function ( event ) {
				event.preventDefault()

				this.model.set( "markSelected", formList_to_object( event.target ) )

				this.calValueStateMap()

				countryMap_view.renderUIList()
			}
		}
	} )

	var markSelected_view = new make_markSelected_view( { model: realTime_model } )


	var make_countryMap_view = Backbone.View.extend( {

		el: "#UImap",

		renderUIList: (function () {
			var UIList = [
				function () {
					watershedMap_view.render()
				}, function () {
					brief_view.render()
				}, function () {
					detail_view.render()
				}
			]
			return function () {
				_.each( UIList, function ( item ) {
					item()
				} )
			}
		})(),

		events: {
			"click": function (  ) {
				if ( Backbone.history.getFragment() != "realTimeData" ) {
					work_space.navigate( "realTimeData", {trigger: true} )
				}
			},
			"click #countryMap area": function ( event ) {
				var self = this
				var primaryDataMap = self.model.get( "primaryDataMap" )
				var $ele = $( event.target )

				//配置公共数据
				var tableWatershed                                              = self.model.get( "asideList" )
																					  .get( "tableBody" ).watershed[ $ele.attr( "id" ) ]
				primaryDataMap.tableOldSelectedWatershed    = primaryDataMap.tableSelectedWatershed
				primaryDataMap.tableSelectedWatershed       = tableWatershed
				primaryDataMap.locationLevel                = "watershed"
				primaryDataMap.tableSelectedDetectedStation = ""

				self.renderUIList()
			}
		}
	} )

	var countryMap_view = new make_countryMap_view( { model: realTime_model } )




	// 辅助功能模块
	var make_customWaterlevel_model = Backbone.Model.extend( {
		defaults : {
			unit         : unit_model,
			waterlevel   : waterlevel_collection,
			asideList    : asideList_Model
		}
	} )

	var customWaterlevel_model = new make_customWaterlevel_model()

	var make_customWaterlevel_view = Backbone.View.extend( {

		el: "#customWaterlevelContainner div.modal-body",

		//不包含tr输入组，使用DOM动态添加
		template: _.template( tmpl_map[ "customWaterlevel" ],{ variable: "data" } ),

		trTemplate: _.template(
			"<tr data-index='<%-data.index%>'>"
			+ tmpl_map[ "otherTds" ]
			+ tmpl_map[ "waterlevelName" ]
			+ tmpl_map[ "pHTd" ]
			+ tmpl_map[ "dissolvedOxygenTd" ]
			+ tmpl_map[ "ammoniaNitrogenTd" ]
			+ tmpl_map[ "mineralChameleonTd" ]
			+ "</tr>"
			, { variable: "data" }
		),
		
		tdTemplateMap: {
			pH:_.template( tmpl_map[ "pHTd" ], { variable: "data" } ),
			dissolvedOxygen: _.template( tmpl_map[ "dissolvedOxygenTd" ], { variable: "data" } ),
			ammoniaNitrogen: _.template( tmpl_map[ "ammoniaNitrogenTd" ], { variable: "data" } ),
			mineralChameleon: _.template( tmpl_map[ "mineralChameleonTd" ], { variable: "data" } )
},

		render: function (  ) {
			var self = this

			self.$el.html( self.template( self.model.get( "waterlevel" ).toJSON() ) )

			return this
		},

		orderTr: function ( direction ) {
			var self = this
			var type = $( "#orderedItem" ).val()

			//待修改，选择器不对
			var  trList = _.sortBy( $( "#waterlevelTable tbody tr" ), function ( item ) {
				var $ele = $( item )
				var value = self.getTdData( type, $ele )
				return parseFloat( value ? value : 0 )
			} )


			if ( direction === 0) {
				trList = trList.reverse()
			}

			var $tbody = $( "<tbody></tbody>" )
			_.each( trList, function ( item ) {
				$( item ).appendTo( $tbody )
			} )

			$( "#waterlevelTable tbody" ).replaceWith( $tbody )
		},

		defaultOrder: function (  ) {

			var $trList = _.sortBy( $( "#waterlevelTable tbody tr" ), function ( item ) {
				return parseInt( $( item ).data( "index" ) )
			} )

			var $tbody = $( "<tbody></tbody>" )
			_.each( $trList, function ( item ) {
				$( item ).appendTo( $tbody )
			} )

			$( "#waterlevelTable tbody" ).replaceWith( $tbody )
		},

		getTdData: function ( index, $ele ) {
			return parseFloat(
				$ele.find( "input[name='" + index + "']" ).val()
				|| $ele.find("td[data-index='" + index +"'] span[data-name='value']").text()
			)
		},

		getPHData: function ( $ele ) {
			var min
			if (  min = parseFloat( $ele.find( "input[name='min']" ).val() ) ) {
				var max = parseFloat( $ele.find( "input[name='max']" ).val() )
				return {
					relation: min + "-" + max,
					min: min,
					max: max
				}
			} else {
				var text1 = $ele.find("td[data-index='pH'] span[data-name='value']").text()
				var text1Arr = text1.split("-")
				return {
					relation: text1,
					min: text1Arr[0],
					max: text1Arr[1]
				}
			}
		},

		returnUniqueName: function ( $ele, waterLevelCollection ) {
			var self = this

			//待整合进getTdData
			var nameStr = $ele.find( "input[name='" + "name" + "']" ).val()
				|| $ele.find("td[data-index='" + "name" +"'] span[data-name='value']").text()

			var index = waterLevelCollection.findWhere( {
				name: nameStr
			} )

			if ( !index ) {
				return nameStr
			} else {
				return nameStr + myUniqeId( "(", ")" )
			}
		},

		//待使用after,解决
		allSelected: function (  ) {
			// 待修改。由于监听元素的不同， 和侧边栏的条件正好相反. 由于样式问题，待最后统一解决
			if ( $( "#waterlevelALLCheckbox" )
					.is( ":checked" ) ) {
				$( ".warterlevelCheckbox" ).not( ":disabled" )
										   .prop( "checked", true )
			} else {
				$( ".warterlevelCheckbox" ).not( ":disabled" )
										   .prop( "checked", false )
			}
		},

		events: {
			"click #waterlevelALLCheckbox": function (  ) {
				this.allSelected()
			},

			"click .ascend": function (  ) {
				this.orderTr( 1 )
			},

			"click .descend": function (  ) {
				this.orderTr( 0 )
			},

			"click .default": function (  ) {
				this.defaultOrder()
			},

			"click #deleteStandard": function (  ) {
				var self = this

				//?? 单一ID 还需要【0】 ?
				//if ( $( "#waterlevelALLCheckbox" )[0].checked ) {
				//
				//}

				$( ".warterlevelCheckbox" ).each( function ( index, item ) {
					var $ele = $( item )
					if ( item.checked ) {
						var id = $ele.parents( "tr" ).data( "id" )
						if ( id ) {
							self.model.get( "waterlevel" ).remove( $ele.parents( "tr" ).data( "id" ) )
						}
						$ele.parents( "tr" ).remove()
					}
				} )

				$( "#waterlevelTable tbody tr th" ).each( function (  index, item  ) {
					$( item ).text( index + 1 )
				} )

			},

			"click #resetStandard": function (  ) {
				var self = this
				$( ".warterlevelCheckbox" ).each( function ( index, item ) {

					var $ele = $( item )
					if ( item.checked ) {
						$ele.parents( "tr" ).replaceWith(
							self.trTemplate( {
								index: $ele.parents( "tr" ).find( "th" ).text()
							} )
						)
					}
				} )

				this.allSelected()
			},

			"click #continueAdd": function() {
				$( "#waterlevelTable tbody" ).append( this.trTemplate( {
					index: $( "#waterlevelTable tbody tr" ).length + 1
				}  ) )

				this.allSelected()
			},

			"submit #customWaterlevelForm": function ( event ) {
				event.preventDefault()
				var self = this

				// 恢复默认顺序
				self.defaultOrder()

				//???  被注释， 已经忘记原情景， 待解决
				// 储存数据进model
				// var length = self.model.get( "waterlevel" ).length
				// _.times( length - 3, function ( ) {
				// 	self.model.get( "waterlevel" ).models.pop()
				// } )
				var defaultWaterlevelCountFix = 3 + 1
				idCounter = 0
				var waterLevelCollection = self.model.get( "waterlevel" )
				$( "#waterlevelTable tbody tr:nth-of-type( n " + defaultWaterlevelCountFix + " )" ).each( function ( index, item ) {
					var $ele = $( item )

					waterLevelCollection.push( {
						"pH"              : self.getPHData( $ele ),
						"dissolvedOxygen" : {
							relation: "≥",
							value   : self.getTdData( "dissolvedOxygen",$ele )
						},
						"ammoniaNitrogen" : {
							relation: "≤",
							value   : self.getTdData( "ammoniaNitrogen",$ele )
						},
						"mineralChameleon": {
							relation: "≤",
							value   : self.getTdData( "mineralChameleon",$ele )
						},
						id                : "waterlevel" + (index + defaultWaterlevelCountFix ),
						name              : self.returnUniqueName( $ele, waterLevelCollection )
					} )
				} )

				// 重新渲染
				this.render()

				//取消选择
				$( ".warterlevelCheckbox" ).not( ":disabled" ).prop( "checked", false )

			},

			"click tbody td span:not(.input-group-addon)": function ( event ) {
				var $td = $( event.target ).parent( "td" )

				//待修改, 兄弟选择器
				if ( $td.sibling( 1, 'td input[type="checkbox"]' ).prop( "disabled" ) ){
					var tdIndex = $td.data( "index" )

					if ( tdIndex === "pH" ) {
						var textArr = $td.find( 'span[data-name="value"]' ).text().split( "-" )
						$( this.tdTemplateMap[ tdIndex ]( {
							startValue: parseFloat( textArr[0] ),
							endValue: parseFloat( textArr[1] )
						} ) ).replaceAll( $td ).find( "input" ).focus()
					}
					else {
						$( this.tdTemplateMap[ tdIndex ]( {
							value: parseFloat( $td.find( 'span[data-name="value"]' ).text() )
						} ) ).replaceAll( $td ).find( "input" ).focus()
					}
				}
			}
		}
	} )

	var customWaterlevel_view = new make_customWaterlevel_view( { model:customWaterlevel_model } )

	var make_header_view = Backbone.View.extend( {
		//绑定在body 防止元素替换后丢失元素的问题
		el: "body",

		events: {
			"click #showCustomWatershedContainer": function ( event ) {
				customWaterlevel_view.render()
			},
			"change #switchPage input": function (  ) {
				//z-index管理
				if ( $( "#showRealTimeData" ).is( ":checked" ) ) {
					work_space.navigate( "realTimeData",{trigger: true} )
				} else {
					work_space.navigate( "analysis",{trigger: true} )
				}
			}
		}
	} )

	var header_view = new make_header_view()

	var make_modifyUserData_view = Backbone.View.extend( {

		el: "",

		template: function (  ) {
			//tmpl_map
		},

		render: function (  ) {

		},

		events: {

		}

	} )

	var modifyUserData_view = new  make_modifyUserData_view( { model: userName_model } )

	var make_uploadData_model = Backbone.Model.extend( {
		defaults: {
			validity1: false,
			validity2: false,

			watershedHTMLname: "",
			detectedStationHTMLname: "",

			data: {},
			detectedItemDataMap : {}
		}
	})

	var uploadData_model = new make_uploadData_model( {} )

	// ？？？？数据的顺序问题， 上传的复写优先级问题， 日期的顺序问题， 每个值得有效性问题， 等待读取的样式问题，禁止上传的样式问题 未解决
	var make_uploadData_view = Backbone.View.extend( {
		el: "#uploadDataModal",

		model: uploadData_model,

		events: {
			"click .detectedStation-ul li" : function ( e ) {
				$( "#breadcrumb" ).popover( "hide" )
				this.model.set( "validity1", false )
				var $station = $( e.target )
				var $watershed = $station.parents( "li" ).find( "span" )
				this.model.set( "detectedStationHTMLname", $station.data( "htmlname" ) )
				var stationName = $station.text()
				this.model.set( "watershedHTMLname", $watershed.data( "htmlname" ) )
				var watershedName = $watershed.text()

				$( "#watershedLabel" ).text( watershedName )
				$( "#detectedStationLabel" ).text( stationName )
				this.model.set( "validity1", true )
			},
			"change #fileSelect": function ( e ) {
				var self = this
				var file = e.target.files[0]
				var reader = new FileReader()
				var validity = true

				$( "#fileSelect" ).popover( "hide" )
				$( "#upload" ).prop( "disabled", true )

				reader.readAsText( file, "gb2312" )

				reader.onload = function (  ) {
					$( "#upload" ).prop( "disabled", false )
					self.model.set( "validity2", false )

					var result = _.map( reader.result.split( "\r\n" ), function ( item ) {
						return item.split( "," )
					} )
					result.pop()
					var indexArr = _.map( [ "日期","溶解氧","氨氮", "高锰酸钾", "pH" ], function ( item ) {
						var temp = result[0].indexOf( item )
						if ( temp > -1 ) {
							return temp
						} else {
							validity = false
						}
					} )
					if ( !validity ){
						return
					}
					result.shift()

					var dateArr = _.map( result, function ( item ) {
						return item.splice( 0 , 1 )[0]
					} )
					var dataArr = _.map( result, function ( item) {
						var temp  = {}
						temp.dissolvedOxygen = item[ indexArr[ 1 ] ]
						temp.ammoniaNitrogen = item[ indexArr[ 2 ] ]
						temp.mineralChameleon = item[ indexArr[ 3 ] ]
						temp.pH = item[ indexArr[ 4 ] ]
						return temp
					} )

					//？？？？数据顺序不匹配
					//var a = _.object( dateArr,  dataArr)

					self.model.set( "detectedItemDataMap" , _.object( dateArr,  dataArr) )

					self.model.set( "validity2", true )


				}
			},
			"click #upload": function ( event ) {


				var data = this.model.get( "data" )
				var validity = true

				if ( !this.model.get( "validity1" ) ) {
					$( "#breadcrumb" ).popover( "show" )
					validity = false
				}

				if ( !this.model.get( "validity2" ) ) {
					$( "#fileSelect" ).popover( "show" )
					validity = false
				}

				if ( validity ) {
					data[ this.model.get( "watershedHTMLname" ) ] = {}
					data[ this.model.get( "watershedHTMLname" ) ] [ this.model.get( "detectedStationHTMLname" ) ] = this.model.get( "detectedItemDataMap" )
					$( "#upload" ).popover( "show" )
					setTimeout( function (  ) {
						$( "#upload" ).popover( "hide" )
					} , 2000)
				}
			}
		}

	} )

	var uploadData_view = new make_uploadData_view( {} )

	/* 路由对象 */
	var make_work_space = Backbone.Router.extend( {

		routes: {
			"loginIn": function () {
				this.changeIndex( "#loginInAndSignUpPage")
				//???待修改，由于signUp直接实例化了，判断条件待修改
				if ( userName_model.hasChanged() ) {
					loginIn_view.render( {
						account  : userName_model.get( "account" ),
						textColor: "text-success",
						message  : "注册成功，请登录"
					} )
				} else {
					loginIn_view.render( {} )
				}
			},
			"signUp" : function () {
				this.changeIndex( "#loginInAndSignUpPage")
				signUp_view.render()
			},

			//??? url指向文档内ID时， 对布局产生了未可知的影响
			"analysis": function (  ) {
				this.changeIndex( "#analysisPage" )
			},
			"realTimeData": "realTimeData",

			"home": "home",
			"": "home"

		},

		changeIndex: function (  ) {
			var $eles = $( "#realTimeDataPage, #analysisPage,#loginInAndSignUpPage" )
			return function ( showEle ) {
				$eles.each( function (  index, ele  ) {
					var $ele = $( ele )
					if ( $ele.is( showEle ) ) {
						if ( $ele.is( "#loginInAndSignUpPage" ) ) {
							$ele.css( "display", "block" )
						}

						$ele.css( "z-index", 500 )
					} else {
						if ( $ele.is( "#loginInAndSignUpPage" ) ) {
							$ele.css( "display", "none" )
						}

						$ele.css( "z-index", 490)
					}
				} )
			}
		}(),

		home: function (  ) {
			this.changeIndex( "#realTimeDataPage" )

			$( "#animationUI" ).css( "display", "block" )
			$( "#rightContent" ).css( "display", "none")

			$( "#switchPage label" ).removeClass( "active" ).find( "input" ).prop( "checked", false )
			$( "#UImap > img" ).removeClass( "smallState" ).addClass( "bigstate" )
		},

		realTimeData: function (  ) {
			this.changeIndex( "#realTimeDataPage" )


			$( "#animationUI" ).css( "display", "none" )
			$( "#rightContent" ).css( "display", "block")

			$( "#UImap > img" ).removeClass( "bigstate" ).addClass( "smallState" )
		}
	} )


	/*  启动路由 */
	var work_space = new make_work_space()
	Backbone.history.start()

} );


$( function () {

	$( ".nano" ).nanoScroller();

	$( '.selectpicker' )
		.addClass( "btn-group-sm" )
		.selectpicker( 'setStyle' );
} );
