/**
 * Header navigation with all the possible states
 *
 * @requires $us.canvas
 */
! function( $, _undefined ) {
	"use strict";

	window.$us = window.$us || {};

	$us.mobileNavOpened = 0;

	const SLIDE_DURATION = 250;

	function usNav( container ) {
		const self = this;

		self.$container = $( container );
		if ( self.$container.length === 0 ) {
			return;
		}

		// Elements
		self.$items = $( '.menu-item', self.$container );
		self.$list = $( '.w-nav-list.level_1', self.$container );
		self.$anchors = $( '.w-nav-anchor', self.$container );
		self.$arrows = $( '.w-nav-arrow', self.$container );
		self.$mobileMenu = $( '.w-nav-control', self.$container );
		self.$itemsHasChildren = $( '.menu-item-has-children', self.$list );
		self.$childLists = $( '.menu-item-has-children > .w-nav-list', self.$list );
		self.$reusableBlocksLinks = $( '.menu-item-object-us_page_block a', self.$container );

		// Private "Variables"
		self.type = self.$container.usMod( 'type' );
		self.layout = self.$container.usMod( 'layout' );
		self.openDropdownOnClick = self.$container.hasClass( 'open_on_click' );
		self.mobileNavOpened = false;
		self.keyboardNavEvent = false;
		self.opts = {};

		// Bondable events
		self._events = {
			closeMobileMenu: self.closeMobileMenu.bind( self ),
			closeMobileMenuOnClick: self.closeMobileMenuOnClick.bind( self ),
			closeMobileMenuOnFocusIn: self.closeMobileMenuOnFocusIn.bind( self ),
			closeOnClickOutside: self.closeOnClickOutside.bind( self ),
			handleKeyboardNav: self.handleKeyboardNav.bind( self ),
			handleMobileClick: self.handleMobileClick.bind( self ),
			resize: self.resize.bind( self ),
			toggleMenuOnClick: self.toggleMenuOnClick.bind( self ),
			toggleMobileMenu: self.toggleMobileMenu.bind( self ),
		}

		// Load nav options
		const $opts = $( '.w-nav-options:first', self.$container );
		if ( $opts.is( '[onclick]' ) ) {
			self.opts = $opts[0].onclick() || {};
			$opts.remove();
		}

		// Events
		self.$container
			// Detach animation after transition
			.on( 'transitionend', () => self.$container.removeClass( 'us_animate_this' ) )
			// Keyboard navigation accessibility
			.on( 'keydown.upsolution', self._events.handleKeyboardNav )
			.on( 'click', '.w-nav-close', self._events.closeMobileMenu )
			.on( 'click', '.w-nav-anchor, .w-hwrapper-link', self._events.closeMobileMenuOnClick )
			.on( 'click', '.w-nav-control', self._events.toggleMobileMenu )
			.on( 'closeMobileMenu', self._events.closeMobileMenu );

		// Open dropdown on click
		if ( self.openDropdownOnClick ) {
			self.$container.on( 'click', '.menu-item.togglable > .w-nav-anchor', self._events.toggleMenuOnClick );

			// Close on outside menu click
			$us.$document.on( 'mouseup touchend.noPreventDefault', self._events.closeOnClickOutside );
		}

		// Triggered in `$us.header.setView()`
		$us.$document
			.on( 'usHeader.update_view', self._events.resize );

		$us.$window
			.on( 'resize', $ush.debounce( self._events.resize, 5 ) );

		// Fix "Safari outline webkit bug #243289"
		if ( $ush.isSafari ) {
			self.$mobileMenu.on( 'mouseup', () => {
				self.$mobileMenu.attr( 'style', 'outline: none' );
			} );
		}

		// Add anchors from reusable blocks
		self.$reusableBlocksLinks.each( ( index, anchor ) => {
			if ( $( anchor ).parents( '.w-popup-wrap' ).length === 0 ) {
				self.$anchors.push( anchor );
			}
		} );

		// Close the main menu on tablets after a submenu click (since tablets don’t support hover)
		if ( $.isMobile && self.type === 'desktop' ) {
			self.$list.on( 'click', '.w-nav-anchor[class*="level_"]', ( e ) => {
				const $target = $( e.currentTarget );
				const $menuItem = $target.closest( '.menu-item' );
				if ( $target.usMod('level') > 1 && ! $menuItem.hasClass( 'menu-item-has-children' ) ) {
					$target.parents( '.menu-item.opened' ).removeClass( 'opened' );
				}
			} );
		}

		self.$itemsHasChildren.each( ( _, menuItem ) => {
			const $menuItem = $( menuItem );

			// Mark toggleable items
			const $parent = $menuItem.closest( '.menu-item' );
			if ( $parent.length === 0 || $parent.usMod( 'columns' ) === false ) {
				$menuItem.addClass( 'togglable' );
			}

			// Behavior of menu items on mobile
			const $arrow = $( '.w-nav-arrow:first', $menuItem );
			const $subAnchor = $( '.w-nav-anchor:first', $menuItem );
			const dropByLabel = $menuItem.hasClass( 'mobile-drop-by_label' ) || $menuItem.parents( '.menu-item' ).hasClass( 'mobile-drop-by_label' );
			const dropByArrow = $menuItem.hasClass( 'mobile-drop-by_arrow' ) || $menuItem.parents( '.menu-item' ).hasClass( 'mobile-drop-by_arrow' );

			if ( dropByLabel || ( self.opts.mobileBehavior && ! dropByArrow ) ) {
				$subAnchor.on( 'click', self._events.handleMobileClick );
			} else {
				$arrow.on( 'click', self._events.handleMobileClick );
				$arrow.on( 'click', self._events.handleKeyboardNav );
			}
		} );

		// Touchscreen handling on desktop devices
		if ( ! $us.$html.hasClass( 'no-touch' ) ) {
			self.$list.on( 'click', '.menu-item-has-children.togglable > .w-nav-anchor', ( e ) => {
				if ( self.type === 'mobile' ) {
					return;
				}
				e.preventDefault();
				const $target = $( e.currentTarget );
				const $menuItem = $target.parent();
				if ( $menuItem.hasClass( 'opened' ) ) {
					return location.assign( $target.attr( 'href' ) );
				}
				$menuItem.addClass( 'opened' );
				const onOutsideClick = ( e ) => {
					if ( $.contains( $menuItem[0], e.target ) ) {
						return;
					}
					$menuItem.removeClass( 'opened' );
					$us.$body.off( 'touchstart', onOutsideClick );
				};
				$us.$body.on( 'touchstart.noPreventDefault', onOutsideClick );
			} );
		}

		$us.$document.on( 'keydown', ( e ) => {

			// Fix Safari outline webkit bug #243289
			if ( $ush.isSafari ) {
				self.$mobileMenu.removeAttr( 'style' );
			}

			// Close mobile menu on ESC
			if ( e.keyCode === $ush.ESC_KEYCODE && self.type === 'mobile' && self.mobileNavOpened ) {
				self.closeMobileMenu();
			}

			// Close submenus when navigating outside the menu
			if ( e.keyCode === $ush.TAB_KEYCODE && self.type === 'desktop' && ! $( e.target ).closest( '.w-nav' ).length ) {
				self.$items.removeClass( 'opened' );
			}
		} );

		$ush.timeout( () => {
			self.resize();
			$us.header.$container.trigger( 'contentChange' );
		}, 50 );
	};

	// Mobile navigation API.
	$.extend( usNav.prototype, {

		/**
		 * Mobile menu toggle button.
		 *
		 * @param {Event} e
		 */
		toggleMobileMenu: function( e ) {
			const self = this;

			e.preventDefault();

			self.mobileNavOpened = ! self.mobileNavOpened;

			// Close on outside menu click
			$us.$document.on( 'mouseup touchend.noPreventDefault', self._events.closeOnClickOutside );

			// Make empty links focusable and clickable to open dropdown
			self.$anchors.each( ( _, node ) => { node.href = node.href || 'javascript:void(0)'; } );

			if ( self.mobileNavOpened ) {

				// Close other opened menus
				$( '.l-header .w-nav' ).not( self.$container ).each( ( _, node ) => {
					$( node ).trigger( 'closeMobileMenu' );
				} );

				// Close opened sublists
				self.$mobileMenu.addClass( 'active' ).focus();
				self.$items.filter( '.opened' ).removeClass( 'opened' );
				self.$childLists.resetInlineCSS( 'display', 'height', 'opacity' );
				if ( self.layout === 'dropdown' ) {
					self.$list.slideDownCSS( SLIDE_DURATION, () => $us.header.$container.trigger( 'contentChange' ) );
				}
				$us.$html.addClass( 'w-nav-open' );
				self.$mobileMenu.attr( 'aria-expanded', 'true' );
				$us.mobileNavOpened++;

				// Close mobile menu when focus is outside the menu
				$us.$document.on( 'focusin', self._events.closeMobileMenuOnFocusIn );

			} else {
				self.closeMobileMenu();
			}

			$us.$canvas.trigger( 'contentChange' );
		},

		/**
		 * Handle click on mobile.
		 *
		 * @param {Event} e
		 */
		handleMobileClick: function( e ) {
			const self = this;
			if ( self.type === 'mobile' ) {
				e.stopPropagation();
				e.preventDefault();
				const $menuItem = $( e.currentTarget ).closest( '.menu-item' );
				self.switchMobileSubMenu( $menuItem, ! $menuItem.hasClass( 'opened' ) );
			}
		},

		/**
		 * Switch mobile submenu items.
		 *
		 * @param {Node} $menuItem
		 * @param {Boolean} opened
		 */
		switchMobileSubMenu: function( $menuItem, opened ) {
			const self = this;
			if ( self.type !== 'mobile' ) {
				return;
			}
			const $subMenu = $menuItem.children( '.w-nav-list' );
			if ( opened ) {
				$menuItem.addClass( 'opened' );
				$subMenu.slideDownCSS( SLIDE_DURATION, () => $us.header.$container.trigger( 'contentChange' ) );
			} else {
				$menuItem.removeClass( 'opened' );
				$subMenu.slideUpCSS( SLIDE_DURATION, () => $us.header.$container.trigger( 'contentChange' ) );
			}
		},

		/**
		 * Close mobile menu on focus leave.
		 *
		 * @event handler
		 */
		closeMobileMenuOnFocusIn: function() {
			const self = this;
			if ( ! $.contains( self.$container[0], document.activeElement ) ) {
				self.closeMobileMenu();
			}
		},

		/**
		 * Close mobile menu.
		 */
		closeMobileMenu: function() {
			const self = this;
			if ( self.type !== 'mobile' ) {
				return;
			}
			self.mobileNavOpened = false;
			self.$mobileMenu.removeClass( 'active' );
			$us.$html.removeClass( 'w-nav-open' );
			self.$mobileMenu.attr( 'aria-expanded', 'false' );

			if ( self.$list && self.layout === 'dropdown' ) {
				self.$list.slideUpCSS( SLIDE_DURATION );
			}

			$us.mobileNavOpened--;
			self.$mobileMenu[0].focus();
			$us.$canvas.trigger( 'contentChange' );

			$us.$document
				.off( 'focusin', self._events.closeMobileMenuOnFocusIn )
				.off( 'mouseup touchend.noPreventDefault', self._events.closeOnClickOutside );
		},

		/**
		 * Close on anchor click (mobile).
		 *
		 * @param {Event} e
		 */
		closeMobileMenuOnClick: function( e ) {
			const self = this;
			const $menuItem = $( e.currentTarget ).closest( '.menu-item' );
			const dropByLabel = $menuItem.hasClass( 'mobile-drop-by_label' ) || $menuItem.parents( '.menu-item' ).hasClass( 'mobile-drop-by_label' );
			const dropByArrow = $menuItem.hasClass( 'mobile-drop-by_arrow' ) || $menuItem.parents( '.menu-item' ).hasClass( 'mobile-drop-by_arrow' );

			if ( self.type !== 'mobile' || $us.header.isVertical() ) {
				return;
			}
			if (
				dropByLabel
				|| ( self.opts.mobileBehavior && $menuItem.hasClass( 'menu-item-has-children' ) && ! dropByArrow )
			) {
				return;
			}

			self.closeMobileMenu();
		},

	} );

	// Global navigation API
	$.extend( usNav.prototype, {

		/**
		 * Open/close dropdown on click.
		 *
		 * @param {Event} e
		 */
		toggleMenuOnClick: function( e ) {
			const self = this;

			if ( self.type === 'mobile' ) {
				return;
			}

			const $menuItem = $( e.currentTarget ).closest( '.menu-item' );
			const opened = ! $menuItem.hasClass( 'opened' );

			if ( ! self.keyboardNavEvent ) {
				e.preventDefault();
				e.stopPropagation();
			} else {
				return;
			}

			$menuItem.toggleClass( 'opened', opened );

			// Events for open items
			if ( opened ) {
				self.closeOnMouseOver( e );

			} else {
				$( '.menu-item-has-children.opened', $menuItem ).removeClass( 'opened' );
			}
		},

		/**
		 * Close menu on click outside.
		 *
		 * @param {Event} e
		 */
		closeOnClickOutside: function( e ) {
			const self = this;

			if ( self.mobileNavOpened && self.type === 'mobile' ) {
				if (
					! self.$mobileMenu.is( e.target )
					&& ! self.$mobileMenu.has( e.target ).length
					&& ! self.$list.is( e.target )
					&& ! self.$list.has( e.target ).length
				) {
					self.closeMobileMenu();
				}

			} else if (
				self.$itemsHasChildren.hasClass( 'opened' )
				&& ! $.contains( self.$container[0], e.target )
			) {
				self.$itemsHasChildren.removeClass( 'opened' );
			}
		},

		/**
		 * Close tab-opened items on hover of other items.
		 *
		 * @param {Event} e
		 */
		closeOnMouseOver: function( e ) {
			const self = this;
			if ( self.type === 'mobile' ) {
				return;
			}
			const $target = $( e.target );
			const $itemHasChildren = $target.closest( '.menu-item-has-children' );
			const $menuItemLevel1 = $target.closest( '.menu-item.level_1' );
			self.$itemsHasChildren.not( $itemHasChildren ).not( $menuItemLevel1 ).removeClass( 'opened' );
		},

		/**
		 * Handle keydown events.
		 *
		 * @param {Event} e
		 */
		handleKeyboardNav: function( e ) {
			const self = this;
			const keyCode = e.keyCode || e.which;
			const $target = $( e.target );
			const $menuItem = $target.closest( '.menu-item' );
			const $menuItemLevel1 = $target.closest( '.menu-item.level_1' );
			const $itemHasChildren = $target.closest( '.menu-item-has-children' );

			// Mobile menu handlers
			if ( self.type === 'mobile' ) {
				if ( [ $ush.ENTER_KEYCODE, $ush.SPACE_KEYCODE ].includes( keyCode ) && $target.is( self.$arrows ) ) {
					e.stopPropagation();
					e.preventDefault();
					self.switchMobileSubMenu( $menuItem, ! $menuItem.hasClass( 'opened' ) );
				}
				if ( keyCode === $ush.TAB_KEYCODE ) {
					if ( e.shiftKey && self.$anchors.index( $target ) === 0 ) {
						self.closeMobileMenu();
					}
				}
			}

			// Desktop menu handlers
			if ( self.type === 'desktop' ) {
				if ( [ $ush.ENTER_KEYCODE, $ush.SPACE_KEYCODE ].includes( keyCode ) && $target.is( self.$arrows ) ) {
					e.preventDefault();

					// Close items opened via tab on hover over other items
					self.$itemsHasChildren
						.off( 'mouseover', self._events.closeOnMouseOver )
						.one( 'mouseover', self._events.closeOnMouseOver );

					if ( ! $itemHasChildren.hasClass( 'opened' ) ) {
						$itemHasChildren
							.addClass( 'opened' )
							.siblings()
							.removeClass( 'opened' );

						self.$itemsHasChildren.not( $itemHasChildren ).not( $menuItemLevel1 ).removeClass( 'opened' );

						self.$arrows.attr( 'aria-expanded', 'false' );
						$target.attr( 'aria-expanded', 'true' );

					} else {
						$itemHasChildren.removeClass( 'opened' );
						$target.attr( 'aria-expanded', 'false' );
					}
				}
				if ( keyCode === $ush.ESC_KEYCODE ) {
					if ( $menuItemLevel1.hasClass( 'opened' ) ) {
						$( '.w-nav-arrow:first', $menuItemLevel1 ).focus();
					}
					self.$items.removeClass( 'opened' );
					self.$arrows.attr( 'aria-expanded', 'false' );
				}

				self.keyboardNavEvent = true;
				$ush.timeout( () => { self.keyboardNavEvent = false; }, 1 );
			}
		},

		/**
		 * Resize handler.
		 */
		resize: function() {
			const self = this;

			if ( self.$container.length === 0 ) {
				return;
			}

			const newType = ( window.innerWidth < self.opts.mobileWidth ) ? 'mobile' : 'desktop';

			if ( $us.header.orientation !== self.headerOrientation || newType !== self.type ) {

				self.$childLists.resetInlineCSS( 'display', 'height', 'opacity' );

				if ( self.headerOrientation === 'hor' && self.type === 'mobile' ) {
					self.$list.resetInlineCSS( 'display', 'height', 'opacity' );
				}

				self.$items.removeClass( 'opened' );
				self.headerOrientation = $us.header.orientation;
				self.type = newType;
				self.$container.usMod( 'type', newType );
			}

			self.$list.removeClass( 'hide_for_mobiles' );
		},

	} );

	$.fn.usNav = function() {
		return this.each( function() {
			$( this ).data( 'usNav', new usNav( this ) );
		} );
	};

	$( '.l-header .w-nav' ).usNav();

}( jQuery );
