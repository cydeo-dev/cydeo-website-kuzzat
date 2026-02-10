/**
 * USOF Field: Color
 */
! function( $, _undefined ) {
	'use strict';

	const _window = window;
	const _document = document;

	const min = Math.min;
	const max = Math.max;
	const round = Math.round;

	_window.$ush = _window.$ush || {};
	_window.$usof = _window.$usof || {};
	_window.usofGlobalData = _window.usofGlobalData || {};

	/**
	 * @type {Number} ASCII code for Enter.
	 */
	const ENTER_KEY_CODE = 13;

	/**
	 * @type {Number} Minimun number of gradient colors.
	 */
	const MIN_NUM_GRADIENT_COLORS = 2;

	/**
	 * @type {RegExp} Regular expression for find space.
	 */
	const REGEXP_SPACE = /\p{Zs}/u;

	/**
	 * @type {RegExp} Regular expression for match Hexadecimal value.
	 */
	const REGEXP_HEX_VALUE = /^\#?([\dA-f]{3,6})\s?$/;

	/**
	 * @type {RegExp} Regular expression for match Hexadecimal with transparency value.
	 */
	const REGEXP_HEX_WITH_TRANSPARENCY_VALUE = /^\#?([\dA-f]{8})\s?$/;

	/**
	 * @type {RegExp} Regular expression for match Hexadecimal 3-digit value.
	 */
	const REGEXP_HEX_3_DIGIT_VALUE = /^\#?([\dA-f])([\dA-f])([\dA-f])$/;

	/**
	 * @type {RegExp} Regular expression for match RGB or RGBa value.
	 */
	const REGEXP_RGB_OR_RGBA_VALUE = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d?(?:\.\d+)?))?\)$/;

	/**
	 * @type {[]} Predefined values.
	 */
	const PREDEFINED_VALUES = [ 'inherit', 'transparent', 'currentColor' ];

	/**
	 * @type {{}} List of color names and hexes in key => value format.
	 */
	const colorNames = {
		'aliceblue': '#f0f8ff',
		'antiquewhite': '#faebd7',
		'aqua': '#00ffff',
		'aquamarine': '#7fffd4',
		'azure': '#f0ffff',
		'beige': '#f5f5dc',
		'bisque': '#ffe4c4',
		'black': '#000000',
		'blanchedalmond': '#ffebcd',
		'blue': '#0000ff',
		'blueviolet': '#8a2be2',
		'brown': '#a52a2a',
		'burlywood': '#deb887',
		'cadetblue': '#5f9ea0',
		'chartreuse': '#7fff00',
		'chocolate': '#d2691e',
		'coral': '#ff7f50',
		'cornflowerblue': '#6495ed',
		'cornsilk': '#fff8dc',
		'crimson': '#dc143c',
		'cyan': '#00ffff',
		'darkblue': '#00008b',
		'darkcyan': '#008b8b',
		'darkgoldenrod': '#b8860b',
		'darkgray': '#a9a9a9',
		'darkgreen': '#006400',
		'darkkhaki': '#bdb76b',
		'darkmagenta': '#8b008b',
		'darkolivegreen': '#556b2f',
		'darkorange': '#ff8c00',
		'darkorchid': '#9932cc',
		'darkred': '#8b0000',
		'darksalmon': '#e9967a',
		'darkseagreen': '#8fbc8f',
		'darkslateblue': '#483d8b',
		'darkslategray': '#2f4f4f',
		'darkturquoise': '#00ced1',
		'darkviolet': '#9400d3',
		'deeppink': '#ff1493',
		'deepskyblue': '#00bfff',
		'dimgray': '#696969',
		'dodgerblue': '#1e90ff',
		'firebrick': '#b22222',
		'floralwhite': '#fffaf0',
		'forestgreen': '#228b22',
		'fuchsia': '#ff00ff',
		'gainsboro': '#dcdcdc',
		'ghostwhite': '#f8f8ff',
		'gold': '#ffd700',
		'goldenrod': '#daa520',
		'gray': '#808080',
		'green': '#008000',
		'greenyellow': '#adff2f',
		'honeydew': '#f0fff0',
		'hotpink': '#ff69b4',
		'indianred': '#cd5c5c',
		'indigo': '#4b0082',
		'ivory': '#fffff0',
		'khaki': '#f0e68c',
		'lavender': '#e6e6fa',
		'lavenderblush': '#fff0f5',
		'lawngreen': '#7cfc00',
		'lemonchiffon': '#fffacd',
		'lightblue': '#add8e6',
		'lightcoral': '#f08080',
		'lightcyan': '#e0ffff',
		'lightgoldenrodyellow': '#fafad2',
		'lightgrey': '#d3d3d3',
		'lightgreen': '#90ee90',
		'lightpink': '#ffb6c1',
		'lightsalmon': '#ffa07a',
		'lightseagreen': '#20b2aa',
		'lightskyblue': '#87cefa',
		'lightslategray': '#778899',
		'lightsteelblue': '#b0c4de',
		'lightyellow': '#ffffe0',
		'lime': '#00ff00',
		'limegreen': '#32cd32',
		'linen': '#faf0e6',
		'magenta': '#ff00ff',
		'maroon': '#800000',
		'mediumaquamarine': '#66cdaa',
		'mediumblue': '#0000cd',
		'mediumorchid': '#ba55d3',
		'mediumpurple': '#9370d8',
		'mediumseagreen': '#3cb371',
		'mediumslateblue': '#7b68ee',
		'mediumspringgreen': '#00fa9a',
		'mediumturquoise': '#48d1cc',
		'mediumvioletred': '#c71585',
		'midnightblue': '#191970',
		'mintcream': '#f5fffa',
		'mistyrose': '#ffe4e1',
		'moccasin': '#ffe4b5',
		'navajowhite': '#ffdead',
		'navy': '#000080',
		'oldlace': '#fdf5e6',
		'olive': '#808000',
		'olivedrab': '#6b8e23',
		'orange': '#ffa500',
		'orangered': '#ff4500',
		'orchid': '#da70d6',
		'palegoldenrod': '#eee8aa',
		'palegreen': '#98fb98',
		'paleturquoise': '#afeeee',
		'palevioletred': '#d87093',
		'papayawhip': '#ffefd5',
		'peachpuff': '#ffdab9',
		'peru': '#cd853f',
		'pink': '#ffc0cb',
		'plum': '#dda0dd',
		'powderblue': '#b0e0e6',
		'purple': '#800080',
		'rebeccapurple': '#663399',
		'red': '#ff0000',
		'rosybrown': '#bc8f8f',
		'royalblue': '#4169e1',
		'saddlebrown': '#8b4513',
		'salmon': '#fa8072',
		'sandybrown': '#f4a460',
		'seagreen': '#2e8b57',
		'seashell': '#fff5ee',
		'sienna': '#a0522d',
		'silver': '#c0c0c0',
		'skyblue': '#87ceeb',
		'slateblue': '#6a5acd',
		'slategray': '#708090',
		'snow': '#fffafa',
		'springgreen': '#00ff7f',
		'steelblue': '#4682b4',
		'tan': '#d2b48c',
		'teal': '#008080',
		'thistle': '#d8bfd8',
		'tomato': '#ff6347',
		'turquoise': '#40e0d0',
		'violet': '#ee82ee',
		'wheat': '#f5deb3',
		'white': '#ffffff',
		'whitesmoke': '#f5f5f5',
		'yellow': '#ffff00',
		'yellowgreen': '#9acd32',
	};

	/**
	 * Helper Library.
	 */
	const Helper = {

		/**
		 * Determines whether the specified value is value valid.
		 *
		 * @param {String} value The value.
		 * @return {Boolean} True if the specified value is value valid, false otherwise.
		 */
		valueIsValid: function( value ) {
			return (
				value === ''
				|| PREDEFINED_VALUES.includes( value )
				|| Helper.isVariable( value )
				|| Helper.isGradient( value )
				|| Helper.colorNameToHex( value )
				|| REGEXP_RGB_OR_RGBA_VALUE.test( value )
				|| REGEXP_HEX_VALUE.test( value )
				|| REGEXP_HEX_WITH_TRANSPARENCY_VALUE.test( value )
			);
		},

		/**
		 * Determines whether the specified value is gradient.
		 *
		 * @param {String} value The value.
		 * @return {Boolean} True if the specified value is gradient, false otherwise.
		 */
		isGradient: function( value ) {
			if ( Helper.isVariable( value ) ) {
				value = Helper.getVarValue( value );
			}
			return value && /^linear-gradient\(.+\)$/.test( $ush.toString( value ) );
		},

		/**
		 * Determines whether the specified value is dynamic or css variable.
		 *
		 * @param {String} value The value.
		 * @return {Boolean} True if the specified value is variable, false otherwise.
		 */
		isVariable: function( value ) {
			return Helper.isCssVariable( value ) || Helper.isDynamicVariable( value );
		},

		/**
		 * Determines whether the specified value is css variable.
		 *
		 * @param {String} value The value (example: "_css_variable").
		 * @return {Boolean} True if the specified value is css variable, false otherwise.
		 */
		isCssVariable: function( value ) {
			return value && /^_([\dA-z\-_]+)$/.test( $ush.toString( value ) );
		},

		/**
		 * Determines whether the specified value is dynamic variable.
		 *
		 * @param {String} value The value (example: "{{dynamic_variable}}").
		 * @return {Boolean} True if the specified value is dynamic variable, false otherwise.
		 */
		isDynamicVariable: function( value ) {
			return value && /^{{([\dA-z\/\|\-_]+)}}$/.test( $ush.toString( value ) );
		},

		/**
		 * Get Hexadecimal color by name.
		 *
		 * @param {String} colorName The color name.
		 * @return {String|null} Returns hexadecimal color on success, otherwise null.
		 */
		colorNameToHex: function( value ) {
			value = $ush.toString( value );
			if ( value ) {
				return colorNames[ value.toLowerCase() ] || null;
			}
			return null;
		},

		/**
		 * Normalize Hexadecimal color.
		 *
		 * @param {String} hex The hexadecimal color.
		 * @return {String} Returns the correct hexadecimal color.
		 */
		normalizeHex: function( hex ) {
			hex = $ush.toString( hex ).replace( '#', '' );

			if ( hex.length === 3 ) {
				hex = hex.replace( REGEXP_HEX_3_DIGIT_VALUE, '$1$1$2$2$3$3' );

			} else if ( hex.length <= 6 ) {
				const newHex = hex.split( '' );
				while ( newHex.length < 6 ) {
					newHex.unshift( '0' );
				}
				hex = newHex.join( '' );

			} else if ( hex.length > 8 ) {
				hex = hex.slice( 0, 8 );
			}

			return '#' + hex;
		},

		/**
		 * Convert Hexadecimal color to HSBA object.
		 *
		 * @param {String} hex The hexadecimal color.
		 * @return {{}} Returns an HSBA object.
		 */
		hexToHSBA: function( hex ) {
			return Helper.RGBAToHSBA( Helper.hexToRGBA( Helper.normalizeHex( hex ) ) );
		},

		/**
		 * Convert Hexadecimal to RGBA object.
		 *
		 * @param {String} hex The hexadecimal color.
		 * @return {{}} Returns an RGBA object.
		 */
		hexToRGBA: function( hex ) {
			if ( hex.substr( 0, 5 ) == 'rgba(' ) {
				const parts = hex.substring( 5, hex.length - 1 ).split( ',' ).map( $ush.parseFloat );
				if ( parts.length == 4 ) {
					return {
						r: parts[0],
						g: parts[1],
						b: parts[2],
						a: parts[3]
					};
				}
			}
			if ( hex.length == 3 ) {
				hex = hex.replace( REGEXP_HEX_3_DIGIT_VALUE, '$1$1$2$2$3$3' );
			}
			hex = parseInt( ( hex.includes( '#' ) ? hex.substring(1) : hex ), 16 );
			return {
				r: hex >> 16,
				g: ( hex & 0x00FF00 ) >> 8,
				b: ( hex & 0x0000FF ),
				a: 1.
			};
		},

		/**
		 * Convert Hexadecimal color to Hexadecimal with transparency.
		 *
		 * @param {String} hex The hexadecimal color.
		 * @param {Number} alpha The alpha parameter is a number between 0 (fully transparent) and 100 (not transparent at all).
		 * @return {String} Returns Hexadecimal with transparency.
		 */
		hexToHexA: function( hex, alpha ) {
			hex = Helper.normalizeHex( Helper.colorNameToHex( hex ) || hex );
			alpha = $ush.limitValueByRange( alpha, 0, 100 );
			return hex + `0${ round( 255 * ( alpha / 100 ) ).toString( 16 ) }`.slice( -2 ).toUpperCase();
		},

		/**
		 * Convert Hexadecimal with transparency to RGBA object.
		 *
		 * @param {String} hex The Hexadecimal with transparency.
		 * @return {String} Returns a new RGBA object.
		 */
		hexAToRGBA: function( hexa ) {
			if ( ! REGEXP_HEX_WITH_TRANSPARENCY_VALUE.test( hexa ) ) {
				return Helper.RGBAToValue( Helper.RGBADefault() );
			}

			var r = 0, g = 0, b = 0, a = 1;
			if ( hexa.length == 5 ) {
				r = '0x' + hexa[1] + hexa[1];
				g = '0x' + hexa[2] + hexa[2];
				b = '0x' + hexa[3] + hexa[3];
				a = '0x' + hexa[4] + hexa[4];

			} else if ( hexa.length == 9 ) {
				r = '0x' + hexa[1] + hexa[2];
				g = '0x' + hexa[3] + hexa[4];
				b = '0x' + hexa[5] + hexa[6];
				a = '0x' + hexa[7] + hexa[8];
			}

			return {
				r: +r,
				g: +g,
				b: +b,
				a: +Helper.round2digits( a / 255 ),
			}
		},

		/**
		 * Convert Hexadecimal with transparency to RGBA string.
		 *
		 * @param {String} hex The Hexadecimal with transparency.
		 * @return {String} Returns a new RGBA string.
		 */
		hexAToRGBAValue: function( hexa ) {
			return Helper.RGBAToValue( Helper.hexAToRGBA( hexa ) );
		},

		/**
		 * @return {{}} Returns a new RGBA object.
		 */
		RGBADefault: function() {
			return {
				r: 0,
				g: 0,
				b: 0,
				a: 1,
			};
		},

		/**
		 * Convert RGBA object to Hexadecimal color.
		 *
		 * @param {{}} rgba The RGBA object.
		 * @return {String} Returns hexadecimal color.
		 */
		RGBAToHex: function( rgba ) {
			if ( ! $.isPlainObject( rgba ) ) {
				rgba = {};
			}
			const values = Object.values( rgba )
				.slice( 0, 3 )
				.map( ( value ) => { return value <= 255 ? ( '0' + $ush.parseInt( value ).toString( 16 ) ).slice( -2 ) : 'ff' } );
			if ( values.length ) {
				return '#' + values.join( '' );
			}
			return '';
		},

		/**
		 * Convert RGBA object to HSBA object.
		 *
		 * @param {{}} rgba The RGBA object.
		 * @return {{}} Returns an HSBA object.
		 */
		RGBAToHSBA: function( rgba ) {
			const hsba = {
				h: 0,
				s: 0,
				b: 0
			};
			const _max = max( rgba.r, rgba.g, rgba.b );
			const delta = _max - min( rgba.r, rgba.g, rgba.b );

			hsba.b = _max;
			hsba.s = _max != 0 ? 255 * delta / _max : 0;
			if ( hsba.s != 0 ) {
				if ( rgba.r == _max ) {
					hsba.h = ( rgba.g - rgba.b ) / delta;
				} else if ( rgba.g == _max ) {
					hsba.h = 2 + ( rgba.b - rgba.r ) / delta;
				} else {
					hsba.h = 4 + ( rgba.r - rgba.g ) / delta;
				}
			} else {
				hsba.h = -1;
			}
			hsba.h *= 60;
			if ( hsba.h < 0 ) {
				hsba.h += 360;
			}
			hsba.s *= 100 / 255;
			hsba.b *= 100 / 255;
			hsba.a = rgba.a;

			return hsba;
		},

		/**
		 * Convert RGB or RGBA object to string.
		 *
		 * @param {{}} rgba The RGB or RGBA object.
		 * @return {String} Returns RGB or RGBA as a string.
		 */
		RGBAToValue: function( rgba ) {
			if ( ! $.isPlainObject( rgba ) ) {
				rgba = Helper.RGBADefault();
			}
			var values = Object.values( rgba ).map( $ush.parseFloat );
			if ( values.length ) {
				values = values.slice( 0, 4 );
			}
			if ( values[3] === 1 ) {
				values = values.filter( ( _, i ) => i !== 3 );
			}
			if ( ! $ush.isUndefined( values[3] ) ) {
				values[3] = Helper.round2digits( values[3], 2 );
			}
			if ( values.length === 4 ) {
				return `rgba(${values.join()})`;
			}
			return `rgb(${values.join()})`;
		},

		/**
		 * @return {{}} Returns a new HSBA object.
		 */
		HSBADefault: function() {
			return {
				h: 360,
				s: 0,
				b: 0,
				a: 1,
			};
		},

		/**
		 * Convert HSBA object to RGBA object.
		 *
		 * @param {{}} hsba The HSBA object.
		 * @return {{}} Returns an RGBA object.
		 */
		HSBAToRGBA: function( hsba ) {
			var rgb = {},
				h = hsba.h,
				s = hsba.s * 255 / 100,
				v = hsba.b * 255 / 100;

			if ( s === 0 ) {
				rgb.r = rgb.g = rgb.b = v;
			} else {
				var t1 = v,
					t2 = ( 255 - s ) * v / 255,
					t3 = ( t1 - t2 ) * ( h % 60 ) / 60;
				if ( h === 360 ) {
					h = 0;
				}
				if ( h < 60 ) {
					rgb.r = t1;
					rgb.b = t2;
					rgb.g = t2 + t3
				} else if ( h < 120 ) {
					rgb.g = t1;
					rgb.b = t2;
					rgb.r = t1 - t3
				} else if ( h < 180 ) {
					rgb.g = t1;
					rgb.r = t2;
					rgb.b = t2 + t3
				} else if ( h < 240 ) {
					rgb.b = t1;
					rgb.r = t2;
					rgb.g = t1 - t3
				} else if ( h < 300 ) {
					rgb.b = t1;
					rgb.g = t2;
					rgb.r = t2 + t3
				} else if ( h < 360 ) {
					rgb.r = t1;
					rgb.g = t2;
					rgb.b = t1 - t3
				} else {
					rgb.r = 0;
					rgb.g = 0;
					rgb.b = 0
				}
			}
			return {
				r: round( rgb.r ),
				g: round( rgb.g ),
				b: round( rgb.b ),
				a: hsba.a
			};
		},

		/**
		 * Convert HSBA object to Hexadecimal.
		 *
		 * @param {{}} hsba The HSBA object.
		 * @return {String} Returns hexadecimal color.
		 */
		HSBAToHex: function( hsba ) {
			return Helper.RGBAToHex( Helper.HSBAToRGBA( hsba ) );
		},

		/**
		 * Convert HSBA object to value.
		 *
		 * @param {{}} hsba The HSBA object.
		 * @return {String}
		 */
		HSBAToValue: function( hsba ) {
			const rgba = Helper.HSBAToRGBA( hsba );
			if ( rgba.a < 1 ) {
				return Helper.RGBAToValue( rgba );
			}
			return Helper.RGBAToHex( rgba );
		},

		/**
		 * Convert value to HSBA object.
		 *
		 * @param {String|{}} value
		 * @return {{}} Returns an HSBA object.
		 */
		valueToHSBA: function( value ) {
			if ( typeof value === 'string' ) {
				if ( Helper.isVariable( value ) ) {
					value = Helper.getVarValue( value );
				}
				if ( Helper.isGradient( value ) ) {
					value = Helper.gradientParse( value ).firstColorValue;
				}
				value = Helper.colorNameToHex( value ) || value;
				if ( REGEXP_RGB_OR_RGBA_VALUE.test( value ) ) {
					const m = value.match( REGEXP_RGB_OR_RGBA_VALUE );
					value = Helper.RGBAToHSBA( {
						r: m[1],
						g: m[2],
						b: m[3],
						a: m[4],
					} );
				} else {
					value = Helper.hexToHSBA( value );
				}
			} else {
				value = Helper.HSBADefault();
			}
			return value;
		},

		/**
		 * Round to 2 digits.
		 *
		 * @param {Number} value
		 * @return {Number}
		 */
		round2digits: function( value ) {
			return round( ( value + Number.EPSILON ) * 100 ) / 100;
		},

		/**
		 * Check if white text is needed.
		 *
		 * @param {String} background
		 * @return {Boolean} Returns true if the text is white, otherwise false.
		 */
		isWhiteText: function( background ) {
			const self = this;
			const white = Helper.colorNameToHex( 'white' );

			background = $ush.toString( background ).trim( REGEXP_SPACE );

			// If there is no value or this is a reserved value, then don't install white
			if ( ! background || PREDEFINED_VALUES.includes( background ) ) {
				return false;
			}

			// Set color for dynamic variables
			if ( Helper.isVariable( background ) ) {
				background = Helper.getVarValue( background );
				if ( Helper.isDynamicVariable( background ) ) {
					background = white;
				}
			}

			// If Hex is 3-digit, convert to 6-digit
			if ( background.charAt(0) == '#' && background.length === 4 ) {
				background = background.replace( REGEXP_HEX_3_DIGIT_VALUE, '#$1$1$2$2$3$3' );
			}

			// Get the first color from the gradient
			else if ( Helper.isGradient( background ) ) {
				background = Helper.gradientParse( background ).firstColorValue;
			}

			// Get Hex for a named color
			if ( /^([A-z]+)$/.test( background ) ) {
				background = Helper.colorNameToHex( background ) || white;
			}

			// Convert Hex to RGBA object
			const rgba = $.extend( Helper.RGBADefault(), Helper.hexToRGBA( background ) );

			// Determine lightness
			var light = rgba.r * 0.213 + rgba.g * 0.715 + rgba.b * 0.072;

			// Increase lightness regarding color opacity
			if ( rgba.a < 1 ) {
				light = light + ( 1 - rgba.a ) * ( 1 - light / 255 ) * 235;
			}

			return light < 178;
		},

		/**
		 * Parse the gradient value and extracts all values.
		 *
		 * @param {String} value The value.
		 * @return {{}} Returns all gradient values.
		 */
		gradientParse: function( value ) {
			const result = {
				angle: 180,
				colorsData: [],
				firstValue: '', // any value
				firstColorValue: '', // only color value
			};

			value = $ush.toString( value ).trim( REGEXP_SPACE );

			if ( ! Helper.isGradient( value ) ) {
				return result;
			}
			if ( Helper.isVariable( value ) ) {
				value = Helper.getVarValue( value );
			}

			const colorVars = getColorVars();

			var strValues = $ush.toString( ( value.match( /^linear-gradient\((.*)\)$/ ) || [] )[1] ),
				iteration = 0;

			while ( strValues && iteration++ < /* max iterations */15 ) {
				var part = $ush.toString( ( strValues.match( /^(rgba?\([\d\,\.]+\)(\s[^\,]+)?|([^\,]+)),?/ ) || [] )[0] ).trim( REGEXP_SPACE );
				strValues = strValues.replace( part, '' ).trim( REGEXP_SPACE );

				if ( part.slice( -1 ) === ',' ) {
					part = part.slice( 0, -1 );
				}

				if ( iteration === 1 && ! Helper.valueIsValid( part ) ) {
					result.angle = $ush.limitValueByRange( $ush.parseInt( part ), 0, 360 );
				} else {
					part = part.split( REGEXP_SPACE );
					var itemValue = $ush.toString( part[0] );
					if ( ! Helper.valueIsValid( itemValue ) ) {
						continue;
					}
					// Convert Hexadecimal with transparency to RGBA string
					if ( REGEXP_HEX_WITH_TRANSPARENCY_VALUE.test( itemValue ) ) {
						itemValue = Helper.hexAToRGBAValue( itemValue );
					}
					var colorValue = itemValue;
					if ( Helper.isVariable( itemValue ) ) {
						// Excludes recursion in variables
						if ( value === colorVars[ itemValue ] ) {
							colorValue = 'transparent';
						} else {
							colorValue = Helper.valueToPreview( itemValue );
						}
					}
					if ( ! result.firstValue ) {
						result.firstValue = itemValue;
						result.firstColorValue = colorValue;
					}
					const colorData = {
						value: itemValue,
						position: _undefined,
						hsba: Helper.valueToHSBA( colorValue ),
					};
					if ( ! $ush.isUndefined( part[1] ) ) {
						colorData.position = $ush.parseInt( part[1] );
					}
					result.colorsData.push( colorData );
				}
			}

			// Recount positions
			var numColors = result.colorsData.length;
			if ( numColors > 1 ) {
				numColors -= 1;
			}
			result.colorsData.map( ( colorData, i ) => {
				if ( $ush.isUndefined( colorData.position ) ) {
					colorData.position = round( ( 100 / numColors ) * i );
				}
			} );

			return result;
		},

		/**
		 * Get the variable value.
		 *
		 * @param {String} varName
		 * @return {String} Returns the value of the variable if it exists, otherwise only the variable name.
		 */
		getVarValue: function( varName ) {
			for ( var i = 10; i > 0; i-- ) {
				if ( ! Helper.isVariable( varName ) ) {
					break;
				}
				varName = getColorVars()[ varName ] || '';
			}
			return varName;
		},

		/**
		 * Get the value to preview.
		 *
		 * @param {String} value The value.
		 * @return {String} Returns value for preview.
		 */
		valueToPreview: function( value ) {
			if ( Helper.isVariable( value ) ) {
				value = Helper.getVarValue( value );
			}
			if ( PREDEFINED_VALUES.includes( value ) ) {
				return 'transparent';
			}
			if ( Helper.isGradient( value ) ) {
				const gradient = Helper.gradientParse( value );
				const items = [];

				gradient.colorsData.map( ( colorData ) => {
					var colorValue = colorData.value || 'transparent';
					if ( Helper.isVariable( colorValue ) ) {
						if ( Helper.isGradient( colorValue ) ) {
							colorValue = Helper.gradientParse( colorValue ).firstColorValue;
						} else {
							colorValue = Helper.getVarValue( colorValue );
						}
					}
					items.push( `${colorValue} ${colorData.position}%` );
				} );
				return `linear-gradient(${gradient.angle}deg, ${items.join()})`;
			}
			return value;
		},
	};

	/**
	 * Get color list.
	 *
	 * @return {{}} Returns color list.
	 */
	function getColorList() {
		return $ush.toPlainObject( _window.usofGlobalData['colorList'] );
	}

	/**
	 * Get list of variables.
	 *
	 * @return {{}} Returns list of set variables.
	 */
	function getColorVars() {
		return $ush.toPlainObject( _window.usofGlobalData['colorVars'] );
	}

	// Field
	$usof.field[ 'color' ] = {
		/**
		 * Initializes the color field.
		 */
		init: function() {
			const self = this;

			// Elements
			self.$preview = $( '.usof-color-preview:first', self.$row );
			self.$container = $( '.usof-color', self.$row );

			// Private "Variables"
			self.withGradient = self.$container.hasClass( 'with_gradient' );
			self.withColorList = self.$container.hasClass( 'with_color_list' );

			// Bondable events
			self._events = {
				initEditor: self.initEditor.bind( self ),
			};

			// Events
			self.$row.one( 'mousedown', '.usof-color', self._events.initEditor );

			// Set current value
			const value = self.getValue();
			if ( value ) {
				self.setValue( value, /*quiet*/true );
			}
		},

		/**
		 * Initializes the color editor.
		 *
		 * @event handler
		 */
		initEditor: function() {
			const self = this;

			// Extend API
			$.extend( self, editorAPI );

			// Bondable events
			$.extend( self._events, {
				setSelectedMode: self.setSelectedMode.bind( self ),

				enterValue: self.enterValue.bind( self ),
				selectValueOnFirstClick: self.selectValueOnFirstClick.bind( self ),
				removeFirstClickCompleted: self.removeFirstClickCompleted.bind( self ),

				stopFormSubmission: self.stopFormSubmission.bind( self ),

				toggleList: self.toggleList.bind( self ),
				hideList: self.hideList.bind( self ),
				colorSelected: self.colorSelected.bind( self ),

				showEditor: self.showEditor.bind( self ),
				hideEditor: self.hideEditor.bind( self ),
				showPicker: self.showPicker.bind( self ),
				hidePicker: self.hidePicker.bind( self ),

				downColor: self.downColor.bind( self ),
				moveColor: self.moveColor.bind( self ),
				upColor: self.upColor.bind( self ),
				downHue: self.downHue.bind( self ),
				moveHue: self.moveHue.bind( self ),
				upHue: self.upHue.bind( self ),
				downAlpha: self.downAlpha.bind( self ),
				moveAlpha: self.moveAlpha.bind( self ),
				upAlpha: self.upAlpha.bind( self ),

				setColorIndex: self.setColorIndex.bind( self ),
				changeAngle: self.changeAngle.bind( self ),
				changeColorPosition: self.changeColorPosition.bind( self ),

				addGradientColor: self.addGradientColor.bind( self ),
				deleteGradientColor: self.deleteGradientColor.bind( self ),

				clearAll: self.clearAll.bind( self ),
			} );

			// Elements
			self.$typeButtons = $( '.usof-radio', self.$row );
			self.$colorList = $( '.usof-color-list', self.$row );
			self.$editPanel = $( '.usof-color-edit-panel', self.$row );

			if ( self.withGradient ) {
				self.$angleValue = $( '.usof-gradient-angle-value', self.$row );
				self.$angleRange = $( '.usof-gradient-angle-range', self.$row );
				self.$gradientColors = $( '.usof-gradient-colors', self.$row );
				self.$addGradientColor = $( '.action_add-gradient-color', self.$row );
				self.$template = $( '.usof-gradient-color', self.$row ).clone();
				$( '.usof-gradient-color', self.$row ).remove();
			} else {
				$( '.for_gradient', self.$row ).remove();
			}

			// Private "Variables"
			self.angleDefault = 90;
			self.pickerHeight = 160;
			self.maxNumGradientColors = 8;

			// Get current value
			const value = self.getValue();
			const valueIsGradient = Helper.isGradient( value );

			// Set current mode
			self.setMode( ( valueIsGradient && self.withGradient ) ? 'gradient' : 'solid' );

			// Main color
			self.mainColor = {
				value: '',
				hsba: Helper.HSBADefault(),
				$picker: $( '.for_solid .usof-color-picker', self.$editPanel ),
				$preview: self.$preview,
			};
			if (
				! valueIsGradient
				|| Helper.isVariable( value )
				|| ( valueIsGradient && ! self.withGradient )
			) {
				$.extend( self.mainColor, {
					hsba: Helper.valueToHSBA( value ),
					value: value,
				} );
				self.setPicker( self.mainColor );
			}

			// Gradient colors
			self.gradientColors = [];
			self.colorIndex = 0; // in gradient
			self.angle = self.angleDefault;

			// Offset for controls
			self.offsetControl = {
				top: 0,
				left: 0,
			};

			// Set gradient
			if ( self.withGradient ) {
				var colorsData = [];
				if ( valueIsGradient ) {
					const gradient = Helper.gradientParse( value );
					colorsData = gradient.colorsData;
					self.angle = gradient.angle;
				}
				self.setGradient( colorsData );
				self.setAngle();
			}

			// Events
			self.$document
				.on( 'keypress', self._events.stopFormSubmission );
			self.$container
				.off( 'mousedown touchstart', '.usof-color-picker *' );
			self.$container
				.on( 'click', '.action_clear', self._events.clearAll )
				.on( 'focus', '.usof-color-value', self._events.selectValueOnFirstClick )
				.on( 'blur', '.usof-color-value', self._events.removeFirstClickCompleted )
				.on( 'change', 'input[name="usof-color-editor-mode"]', self._events.setSelectedMode )
				.on( 'click', '.usof-color-value:first', self._events.showEditor )
				.on( 'change', '.usof-color-value', self._events.enterValue )
				.on( 'click', '.for_gradient .usof-color-value', self._events.showPicker )
				.on( 'mousedown', '.action_add-gradient-color', self._events.addGradientColor )
				.on( 'click', '.action_delete-gradient-color', self._events.deleteGradientColor )
				.on( 'change input', '.usof-gradient-color-position', self._events.changeColorPosition )
				.on( 'input', '.usof-gradient-angle-range', self._events.changeAngle )
				.on( 'mousedown', '.usof-gradient-color', self._events.setColorIndex )
				.on( 'mousedown touchstart', '.usof-color-picker-color', self._events.downColor )
				.on( 'mousedown touchstart', '.usof-color-picker-hue', self._events.downHue )
				.on( 'mousedown touchstart', '.usof-color-picker-alpha', self._events.downAlpha );

			if ( self.withColorList ) {
				self.$container
					.on( 'click', '.action_toggle-list', self._events.toggleList )
					.on( 'mousedown', '[data-name]', self._events.colorSelected );
			}

			self.$container.addClass( 'inited' );
		},

		/**
		 * Set the value.
		 *
		 * @param {*} value The value.
		 * @param {Boolean} quiet The quiet.
		 */
		setValue: function( value, quiet ) {
			const self = this;

			value = $ush.toString( value ).trim( REGEXP_SPACE );
			self.$input.val( value );

			var background = Helper.valueToPreview( value );
			if (
				! Helper.isVariable( background )
				&& Helper.isGradient( background )
				&& ! self.withGradient
			) {
				background = Helper.gradientParse( background ).firstColorValue;
			}
			if (
				Helper.isDynamicVariable( background )
				|| Helper.isDynamicVariable( value )
			) {
				background = 'white';
			}
			self.$preview
				.css( 'background', background )
				.toggleClass( 'white_text', Helper.isWhiteText( background ) );

			if ( ! $ush.isUndefined( self.setupEditorByValue ) ) {
				self.setupEditorByValue( value );
			}

			if ( ! quiet ) {
				self.trigger( 'change', [ value ] );
			}
		},

		/**
		 * Get the value.
		 *
		 * @return {string} Returns value.
		 */
		getValue: function() {
			const value = $ush.toString( this.$input.val() ).trim();
			if ( Helper.valueIsValid( value ) ) {
				return value;
			}
			return '';
		},

		/**
		 * Get the color value.
		 *
		 * @return {String} Returns the current color in Hexadecimal, RGB, RGBA or Gradient.
		 */
		getColorValue: function() {
			var value = this.getValue();
			if ( Helper.isGradient( value ) ) {
				value = Helper.valueToPreview( value );
			}
			if ( Helper.isVariable( value ) ) {
				value = Helper.getVarValue( value );
			}
			return value;
		},

	};

	/**
	 * @type {Node}
	 */
	const $colorListFragment = $( new DocumentFragment );

	/**
	 * @type {{}} Editor API
	 */
	const editorAPI = {

		/**
		 * Select value on first click.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		selectValueOnFirstClick: function( e ) {
			const input = e.currentTarget;
			const $input = $( input );
			if ( ! $input.hasClass( 'first_click_completed' ) ) {
				$input.addClass( 'first_click_completed' )[0].focus();
				input.selectionStart = input.value.length;
				input.select();
			}
		},

		/**
		 * Remove first click completed.
		 *
		 * @event handler
		 */
		removeFirstClickCompleted: function() {
			$( '.first_click_completed', this.$row ).removeClass( 'first_click_completed' );
		},

		/**
		 * Set the editor mode.
		 *
		 * @param {String} mode
		 */
		setMode: function( mode ) {
			const self = this;
			self.mode = $ush.toString( mode ) || 'solid';

			$( `input[value='${self.mode}']`, self.$editPanel )
				.prop( 'checked', true );

			self.$container
				.toggleClass( 'type_solid', self.mode === 'solid' )
				.toggleClass( 'type_gradient', self.mode === 'gradient' );
		},

		/**
		 * Set the selected mode.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		setSelectedMode: function( e ) {
			e.preventDefault();

			const self = this;

			self.colorIndex = 0;
			self.setMode( e.target.value );

			const value = ( self.mode === 'solid' )
				? self.gradientColors[ self.colorIndex ].value
				: self.mainColor.value || 'transparent';

			self.setupColorData( value );
			self.setPicker( self.currentColorData() );
			self.dataChanged();
		},

		/**
		 * Set position of edit elements.
		 *
		 * @param {Node} $node
		 */
		setElementPosition: function( $node ) {
			const self = this;
			const nodeRect = $ush.$rect( self.$input[0] );
			const bottomPosition = nodeRect.top + nodeRect.height + ( $node.outerHeight() / 2 );

			var isBeforeField = bottomPosition > _window.innerHeight;

			// Fix in WPBakery window context
			if ( self.isWPBakeryParamValue() ) {
				const contextRect = $ush.$rect( $node.closest( '.vc_ui-panel-content-container' )[0] );
				isBeforeField = bottomPosition > ( contextRect.top + contextRect.height )
			}

			self.$container.toggleClass( 'before_field', isBeforeField );
		},

		/**
		 * Show or hide colors list.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		toggleList: function( e ) {
			const self = this;

			e.preventDefault();

			const $colorField = $( e.currentTarget ).closest( '.usof-color-field' );
			const $colorList = $( '> .usof-color-list', $colorField );

			if ( $colorField.hasClass( 'show_list' ) ) {
				self.hideList();
				return;
			}

			const mainColorList = self.$colorList.is( $colorList );

			var value = self.currentColorData().value;
			if ( mainColorList ) {
				value = self.mainColor.value;
				self.hideEditor();
			}

			// Generate list items
			if ( $colorListFragment[0].childElementCount === 0 ) {
				const colorList = getColorList();
				const insertItem = ( $parent, data ) => {
					data = $.extend(
						{
							type: '',
							name: '',
							value: '',
							title: '',
						},
						data
					);
					const $item = $( '<div></div>', {
						'class': 'usof-color-list-item',
						'value': data.value,
						'data-name': data.name,
					} );
					if ( data.type === 'cf_colors' ) {
						$item.append( `<span class="usof-color-list-item-title">${data.title}</span>` );
					} else {
						const background = Helper.valueToPreview( data.value );
						$( `
							<div class="usof-color-list-item-value">
								<span style="background:${background}" title="${data.value} – ${data.title}"></span>
							</div>
						` )
						.toggleClass( 'white_text', Helper.isWhiteText( background ) )
						.appendTo( $item );
					}
					$parent.append( $item ).addClass( data.type );
				};

				for( const group in colorList ) {
					const items = colorList[ group ];
					if ( Array.isArray( items ) && items.length ) {
						var $group = $( `> [data-group="${group}"]`, $colorListFragment );
						if ( ! $group.length ) {
							$group = $( `<div class="usof-color-list-group" data-group="${group}"></div>` );
						}
						for ( const k in items ) {
							insertItem( $group, items[ k ] );
							$colorListFragment.append( $group );
						}
					} else {
						insertItem( $colorListFragment, items );
					}
				}
			}

			$colorField
				.removeClass( 'show_picker' )
				.addClass( 'show_list' );
			$colorList
				.append( $colorListFragment.clone() )
				.scrollTop(0);

			if ( mainColorList ) {
				self.setElementPosition( $colorList );
			}

			$( '.selected', $colorList ).removeClass( 'selected' );
			if ( Helper.isVariable( value ) ) {
				$( `[data-name="${value}"]`, $colorList ).addClass( 'selected' );
			}

			self.$document.on( 'mousedown', self._events.hideList );
		},

		/**
		 * Hide colors list.
		 *
		 * @event handler
		 * @param {Event} e [optional] The Event interface represents an event which takes place in the DOM.
		 */
		hideList: function( e ) {
			const self = this;
			const $colorField = $( '.usof-color-field.show_list', self.$container );
			if ( e && $colorField.has( e.target ).length ) {
				return;
			}
			$colorField
				.removeClass( 'show_list' );
			// Note: Timeout is necessary for "hideEditor" to work correctly.
			$ush.timeout( () => {
				$( '.usof-color-list', $colorField ).html( '' );
			}, 1 );
			self.$document.off( 'mousedown', self._events.hideList );
		},

		/**
		 * Select color value.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		colorSelected: function( e ) {
			const self = this;
			const $target = $( e.currentTarget );

			if ( $target.hasClass( 'selected' ) ) {
				return;
			}

			if ( self.$colorList.is( $target.closest( '.usof-color-list' ) ) ) {
				self.setMode( 'solid' );
			}

			var value = $ush.toString( $target.data( 'name' ) ),
				gradient;

			if ( Helper.isGradient( value ) ) {
				gradient = Helper.gradientParse( value );
			}

			// For main color
			if (
				gradient
				&& self.withGradient
				&& self.mode === 'solid'
			) {
				self.mainColor.value = value;

				self.setMode( 'gradient' );
				self.setAngle( gradient.angle );
				self.setGradient( gradient.colorsData );

				// For gradient color
			} else {
				if ( gradient && ! Helper.isVariable( value ) ) {
					value = gradient.firstValue;
				}
				self.setupColorData( value );
				self.setPicker( self.currentColorData() );
				value = '';
			}

			self.hideList();
			self.dataChanged( /* gradient */value );
		},

		/**
		 * Show edit panel.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		showEditor: function() {
			const self = this;
			if ( self.$container.hasClass( 'show_editor' ) ) {
				return;
			}
			self.hideList();
			if ( self.withGradient ) {
				// The buttons are in the global area outside the form,
				// so they need to be enabled every time.
				$( `input[value='${self.mode}']`, self.$editPanel ).prop( 'checked', true );
			}
			self.setElementPosition( self.$editPanel );
			self.$container.addClass( 'show_editor' );
			self.$document.on( 'mousedown', self._events.hideEditor );
		},

		/**
		 * Hide edit panel.
		 *
		 * @event handler
		 * @param {Event} e [optional] The Event interface represents an event which takes place in the DOM.
		 */
		hideEditor: function( e ) {
			const self = this;
			if ( e && self.$container.has( e.target ).length ) {
				return;
			}
			self.$container.removeClass( 'show_editor' );
			self.$document.off( 'mousedown', self._events.hideEditor );
		},

		/**
		 * Stop form submission.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		stopFormSubmission: function( e ) {
			if ( e.which !== ENTER_KEY_CODE ) {
				return;
			}
			const self = this;
			const $target = $( e.target );
			if ( $target.hasClass( 'usof-color-value' ) ) {
				e.preventDefault();
				if ( self.$input.is( $target ) ) {
					self.hideEditor();
				}
				$target.trigger( 'change' );
			}
		},

		/**
		 * Get current color data.
		 *
		 * @return {{}} Returns a reference to the current color data
		 */
		currentColorData: function() {
			const self = this;
			if ( self.mode === 'solid' ) {
				return self.mainColor;
			}
			return self.gradientColors[ self.colorIndex ];
		},

		/**
		 * @param {{}} colorData
		 */
		setPreview: function( colorData ) {
			const self = this;
			const value = $ush.toString( colorData.value );

			var background = value;
			if ( Helper.isVariable( background ) ) {
				if ( Helper.isDynamicVariable( background ) ) {
					background = 'white';
				} else {
					background = Helper.valueToPreview( background );
					if (
						Helper.isGradient( background )
						&& (
							! self.withGradient
							|| ! $ush.isUndefined( colorData.position ) // in gradient context
						)
					) {
						background = Helper.gradientParse( background ).firstColorValue;
					}
				}
			}
			if ( PREDEFINED_VALUES.includes( background ) ) {
				background = 'transparent';
			}

			colorData.$preview
				.css( 'background', background )
				.toggleClass( 'white_text', Helper.isWhiteText( background ) )
				.find( '.usof-color-value' )
				.val( value );
		},

		/**
		 * Manual value input.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		enterValue: function( e ) {
			const self = this;
			const value = e.target.value;
			self.setupEditorByValue( value, ! self.$input.is( e.target ) );
			self.dataChanged( Helper.isVariable( value ) ? value : _undefined );
		},

		/**
		 * Setup editor by value.
		 *
		 * Supported values:
		 * _css_variable
		 * 	{{dynamic_variable}}
		 * 	inherit
		 * 	transparent
		 * 	currentColor
		 * 	black (color name)
		 * 	#000 (3-digit)
		 * 	#000000 (6-digit)
		 * 	#0000008f (8-digit)
		 * 	rgb(0,0,0)
		 * 	rgba(0,0,0,0.5)
		 * 	linear-gradient(90deg, black 0, transparent 100%)
		 * 	linear-gradient(90deg, {{Supported values}} 0, ..., transparent 100%)
		 *
		 * @param {String} value The value.
		 * @param {Boolean} maybeGradient The maybe gradient.
		 */
		setupEditorByValue: function( value, maybeGradient ) {
			const self = this;

			value = $ush.toString( value ).trim( REGEXP_SPACE );

			if ( ! Helper.valueIsValid( value ) ) {
				value = '';
			}

			var gradient;
			if ( Helper.isGradient( value ) ) {
				gradient = Helper.gradientParse( value );
			}

			// Gradient value cannot be empty
			if ( self.withGradient && maybeGradient && value === '' ) {
				value = 'transparent';
			}

			if (
				gradient
				&& ! Helper.isVariable( value )
				&& ( ! self.withGradient || maybeGradient )
			) {
				value = gradient.firstValue;
			}

			if (
				value.charAt(0) !== '#'
				&& (
					REGEXP_HEX_VALUE.test( value )
					|| REGEXP_HEX_WITH_TRANSPARENCY_VALUE.test( value )
				)
			) {
				value = '#' + value;
			}

			// Convert Hexadecimal with transparency to RGBA string
			if ( REGEXP_HEX_WITH_TRANSPARENCY_VALUE.test( value ) ) {
				value = Helper.hexAToRGBAValue( value );
			}

			// Get Hexadecimal if it is a reserved color names
			value = Helper.colorNameToHex( value ) || value;

			// Clear all if no value
			if ( ! maybeGradient && value === '' ) {
				self.clearAll();
				return;
			}

			// Set gradient
			if ( self.withGradient && ! maybeGradient ) {
				self.setMode( gradient ? 'gradient' : 'solid' );

				if ( self.mode === 'gradient' ) {
					self.setAngle( gradient.angle );
					self.setGradient( gradient.colorsData );

				} else {
					self.setupColorData( value );
					self.setGradient();
				}

			} else {
				self.setupColorData( value );
			}
		},

		/**
		 * @param {String} value The value.
		 */
		setupColorData: function( value ) {
			const self = this;
			const colorData = self.currentColorData();

			if ( ! Helper.valueIsValid( value ) ) {
				value = '';
			}

			colorData.value = value;
			colorData.hsba = Helper.valueToHSBA( value );

			self.setPreview( colorData );
			self.setPicker( colorData );
		},

		/**
		 * @param {String} priorityValue The priority value.
		 */
		dataChanged: function( priorityValue ) {
			const self = this;

			if ( self.mode === 'solid' ) {
				self.setPreview( self.mainColor );
			}

			// Build gradient
			if ( self.withGradient && self.mode === 'gradient' ) {
				var background = [],
					value = [];

				self.gradientColors.map( ( colorData ) => {
					self.setPreview( colorData );
					const colorValue = colorData.value || 'transparent';
					var colorBackground = colorValue;
					if ( Helper.isVariable( colorBackground ) ) {
						colorBackground = Helper.getVarValue( colorBackground );
					}
					if ( Helper.isGradient( colorBackground ) ) {
						colorBackground = Helper.gradientParse( colorBackground ).firstColorValue;
					}
					background.push( `${colorBackground} ${colorData.position}%` );
					value.push( `${colorValue} ${colorData.position}%` );
				} );

				background = `linear-gradient(${self.angle}deg, ${background.join()})`;
				self.mainColor.value = priorityValue || `linear-gradient(${self.angle}deg, ${value.join()})`;

				self.$preview
					.css( 'background', background )
					.toggleClass( 'white_text', Helper.isWhiteText( background ) )
					.find( '.usof-color-value' )
					.val( self.mainColor.value );
			}

			self.trigger( 'change', self.getValue() );
		},

		/**
		 * Clear all controls.
		 *
		 * @event handler
		 * @param {Event} e [optional] The Event interface represents an event which takes place in the DOM.
		 */
		clearAll: function( e ) {
			if ( e ) {
				e.preventDefault();
			}

			const self = this;

			self.setMode( 'solid' );
			self.hideEditor();
			self.hideList();

			self.mainColor.value = '';
			self.mainColor.hsba = Helper.HSBADefault();
			self.setPicker( self.mainColor );

			// Reset all previews
			$( '.usof-color-preview', self.$row )
				.removeClass( 'white_text' )
				.css( 'background', '' );

			if ( self.withGradient ) {
				self.angle = self.angleDefault;
				self.setAngle();
				self.hidePicker();
				self.setGradient();
				self.resetPositionsGradientColors();
			}

			self.$input.val( '' );
			self.trigger( 'change', '' );
		},

	};

	// For picker controls
	$.extend( editorAPI, {

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		downColor: function( e ) {
			const self = this;

			self.upColor();
			self.$document
				.on( 'mouseup touchend', self._events.upColor )
				.on( 'mousemove touchmove', self._events.moveColor );

			self.offsetControl = $( e.currentTarget ).offset();

			const pageX = ( e.type === 'touchstart' )
				? e.originalEvent.changedTouches[0].pageX
				: e.pageX;
			const pageY = ( e.type === 'touchstart' )
				? e.originalEvent.changedTouches[0].pageY
				: e.pageY;

			const colorData = self.currentColorData();
			const pickerHeight = self.pickerHeight;

			colorData.hsba.s = $ush.parseInt( 100 * ( pageX - self.offsetControl.left ) / pickerHeight );
			colorData.hsba.b = $ush.parseInt( 100 * ( pickerHeight - ( pageY - self.offsetControl.top ) ) / pickerHeight );
			colorData.value = Helper.HSBAToValue( colorData.hsba );

			self.setColor( colorData );
			self.dataChanged();
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 * @return {Boolean}
		 */
		moveColor: function( e ) {
			const self = this;

			const pageX = ( e.type === 'touchstart' )
				? e.originalEvent.changedTouches[0].pageX
				: e.pageX;
			const pageY = ( e.type === 'touchstart' )
				? e.originalEvent.changedTouches[0].pageY
				: e.pageY;

			const colorData = self.currentColorData();
			const pickerHeight = self.pickerHeight;

			colorData.hsba.s = $ush.parseInt( 100 * max( 0, min( pickerHeight, ( pageX - self.offsetControl.left ) ) ) / pickerHeight );
			colorData.hsba.b = $ush.parseInt( 100 * ( pickerHeight - max( 0, min( pickerHeight, ( pageY - self.offsetControl.top ) ) ) ) / pickerHeight )
			colorData.value = Helper.HSBAToValue( colorData.hsba );

			self.setColor( colorData );
			self.dataChanged();
			return false;
		},

		/**
		 * @event handler
		 * @return {Boolean}
		 */
		upColor: function() {
			const self = this;
			self.$document
				.off( 'mouseup touchend', self._events.upColor )
				.off( 'mousemove touchmove', self._events.moveColor );
			return false;
		},

		/**
		 * Set picker color.
		 *
		 * @param {{}} colorData
		 */
		setColor: function( colorData ) {
			const self = this;
			const pickerHeight = self.pickerHeight;

			$( '.usof-color-picker-color span', colorData.$picker ).css( {
				top: $ush.parseInt( pickerHeight * ( 100 - colorData.hsba.b ) / 100 ),
				left: $ush.parseInt( pickerHeight * colorData.hsba.s / 100 ),
			} );

			self.setAlphaBackground( colorData );
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		downHue: function( e ) {
			const self = this;

			self.offsetControl.top = $( e.currentTarget ).offset().top;

			self.upHue();
			self.$document
				.on( 'mouseup touchend', self._events.upHue )
				.on( 'mousemove touchmove', self._events.moveHue );

			const pageY = ( e.type === 'touchstart' )
				? e.originalEvent.changedTouches[0].pageY
				: e.pageY;

			const colorData = self.currentColorData();
			const pickerHeight = self.pickerHeight;

			colorData.hsba.h = $ush.parseInt( 360 * ( pickerHeight - ( pageY - self.offsetControl.top ) ) / pickerHeight );
			colorData.value = Helper.HSBAToValue( colorData.hsba );

			self.setHue( colorData );
			self.dataChanged();
			return false;
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		moveHue: function( e ) {
			const self = this;

			const pageY = ( e.type === 'touchmove' )
				? e.originalEvent.changedTouches[0].pageY
				: e.pageY;

			const colorData = self.currentColorData();
			const pickerHeight = self.pickerHeight;

			colorData.hsba.h = $ush.parseInt( 360 * ( pickerHeight - max( 0, min( pickerHeight, ( pageY - self.offsetControl.top ) ) ) ) / pickerHeight );
			colorData.value = Helper.HSBAToValue( colorData.hsba );

			self.setHue( colorData );
			self.dataChanged();
			return false;
		},

		/**
		 * @event handler
		 */
		upHue: function() {
			const self = this;
			self.$document
				.off( 'mouseup touchend', self._events.upHue )
				.off( 'mousemove touchmove', self._events.moveHue );
			return false;
		},

		/**
		 * Set hue.
		 *
		 * @param {{}} colorData
		 */
		setHue: function( colorData ) {
			const self = this;
			const hsba = {
				h: colorData.hsba.h,
				s: 100,
				b: 100,
			};
			const pickerHeight = self.pickerHeight;

			$( '.usof-color-picker-color', colorData.$picker )
				.css( 'background-color', Helper.HSBAToHex( hsba ) );
			$( '.usof-color-picker-hue span', colorData.$picker )
				.css( 'top', pickerHeight - pickerHeight * hsba.h / 360 );

			self.setAlphaBackground( colorData );
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		downAlpha: function( e ) {
			const self = this;

			self.upAlpha();
			self.$document
				.on( 'mouseup touchend', self._events.upAlpha )
				.on( 'mousemove touchmove', self._events.moveAlpha );

			self.offsetControl.top = $( e.currentTarget ).offset().top;

			const pageY = ( e.type === 'touchstart' )
				? e.originalEvent.changedTouches[0].pageY
				: e.pageY;

			const colorData = self.currentColorData();
			const pickerHeight = self.pickerHeight;

			colorData.hsba.a = ( pickerHeight - ( pageY - self.offsetControl.top ) ) / pickerHeight;
			colorData.value = Helper.HSBAToValue( colorData.hsba );

			self.setAlpha( colorData );
			self.dataChanged();
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		moveAlpha: function( e ) {
			const self = this;

			const pageY = ( e.type === 'touchmove' )
				? e.originalEvent.changedTouches[0].pageY
				: e.pageY;

			const colorData = self.currentColorData();
			const pickerHeight = self.pickerHeight;

			colorData.hsba.a = $ush.limitValueByRange( ( pickerHeight - ( pageY - self.offsetControl.top ) ) / pickerHeight, 0, 1 );
			colorData.value = Helper.HSBAToValue( colorData.hsba );

			self.setAlpha( colorData );
			self.dataChanged();
			return false;
		},

		/**
		 * @event handler
		 */
		upAlpha: function() {
			const self = this;
			self.$document
				.off( 'mouseup touchend', self._events.upAlpha )
				.off( 'mousemove touchmove', self._events.moveAlpha );
			return false;
		},

		/**
		 * Set alpha.
		 *
		 * @param {{}} colorData
		 */
		setAlpha: function( colorData ) {
			const self = this;
			$( '.usof-color-picker-alpha span', colorData.$picker )
				.css( 'top', $ush.parseInt( self.pickerHeight * ( 1. - colorData.hsba.a ) ) );
		},

		/**
		 * Set alpha background.
		 *
		 * @param {{}} colorData
		 */
		setAlphaBackground: function( colorData ) {
			const self = this;
			const rgba = Helper.HSBAToRGBA( colorData.hsba );

			rgba.a = 1;
			const primary = Helper.RGBAToValue( rgba );

			rgba.a = 0;
			const secondary = Helper.RGBAToValue( rgba );

			$( '.usof-color-picker-alpha', colorData.$picker )
				.attr( 'style', `background: linear-gradient(to bottom, ${primary} 0%, ${secondary} 100%)` );
		},

		/**
		 * Set all controls.
		 *
		 * @param {{}} colorData
		 */
		setPicker: function( colorData ) {
			const self = this;
			self.setColor( colorData );
			self.setHue( colorData );
			self.setAlpha( colorData );
		},

	} );

	// For gradient controls
	$.extend( editorAPI, {

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		setColorIndex: function( e ) {
			this.colorIndex = $( e.currentTarget ).index();
		},

		/**
		 * Reset positions for gradient colors.
		 */
		resetPositionsGradientColors: function() {
			const self = this;
			var numColors = self.gradientColors.length;
			if ( numColors > 1 ) {
				numColors -= 1;
			}
			self.gradientColors.map( ( colorData, i ) => {
				colorData.position = round( ( 100 / numColors ) * i );
				colorData.$position.val( colorData.position );
			} );
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		changeColorPosition: function( e ) {
			const self = this;

			e.target.value = $ush.limitValueByRange( $ush.parseInt( e.target.value ), 0, 100 );

			self.currentColorData().position = e.target.value;
			self.dataChanged();
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		changeAngle: function( e ) {
			const self = this;
			self.setAngle( e.target.value );
			self.dataChanged();
		},

		/**
		 * Set the angle.
		 *
		 * @param {String} value [optional]
		 */
		setAngle: function( value ) {
			const self = this;
			if ( $ush.isUndefined( value ) ) {
				value = self.angle;
			}
			self.angle = $ush.parseInt( value );
			self.$angleRange.val( self.angle );
			self.$angleValue.text( `${self.angle}deg` );
		},

		/**
		 * Show color picker in gradient context.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		showPicker: function( e ) {
			const self = this;
			const $colorField = $( e.currentTarget ).closest( '.usof-color-field' );
			if ( $colorField.hasClass( 'show_picker' ) ) {
				return;
			}
			$colorField
				.removeClass( 'show_list' )
				.addClass( 'show_picker' );
			self.$document.on( 'mousedown', self._events.hidePicker );
		},

		/**
		 * Hide color picker in gradient context.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		hidePicker: function( e ) {
			const self = this;
			$( '.show_picker', self.$container ).each( ( _, node ) => {
				const $colorField = $( node );
				if ( $colorField.has( e.target ).length ) {
					return;
				}
				$colorField.removeClass( 'show_picker' );
				self.$document.off( 'mousedown', self._events.hidePicker );
			} );
		},

		/**
		 * Set gradient colors.
		 *
		 * @param {[]} colorsData
		 */
		setGradient: function( colorsData ) {
			const self = this;
			const positions = [];

			self.$gradientColors.html( '' );
			self.gradientColors = [];

			if ( ! Array.isArray( colorsData ) || colorsData.length < MIN_NUM_GRADIENT_COLORS ) {
				colorsData = [
					{ value: 'transparent', position: 0 },
					{/* default */},
				];
			}

			colorsData.map( self.insertGradientColor.bind( self ) );
			self.gradientColors.map( ( colorData ) => {
				if ( colorData.value ) {
					self.setPreview( colorData );
					self.setPicker( colorData );
				}
				positions.push( colorData.position );
			} );

			if ( positions.reduce( ( a, b ) => a + b ) === 0 ) {
				self.resetPositionsGradientColors();
			}

			self.$container
				.toggleClass( 'hide_action_delete', colorsData.length <= MIN_NUM_GRADIENT_COLORS );

			self.$addGradientColor
				.toggleClass( 'hidden', colorsData.length >= self.maxNumGradientColors );
		},

		/**
		 * Insert gradient color.
		 *
		 * @param {{}} colorData
		 * @return {Number} Returns the index of the added color.
		 */
		insertGradientColor: function( colorData ) {
			const self = this;

			if ( ! $.isPlainObject( colorData ) ) {
				colorData = {};
			}

			self.$gradientColors.append( self.$template.clone() );
			const $lastNode = self.$gradientColors.children().last();

			colorData = $.extend(
				{
					value: Helper.colorNameToHex( 'black' ),
					position: 100,
					hsba: Helper.HSBADefault(),
					$position: $( '.usof-gradient-color-position', $lastNode ),
					$picker: $( '.usof-color-picker', $lastNode ),
					$preview: $( '.usof-color-preview', $lastNode ),
				},
				colorData
			);
			colorData.$position.val( colorData.position );

			self.setPicker( colorData );
			self.gradientColors.push( colorData );

			return $lastNode.index();
		},

		/**
		 * Add new color in gradient.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		addGradientColor: function( e ) {
			e.preventDefault();

			const self = this;
			const colorIndex = self.insertGradientColor();

			self.resetPositionsGradientColors();
			self.dataChanged();

			if ( colorIndex >= self.maxNumGradientColors -1 ) {
				self.$addGradientColor.addClass( 'hidden' );
			}

			if ( self.gradientColors.length > MIN_NUM_GRADIENT_COLORS ) {
				self.$container.removeClass( 'hide_action_delete' );
			}
		},

		/**
		 * Delete color from gradient.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		deleteGradientColor: function( e ) {
			e.preventDefault();

			const self = this;
			const numColors = self.$gradientColors.children().length;

			if ( numColors -1 <= self.maxNumGradientColors ) {
				self.$addGradientColor.removeClass( 'hidden' );
			}

			if ( numColors <= MIN_NUM_GRADIENT_COLORS ) {
				return;
			}

			const $color = $( e.currentTarget ).closest( '.usof-gradient-color' );
			self.gradientColors.splice( $color.index(), 1 );
			$color.remove();

			if ( self.$gradientColors.children().length >= self.maxNumGradientColors ) {
				self.$addGradientColor.addClass( 'hidden' );
			}

			self.resetPositionsGradientColors();
			self.dataChanged();

			if ( self.gradientColors.length <= MIN_NUM_GRADIENT_COLORS ) {
				self.$container.addClass( 'hide_action_delete' );
			}
		},

	} );

	// Global API
	_window.usofColorAPI = {
		REGEXP_HEX_3_DIGIT_VALUE: REGEXP_HEX_3_DIGIT_VALUE,
		REGEXP_HEX_VALUE: REGEXP_HEX_VALUE,
		REGEXP_HEX_WITH_TRANSPARENCY_VALUE: REGEXP_HEX_WITH_TRANSPARENCY_VALUE,
		REGEXP_RGB_OR_RGBA_VALUE: REGEXP_RGB_OR_RGBA_VALUE,
		valueIsValid: Helper.valueIsValid,
		isVariable: Helper.isVariable,
		isGradient: Helper.isGradient,
		isCssVariable: Helper.isCssVariable,
		isDynamicVariable: Helper.isDynamicVariable,
		colorNameToHex: Helper.colorNameToHex,
		normalizeHex: Helper.normalizeHex,
		hexToRGBA: Helper.hexToRGBA,
		hexToHexA: Helper.hexToHexA,
		hexAToRGBA: Helper.hexAToRGBA,
		hexAToRGBAValue: Helper.hexAToRGBAValue,
		RGBAToHex: Helper.RGBAToHex,
		RGBAToValue: Helper.RGBAToValue,
		round2digits: Helper.round2digits,
		isWhiteText: Helper.isWhiteText,
		gradientParse: Helper.gradientParse,
		getVarValue: Helper.getVarValue,
		valueToPreview: Helper.valueToPreview,
		getColorList: getColorList,
		getColorVars: getColorVars,
	};

}( jQuery );
