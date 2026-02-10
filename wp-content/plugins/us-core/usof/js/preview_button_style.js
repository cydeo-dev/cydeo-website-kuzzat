/**
 * USOF Button Style Preview
 */
;! function( $, _undefined ) {

	if ( $ush.isUndefined( window.$usof ) ) {
		return;
	}

	const dependsOn = [
		'h1_font_family',
		'h2_font_family',
		'h3_font_family',
		'h4_font_family',
		'h5_font_family',
		'h6_font_family',
		'body_font_family',
	];

	function ButtonPreview( container ) {
		const self = this;

		// Elements
		self.$container = $( container );
		self.$button = $( '.usof-btn', self.$container );
		self.$groupParams = self.$container.closest( '.usof-form-group-item' );
		self.$style = $( 'style:first', self.$groupParams );

		// Private "Variables"
		self.groupParams = self.$groupParams.data( 'usof.GroupParams' );

		// Bondable events
		self._events = {
			applyStyles: self.applyStyles.bind( self ),
		};

		// Apply style to button preview on dependant fields change
		for ( const fieldId in $usof.instance.fields ) {
			if ( ! $usof.instance.fields.hasOwnProperty( fieldId ) ) {
				continue;
			}
			if ( dependsOn.includes( $usof.instance.fields[ fieldId ].name ) ) {
				$usof.instance.fields[ fieldId ].on( 'change', self._events.applyStyles );
			}
		}

		// Apply style to button preview on button's group params change
		for ( const fieldId in self.groupParams.fields ) {
			if ( ! self.groupParams.fields.hasOwnProperty( fieldId ) ) {
				continue;
			}
			self.groupParams.fields[ fieldId ].on( 'change', self._events.applyStyles );
		}

		self.applyStyles();
	};

	// Export API
	$.extend( ButtonPreview.prototype, {

		/**
		 * Get the color value.
		 *
		 * @param {String} name The field name.
		 * @return {String} Returns the current color in HEX, RGB(A) or Gradient.
		 */
		_getColorValue: function( name ) {
			const self = this;
			if (
				self.groupParams instanceof $usof.GroupParams
				&& self.groupParams.fields[ name ] !== _undefined
				&& self.groupParams.fields[ name ].type === 'color'
				&& self.groupParams.fields[ name ].hasOwnProperty( 'getColorValue' )
			) {
				return self.groupParams.fields[ name ].getColorValue();
			}
			return '';
		},

		/**
		 * Apply styles for form elements a preview
		 */
		applyStyles: function() {
			const self = this;
			const classRandomPart = $ush.uniqid();

			var className = `.usof-btn_${classRandomPart}`,
				style = {
					default: '',
					hover: '',
				};

			self.$button.usMod( 'usof-btn', classRandomPart );
			self.$button.usMod( 'hov', self.groupParams.getValue( 'hover' ) );
			self.$button.usMod( 'hovText', self.groupParams.getValue( 'hover_text_animation' ) );

			// Font family
			var buttonFont = self.groupParams.getValue( 'font' ),
				typographyOptions = $usof.getData('typographyOptions') || {},
				fontFamily;

			if ( $.inArray( buttonFont, Object.keys( typographyOptions ) ) !== - 1 ) {
				fontFamily = ( typographyOptions[ buttonFont ] || {} )['font-family'] || ( ( typographyOptions[ buttonFont ] || {} ).default || {} )['font-family'] || '';
			} else {
				fontFamily = buttonFont;
			}
			if ( fontFamily !== 'none' && fontFamily !== '' && fontFamily !== 'null' ) {
				style.default += 'font-family: ' + fontFamily + '!important;';
			}

			// Text style
			if ( self.groupParams.getValue( 'text_style' ).includes( 'italic' ) ) {
				style.default += 'font-style: italic !important;';
			} else {
				style.default += 'font-style: normal !important;';
			}

			if ( self.groupParams.getValue( 'text_style' ).includes( 'uppercase' ) ) {
				style.default += 'text-transform: uppercase !important;';
			} else {
				style.default += 'text-transform: none !important;';
			}

			// Use min() for correct appearance of the button with huge font-size value, e.g. 20em
			style.default += 'font-size: min(' + self.groupParams.getValue( 'font_size' ) + ', 50px) !important;';

			style.default += 'line-height:' + self.groupParams.getValue( 'line_height' ) + ' !important;';
			style.default += 'font-weight:' + self.groupParams.getValue( 'font_weight' ) + ' !important;';
			style.default += 'padding:' + self.groupParams.getValue( 'height' ) + ' ' + self.groupParams.getValue( 'width' ) + ' !important;';
			style.default += 'border-radius:' + self.groupParams.getValue( 'border_radius' ) + ' !important;';
			style.default += 'letter-spacing:' + self.groupParams.getValue( 'letter_spacing' ) + ' !important;';
			style.default += 'transition-timing-function:' + self.groupParams.getValue( 'transition_timing_function' ) + ' !important;';

			// Total button height for correct circles or squares
			var btnLineHeight = self.groupParams.getValue( 'line_height' );
			if ( btnLineHeight.includes( 'px' ) ) {
				btnLineHeight += 'em';
			}
			style.default += '--btn-height: calc(' + btnLineHeight + ' + 2 * ' + self.groupParams.getValue( 'height' ) + ');';

			style.default += '--btn-transition-duration:' + self.groupParams.getValue( 'transition_duration' ) + ';';

			// Colors
			var colorBg = self._getColorValue( 'color_bg' ),
				colorBorder = self._getColorValue( 'color_border' ),
				colorBgHover = self._getColorValue( 'color_bg_hover' ),
				colorBorderHover = self._getColorValue( 'color_border_hover' ),
				color;

			// Set default values if colors are empty
			if ( colorBg == '' ) {
				colorBg = 'transparent';
			}
			if ( colorBorder == '' ) {
				colorBorder = 'transparent';
			}
			if ( colorBgHover == '' ) {
				colorBgHover = 'transparent';
			}
			if ( colorBorderHover == '' ) {
				colorBorderHover = 'transparent';
			}

			if ( self.groupParams.getValue( 'hover' ) == 'circle' ) {
				style.default += 'background: transparent !important;';

			} else if ( self.groupParams.getValue( 'hover' ) == 'scaleDown' ) {
				style.default += 'background:' + colorBgHover + ' !important;';

			} else {
				style.default += 'background:' + colorBg + ' !important;';
			}

			if ( colorBorder.includes( 'gradient' ) ) {
				style.default += 'border-image:' + colorBorder + ' 1;';
				style.default += 'border-color: transparent;';
			} else {
				style.default += 'border-color:' + colorBorder + ';';
				style.default += 'border-image: none;';
			}

			if ( self._getColorValue( 'color_text' ).includes( 'gradient' ) ) {
				color = usofColorAPI.gradientParse( self._getColorValue( 'color_text' ) ).firstValue;
				style.default += 'color:' + color + ' !important;';
			} else {
				self.$button.css( 'color', self._getColorValue( 'color_text' ) );
			}

			// Shadow
			if ( self._getColorValue( 'color_shadow' ) != '' ) {
				style.default += 'box-shadow:'
					+ self.groupParams.getValue( 'shadow_offset_h' ) + ' '
					+ self.groupParams.getValue( 'shadow_offset_v' ) + ' '
					+ self.groupParams.getValue( 'shadow_blur' ) + ' '
					+ self.groupParams.getValue( 'shadow_spread' ) + ' '
					+ self._getColorValue( 'color_shadow' ) + ' ';
				if ( $.inArray( '1', self.groupParams.getValue( 'shadow_inset' ) ) !== - 1 ) {
					style.default += 'inset';
				}
				style.default += '!important;';
			}

			if (
				self.groupParams.getValue( 'hover' ) == 'fade'
				&& ! colorBg.includes( 'gradient' )
				&& (
					colorBgHover == 'transparent'
					|| colorBgHover == 'rgba(0,0,0,0)'
				)
			) {
				style.hover += 'background:' + colorBgHover + ' !important;';
			}

			// Border color on hover
			if ( colorBorderHover.includes( 'gradient' ) ) {
				style.hover += 'border-image:' + colorBorderHover + ' 1;';
				style.hover += 'border-color: transparent;';
			} else {
				style.hover += 'border-color:' + colorBorderHover + ';';
				style.hover += 'border-image: none;';
			}

			// Text color on hover
			var colorHover;
			if ( self._getColorValue( 'color_text_hover' ).includes( 'gradient' ) ) {
				colorHover = usofColorAPI.gradientParse( self._getColorValue( 'color_text_hover' ) ).firstValue;
			} else {
				colorHover = self._getColorValue( 'color_text_hover' );
			}
			style.hover += 'color:' + colorHover + ' !important;';

			var compiledStyle = className + '{%s}'.replace( '%s', style.default );

			// Shadow on hover
			if ( self._getColorValue( 'color_shadow_hover' ) != '' ) {
				style.hover += 'box-shadow:'
					+ self.groupParams.getValue( 'shadow_hover_offset_h' ) + ' '
					+ self.groupParams.getValue( 'shadow_hover_offset_v' ) + ' '
					+ self.groupParams.getValue( 'shadow_hover_blur' ) + ' '
					+ self.groupParams.getValue( 'shadow_hover_spread' ) + ' '
					+ self._getColorValue( 'color_shadow_hover' ) + ' ';
				if ( $.inArray( '1', self.groupParams.getValue( 'shadow_hover_inset' ) ) !== - 1 ) {
					style.hover += 'inset';
				}
				style.hover += '!important;';
			}

			// Border Width
			compiledStyle += className + ':before {border-width:' + self.groupParams.getValue( 'border_width' ) + ' !important;}';
			compiledStyle += className + ':hover{%s}'.replace( '%s', style.hover );

			// Set hover background color to the extra layer		
			if ( self.groupParams.getValue( 'hover' ) == 'circle' ) {
				compiledStyle += className + '::after {background:' + colorBg + '!important;}';
				compiledStyle += className + ':hover::after {background:' + colorBgHover + '!important;}';

			} else if ( self.groupParams.getValue( 'hover' ) == 'scaleDown' ) {
				compiledStyle += className + '::after {background:' + colorBg + '!important;}';

			} else {
				compiledStyle += className + '::after {background:' + colorBgHover + '!important;}';
			}

			self.$style.text( compiledStyle );
		}

	} );

	$.fn.USOF_ButtonPreview = function() {
		return this.each( function() {
			$( this ).data( 'usof.buttonPreview', new ButtonPreview( this ) );
		} );
	};

}( jQuery );
