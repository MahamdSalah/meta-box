window.rwmb = window.rwmb || {};

jQuery( function ( $ )
{
	'use strict';

	var MapAdvancedField, views = rwmb.views || {};

	MapAdvancedField = views.MapAdvancedField = Backbone.View.extend( {
		initialize: function ( options )
		{
			this.initDomElements();
			this.initMapElements();

			this.initMarkerPosition();
			this.addListeners();
			this.autocomplete();
		},

		// Initialize DOM elements
		initDomElements   : function ()
		{
			this.canvas      = this.$( '.rwmb-map-canvas' ).empty()[0];
			this.$latitude   = this.$( '.rwmb-map-latitude' );
			this.$longitude  = this.$( '.rwmb-map-longitude' );
			this.$zoom       = this.$( '.rwmb-map-zoom' );
			this.$findButton = this.$( '.rwmb-map-goto-address-button' );
			this.$address    = this.$( '.rwmb-map-address' );
		},

		// Initialize map elements
		initMapElements   : function ()
		{
			var defaultLoc = $( this.canvas ).data( 'default-loc' ),
				latLng;

			defaultLoc = defaultLoc ? defaultLoc.split( ',' ) : [53.346881, -6.258860];
			latLng = new google.maps.LatLng( defaultLoc[0], defaultLoc[1] ); // Initial position for map

			this.map = new google.maps.Map( this.canvas, {
				center           : latLng,
				zoom             : 14,
				streetViewControl: 0,
				mapTypeId        : google.maps.MapTypeId.ROADMAP
			} );
			this.marker = new google.maps.Marker( { position: latLng, map: this.map, draggable: true } );
			this.geocoder = new google.maps.Geocoder();
		},

		// Initialize marker position
		initMarkerPosition: function ()
		{
			var lat = this.$latitude.val(),
				long = this.$longitude.val(),
				zoom = this.$zoom.val();

			if ( lat && long )
			{
				this.marker.setPosition( new google.maps.LatLng( lat, long ) );

				zoom = zoom ? parseInt( zoom, 10 ) : 14;

				this.map.setCenter( this.marker.position );
				this.map.setZoom( zoom );
				this.geocodeToAddress();
			}
			else if ( this.$address.length )
			{
				this.geocodeFromAddress();
			}
		},

		// Add event listeners for 'click' & 'drag'
		addListeners      : function ()
		{
			var that = this;
			google.maps.event.addListener( this.map, 'click', function ( event )
			{
				that.marker.setPosition( event.latLng );
				that.updateCoordinate( event.latLng );
			} );

			google.maps.event.addListener( this.marker, 'drag', function ( event )
			{
				that.updateCoordinate( event.latLng );
			} );

			google.maps.event.addListener( this.map, 'zoom_changed', function( event ) {
				that.$zoom.val( that.map.getZoom() );
			});

			this.$findButton.on( 'click', function ()
			{
				that.geocodeFromAddress();
				return false;
			} );

			/**
			 * Add a custom event that allows other scripts to refresh the maps when needed
			 * For example: when maps is in tabs or hidden div (this is known issue of Google Maps)
			 *
			 * @see https://developers.google.com/maps/documentation/javascript/reference
			 *      ('resize' Event)
			 */
			$( window ).on( 'rwmb_map_refresh', function()
			{
				var zoom = that.map.getZoom(),
					center = that.map.getCenter();

				if ( that.map )
				{
					google.maps.event.trigger( that.map, 'resize' );
					that.map.setZoom( zoom );
					that.map.setCenter( center );
				}
			} );

			//Refresh on meta box hide and show
			$( document ).on( 'postbox-toggled', function() {
			    $( window ).trigger( 'rwmb_map_refresh' );
			} );
		},

		// Autocomplete address
		autocomplete      : function ()
		{
			var that = this;

			// No address field or more than 1 address fields, ignore
			if ( ! this.$address.length )
			{
				return;
			}

			this.$address.autocomplete( {
				source: function ( request, response )
				{
					that.geocoder.geocode( {
						'address': request.term
					}, function ( results )
					{
						response( $.map( results, function ( item )
						{
							return {
								label    : item.formatted_address,
								value    : item.formatted_address,
								latitude : item.geometry.location.lat(),
								longitude: item.geometry.location.lng()
							};
						} ) );
					} );
				},
				select: function ( event, ui )
				{
					var latLng = new google.maps.LatLng( ui.item.latitude, ui.item.longitude );

					that.map.setCenter( latLng );
					that.marker.setPosition( latLng );
					that.updateCoordinate( latLng );
				}
			} );
		},

		// Update coordinate to input field
		updateCoordinate  : function ( latLng )
		{
			this.$latitude.val( latLng.lat() );
			this.$longitude.val( latLng.lng() );
			this.geocodeToAddress();
		},

		geocodeToAddress : function()
		{
			if( ! this.$address.length )
			{
				return;
			}
			var that = this;
			this.geocoder.geocode({
				latLng: new google.maps.LatLng( this.$latitude.val(), this.$longitude.val() )
			}, function(responses) {
		    if (responses && responses.length > 0) {
		      that.$address.val( responses[0].formatted_address );
		    } else {
		      that.$address.val( 'Cannot determine address at this location.' );
		    }
		  });
		},

		// Find coordinates by address
		geocodeFromAddress    : function ()
		{
			var address = this.$address.val(),
				that = this;

			if ( address )
			{
				this.geocoder.geocode( { 'address': address }, function ( results, status )
				{
					if ( status === google.maps.GeocoderStatus.OK )
					{
						that.map.setCenter( results[0].geometry.location );
						that.marker.setPosition( results[0].geometry.location );
						that.updateCoordinate( results[0].geometry.location );
					}
				} );
			}
		}
	} );

	function update()
	{
		new MapAdvancedField( { el: this } );
	}

	$( '.rwmb-map-advanced-field' ).each( update );
	$( '.rwmb-input' )
		.on( 'clone', '.rwmb-map-advanced-field', _.debounce( update, 100 ) );

} );
