! ( function( $, _undefined ) {

	const $ush = window.$ush || {};

	/**
	 * UpSolution WooCommerce elements.
	 * Note: All classes and key elements from WooCommerce are retained
	 *
	 * The code depends on:
	 * 	- `../plugins/woocommerce/assets/js/frontend/cart.js`
	 * 	- `../plugins/woocommerce/assets/js/frontend/checkout.js`
	 *
	 * @param container
	 * @requires $us.$body
	 * @requires $us.$canvas
	 * @requires $ush.debounce
	 * @requires $ush.timeout
	 * @constructor
	 */
	function WooCommerce() {
		const self = this;

		// Elements
		self.$cart = $( '.w-cart' );
		self.$cartCloser = $( '.w-cart-closer', self.$cart ); 
		self.$cartLink = $( '.w-cart-link', self.$cart );
		self.$pageContent = $( '#page-content' );
		self.$notice = $( '.w-wc-notices.woocommerce-notices-wrapper:first', $us.$canvas );
		self.$addToCart = $( '.w-post-elm.add_to_cart', $us.$canvas );

		// Private "Variables"
		self._activeJqXHR = {}; // This is the object of the last ajax request
		self._cartOpened = false;
		self._removeProcesses = 0; // Number of remove processes simultaneously

		// Event handlers
		self._events = {
			ajaxAddToCart: self.ajaxAddToCart.bind( self ),
			applyCouponCode: self.applyCouponCode.bind( self ),
			changeCartQuantity: self.changeCartQuantity.bind( self ),
			couponCodeChange: self.couponCodeChange.bind( self ),
			couponDisplaySwitch: self.couponDisplaySwitch.bind( self ),
			enterCouponCode: self.enterCouponCode.bind( self ),
			showNotification: self.showNotification.bind( self ),
			loginFieldKeydown: self.loginFieldKeydown.bind( self ),
			minusCartQuantity: self.minusCartQuantity.bind( self ),
			moveNotifications: self.moveNotifications.bind( self ),
			outsideClickEvent: self.outsideClickEvent.bind( self ),
			plusCartQuantity: self.plusCartQuantity.bind( self ),
			removeCartItem: self.removeCartItem.bind( self ),
			showLoginForm: self.showLoginForm.bind( self ),
			submitLoginForm: self.submitLoginForm.bind( self ),
			updateCart: self.updateCart.bind( self ),
			updatedCartTotals: self.updatedCartTotals.bind( self ),
			showCartOnClick: self._showCartOnClick.bind( self ),
			showCartOnKeyup: self._showCartOnKeyup.bind( self ),
			hideCartOnKeyup: self._hideCartOnKeyup.bind( self )
		};

		// Init cart elements
		if ( self.isCart() ) {

			self.$cartNotification = $( '.w-cart-notification', self.$cart );

			// Events
			self.$cartNotification.on( 'click', () => {
				self.$cartNotification.fadeOutCSS();
			} );

			// Handler of outside click for mobile devices
			if ( $.isMobile ) {
				self.$cart.on( 'click', '.w-cart-link', ( e ) => {
					if ( ! self._cartOpened ) {
						e.preventDefault();
						self.$cart.addClass( 'opened' );
						$us.$body.on( 'touchstart.noPreventDefault', self._events.outsideClickEvent );
					} else {
						self.$cart.removeClass( 'opened' );
						$us.$body.off( 'touchstart', self._events.outsideClickEvent );
					}
					self._cartOpened = ! self._cartOpened;
				} );

				// Handle click event for desktop devices with panel layouts
			} else {
				if ( self.$cart.hasClass( 'drop_on_click' ) || self.$cart.is( '[class*="_panel"]' ) ) {
					// need to separate these events because keyup event also manages focus
					self.$cartLink.on( 'keyup', self._events.showCartOnKeyup ); 
					self.$cartLink.on( 'click', self._events.showCartOnClick );
				}

				$us.$body.on( 'keyup', self._events.hideCartOnKeyup );
			
				// Cart closer button
				if ( self.$cart.hasClass( 'layout_left_panel' ) || self.$cart.hasClass( 'layout_right_panel' ) ) {
					self.$cartCloser.on( 'click', ( e ) => {
						self._toggleCart( false );
					} );

					self.$cartCloser.on( 'keyup', ( e ) => {
						if ( e.keyCode === $ush.ENTER_KEYCODE ) {
							self._toggleCart( false, self.$cartLink );
						}
					} );
				}
			}

			$us.$body
				// Events of `../plugins/woocommerce/assets/js/frontend/add-to-cart.js`,
				// `../plugins/woocommerce/assets/js/frontend/cart-fragments.js`
				.on( 'wc_fragments_loaded wc_fragments_refreshed', self._events.updateCart )
				// Events of `../plugins/woocommerce/assets/js/frontend/add-to-cart.js`
				.on( 'added_to_cart', self._events.showNotification )
				.on( 'removed_from_cart', self._events.updateCart );
		}

		if ( self.isCartPage() ) {
			// Events
			$us.$body
				.on( 'change initControls', 'input.qty', self._events.changeCartQuantity )
				.on( 'change', '.w-wc-coupon-form input', self._events.couponCodeChange )
				.on( 'keyup', '.w-wc-coupon-form input', self._events.enterCouponCode )
				.on( 'click', '.w-wc-coupon-form button', self._events.applyCouponCode )
				.on( 'click', 'a.remove', self._events.removeCartItem )
				.on( 'click', 'input.minus', self._events.minusCartQuantity )
				.on( 'click', 'input.plus', self._events.plusCartQuantity )
				// Events of `../plugins/woocommerce/assets/js/frontend/cart.js`
				.on( 'applied_coupon removed_coupon', self._events.couponDisplaySwitch )
				.on( 'updated_cart_totals', self._events.updatedCartTotals );

			// Initializing controls after the ready document
			$( 'input.qty', $us.$canvas ).trigger( 'initControls' );

			// Get the last active request for cart updates
			$.ajaxPrefilter( ( _, originalOptions, jqXHR ) => {
				const data = $ush.toString( originalOptions.data );
				if ( data.indexOf( '&update_cart' ) > -1 ) {
					self._activeJqXHR.updateCart = jqXHR;
				}
				// Distance information updates in shortcode `[us_cart_shipping]`
				if ( data.indexOf( '&us_calc_shipping' ) > -1 ) {
					jqXHR.done( ( res ) => {
						$( '.w-cart-shipping .woocommerce-shipping-destination' )
							.html( $( '.w-cart-shipping:first .woocommerce-shipping-destination', res ).html() );
					} );
				}
			} );

			$( '.w-cart-shipping form.woocommerce-shipping-calculator', $us.$canvas )
				.append( '<input type="hidden" name="us_calc_shipping">' );
		}

		if ( self.isCheckoutPage() ) {
			// Events
			$us.$body
				.on( 'change', '.w-wc-coupon-form input', self._events.couponCodeChange )
				.on( 'keyup', '.w-wc-coupon-form input', self._events.enterCouponCode )
				.on( 'click', '.w-wc-coupon-form button', self._events.applyCouponCode )
				// Events of `../plugins/woocommerce/assets/js/frontend/checkout.js`
				.on( 'applied_coupon_in_checkout removed_coupon_in_checkout', self._events.couponDisplaySwitch )
				.on( 'applied_coupon_in_checkout removed_coupon_in_checkout checkout_error', self._events.moveNotifications )
				.on( 'click', '.w-checkout-login .showlogin', self._events.showLoginForm )
				.on( 'click', '.w-checkout-login button', self._events.submitLoginForm )
				.on( 'keydown', '.w-checkout-login input, .w-checkout-login button', self._events.loginFieldKeydown );

			// Blocks the form from being submitted if the coupon field is in focus
			// and the Enter key is pressed, this allows the coupon to be applied
			// correctly, otherwise the form will simply be submitted.
			const $couponField = $( '.w-wc-coupon-form input', $us.$canvas );
			$us.$document.on( 'keypress', ( e ) => {
				if ( e.keyCode === $ush.ENTER_KEYCODE && $couponField.is( ':focus' ) ) {
					e.preventDefault();
				}
			} );
		}

		// "Add to cart" via Ajax
		if( $us.$body.hasClass( 'us-ajax_add_to_cart' ) ) {
			$us.$body.on( 'click', '.single_add_to_cart_button:not(.disabled)', self._events.ajaxAddToCart );
		}

		// Input quantity on product page
		if ( self.$addToCart.length > 0 ) {
			$us.$body
				.on( 'click', 'input.minus', self._events.minusCartQuantity )
				.on( 'click', 'input.plus', self._events.plusCartQuantity )
				.on( 'change initControls', 'input.qty', self._events.changeCartQuantity )
		}

		$us.$document.on( 'ajaxComplete', ( _, jqXHR, settings ) => {

			// Skip JSON string
			if ( String( jqXHR.responseText ).charAt(0) === '{' ) {
				return;
			}

			const $fragment = $( new DocumentFragment ).append( jqXHR.responseText );

			// Updated only visible "Cart Totals" elements, bypassing WooCommerce core logic. See #3935 for details.
			if ( self.isCartPage() && $( '.cart_totals', $fragment ).length > 1 ) {
				const notices = self.$notice.html();
				self.$pageContent.html( $( '.l-main', $fragment ) );
				self.$notice = $( '.w-wc-notices.woocommerce-notices-wrapper:first', $us.$canvas );
				// Restore notifications
				if ( notices ) {
					self.$notice.html( notices );
				}
			}

			// Intercept messages after apply a coupon.
			if ( String( settings.url ).includes( 'wc-ajax=apply_coupon' ) ) {
				const $message = $( '.woocommerce-error, .woocommerce-message', $fragment );
				if ( $message.length > 0 ) {
					self.$notice.html( $message.clone() );
				} else {
					self.$notice.html( '' );
				}
			}

			if (
				self.$cart.hasClass( 'open_on_ajax' )
				&& ( self.$cart.hasClass( 'layout_left_panel' ) || self.$cart.hasClass( 'layout_right_panel' ) )
				&& settings.url.includes( 'add_to_cart' )
			) {
				self._toggleCart( true );
				// waiting for transition - cannot focus element with visibility:hidden
				self.$cart.on( 'transitionend', () => {
					self.$cartCloser[0].focus();
					self.$cart.off( 'transitionend' );
				} );
			}
		} );
	}

	/**
	 * Export API
	 */
	$.extend( WooCommerce.prototype, {

		/**
		 * Determines if cart.
		 *
		 * @return {boolean} True if cartesian, False otherwise.
		 */
		isCart: function() {
			return this.$cart.length > 0;
		},

		/**
		 * Determines if current cartesian page.
		 *
		 * @return {boolean} True if current cartesian page, False otherwise.
		 */
		isCartPage: function() {
			return $us.$body.hasClass( 'woocommerce-cart' );
		},

		/**
		 * Determines if current checkout page.
		 *
		 * @return {boolean} True if current checkout page, False otherwise
		 */
		isCheckoutPage: function() {
			return $us.$body.hasClass( 'woocommerce-checkout' );
		},

		/**
		 * Update cart elements.
		 */
		updateCart: function() {
			const self = this;
			$.each( self.$cart, ( _, cart ) => {
				var $cart = $( cart ),
					$cartQuantity = $( '.w-cart-quantity', $cart ),
					miniCartAmount = $( '.us_mini_cart_amount:first', $cart ).text();

				if (
					$cart.hasClass( 'opened' )
					&& ! $cart.hasClass( 'drop_on_click' )
					&& ! $cart.hasClass( 'layout_left_panel' )
					&& ! $cart.hasClass( 'layout_right_panel' )
				) {
					$cart.removeClass( 'opened' );
				}

				if ( miniCartAmount !== _undefined ) {
					miniCartAmount = String( miniCartAmount ).match( /\d+/g );
					$cartQuantity.html( miniCartAmount > 0 ? miniCartAmount : '0' );
					$cart[ miniCartAmount > 0 ? 'removeClass' : 'addClass' ]( 'empty' );
				} else {
					// fallback in case our action wasn't fired somehow
					var total = 0;
					$( '.quantity', $cart ).each( ( _, quantity ) => {
						var matches = String( quantity.innerText ).match( /\d+/g );

						if ( matches ) {
							total += parseInt( matches[0], 10 );
						}
					} );
					$cartQuantity.html( total > 0 ? total : '0' );
					$cart[ total > 0 ? 'removeClass' : 'addClass' ]( 'empty' );
				}
			} );
		},

		/**
		 * Show notifications after adding product to cart.
		 *
		 * @event handler
		 * @param {Event} e
		 * @param {{} fragments
		 * @param {node} $button
		 */
		showNotification: function( e, fragments, _, $button ) {
			if ( $ush.isUndefined( e ) ) {
				return;
			}
			const self = this;

			// Update cart element
			self.updateCart();

			const $notice = self.$cartNotification;
			// NOTE: Get product name in product page or popup when available.
			const theProductName = $button
				.closest( '.product, .w-popup-box-content' )
				.find( '.woocommerce-loop-product__title, .w-post-elm.post_title' )
				.first()
				.text();

			$( '.product-name', $notice ).html( `"${theProductName}"` );

			// Skip show message
			if ( $notice.hasClass( 'skip_message' ) ) {
				$notice.removeClass( 'skip_message' );
				return;
			}

			$notice.addClass( 'shown' );
			$notice.on( 'mouseenter', () => {
				$notice.removeClass( 'shown' );
			} );

			$ush.timeout( () => {
				$notice
					.removeClass( 'shown' )
					.off( 'mouseenter' );
			}, 3000 );
		},

		/**
		 * Handler for outside click events for mobile devices.
		 * Note: Designed for mobile devices
		 *
		 * @event handler
		 * @param {Event} e
		 */
		outsideClickEvent: function( e ) {
			const self = this;
			if ( $.contains( self.$cart[0], e.target ) ) {
				return;
			}
			self.$cart.removeClass( 'opened' );
			$us.$body.off( 'touchstart', self._events.outsideClickEvent );
			self._cartOpened = false;
		},

		/**
		 * Handler when remove a item.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		removeCartItem: function( e ) {
			var $item = $( e.target )
				.closest( '.cart_item' )
				.addClass( 'change_process' );
			// If the element is the last, then delete the table for correct operation `cart.js:update_wc_div`
			if ( ! $item.siblings( '.cart_item:not(.change_process)' ).length ) {
				$( '.w-cart-table', $us.$canvas ).remove();
			}
		},

		/**
		 * Check and set quantity.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		changeCartQuantity: function( e ) {

			if ( $us.usbPreview() ) {
				return;
			}

			const self = this;

			const $input = $( e.target );
			const isGroupTable = $input.closest( '.cart' ).hasClass( 'grouped_form' );
			const max = $ush.parseInt( $input.attr( 'max' ) ) || -1;
			const min = $ush.parseInt( $input.attr( 'min' ) ) || ( isGroupTable ? 0 : 1 );

			var value = $ush.parseInt( $input.val() );

			if ( $input.is( ':disabled' ) ) {
				return;
			}
			if ( min >= value ) {
				value = min;
			}
			if ( max > 1 && value >= max ) {
				value = max;
			}
			if ( value != $input.val() ) {
				$input.val( value );
			}

			$input
				.siblings( 'input.plus:first' )
				.prop( 'disabled', ( max > 0 && value >= max ) );
			$input
				.siblings( 'input.minus:first' )
				.prop( 'disabled', ( value <= min ) );

			// If the event type is `initControls` then this is the
			// first init when loading the document
			if ( e.type == 'initControls' ) {
				return;
			}

			// Add a flag that there was a change in the quantity to the cart elements
			$( 'input[name=us_cart_quantity]', $us.$canvas ).val( true );

			// Update the cart by means of WooCommerce
			if ( ! $( '.w-cart-table', $us.$canvas ).hasClass( 'processing' ) ) {
				self.__updateCartForm_long( self._updateCartForm.bind( self ) );
			} else {
				self._updateCartForm();
			}
		},

		/**
		 * Decreasing quantity item in cart.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		minusCartQuantity: function( e ) {
			const self = this;

			var $target = $( e.target ),
				$input = $target.siblings( 'input.qty:first' );

			if ( ! $input.length ) {
				return;
			}

			const step = $ush.parseInt( $input.attr( 'step' ) || 1 );
			$input // Update quantity
				.val( $ush.parseInt( $input.val() ) - step )
				.trigger( 'change' );
		},

		/**
		 * Increasing quantity item in cart.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		plusCartQuantity: function( e ) {
			const self = this;

			var $target = $( e.target ),
				$input = $target.siblings( 'input.qty:first' );

			if ( ! $input.length ) {
				return;
			}

			const step = $ush.parseInt( $input.attr( 'step' ) || 1 );
			$input
				.val( $ush.parseInt( $input.val() ) + step )
				.trigger( 'change' );
		},

		/**
		 * Update the cart form by means of WooCommerce
		 * Note: The code is moved to a separate function since `debounced`
		 * must be initialized before calling
		 *
		 * @param {function} fn The function to be executed
		 * @type debounced
		 */
		__updateCartForm_long: $ush.debounce( $ush.fn, /* wait */50 ),

		/**
		 * Update the cart form by means of WooCommerce.
		 */
		_updateCartForm: function() {
			const self = this;
			// Abort previous cart update request
			if ( typeof ( self._activeJqXHR.updateCart || {} ).abort === 'function' ) {
				self._activeJqXHR.updateCart.abort();
			}
			// Initialize cart update
			$( '.w-cart-table > button[name=update_cart]', $us.$canvas )
				.removeAttr( 'disabled' )
				.trigger( 'click' );
		},

		/**
		 * Updating cart totals.
		 *
		 * @event handler
		 */
		updatedCartTotals: function() {
			const self = this;
			// Reset last active request
			if ( !! self._activeJqXHR.updateCart ) {
				self._activeJqXHR.updateCart = _undefined;
			}
			// Removing animated class if any element had it
			var wooElementClasses = [
				'w-cart-shipping',
				'w-cart-table',
				'w-cart-totals',
				'w-checkout-billing',
				'w-checkout-order-review',
				'w-checkout-payment',
				'w-wc-coupon-form',
			];
			for ( const i in wooElementClasses ) {
				$( `.${wooElementClasses[i]}.us_animate_this`, $us.$canvas ).removeClass( 'us_animate_this' );
			}

			// Shipping element sync after totals update
			const $shipping = $( '.w-cart-shipping .shipping', $us.$canvas );
			if ( ! $shipping.length ) {
				return;
			}
			$shipping.html( $( '.w-cart-totals .shipping:first', $us.$canvas ).html() );
		},

		/**
		 * Entering the coupon code in the field.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		couponCodeChange: function( e ) {
			// Transit value to the cart form to add a coupon by WooCommerce logic
			$( '.w-cart-table, form.checkout_coupon:first', $us.$canvas )
				.find( 'input[name=coupon_code]' )
				.val( e.target.value );
		},

		/**
		 * Enters a coupon code.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		enterCouponCode: function( e ) {
			if ( e.keyCode === $ush.ENTER_KEYCODE ) {
				$( e.target )
					.trigger( 'change' )
					.siblings( 'button:first' )
					.trigger( 'click' );
			}
		},

		/**
		 * Click on the "Apply Coupon" button.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		applyCouponCode: function( e ) {
			// Stop event (Important on the checkout page)
			e.stopPropagation();
			e.preventDefault();
			// Initialize coupon additions using WooCommerce logic
			$( '.w-cart-table, form.checkout_coupon:first', $us.$canvas )
				.find( 'button[name=apply_coupon]' )
				.trigger( 'click' );
			// Clear input field
			$( e.target ).closest( '.w-wc-coupon-form' ).find( 'input:first' ).val( '' );
		},

		/**
		 * Coupon form display switch.
		 *
		 * @param {Event} e
		 */
		couponDisplaySwitch: function( e ) {
			const $coupon = $( '.w-wc-coupon-form', $us.$canvas );
			if ( ! $coupon.length ) {
				return;
			}
			// Add a class if the coupon is applied
			if ( e.type.indexOf( 'applied_coupon' ) > -1 && ! $( '.woocommerce-error', $us.$canvas ).length ) {
				$coupon.addClass( 'coupon_applied' );
			}
			// Remove a class if all coupons were removed
			if ( e.type.indexOf( 'removed_coupon' ) > -1 && $( '.woocommerce-remove-coupon', $us.$canvas ).length <= 1 ) {
				$coupon.removeClass( 'coupon_applied' );
			}
		},

		/**
		 * Move notifications to `[wc_notices...]`.
		 *
		 * @event handler
		 * @param {Event} e
		 * @param {String} err_html The value is needed for checkout_error.
		 */
		moveNotifications: function( e, err_html ) {
			const self = this;

			// Do not proceed with notices adjustment if there are no US Cart / Checkout elements on the page
			if ( ! self.$notice.length ) {
				var $cartTotals = $( '.w-cart-totals', $us.$canvas ),
					$checkoutPayment = $( '.w-checkout-payment', $us.$canvas );
				if ( ! $cartTotals.length && ! $checkoutPayment.length ) {
					return;
				}
			}

			// Get notice
			var $message;
			if ( e.type === 'checkout_error' && err_html ) {
				$message = $( err_html );
			} else {
				$message = $( '.woocommerce-error, .woocommerce-message', $us.$canvas );
			}

			// Show notification
			if ( $message.length > 0 ) {
				self.$notice.html( $message.clone() );
			}
			$message.remove();

			// Remove NoticeGroup
			if ( e.type === 'checkout_error' ) {
				$( '.woocommerce-NoticeGroup-checkout' ).remove();
			}
		},

		/**
		 * "Add to cart" via Ajax.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		ajaxAddToCart: function( e ) {
			const self = this;

			e.preventDefault();

			const $button = $( e.currentTarget );

			// Add text wrapper and preloader
			if ( $( '.g-preloader', $button ).length === 0 ) {
				$button.html( `<div class="g-preloader type_1"><div></div></div><span class="w-btn-label">${$button.html()}</span>` );
			}

			var data = {};

			// Serialize Form
			const $form = $button.closest( 'form.cart' );
			const formData = new FormData( $form[0], $button[0] );

			formData.forEach( ( value, key ) => {
				if ( key.includes( '[' ) ) {
					const keys = key.split( /\[|\]/ ).filter( ( k ) => { return k; } );
					keys.forEach( ( k, index ) => {
						if ( index === keys.length -1 ) {
							if ( Array.isArray( data[ k ] ) ) {
								data[ k ].push( value );
							} else if ( data[ k ] ) {
								data[ k ] = [ data[ k ], value ];
							} else {
								data[ k ] = key.includes( '[]' ) ? [ value ] : value; // кey includes [] without a k, ie: field[].
							}
						} else {
							if ( ! data[ k ] ) {
								data[ k ] = {};
							}
							data = data[ k ];
						}
					} );
				} else {
					if ( data[ key ] ) {
						if ( Array.isArray( data[ key ] ) )  {
							data[ key ].push( value );
						} else {
							data[ key ] = [ data[ key ], value ];
						}
					} else {
						data[ key ] = value;
					}
				}
			} );

			// Check if product_id exists, if not add it with the value of add-to-cart. Use variation_id for variable products.
			if ( data['variation_id'] ) {
				data['product_id'] = data['variation_id'];
			} else if ( ! data['product_id'] && data['add-to-cart'] ) {
				data['product_id'] = data['add-to-cart'];
			}

			delete data['add-to-cart']; // need to remove this so that the form handler doesn't try to add the product to the cart again.

			// Events of `../plugins/woocommerce/assets/js/frontend/add-to-cart.js`
			$us.$body.trigger( 'adding_to_cart', $button, data );

			$.ajax( {
				type: 'POST',
				url: String( woocommerce_params.wc_ajax_url ).replace( '%%endpoint%%', 'add_to_cart' ),
				data: data,
				beforeSend: () => {
					$button
						.removeClass( 'added' )
						.addClass( 'loading' );
				},
				complete: ( jqXHR ) => {
					// Redirect to the cart page after successful addition
					if ( String( jqXHR.responseText ).includes( 'us_redirect_to_cart' ) ) {
						return;
					}
					$button
						.addClass( 'added' )
						.removeClass( 'loading' );
				},
				success: ( res ) => {
					if ( res.error && res.product_url ) {
						window.location = res.product_url;
						return;
					}

					// Redirect to the cart page after successful addition
					if ( res.fragments[ 'us_redirect_to_cart' ] ) {
						window.location.href = res.fragments[ 'us_redirect_to_cart' ];
						return;
					}

					// Skip default message
					if ( self.isCart() ) {
						self.$cartNotification.addClass( 'skip_message' );
					}

					$us.$body.trigger( 'added_to_cart', [ res.fragments, res.cart_hash, $button ] );

					var message = '';

					if ( self.isCart() ) {
						message = self.$cartNotification.text();
					}

					// Get "View cart"
					var $viewCart = $button.next( '.added_to_cart.wc-forward' ).removeClass( 'added_to_cart' );
					if ( $viewCart.length ) {
						message += ' ' + $viewCart.prop( 'outerHTML' );
						$viewCart.remove();
					}

					// Show notice
					$form.next( '.woocommerce-notices-wrapper' ).remove();
					$form.after( `
						<div class="woocommerce-notices-wrapper">
							<div class="woocommerce-message" role="alert" tabindex="-1">${message}</div>
						</div>
					` );
				},
			} );
		},
	} );

	// Login Form
	$.extend( WooCommerce.prototype, {

		showLoginForm: function() {
			$( '.woocommerce-form-login' ).toggleClass( 'hidden' );
			return false;
		},

		submitLoginForm: function() {
			const self = this;
			// Prevent double sending
			if ( self.isSubmittingLoginForm ) {
				return false;
			}
			self.isSubmittingLoginForm = true;

			// Get the form substitute view and all its fields
			var $formView = $( '.w-checkout-login' ),
				$usernameField = $( '#us_checkout_login_username', $formView ),
				$passwordField = $( '#us_checkout_login_password', $formView ),
				$redirectField = $( '#us_checkout_login_redirect', $formView ),
				$nonceField = $( '#us_checkout_login_nonce', $formView );

			// Make sure all fields are present
			if (
				$usernameField.length == 0
				|| $passwordField.length == 0
				|| $redirectField.length == 0
				|| $nonceField.length == 0
			) {
				return false;
			}

			// Append a new form with needed fields to <body> and submit it
			var fields = {
					'login': 'Login',
					'rememberme': 'forever',
					'username': $usernameField.val(),
					'password': $passwordField.val(),
					'redirect': $redirectField.val(),
					'woocommerce-login-nonce': $nonceField.val(),
				},
				$form = $( '<form>', {
					method: 'post'
				} );
			$.each( fields, ( key, val ) => {
				$( '<input>' ).attr( {
					type: "hidden",
					name: key,
					value: val
				} ).appendTo( $form );
			} );

			$form.appendTo( 'body' ).submit();

			return false;
		},

		loginFieldKeydown: function( e ) {
			if ( e.keyCode === $ush.ENTER_KEYCODE ) {
				e.stopPropagation();
				e.preventDefault();
				this.submitLoginForm();
			}
		},

		_showCartOnClick: function( e ) {
			e.preventDefault();
			const self = this;

			// Enter press generates 'click' event firing two events in a row so need to distinguish these events
			if ( [ 'mouse', 'touch', 'pen' ].includes( e.pointerType ) ) {
				self._toggleCart( ! self._cartOpened );
			}
		},

		_showCartOnKeyup: function( e ) {
			e.preventDefault();
			const self = this;

			if ( e.keyCode === $ush.ENTER_KEYCODE ) {
				if ( ! self._cartOpened ) {
					if ( self.$cartCloser.length > 0 ) {
						// waiting for transition - cannot focus element with visibility:hidden
						self.$cart.on( 'transitionend', () => {
							self.$cartCloser[0].focus();
							self.$cart.off( 'transitionend' );
						} );
					}
				}
				
				self._toggleCart( ! self._cartOpened );
			} 
		},

		_hideCartOnKeyup: function( e ) {
			const self = this;
			if ( e.keyCode === $ush.ESC_KEYCODE ) {
				self._toggleCart( false, self.$cartLink );
			}
		},

		_toggleCart: function( open = true, $elementToFocus = null ) {
			const self = this;

			self.$cart.toggleClass( 'opened', open );
			self.$cartLink.attr( 'aria-expanded', open );
			self._cartOpened = open;

			if ( $elementToFocus !== null ) {
				$elementToFocus.focus();
			}
		}

	} );

	$us.woocommerce = new WooCommerce;

	/**
	 * Sets product images for the chosen variation.
	 * Note: Overriding a default function implemented in WooCommerce logic.
	 * https://github.com/woocommerce/woocommerce/blob/d4696f043710131d5bbf51455e070791eaa12cf9/plugins/woocommerce/client/legacy/js/frontend/add-to-cart-variation.js#L646
	 *
	 * @param {{}} variation The variation.
	 */
	function us_wc_variations_image_update( variation ) {
		var $slider = $( '.w-slider.for_product_image_gallery:not(.w-grid .w-slider)', $( this ).closest( '.product' ) ),
			royalSlider = ( $slider.data( 'usImageSlider' ) || {} ).royalSlider;
		if ( $ush.isUndefined( royalSlider ) ) {
			return;
		}
		royalSlider.goTo(0);
		var $image = $( '.rsImg', royalSlider.slidesJQ[0] ),
			$thumb = $( '.rsThumb:first img', $slider );
		if ( variation === false ) {
			if ( ! $slider.data( 'orig-img' ) ) {
				var src = $image.attr( 'src' );
				$slider.data( 'orig-img', {
					src: src,
					srcset: src,
					full_src: src,
					thumb_src: $thumb.attr( 'srcset' ),
					gallery_thumbnail_src: $thumb.attr( 'src' ),
				} );
				return;
			}
			variation = {
				image: $slider.data( 'orig-img' ),
			};
		}
		if ( $.isPlainObject( variation.image ) ) {
			$image
				.attr( 'src', $ush.toString( variation.image.src ) )
				.attr( 'srcset', $ush.toString( variation.image.srcset ) );
			$thumb
				.attr( 'src', $ush.toString( variation.image.gallery_thumbnail_src ) )
				.attr( 'srcset', $ush.toString( variation.image.thumb_src ) );
			// Set bigImage for Fullscreen
			$.extend( royalSlider.currSlide, {
				bigImage: $ush.toString( variation.image.full_src ),
				image: $ush.toString( variation.image.src ),
			} );
			if ( typeof royalSlider.updateSliderSize === 'function' ) {
				royalSlider.updateSliderSize( true );
			}
		}
	}
	$( () => {
		if ( $( '.w-slider.for_product_image_gallery:not(.w-grid .w-slider.for_product_image_gallery)' ).length > 0 ) {
			$ush.timeout( () => {
				$.fn.wc_variations_image_update = us_wc_variations_image_update;
			}, 1 );
		}
	} );

	// Init the "Product Gallery" inside the popup content in loop elements.
	$us.$document.on( 'usPopup.itemContentLoaded', ( e, usPopup ) => {
		if ( typeof $.fn.wc_product_gallery === 'function' ) {
			$( '.woocommerce-product-gallery', usPopup.$content ).wc_product_gallery();
		}
	} );

} )( jQuery );
