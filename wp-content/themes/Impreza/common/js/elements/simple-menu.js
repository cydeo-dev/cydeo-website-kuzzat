/**
 * Simple menu that can be placed anywhere in the content
 */
! function( $, _undefined ) {
	"use strict";

	window.$us = window.$us || {};

	const SLIDE_DURATION = 250;

	function usSimpleNav( container ) {
		const self = this;

		// Elements
		self.$container = $( container );

		if ( self.$container.length === 0 ) {
			return;
		}

		self.$items = $( '.menu-item', self.$container );
		self.$menuItemHasChildren = $( '.menu-item-has-children', self.$container );

		// Init inline CSS to prevent jump on first interaction
		self.$menuItemHasChildren.each( ( _, section ) => {
			const $section = $( section );
			if ( ! $section.hasClass( 'current-menu-ancestor' ) ) {
				self.closeSection( $section );
			}
		} );

		// Bondable events
		self._events = {
			toggleAccordionSection: self.toggleAccordionSection.bind( self ),
			keyboardToggleAccordionSection: self.keyboardToggleAccordionSection.bind( self ),
		}

		self.$container
			.on( 'click', '.menu-item-has-children > a', self._events.toggleAccordionSection )
			.on( 'keydown', '.menu-item-has-children > a', self._events.keyboardToggleAccordionSection );
	}

	$.extend( usSimpleNav.prototype, {

		toggleAccordionSection: function( e ) {
			const self = this;
			const $target = $( e.target );
			const $clickedSection = $target.closest( '.menu-item-has-children' );

			e.preventDefault();
			e.stopImmediatePropagation();

			if ( ! self.$container.hasClass( 'allow_multiple_open' ) ) {
				self.closeOtherSections( $clickedSection );
			}

			if ( $clickedSection.hasClass( 'expanded' ) ) {
				self.closeSection( $clickedSection );
			} else {
				self.openSection( $clickedSection );
			}

			return false;
		},

		keyboardToggleAccordionSection: function( e ) {
			const self = this;
			const $target = $( e.target );

			if (
				[ $ush.ENTER_KEYCODE, $ush.SPACE_KEYCODE ].includes( e.keyCode || e.which )
				&& $target.parent( '.menu-item-has-children' ).length !== 0
			) {
				e.preventDefault(); // prevent click event from firing on keypress thus doubling function call
				self.toggleAccordionSection( e );
			}
		},

		openSection: function( $section ) {
			$section.addClass( 'expanded' );
			$section.children( 'a' ).attr( 'aria-expanded', 'true' );
			$section.children( '.sub-menu' ).slideDownCSS( SLIDE_DURATION );
		},

		closeSection: function( $section ) {
			$section.removeClass( 'expanded' );
			$section.children( 'a' ).attr( 'aria-expanded', 'false' );
			$section.children( '.sub-menu' ).slideUpCSS( SLIDE_DURATION );
		},

		closeOtherSections: function( $selectedSection ) {
			const self = this;
			const $selectedSectionParents = $selectedSection.parentsUntil( '.w-menu' );
			
			self.$menuItemHasChildren.each( ( _, section ) => {
				const $section = $( section );
				if (
					// Do not close the currently clicked section
					section != $selectedSection[0]
					&& $section.hasClass( 'expanded' )
					// Do not close parent sections of the clicked section
					&& ! $selectedSectionParents.is( $section )
				) {
					self.closeSection( $section );
				}
			} );
		}

	} );

	$.fn.usSimpleNav = function() {
		return this.each( function() {
			$( this ).data( 'usSimpleNav', new usSimpleNav( this ) );
		} );
	};

	// Assume that if the menu needs JavaScript - its an Accordion-type menu for optimization
	$( '.w-menu.type_accordion' ).usSimpleNav();

}( jQuery );
