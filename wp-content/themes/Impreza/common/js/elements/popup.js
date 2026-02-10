/**
 * UpSolution Element: Modal Popup
 */
! function( $, _undefined ) {
	"use strict";

	// The original URL to return to after closing the popup.
	var _originalUrl;

	$us.usPopup = function( container ) {
		const self = this;

		// Elements
		self.$container = $( container );
		self.$content = $( '.w-popup-box-content', self.$container );
		self.$closer = $( '.w-popup-closer', self.$container );

		self._events = {
			show: self.show.bind( self ),
			afterShow: self.afterShow.bind( self ),
			hide: self.hide.bind( self ),
			hideOnLinkClick: self.hideOnLinkClick.bind( self ),
			afterHide: self.afterHide.bind( self ),
			keyup: ( e ) => {
				if ( e.keyCode === $ush.ESC_KEYCODE ) {
					self.hide();
					self.$trigger[0].focus();
				}
			},
			// Trigger an event for check lazyLoadXT
			scroll: () => {
				$us.$document.trigger( 'scroll' );
			},
			touchmove: ( e ) => {
				self.savePopupSizes();
				// Prevent underlying content scroll
				if (
					( self.popupSizes.wrapHeight > self.popupSizes.contentHeight )
					|| $( e.target ).closest( '.w-popup-box' ).length === 0
				) {
					e.preventDefault();
				}
			},
			tabFocusTrap: self.tabFocusTrap.bind( self )
		};

		// Private "Variables"
		self.isDesktop = ! jQuery.isMobile;
		self.forListItem = self.$container.hasClass( 'for_list-item' );
		// Event name for triggering CSS transition finish
		self.transitionEndEvent = ( navigator.userAgent.search( /webkit/i ) > 0 ) ? 'webkitTransitionEnd' : 'transitionend';
		self.$trigger = $( '.w-popup-trigger', self.$container );
		self.triggerType = self.$trigger.usMod( 'type' );
		self.triggerOptions = $ush.toPlainObject( self.$trigger.data( 'options' ) );

		if ( self.triggerType === 'load' ) {
			let _timeoutHandle;
			// Check trigger display on which `hide_on_*` can be applied
			if ( self.$container.css( 'display' ) !== 'none' ) {
				const delay = $ush.parseInt( self.triggerOptions.delay );
				_timeoutHandle = $ush.timeout( self.show.bind( self ), delay * 1000 );
			}
			// When refreshed entire node in the Live builder,
			// we will remove the popup itself from the body
			self.$container.on( 'usb.refreshedEntireNode', () => {
				if ( _timeoutHandle ) {
					$ush.clearTimeout( _timeoutHandle );
				}
				self.$overlay.remove();
				self.$wrap.remove();
			} );

		} else if ( self.triggerType === 'selector' ) {
			const selector = self.$trigger.data( 'selector' );
			if ( selector ) {
				$us.$body.on( 'click', selector, self._events.show );
			}

		} else {
			self.$trigger.on( 'click', self._events.show );
		}

		self.$wrap = $( '.w-popup-wrap', self.$container ).on( 'click', self._events.hide );
		self.$box = $( '.w-popup-box', self.$container );
		self.$overlay = $( '.w-popup-overlay', self.$container );
		self.$closer.on( 'click', self._events.hide );

		// Hide popup, if find link with '#' in content
		self.$wrap.on( 'click', 'a', self._events.hideOnLinkClick );

		self.$media = $( 'video,audio', self.$box );
		self.$wVideos = $( '.w-video', self.$box );

		self.timer = null;

		// If popup used in grid retrieve data for ajax
		self.ajaxData = {
			action: 'us_list_item_popup_content',
		};
		if ( self.forListItem && self.$container.is( '[onclick]' ) ) {
			$.extend( self.ajaxData, self.$container[0].onclick() || {} );
			self.ajaxData.post_id = self.$container.parents( '.w-grid-item' ).attr( 'data-id' );
			self.$container.removeAttr( 'onclick' );
		}

		// Save sizes to prevent scroll on iPhones, iPads
		self.popupSizes = {
			wrapHeight: 0,
			contentHeight: 0,
		}
	};
	$us.usPopup.prototype = {
		isKeyboardUsed: function( e ) {
			return e && e.pointerType !== 'mouse' && e.pointerType !== 'touch' && e.pointerType !== 'pen';
		},
		show: function( e ) {
			const self = this;
			if ( e !== _undefined ) {
				e.preventDefault();
			}
			// Load content in grid popup elm dynamically
			if ( self.$content.is( ':empty' ) ) {
				$ush.timeout( self.loadItemContent.bind( self ) );
			}
			// Show once
			if ( self.triggerType === 'load' && ! $us.usbPreview() ) {
				const uniqueId = $ush.toString( self.triggerOptions.uniqueId ),
					cookieName = 'us_popup_' + uniqueId;
				if ( uniqueId ) {
					if ( $ush.getCookie( cookieName ) !== null ) {
						return;
					}
					const daysUntilNextShow = $ush.parseFloat( self.triggerOptions.daysUntilNextShow );
					$ush.setCookie( cookieName, 'shown', daysUntilNextShow || 365 );
				}
			}
			$ush.clearTimeout( self.timer );
			self.$overlay.appendTo( $us.$body ).show();
			self.$wrap.appendTo( $us.$body ).css( 'display', 'flex' );

			if ( ! self.isDesktop ) {
				self.$wrap.on( 'touchmove', self._events.touchmove );
				$us.$document.on( 'touchmove', self._events.touchmove );
			}

			$us.$body.on( 'keyup', self._events.keyup );
			self.$wrap.on( 'scroll.noPreventDefault', self._events.scroll );
			self.timer = $ush.timeout( self._events.afterShow, 25 );

			$us.$document.on( 'keydown.usPopup', self._events.tabFocusTrap );
			$us.$document.trigger( 'usPopupOpened', [ self.$container ] );

			if ( e ) {
				self.$closer[0].focus( { preventScroll: true } );
			}
		},
		afterShow: function() {
			const self = this;
			$ush.clearTimeout( self.timer );
			self.$overlay.addClass( 'active' );
			self.$box.addClass( 'active' );
			if ( window.$us !== _undefined && $us.$canvas !== _undefined ) {
				$us.$canvas.trigger( 'contentChange', { elm: self.$container } );
			}

			// If popup contains our video elements, restore their src from data attribute
			// this is made to make sure these video elements play only when popup is opened
			if ( self.$wVideos.length ) {
				self.$wVideos.each( ( _, wVideo ) => {
					const $wVideoSource = $( '[data-src]', wVideo );
					const $videoTag = $wVideoSource.parent( 'video' );
					const src = $wVideoSource.data( 'src' );

					if ( ! src ) {
						return;
					}
					$wVideoSource.attr( 'src', src );

					// Init video
					if ( $videoTag.length > 0 ) {
						$videoTag[0].load();
					}
				} );
			}

			$us.$window.trigger( 'resize' );
			$us.$document.trigger( 'usPopup.afterShow', self );
		},
		/**
		 * Get popup content in loop elements via AJAX.
		 */
		loadItemContent: function() {
			const self = this;
			if ( ! self.forListItem ) {
				return;
			}
			$.ajax( {
				url: $us.ajaxUrl,
				type: 'POST',
				dataType: 'json',
				data: self.ajaxData,
				beforeSend: () => {
					self.$content.html( '<div class="g-preloader type_1"></div>' );
				},
				success: ( response ) => {
					if ( response.success && response.data ) {
						self.$content.html( response.data );
						$us.$document.trigger( 'usPopup.itemContentLoaded', self );
					}
				},
			} );
		},
		hide: function( e ) {
			const self = this;
			// Do not hide if the click is inside the popup except closer
			if (
				e
				&& $( e.target ).closest( self.$box ).length
				&& ! $( e.target ).hasClass( 'w-popup-closer' )
			) {
				return;
			}
			$ush.clearTimeout( self.timer );
			$us.$body.off( 'keyup', self._events.keyup );
			self.$overlay.on( self.transitionEndEvent, self._events.afterHide );
			self.$overlay.removeClass( 'active' );
			self.$box.removeClass( 'active' );
			self.$wrap.off( 'scroll.noPreventDefault', self._events.scroll );
			$us.$document.off( 'touchmove', self._events.touchmove );

			self.timer = $ush.timeout( self._events.afterHide, 1000 );
			$us.$document.off( 'keydown.usPopup' );
			if ( self.isKeyboardUsed( e ) ) {
				self.$trigger[0].focus();
			}
		},
		hideOnLinkClick: function( event ) {
			const self = this;
			const $item = $( event.currentTarget );
			const place = $item.attr( 'href' );

			// Do not hide if: ...
			if (
				// ... the link is not a scroll link
				(
					place.indexOf( '#' ) === -1
				)
				// ... or current popup contains scroll link target
				|| (
					place !== '#'
					&& place.indexOf( '#' ) === 0
					&& $( place, self.$wrap ).length > 0
				)
			) {
				return;
			}

			self.hide();
		},
		afterHide: function() {
			const self = this;
			$ush.clearTimeout( self.timer );
			self.$overlay.off( self.transitionEndEvent, self._events.afterHide );
			self.$overlay.appendTo( self.$container ).hide();
			self.$wrap.appendTo( self.$container ).hide();
			$us.$document.trigger( 'usPopupClosed' );
			$us.$window
				.trigger( 'resize', true ) // Pass true not to trigger this event in Page Scroller
				.trigger( 'usPopup.afterHide', self );


			// If popup contains media elements, then we will pause after closing the window
			if ( self.$media.length > 0 ) {
				self.$media.trigger( 'pause' );
			}

			// Pass src to data-src if data-src is missing
			// Stop video playing by removing src parameter after moving it to data-src
			if ( self.$wVideos.length ) {
				self.$wVideos.each( ( _, wVideo ) => {
					const $wVideoSource = $( wVideo ).find( '[src]' );
					if ( ! $wVideoSource.data( 'src' ) ) {
						$wVideoSource.attr( 'data-src', $wVideoSource.attr( 'src' ) );
					}

					$wVideoSource.attr( 'src', '' );
				} );
			}
		},
		savePopupSizes: function() {
			const self = this;
			self.popupSizes.wrapHeight = self.$wrap.height();
			self.popupSizes.contentHeight = self.$content.outerHeight( true );
		},

		// Loop the navigation via TAB key inside a popup.
		// This is the accessibility requirement for aria-modal="true".
		tabFocusTrap: function( e, $wrap, $popupCloser, triggerElm ) {
			const self = this;
			self.$wrap = $wrap || self.$wrap;
			self.$closer = $popupCloser || self.$closer;

			// Additional functionality for Open Post in Popup only
			if ( self.$wrap.hasClass( 'l-popup' ) ) {
				// Focus the element that opened the popup on close
				$us.$document.on( 'usPopupClosed', () => {
					if ( $ush.isNode( triggerElm ) ) {
						triggerElm.focus();
					}
				} );
			}

			if ( e.keyCode !== $ush.TAB_KEYCODE ) {
				return;
			}

			const focusableSelectors = [
				'a[href]', 'area[href]',
				'input:not([disabled])',
				'select:not([disabled])',
				'textarea:not([disabled])',
				'button:not([disabled])',
				'iframe', 'object', 'embed',
				'[tabindex]:not([tabindex="-1"])',
				'[contenteditable]', 'video[controls] source'
			].join();

			const $focusable = $( focusableSelectors, self.$wrap ).filter( ( _, node ) => {
				if ( $( node ).is( 'video[controls], source' ) ) {
					return true;
				}
				return $( node ).is( ':visible' );
			} );

			if ( ! $focusable.length ) {
				e.preventDefault();
				self.$closer[0].focus();
				return;
			}

			const firstElement = $focusable.first()[0];
			const lastElement = $focusable.last()[0];
			const target = e.target;

			if (
				! $.contains( self.$wrap[0], target )
				&& $us.$html.hasClass( 'us_popup_is_opened' )
				&& ! $( target ).hasClass( 'w-popup-closer' )
			) {
				e.preventDefault();
				if ( e.shiftKey ) {
					lastElement.focus();
				} else {
					firstElement.focus();
				}
				return;
			}

			if ( e.shiftKey && target === firstElement ) {
				e.preventDefault();
				lastElement.focus();

			} else if ( ! e.shiftKey && target === lastElement ) {
				e.preventDefault();
				firstElement.focus();
			}
		}
	};

	// Open post in popup
	$.extend( $us.usPopup.prototype, {

		/**
		 * Open Post in a Popup.
		 *
		 * @param {Node} gridList
		 */
		popupPost: function( gridList ) {
			if ( ! gridList.hasClass( 'open_items_in_popup' ) ) {
				return;
			}
			const self = this;
			// Elements
			self.gridList = gridList;
			self.$popupPost = $( '.l-popup', gridList );
			self.$popupPostBox = $( '.l-popup-box', self.$popupPost );
			self.$popupPostFrame = $( '.l-popup-box-content-frame', self.$popupPost );
			self.$popupPostToPrev = $( '.l-popup-arrow.to_prev', self.$popupPost );
			self.$popupPostToNext = $( '.l-popup-arrow.to_next', self.$popupPost );
			self.$popupPostCloser = $( '.l-popup-closer', self.$popupPost );
			self.$list = $( '.w-grid-list', gridList );

			// Events
			$.extend( self._events, {
				closePostInPopup: self.closePostInPopup.bind( self ),
				closePostInPopupByEsc: self.closePostInPopupByEsc.bind( self ),
				loadPostInPopup: self.loadPostInPopup.bind( self ),
				navInPopup: self.navInPopup.bind( self ),
				openPostInPopup: self.openPostInPopup.bind( self ),
				setPostInPopup: self.setPostInPopup.bind( self )
			} );

			$us.$body.append( self.$popupPost );

			// Events
			self.$list
				.on( 'click', '.w-grid-item:not(.custom-link) .w-grid-item-anchor', self._events.openPostInPopup );
			self.$popupPostFrame
				.on( 'load', self._events.loadPostInPopup );
			self.$popupPost
				.on( 'click', '.l-popup-arrow', self._events.navInPopup )
				.on( 'click', '.l-popup-closer, .l-popup-box', self._events.closePostInPopup );
		},

		/**
		 * Sets post by index in the list.
		 *
		 * @param {String} index The new value.
		 */
		setPostInPopup: function( index ) {
			const self = this;

			// Get current node and url
			var $node = $( '> *:eq(' + $ush.parseInt( index ) + ')', self.$list );
			if ( self.gridList.hasClass( 'type_carousel' ) ) {
				$node = $( '.owl-item:eq(' + $ush.parseInt( index ) + ')', self.$list );
			}
			const url = $ush.toString( $( '[href]:first', $node ).attr( 'href' ) );

			// If there is no href, then exit
			if ( ! url ) {
				console.error( 'No url to loaded post' );
				return;
			}

			// Gen prev / next node
			const $prev = $node.prev( ':not(.custom-link)' );
			const $next = $node.next( ':not(.custom-link)' );

			// Check for custom page template
			var pageTemplate = self.$popupPostBox.data( 'page-template' );
			pageTemplate = pageTemplate ? `&us_popup_page_template=${pageTemplate}` : '';

			// Pagination controls switch
			self.$popupPostToPrev
				.data( 'index', $prev.index() )
				.attr( 'title', $( '.post_title', $prev ).text() )
				.toggleClass( 'hidden', ! $prev.length );
			self.$popupPostToNext
				.data( 'index', $next.index() )
				.attr( 'title', $( '.post_title', $next ).text() )
				.toggleClass( 'hidden', ! $next.length );

			self.$popupPostBox.addClass( 'loading' );
			self.$popupPostBox.off( 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd' );
			self.$popupPostFrame.attr( 'src', url + ( url.includes( '?' ) ? '&' : '?' ) + 'us_iframe=1' + pageTemplate );

			history.replaceState( null, null, url );
		},

		/**
		 * Open post in popup.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		openPostInPopup: function( e ) {
			const self = this;

			// If scripts are disabled on a given screen width, then exit
			if ( $us.$window.width() <= $us.canvasOptions.disableEffectsWidth ) {
				return;
			}

			e.stopPropagation();
			e.preventDefault();

			// Remember original page URL
			if ( ! _originalUrl ) {
				_originalUrl = location.href;
			}

			// Set post by index in the list
			if ( self.gridList.hasClass( 'type_carousel' ) ) {
				self.setPostInPopup( $( e.target ).closest( '.owl-item' ).index() );
			} else {
				self.setPostInPopup( $( e.target ).closest( '.w-grid-item' ).index() );
			}

			// Show popup
			self.$popupPost.addClass( 'active' );
			self.$popupPostBox.addClass( 'loading' );

			$us.$document.trigger( 'usPopupOpened', [ self.$popupPost, self.$popupPostCloser, e.target ] );

			$ush.timeout( () => { self.$popupPostBox.addClass( 'show' ); }, 25 );
		},

		/**
		 * Load post in popup.
		 *
		 * @event handler
		 */
		loadPostInPopup: function() {
			const self = this;
			self.$popupPost.on( 'keyup.usCloseLightbox', self._events.closePostInPopupByEsc );
			$( 'body', self.$popupPostFrame.contents() ).on( 'keyup.usCloseLightbox', self._events.closePostInPopupByEsc );
		},

		/**
		 * Navigation in the post popup.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		navInPopup: function( e ) {
			this.setPostInPopup( $( e.target ).data( 'index' ) );
		},

		/**
		 * Close post in popup.
		 *
		 * @event handler
		 */
		closePostInPopup: function() {
			const self = this;

			self.$popupPost.addClass( 'closing' );
			self.$popupPostFrame.attr( 'src', 'about:blank' );
			self.$popupPostBox
				.removeClass( 'show' )
				.one( 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', $ush.debounce( () => {
					self.$popupPost.removeClass( 'active closing' );
					self.$popupPostToPrev.addClass( 'hidden' );
					self.$popupPostToNext.addClass( 'hidden' );
					$us.$document.trigger( 'usPopupClosed' );
				}, 1 ) );
			self.$popupPost.off( 'keyup.usCloseLightbox' );

			// Restore original URL
			if ( _originalUrl ) {
				history.replaceState( null, null, _originalUrl );
			}
		},

		/**
		 * Close post in popup by escape.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		closePostInPopupByEsc: function( e ) {
			const self = this;
			if ( e.keyCode === $ush.ESC_KEYCODE && self.$popupPost.hasClass( 'active' ) ) {
				self.closePostInPopup();
			}
		},
	} );

	$.fn.usPopup = function( options ) {
		return this.each( function() {
			$( this ).data( 'usPopup', new $us.usPopup( this, options ) );
		} );
	};

	$( () => $( '.w-popup' ).usPopup() );

	// Init in Grid Layout context
	$us.$document.on( 'usPostList.itemsLoaded usGrid.itemsLoaded', ( _, $items ) => {
		$( '.w-popup', $items ).usPopup();
	} );

	// Open posts in popup Focus Trap
	$us.$document.on( 'usPopupOpened', ( e, $popup, $popupCloser, triggerElm ) => {
		if ( $popup.hasClass( 'l-popup' ) ) {
			// Focus close button on open if keyboard is used
			if ( e ) {
				$popupCloser[0].focus( { preventScroll: true } );
			}
			$us.$document.on( 'keydown.usPopup', ( e ) => {
				$us.usPopup.prototype.tabFocusTrap( e, $popup, $popupCloser, triggerElm );
			} );
		}
	} );

	$us.$document.on( 'usPopupClosed', () => {
		$us.$document.off( 'keydown.usPopup' );
	} );

}( jQuery );
