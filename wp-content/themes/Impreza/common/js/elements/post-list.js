/**
 * UpSolution Element: Post List
 */
;( function( $, _undefined ) {
	"use strict";

	const DELETE_FILTER = null;

	/**
	 * @param {Node} container.
	 */
	function usPostList( container ) {
		const self = this;

		// Private "variables"
		self.data = {
			paged: 1,
			max_num_pages: 1,
			paginationBase: 'page',
			pagination: 'none',
			ajaxUrl: $us.ajaxUrl,
			ajaxData: {
				us_ajax_list_pagination: 1,
			},
			facetedFilter: {},
		};
		self.listFilterUid = null;
		self.uid = $ush.uniqid();
		self.xhr;

		// Elements
		self.$container = $( container );
		self.$list = $( '.w-grid-list', container );
		self.$loadmore = $( '.g-loadmore', container );
		self.$pagination = $( 'nav.pagination', container );
		self.$none = self.$container.next( '.w-grid-none' );

		self.isCurrentQuery = self.$container.hasClass( 'for_current_wp_query' );

		// Get element settings
		const $opts = $( '.w-grid-list-json:first', container );
		if ( $opts.is( '[onclick]' ) ) {
			$.extend( self.data, $opts[0].onclick() || {} );
		}
		$opts.remove();

		self.paginationType = $ush.toString( self.data.pagination );
		self.hideIsEmpty = self.$container.closest( '.hide_if_inner_list_is_empty' ).length > 0;

		// Bondable events
		self._events = {
			addNextPage: self._addNextPage.bind( self ),
			initMagnificPopup: self.initMagnificPopup.bind( self ),

			usListOrder: self.usListOrder.bind( self ),
			usListSearch: self.usListSearch.bind( self ),
			usListFilter: self.usListFilter.bind( self ),

			usbReloadIsotopeLayout: self.usbReloadIsotopeLayout.bind( self ),
		};

		// Load posts on button click or page scroll
		if ( self.paginationType === 'load_on_btn' ) {
			self.$loadmore.on( 'mousedown', 'button', self._events.addNextPage );

		} else if ( self.paginationType === 'load_on_scroll' ) {
			$us.waypoints.add( self.$loadmore, /* offset */'-70%', self._events.addNextPage );
		}

		// Events
		self.$container
			.add( self.$none )
			.on( 'usListSearch', self._events.usListSearch )
			.on( 'usListOrder', self._events.usListOrder )
			.on( 'usListFilter', self._events.usListFilter );
		self.$list
			.on( 'click', '[ref=magnificPopup]', self._events.initMagnificPopup )

		// Open posts in popup
		if ( self.$container.hasClass( 'open_items_in_popup' ) ) {
			new $us.usPopup().popupPost( self.$container );
		}

		// Initialize Masonry.
		// @see https://isotope.metafizzy.co
		if ( self.$container.hasClass( 'type_masonry' ) ) {
			self.$list.imagesLoaded( () => {

				const isotopeOptions = {
					itemSelector: '.w-grid-item',
					layoutMode: ( self.$container.hasClass( 'isotope_fit_rows' ) ) ? 'fitRows' : 'masonry',
					isOriginLeft: ! $( '.l-body' ).hasClass( 'rtl' ),
					transitionDuration: 0
				};

				var columnWidth;
				if ( $( '.size_1x1', self.$list ).length > 0 ) {
					columnWidth = '.size_1x1';
				} else if ( $( '.size_1x2', self.$list ).length > 0 ) {
					columnWidth = '.size_1x2';
				} else if ( $( '.size_2x1', self.$list ).length >0 ) {
					columnWidth = '.size_2x1';
				} else if ( $( '.size_2x2', self.$list ).length > 0 ) {
					columnWidth = '.size_2x2';
				}
				if ( columnWidth ) {
					columnWidth = columnWidth || '.w-grid-item';
					isotopeOptions.masonry = { columnWidth: columnWidth };
				}

				// Run CSS animations locally after rendering elements in Isotope.
				self.$list.on( 'layoutComplete', () => {
					if ( _window.USAnimate ) {
						$( '.w-grid-item.off_autostart', self.$list ).removeClass( 'off_autostart' );
						new USAnimate( self.$list );
					}
					// Trigger scroll event to check positions for `$us.waypoints`.
					$us.$window.trigger( 'scroll.waypoints' );
				} );

				self.$list.isotope( isotopeOptions );

				$us.$canvas.on( 'contentChange', () => {
					self.$list.imagesLoaded( () => {
						self.$list.isotope( 'layout' );
					} );
				} );
			} );

			self.$container.on( 'usbReloadIsotopeLayout', self._events.usbReloadIsotopeLayout );
		}

		// List Result Counter element
		self.initListResultCounter();
	}

	// Post List API
	$.extend( usPostList.prototype, {

		/**
		 * Sets the search string from "List Search".
		 *
		 * @event handler
		 * @param {Event} e
		 * @param {String} name
		 * @param {String} value The search text.
		 */
		usListSearch: function( e, name, value ) {
			this.applyFilter( name, value );
		},

		/**
		 * Sets orderby from "List Order".
		 *
		 * @event handler
		 * @param {Event} e
		 * @param {String} name
		 * @param {String} value The search text.
		 */
		usListOrder: function( e, name, value ) {
			this.applyFilter( name, value );
		},

		/**
		 * Sets values from "List Filter".
		 *
		 * @event handler
		 * @param {Event} e
		 * @param {{}} values
		 */
		usListFilter: function( e, values ) {
			const self = this;
			$.each( values, self.applyFilter.bind( self ) );
		},

		/**
		 * Adds next page.
		 *
		 * @event handler
		 */
		_addNextPage: function() {
			const self = this;
			if ( $ush.isUndefined( self.xhr ) && ! self.$none.is( ':visible' ) ) {
				self.addItems();
			}
		},

		/**
		 * Apply param to "Post/Product List".
		 *
		 * @param {String} name
		 * @param {String} value
		 */
		applyFilter: function( name, value ) {
			const self = this;
			if ( $ush.toString( value ) == '{}' ) {
				value = DELETE_FILTER;
			}

			// only save
			if ( name === 'list_filters' ) {
				$.extend( value, JSON.parse( self.data.ajaxData[ name ] || '{}' ) );
				self.data.ajaxData[ name ] = JSON.stringify( value );
				return;
			}
			if ( name === 'list_filter_uid' ) {
				self.listFilterUid = value;
				return;
			}

			// Reset pagination
			const pathname = location.pathname;
			const PAGINATION_PAGE_PATTERN = new RegExp( `\/${self.data.paginationBase}\/?([0-9]{1,})\/?$` );
			if ( PAGINATION_PAGE_PATTERN.test( pathname ) ) {
				history.pushState( {}, '', location.href.replace( pathname, pathname.replace( PAGINATION_PAGE_PATTERN, '' ) + '/' ) );
			}
			self.data.paged = 0;

			if ( self.isCurrentQuery ) {
				self.data.ajaxUrl = $ush
					.urlManager( self.data.ajaxUrl )
					.set( name, value )
					.toString();

			} else if ( value === DELETE_FILTER ) {
				delete self.data.ajaxData[ name ];

			} else {
				self.data.ajaxData[ name ] = value;
			}

			if ( ! $ush.isUndefined( self.xhr ) ) {
				self.xhr.abort();
			}
			self.addItems( /* apply filter */true );
		},

		/**
		 * Scrolls to the beginning of the list.
		 */
		scrollToList: function() {
			const self = this;

			if ( self.data.paged > 1 ) {
				return;
			}

			const offsetTop = $ush.parseInt( self.$container.offset().top );
			if ( ! offsetTop ) {
				return;
			}

			const scrollTop = $us.$window.scrollTop();

			if (
				! $ush.isNodeInViewport( self.$container[0] )
				|| offsetTop >= ( scrollTop + window.innerHeight )
				|| scrollTop >= offsetTop
			) {
				$us.$htmlBody
					.stop( true, false )
					.animate( { scrollTop: ( offsetTop - $us.header.getInitHeight() ) }, 500 );
			}
		},

		/**
		 * Adds items to element.
		 *
		 * @param {Boolean} listFiltersApplied
		 */
		addItems: function( listFiltersApplied ) {
			const self = this;

			self.data.paged += 1;
			if ( ! listFiltersApplied && self.data.paged > self.data.max_num_pages ) {
				return;
			}

			if ( listFiltersApplied ) {
				self.$container.addClass( 'filtering' );

				// Show spinner for filtering action only if set in options
				if ( self.$container.hasClass( 'preload_style_spinner' ) ) {
					self.$loadmore.removeClass( 'hidden' ).addClass( 'loading' );
				}

				// Always show spinner for pagination action
			} else {
				self.$loadmore.removeClass( 'hidden' ).addClass( 'loading' );
			}

			if ( ! self.hideIsEmpty ) {
				self.$container.removeClass( 'hidden' );
			}
			self.$pagination.addClass( 'hidden' );

			// Get request link and data
			var ajaxUrl = $ush.toString( self.data.ajaxUrl ),
				ajaxData = $ush.clone( self.data.ajaxData ),
				numPage = $ush.rawurlencode( '{num_page}' );

			if ( ajaxUrl.includes( numPage ) ) {
				ajaxUrl = ajaxUrl.replace( numPage, self.data.paged );

			} else if ( ajaxData.template_vars ) {
				ajaxData.template_vars = JSON.stringify( ajaxData.template_vars ); // convert for `us_get_HTTP_POST_json()`
				ajaxData.paged = self.data.paged;
			}

			self.xhr = $.ajax( {
				type: 'post',
				url: ajaxUrl,
				dataType: 'html',
				cache: false,
				data: ajaxData,
				success: ( html ) => {

					// Remove previous items when filtered
					if ( listFiltersApplied ) {
						self.$list.html('');
						self.$none.addClass( 'hidden' );
					}

					// Reload element settings
					var $listJson = $( '.w-grid-list-json:first', html );
					if ( $listJson.is( '[onclick]' ) ) {

						// Fix for WP Rocket "Delay JavaScript execution", see issue #5131
						if ( $listJson[0].onclick === null ) {
							$listJson[0].onclick = new Function( $listJson.attr('onclick') );
						}
						$.extend( true, self.data, $listJson[0].onclick() || {} );
					}

					var $items = $( html ).find( '.w-grid-list' ).first().children();
					const numAjaxParams = Object.keys( $ush.urlManager( self.data.ajaxUrl ).toJson( false ) ).length;

					var filterIsClear = numAjaxParams <= 1;
					if ( self.paginationType === 'numbered' ) {
						filterIsClear = numAjaxParams < 1;
					}

					// List items loaded
					$ush.timeout( () => {
						const data = {
							postListUid: self.uid,
							listFilterUid: self.listFilterUid,
							listFiltersApplied: listFiltersApplied,
						};
						// NOTE: Use `$items` as the first argument to ensure backward compatibility with custom solutions.
						$us.$document.trigger( 'usPostList.itemsLoaded', [ $items, data ] );
					}, 50 );

					if ( self.hideIsEmpty ) {
						self.$container.toggleClass( 'hidden', $items.length === 0 );
					}

					// Case when there are no results
					if ( ! $items.length ) {
						if ( ! self.$none.length ) {
							self.$none = $( '.w-grid-none:first', html );
							if ( ! self.$none.length ) {
								self.$none = $( html ).filter( '.w-grid-none:first' );
							}
							self.$container.after( self.$none );
						}
						self.$container.removeClass( 'filtering' );
						self.$loadmore.addClass( 'hidden' );
						self.$pagination.addClass( 'hidden' );
						self.$none.removeClass( 'hidden' );
						return;
					}

					// Output of results
					if ( self.$container.hasClass( 'type_masonry' ) ) {
						self.$list
							.isotope( 'insert', $items )
							.isotope( 'reloadItems' );
					} else {
						self.$list.append( $items );
					}

					// Init animation handler for new items
					if ( window.USAnimate && self.$container.hasClass( 'with_css_animation' ) ) {
						new USAnimate( self.$list );
						$us.$window.trigger( 'scroll.waypoints' );
					}

					// Case with numbered pagination
					if ( self.paginationType == 'numbered' ) {
						const $pagination = $( 'nav.pagination', html );
						if ( $pagination.length && ! self.$pagination.length ) {
							self.$list.after( $pagination.prop( 'outerHTML' ) );
							self.$pagination = self.$list.next( 'nav.pagination' );
						}
						if ( self.$pagination.length && $pagination.length ) {
							self.$pagination.html( $pagination.html() ).removeClass( 'hidden' );

						} else {
							self.$pagination.addClass( 'hidden' );
						}
					}

					// Case when the last page is loaded
					if ( self.data.paged >= self.data.max_num_pages ) {
						self.$loadmore.addClass( 'hidden' );
						self.$none.addClass( 'hidden' );

					} else {
						self.$loadmore.removeClass( 'hidden' );
					}

					// Adds point to load the next page
					if ( self.paginationType == 'load_on_scroll' ) {
						$us.waypoints.add( self.$loadmore, /* offset */'-70%', self._events.addNextPage );
					}

					$us.$canvas.trigger( 'contentChange' );
				},
				complete: () => {
					self.$container.removeClass( 'filtering' );
					self.$loadmore.removeClass( 'loading' );
					if ( self.paginationType === 'load_on_scroll' ) {
						self.$loadmore.addClass( 'hidden' );
					}
					delete self.xhr;

					// Scroll to top of list
					self.scrollToList();
				}
			} );
		},

		/**
		 * Reload layout in the Live Builder context.
		 *
		 * @event handler
		 */
		usbReloadIsotopeLayout: function() {
			const self = this;
			if ( self.$container.hasClass( 'with_isotope' ) ) {
				self.$list.isotope( 'layout' );
			}
		},
	} );

	// List Result Counter functionality
	$.extend( usPostList.prototype, {

		/**
		 * Initializing List Result Counter.
		 */
		initListResultCounter: function() {
			const self = this;
			const listResultCounterOpts = [];

			// Elements
			self.$listResultCounter = $( '.w-list-result-counter' );

			if ( ! ( self.$listResultCounter.length && self.isCurrentQuery ) ) {
				return;
			}

			// Load options
			self.$listResultCounter.each( ( _, node ) => {
				const $node = $( node );
				if ( $node.is( '[onclick]' ) ) {
					listResultCounterOpts.push( node.onclick() || {} );
					$node.removeAttr( 'onclick' );
				}
			} );

			// Events
			self._events.updateCountResults = function ( _, $items, data ) {
				if ( data.postListUid === self.uid ) {
					$.each( listResultCounterOpts, ( index, opts ) => {
						const foundPosts = ( self.paginationType === 'none' )
							? $( '> *', self.$list ).length
							: self.data.ajaxData.found_posts;
						self.countResult( foundPosts, opts, index );
					} );
				}
			};
			$us.$document.on( 'usPostList.itemsLoaded', self._events.updateCountResults );

			const numAjaxParams = Object.keys( $ush.urlManager( self.data.ajaxUrl ).toJson( false ) ).length;

			// Get total unfiltered from Post/Product list $wp_query
			$.ajax( {
				url: $us.ajaxUrl,
				type: 'POST',
				dataType: 'json',
				data: {
					action: 'us_list_result_counter_total',
					query_args_unfiltered: self.data.facetedFilter.query_args_unfiltered,
				},
				success: ( res ) => {
					if ( ! res.success ) {
						console.error( res.data.message );
						return;
					}

					// Check it here because we need compare below even if value is 0
					if ( res.data.total_unfiltered ) {
						$( '.total-unfiltered', self.$listResultCounter ).text( res.data.total_unfiltered );
					}

					// Always count result if global $wp_query different from Post/Product list $wp_query
					$.each( listResultCounterOpts, ( index, opts ) => {
						if (
							opts.totalUnfiltered !== res.data.total_unfiltered
							&& self.paginationType !== 'none'
							&& numAjaxParams <= 1
						) {
							self.countResult( self.data.ajaxData.found_posts, opts, index );
						}
					} );
				},
			} );

			// Always count result for pagination type "none" on load for correct [upper] result
			if ( self.paginationType === 'none' && numAjaxParams <= 1 ) {
				$.each( listResultCounterOpts, ( index, opts ) => {
					self.countResult( $( '> *', self.$list ).length, opts, index );
				} );
			}

			// Count result on load if filter is active
			if ( self.paginationType === 'numbered' ) {
				if ( ! ( numAjaxParams < 1 ) ) {
					$.each( listResultCounterOpts, ( index, opts ) => {
						self.countResult( self.data.ajaxData.found_posts, opts, index );
					} );
				}

			} else if ( ! ( numAjaxParams <= 1 ) ) {
				const total = ( self.paginationType === 'none' )
					? $( '> *', self.$list ).length
					: self.data.ajaxData.found_posts;
				$.each( listResultCounterOpts, ( index, opts ) => {
					self.countResult( total, opts, index );
				} );
			}
		},

		/**
		 * Counts the number of results ( List Result Counter element )
		 *
		 * @param {Number} total
		 * @param {Object} opts
		 * @param {Number} index
		 */
		countResult: function( total, opts, index ) {
			const self = this;
			if (
				! self.$listResultCounter.length
				|| ! self.isCurrentQuery
				|| $us.usbPreview()
			) {
				return;
			}

			const $listResultCounter = self.$listResultCounter.eq( index );
			const $noResultsSpan = $( '.no-results', $listResultCounter );
			const $oneResultSpan = $( '.one-result', $listResultCounter );
			const $mainSpan = $( 'span:first-child', $listResultCounter );

			$listResultCounter.show();
			$mainSpan.show();
			$noResultsSpan.addClass( 'hidden' );
			$oneResultSpan.addClass( 'hidden' );

			const lower = [ 'load_on_scroll', 'load_on_btn' ].includes( self.paginationType )
				? 1
				: ( self.data.paged - 1 ) * opts.perPage + 1;

			const upper = self.paginationType === 'none'
				? $( '> *', self.$list ).length
				: Math.min( total, self.data.paged * opts.perPage );

			if ( total === 1 ) {
				$mainSpan.hide();
				$oneResultSpan.removeClass( 'hidden' );
			} else if ( total === 0 ) {
				if ( $noResultsSpan.length ) {
					$mainSpan.hide();
					$noResultsSpan.removeClass( 'hidden' );
				} else {
					$listResultCounter.hide();
				}
			} else {
				$( '.lower', $listResultCounter ).text( lower );
				$( '.upper', $listResultCounter ).text( upper );
				$( '.total', $listResultCounter ).text( total );
			}
		},
	} );

	// Popup window functionality
	$.extend( usPostList.prototype, {

		/**
		 * Initializing MagnificPopup for AJAX loaded items
		 *
		 * @param {Event} e
		 */
		initMagnificPopup: function( e ) {
			e.stopPropagation();
			e.preventDefault();
			const $target = $( e.currentTarget );
			if ( $target.data( 'magnificPopup' ) === _undefined ) {
				$target.magnificPopup( {
					type: 'image',
					mainClass: 'mfp-fade'
				} );
				$target.trigger( 'click' );
			}
		},
	} );

	$.fn.usPostList = function() {
		return this.each( function() {
			$( this ).data( 'usPostList', new usPostList( this ) );
		} );
	};

	$( () => $( '.w-grid.us_post_list, .w-grid.us_product_list' ).usPostList() );

} )( jQuery );
