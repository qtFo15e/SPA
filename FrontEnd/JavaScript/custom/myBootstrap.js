/**
 * Created by 77563 on 2016/8/15.
 */

$( function (  ) {

	//button.js
	$( document ).on( "click", "[data-toggle='buttons']", function ( e ) {
		var $ele = $( e.target )
		var $btnGroup =  $ele.parent( "[data-toggle='buttons']" )
		var $notele = $btnGroup.find( ".btn" ).not( $ele )
		$notele.toggleClass( "active" , !$ele.toggleClass( "active" ).hasClass( "active" ))
		$btnGroup.find( "input" ).prop( 'checked', $( this ).parent( "label" ).hasClass( "active" ) )
	} )


	//dropdown.js
	$( document ).on( "click", ".dropdown-toggle", function ( e ) {
		e.stopPropagation()
		$( e.target ).siblings( ".dropdown-menu" ).css( "display", "block" )
	} )

	$( document ).on( "click", function (  ) {
		$( ".dropdown-menu" ).css( "display", "none" )
	} )



	//modal.js
	$( document ).on( "click", '[data-toggle="modal"]', function ( e ) {
		var $btn = $( e.target )
		var $target = $( $btn.data( "target" ) )
		$target.addClass("modal-open").show()
		$target[0].offsetWidth
		$target.addClass( "in" )
		$( "<div class='modal-backdrop fade in'></div>" ).appendTo( "body" )

	} )
	$( document ).on( "click", '[data-dismiss="modal"]', function ( e ) {
		var $btn = $( e.target )
		var $target = $btn.closest( ".modal" )
		$target.one( "transitionend", function (  ) {
			$( this ).hide()
		} )
		$target.removeClass( "in" )
		$target[0].offsetWidth;
		$( ".modal-backdrop" ).remove()
	} )


} )

