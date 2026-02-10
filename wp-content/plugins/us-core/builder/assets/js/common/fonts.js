/**
 * Available spaces:
 *
 * _window.$usb - Basic object for mounting and initializing all extensions of the builder
 * _window.$usbcore - Auxiliary functions for the builder and his extensions
 * _window.$ush - US Helper Library
 *
 */
! function( $, _undefined ) {

	const _window = window;

	if ( ! _window.$usb ) {
		return;
	}

	_window.$ush = _window.$ush || {};

	/**
	 * @class Fonts - Functionality for working with font settings
	 */
	function Fonts() {}

	// Fonts API
	$.extend( Fonts.prototype, {

		/**
		 * Set the google fonts
		 *
		 * @param {{}} themeOptions The theme options
		 */
		setGoogleFonts: function( themeOptions ) {
			const self = this;

			if ( ! $usb.iframeIsReady ) {
				return;
			}

			const $node = $( 'link[id=' + $usb.config( 'typography.fonts_id' ) + ']', $usb.iframe.contentDocument );

			if ( $node.length ) {
				$node.attr( 'href', self._getGoogleEndpoint( themeOptions ) );

			} else {
				$( 'head', $usb.iframe.contentDocument ).append(
					'<link id="' + $usb.config( 'typography.fonts_id' )
					+ '" rel="stylesheet" href="'
					+ self._getGoogleEndpoint( themeOptions )
					+ '" media="all">'
				);
			}
		},

		/**
		 * Get the Google endpoint
		 *
		 * @param {{}} themeOptions The theme options
		 * @return {String} Returns the endpoint for connecting Google Fonts
		 */
		_getGoogleEndpoint: function( themeOptions ) {
			const self = this;

			var usedFonts = {},
				config = $usb.config( 'typography', {} ),
				googleFonts = config.googleFonts || {},
				additionalGoogleFonts = config.usedGoogleFonts || {};

			var tags = config.tags || []; // tags for typography
			for ( const i in tags ) {
				var tag = tags[ i ], tagProps = themeOptions[ tag ];
				if ( ! $.isPlainObject( tagProps ) ) {
					continue;
				}
				// Get font family
				var fontFamily = tagProps[ 'font-family' ];
				if ( $ush.isUndefined( fontFamily ) ) {
					continue;
				}
				// Check if the name is in the list of Google fonts
				if ( $ush.isUndefined( googleFonts[ fontFamily ] ) ) {
					continue;
				}
				// Define italic and inherit family
				var _fontFamily = $ush.rawurlencode( fontFamily );

				// In any case, let's add the font to the list
				if ( fontFamily !== 'inherit' && $ush.isUndefined( usedFonts[ _fontFamily ] ) ) {
					usedFonts[ _fontFamily ] = $ush.toString( googleFonts[ fontFamily ] ).split( ',' );
				}
			}

			// Include Additional Google Fonts as they might be used in the Design settings of the elements on the preview page
			for ( const googleFont in additionalGoogleFonts ) {
				var _fontFamily = $ush.rawurlencode( googleFont );

				if( $ush.isUndefined( usedFonts[ _fontFamily ] ) ) {
					usedFonts[ _fontFamily ] = additionalGoogleFonts[ googleFont ].split( ',' );
				}
			}

			// Create inline fonts `Name:100,200,400italic...`
			var inlineFonts = [];
			for ( const fontFamily in usedFonts ) {
				var font = fontFamily,
					weights = usedFonts[ fontFamily ];
				if ( weights.length ) {
					font += ':' + weights.join( ',' );
				}
				inlineFonts.push( font );
			}

			// Create endpoint to connect Google Fonts
			// see https://developers.google.com/fonts/docs/getting_started
			if ( inlineFonts.length ) {
				return config.googleapis + '?family=' + inlineFonts.join( '|' ) + '&display=' + config.font_display;
			}
			return '';
		}

	} );

	// Export API
	$usb.fonts = new Fonts;

}( jQuery );
