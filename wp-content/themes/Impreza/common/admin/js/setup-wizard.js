;( function( $, _undefined ) {
	"use strict";

	function usSetupWizard( container ) {
		const self = this;

		// Container
		self.$container = $( container );

		// Installation Queue
		self.queue = [];

		// Installation actions container
		self.$installationActionsList = $( '.us-wizard-install-actions-list', self.$container );

		// Data
		self.$data = $( '.us-wizard-json', self.$container );
		if ( ! self.$data.length ) {
			return;
		}
		self.data = self.$data[0].onclick() || {};

		self.steps = self.data.steps || {};
		self.activeStepID = Object.keys( self.steps )[0];
		self.activeStep = self.steps[ self.activeStep ];

		// Top Menu
		self.$menu = $( '.us-wizard-menu', self.$container );

		// From Scratch - Preview
		self.$preview = $( '.us-wizard-preview', self.$container );
		self.$previewIframe = $( 'iframe', self.$preview );
		self.previewParams = {
			header_id: '',
			footer_id: '',
			scheme_id: '',
			font_id: ''
		};

		// Steps
		self.$steps = $( '.us-wizard-step', self.$container );

		// Demos
		self.$demos = $( '.us-wizard-demos-item', self.$container );
		self.$demoFilter = $( '.us-wizard-demos-filters', self.$container );

		// Demo preview
		self.$demoContentOptions = $( '.us-wizard-content-options', self.$container );

		// Common actions
		self.$menu.on( 'click', 'button.us-wizard-menu-item', self.menuClick.bind( self ) );
		self.$container.on( 'click', '.us-wizard-setup-type-item', self.selectType.bind( self ) );
		self.$container.on( 'click', 'button.action-next-step', self.showNextStep.bind( self ) );

		// Filter demos
		self.$demoFilter.on( 'change', 'input', self.filterDemos.bind( self ) );

		// Select Demo
		self.$demos.on( 'click', self.selectDemo.bind( self ) );
		self.$container.on( 'click', '.action-select-content', self.selectDemoContent.bind( self ) );
		self.$demoContentOptions
			.on( 'change', 'label', self.changeContentCheckboxes.bind( self ) );

		// Select From-Scratch param (Header/Footer/Colors/Fonts)
		self.$container.on( 'click', '.us-wizard-templates-item', self.selectFromScratchParam.bind( self ) );

		// Select addons to install
		self.$container.on( 'click', '.us-addon > label', self.selectAddons.bind( self ) );

		// Install selected website
		self.$container.on( 'click', '.action-install-website', self.installContent.bind( self ) );
		
	};

	const prototype = usSetupWizard.prototype;

	/**
	 * Steps
	 */
	$.extend( prototype, {
		selectType: function( e ) {
			const self = this;

			var $target = $( e.target ),
				selectedType;

			if ( ! $target.hasClass( 'us-wizard-setup-type-item' ) ) {
				$target = $target.closest( '.us-wizard-setup-type-item' );
			}
			if ( $target.length ) {
				selectedType = $target.attr( 'for' );
			}
			
			if ( ! selectedType ) {
				return;
			}

			self.selectedType = selectedType;

			// Show menu items for selected type
			$( '.us-wizard-menu-item:not(.type-start, .type-from_scratch)', self.$menu ).addClass( 'hidden' ).prop( 'disabled', true );
			$( '.us-wizard-menu-item.type-' + self.selectedType, self.$menu ).removeClass( 'hidden' );

			// Move layout part of Install step to selected type container
			var $installationActions = $( '.us-wizard-column.for_install-actions' )
				.detach();
			if ( self.selectedType == 'prebuilt' ) {
				$installationActions.appendTo('.us-wizard-step.prebuilt_with_iframe .us-wizard-step-row' );
			} else {
				$installationActions.appendTo('.us-wizard-step.from_scratch_with_iframe .us-wizard-step-row' );
			}

			// Reset installation actions
			self.installationActions = {
				plugins: {},
				content: {},
			};

			// Prepare From Scratch options
			if ( self.selectedType == 'from_scratch' ) {
				self.prepareFromScratchOptions();
			}

			// Find the first step in type and show it
			$.each( self.steps, ( stepID, step ) => {
				if ( step.type == selectedType ) {
					self.showStep( stepID );
					// break execution when first step is found
					return false;
				}
			} );
		},

		showStep: function( stepID ) {
			const self = this;

			var stepsWithIframeFromScratch = [
					'from_scratch_header',
					'from_scratch_footer',
					'from_scratch_colors',
					'from_scratch_fonts',
					'from_scratch_install'
				],
				stepsWithIframePrebuilt = [
					'prebuilt_content',
					'prebuilt_install'
				],
				stepsWithScrollToTemplate = [
					'from_scratch_header',
					'from_scratch_footer',
					'from_scratch_colors',
					'from_scratch_fonts'
				];

			if ( stepID == self.activeStepID ) {
				return;
			}

			self.activeStepID = stepID;
			self.activeStep = self.steps[ stepID ];

			// Hide previous active step
			self.$steps.removeClass( 'active' );

			// Show the current step
			if ( $.inArray( stepID, stepsWithIframeFromScratch ) !== -1 ) {
				self.$steps.filter( '.from_scratch_with_iframe' ).addClass( 'active' );
			} else if ( $.inArray( stepID, stepsWithIframePrebuilt ) !== -1 ) {
				self.$steps.filter( '.prebuilt_with_iframe' ).addClass( 'active' );
			} else {
				self.$steps.filter( '.' + self.activeStepID ).addClass( 'active' );
			}

			// Set menu item active
			$( `[data-step-id="${self.activeStepID}"]`, self.$menu )
				.addClass( 'active' )
				.removeAttr( 'disabled' )
				.siblings( '.us-wizard-menu-item' )
				.removeClass( 'active' );

			// Replace step name in main container class
			self.$container.removeClass( ( index, className ) => {
				return ( className.match( /(^|\s)step-\S+/g ) || [] ).join( ' ' );
			} );
			self.$container.addClass( 'step-' + stepID );

			if ( $.inArray( stepID, stepsWithScrollToTemplate ) !== -1 ) {
				// removing 'from_scratch_' from step ID to get the selected item class
				var templateClass = stepID.substr( 'from_scratch_'.length ),
					$activeItem = $( '.us-wizard-templates-list.for_' + templateClass )
						.find( '.us-wizard-templates-item.active' ),
					scrollTo = 0;

				if ( $activeItem.length ) {
					scrollTo =
						$activeItem.offset().top
						- $( '#wpadminbar' ).innerHeight() - 10 // Padding in the list
				}

				$( 'html, body' ).animate( { scrollTop: scrollTo }, 200 );

			} else {
				$( 'html, body' ).animate( { scrollTop: 0 }, 200 );
			}

			/*
			 * Additional actions for special steps
			 */

			// Disable all menu items for the Success step
			if ( stepID === 'prebuilt_success' || stepID === 'from_scratch_success' ) {
				$( '.us-wizard-menu-item', self.$menu )
					.prop( 'disabled', true )
					.removeClass( 'active' );
			}

			// When selecting header of footer, scroll the preview to see what is selected
			if ( stepID === 'from_scratch_header' || stepID === 'from_scratch_footer' ) {
				self._scrollToElement( stepID.substr( -6 ) );
			}

			// Hide all menu items when going back to start (except the first menu item)
			if ( stepID === 'setup_type' ) {
				$( '.us-wizard-menu-item:not(.type-start)', self.$menu ).addClass( 'hidden' );
			}
		},

		menuClick: function( e ) {
			// Set active selected step
			this.showStep( $( e.currentTarget ).data( 'step-id' ) );
		},

		/**
		 * Next step action
		 *
		 * @param e {Event}
		 */
		showNextStep: function() {
			const self = this;
			var currentStepFound = false;

			// Find the next step and show it
			$.each( self.steps, ( stepID, step ) => {
				// Locate the current step in cycle...
				if ( stepID == self.activeStepID ) {
					// ... mark that cycle went through the current step...
					currentStepFound = true;
					// ... and go to the next item in cycle
					return;
				}
				// If current step was found in previous iteration of cycle...
				if ( currentStepFound ) {
					// ... this is the next step related to current, so show it...
					self.showStep( stepID );
					// ... and break execution
					return false;
				}
			} );

		},

	} );

	/**
	 * Functional for the Prebuilt
	 */
	$.extend( prototype, {
		/**
		 * Select website and insert its preview
		 *
		 * @param e {Event}
		 */
		selectDemo: function( e ) {
			const self = this;
			var $target = $( e.target ),
				$demoItem = $target.closest( '.us-wizard-demos-item' ),
				demoID = $demoItem.data( 'demo-id' ),
				$previewOptions = $( `#demo_content_${demoID}`, self.$demos ) || '',
				demoTitle = $demoItem.find( '.us-wizard-demos-item-title' ).html(),
				previewLink = $demoItem.find( 'a' ).attr( 'href' ),
				$previewTitleAnchor = $( '.us-wizard-step.prebuilt_with_iframe .us-wizard-step-title a', self.$container ),
				$previewFrame = $( '.us-wizard-step.prebuilt_with_iframe iframe', self.$container ),
				previewFrameSrc = $previewFrame.length ? $previewFrame.attr( 'src' ) : '',
				$previewPreloader = $( '.us-wizard-step.prebuilt_with_iframe .g-preloader', self.$container );

			if ( $target.is( 'a' ) ) {
				return;
			}

			self.selectedDemo = demoID;

			// Build preview
			// If Iframe is not showing selected Demo preview already - rebuild the Iframe
			if ( previewFrameSrc != previewLink ) {
				// If another Demo preview was shown in Iframe before - remove the Iframe and show Preloader
				if ( $previewFrame.length ) {
					$previewPreloader.show();
					$previewFrame.remove();
				}

				// Rebuild the Iframe and insert it after the browser bar imitating div
				$previewFrame = $( `<iframe src="${previewLink}?us_setup_wizard_prebuilt_preview=1" frameborder="0"></iframe>` );
				$previewFrame.insertAfter( '.us-wizard-step.prebuilt_with_iframe .us-wizard-preview-bar' );

				// Set the preview link text and URL
				$previewTitleAnchor.html( demoTitle ).attr( 'href', previewLink );

				// Remove Preloader after the Iframe is loaded
				$previewFrame.load(function() {
					$previewPreloader.hide();
				});
			}

			// Set the Content Options checkboxes for selected Demo
			self.$demoContentOptions.html( $previewOptions.html() );

			self.showNextStep();
		},

		/**
		 * Save selected options for the prebuilt
		 */
		selectDemoContent: function() {
			const self = this;
			const $checkboxes = $( 'input[type="checkbox"]:checked', self.$demoContentOptions );

			// Reset installation actions
			self.installationActions = {
				plugins: {},
				content: {},
			};

			// Append US-Core
			if ( self.data.plugins[ 'us-core' ] ) {
				self.installationActions.plugins[ 'us-core' ] = self.data.plugins[ 'us-core' ];
			}

			// Append contents and additional plugins
			$checkboxes.each( ( _, item ) => {
				var $item = $( item ),
					name = $item.attr( 'name' ),
					title = $item.parent().find( 'span.title' ).text(),
					pluginSlug = $item.data( 'plugin' );

				self.installationActions.content[ name ] = title;
				if ( pluginSlug && self.data.plugins[ pluginSlug ] ) {
					self.installationActions.plugins[ pluginSlug ] = self.data.plugins[ pluginSlug ];
				}
			} );

			// Removing children, if checked content_all
			if ( $checkboxes.filter( '[name="content_all"]' ).is( ':checked' ) ) {
				$checkboxes.filter( '.child_checkbox' ).each( ( _, item ) => {
					var $item = $( item ),
						name = $item.attr( 'name' );

					if ( self.installationActions.content[ name ] ) {
						delete self.installationActions.content[ name ];
					}
				} );
			}

			// Prepare and output options for the next install
			self._prepareInstallation( 'prebuilt' );

			self.showNextStep();
		},

		/**
		 * Change checkboxes on the pre-built content
		 *
		 * @param e {Event}
		 */
		changeContentCheckboxes: function( e ) {
			const self = this;
			var $target = $( e.currentTarget ),
				$button = $( '.action-select-content', self.$steps ),
				checked = true;

			// Action for select All Content
			if ( $target.hasClass( 'content' ) ) {
				self.$demoContentOptions
					.find( '.child_checkbox' )
					.prop( 'checked', $( 'input[type="checkbox"]', $target ).is( ':checked' ) );
			}

			// Action for select children of the All content
			if ( $target.hasClass( 'child' ) ) {
				self.$demoContentOptions
					.find( 'label.child input' )
					.each( ( _, item ) => {
						checked = checked && $( item ).is( ':checked' );
					} );
				self.$demoContentOptions
					.find( 'label.content input' )
					.prop( 'checked', checked );
			}

			// Disable button, if don't select any one checkbox
			$button.prop( 'disabled', ! $( 'input[type="checkbox"]', self.$demoContentOptions ).is( ':checked' ) );
		},

		/**
		 * Filter websites
		 *
		 */
		filterDemos: function() {
			const self = this;
			const value = $( 'input:radio:checked', self.$demoFilter ).val();

			self.$demos
				.addClass('hidden')
				.filter( `[data-tags^="${value}"], [data-tags*="${value}"]` )
				.removeClass('hidden');

			// Reset items, if filter do not selected
			if ( value === 'all' ) {
				self.$demos.removeClass( 'hidden' );
			}
		}
	} );

	/**
	 * Functional for From scratch
	 */
	$.extend( prototype, {
		/**
		 * Insert selected template in the preview
		 *
		 * @param e {Event}
		 */
		selectFromScratchParam: function( e ) {
			const self = this;
			var $item = $( e.currentTarget ),
				$root = $( 'html', self.$previewIframe.contents() ),
				type  = $item.data( 'type' ),
				id = $item.data( 'id' ),
				$templateContent = '',
				vertical = '',
				css = '',
				script = '',
				link = '';

			// Save params for the installation
			self.previewParams[ type ] = id;

			if ( $item.hasClass('active') || ! $root.length ) {
				return;
			}

			$item
				.addClass( 'active' )
				.siblings()
				.removeClass( 'active' );

			// Get name for replace iframe html
			type = type.split( '_' )[ 0 ];

			$templateContent = $( `.us-sw-template-for-${type}[data-id="${id}"]`, $root ).first();
			css = $( ' > style', $templateContent ).first().text();
			vertical = $templateContent.data( 'vertical' ); // Using for the Header
			link = $( ` > #us-${type}-link`, $templateContent ).first().text();

			// Reset body classes for the header
			if ( type === 'header' ) {
				$root.find( 'body' )
					.removeClass( 'header_ver' )
					.addClass( 'header_hor' );

				if ( vertical ) {
					$root.find( 'body' )
						.removeClass( 'header_hor' )
						.addClass( 'header_ver' );
				}
			}

			if ( type == 'footer' ) {
				$root.find( type )
					.empty()
					.append( $templateContent.html() )
			} else {
				$root.find( '.l-canvas > ' + type )
					.after( $templateContent.html() )
					.remove();
			}

			if ( link ) {
				link = atob( link );

				$root.find( `link#us-enqueue-${type}-css` ).remove();
				$root.find( 'head' ).append( link );
			}

			if ( css ) {
				css = atob( css );

				$root.find( `style#us-${type}-css` ).remove();
				$root.find( 'head' ).append( `<style id="us-${type}-css"> ${css}</style>` );
			}

			// Header parameters and header JS re-init
			if ( type == 'header' ) {
				script = $( ' > div.sw-header-settings', $templateContent ).first().text();
				script = atob( script );
				$root.find( 'script#us-header-settings' ).remove();
				$root.find( 'head' ).append( script );
				self.$previewIframe[0].contentWindow.USReinitHeder();
			}

			self._scrollToElement( type );
		},

		/**
		 * Scroll Preview after select footer
		 *
		 * @private
		 */
		_scrollToElement: function( type ) {
			const self = this;
			var $root = $( 'body, html', self.$previewIframe.contents() ),
				scrollTop = 0;

			// Exclude other types
			if ( type !== 'header' && type !== 'footer' ) {
				return;
			}

			if ( type == 'footer' ) {
				scrollTop = $root.height();
			}

			$root.animate( { scrollTop: scrollTop }, 200 );
		},

		/**
		 * Prepare options Scratch Step to install
		 *
		 */
		prepareFromScratchOptions: function() {
			const self = this;

			if ( ! self.data.hasOwnProperty( 'translations' ) ) {
				return;
			}

			// Append US-Core
			if ( self.data.plugins[ 'us-core' ] ) {
				self.installationActions.plugins[ 'us-core' ] = self.data.plugins[ 'us-core' ];
			}

			// Get first templates
			for ( const param in self.previewParams ) {
				if ( self.previewParams[ param ] == '' ) {
					var $item = $( `[data-type="${param}"]` ).first(),
						id = $item.data( 'id' );

					if ( id !== '' ) {
						self.previewParams[ param ] = id;
					}
				}
			}

			for ( const type in self.data[ 'translations' ] ) {
				self.installationActions.content[ type ] = self.data[ 'translations' ][ type ];
			}

			self._prepareInstallation( 'from_scratch' );
		},

		selectAddons: function() {
			const self = this;

			self.installationActions.plugins = {};

			$( '.us-addons-list input[type="checkbox"]', self.$container ).each( ( _, item ) => {
				var $item = $( item ),
					plugin = $item.data( 'plugin' ),
					title = $item.data( 'title' );

				if ( ! $item.is( ':checked' ) ) {
					return;
				}

				self.installationActions.plugins[ plugin ] = title;
			} );

			self._prepareInstallation( 'from_scratch' );
		}
	} );

	/**
	 * Functional for the installation (both Prebuilt / From Scratch)
	 */
	$.extend( prototype, {
		/**
		 * State when run install
		 */
		installRunning: false,

		/**
		 * Sort install options before install
		 *
		 * @param type
		 * @private
		 */
		_prepareInstallation: function( type ) {
			const self = this;
			var action_prefix = ( type == 'from_scratch' ) ? 'us_from_scratch_install_' : 'us_import_';

			// Reset installation options
			self.queue = [];
			self.$installationActionsList.html( '' );

			for ( const type in self.installationActions ) {
				if ( ! self.installationActions.hasOwnProperty( type ) ) {
					continue;
				}

				for ( const item in self.installationActions[ type ] ) {
					var action = action_prefix + item,
						plugin = '';

					if ( type === 'plugins' ) {
						action = 'us_ajax_install_plugin';
						plugin = item;
					}

					self._addInstallationAction( action, self.installationActions[ type ][ item ], plugin );
				}
			}
		},

		/**
		 * Insert options to Install Step
		 *
		 * @param action
		 * @param title
		 * @param plugin
		 * @private
		 */
		_addInstallationAction: function( action, title, plugin = '' ) {
			const self = this;

			var installPlugin = '';

			if ( plugin ) {
				installPlugin = `data-install-plugin="${plugin}"`;
			}

			self.$installationActionsList.append( `
				<div class="us-wizard-install-actions-item" data-install-action-item="${action}" ${installPlugin}>
					${title}<span></span><i class="fas"></i>
				</div>
			` );

			self.queue.push( action );
		},

		/**
		 * Install selected content
		 *
		 * @param e {Event}
		 * @private
		 */
		installContent: function( e ) {
			const self = this;
			var $button = $( e.currentTarget ),
				installQueue = self.queue,
				data = {};

			if ( self.installRunning ) {
				return;
			}

			// Default data for Ajax
			data = {
				demo: self.selectedDemo,
				security: self.data[ 'ajax' ].nonce
			};

			if ( self.selectedType === 'from_scratch' ) {
				// Remove variables from the Demo Import
				delete data.demo;
				// Extend selected preview params
				$.extend( data, self.previewParams );
			}

			function processQueue() {
				if ( installQueue.length ) {
					var installAction = installQueue.shift(),
						$installOption = $( `[data-install-action-item="${installAction}"]:not(.loading_success)` ).first();

					$installOption.addClass( 'loading' );
					$button
						.addClass( 'loading' );

					// Disable menu, if start Install
					$( '.us-wizard-menu-item', self.$menu ).attr( 'disabled', 'disabled' );

					// Extend ajax action
					$.extend( data, {
						action: installAction,
					} );

					if ( installAction == 'us_ajax_install_plugin' ) {
						data.plugin = $installOption.data( 'install-plugin' );
					}

					$.post( self.data[ 'ajax' ].url, data, ( res ) => {
						if ( res.success ) {
							$installOption.addClass( 'loading_success' );
							// Extend data from the result,
							// used for the install Setup Wizard: Install theme options
							if ( res.data ) {
								$.extend( data, res.data );
							}
							processQueue();
						} else {
							$installOption.addClass( 'loading_fail' );
							$( 'span', $installOption ).text( res.data.message );

							$button.removeClass( 'loading' );

							$( '.us-wizard-menu-item', self.$menu ).removeAttr( 'disabled' );
						}
						$installOption.removeClass( 'loading' );
					}, 'json' );

				} else {
					// Install is completed
					self.installRunning = true;

					// Update page and open success step
					setTimeout( () => {
						window.location.replace( window.location.href + '&success=1' );
					}, 500 );
				}
			};

			self.installRunning = true;
			processQueue();
		},
	} );

	$.fn.usSetupWizard = function() {
		return this.each( function() {
			$( this ).data( 'usSetupWizard', new usSetupWizard( this ) );
		} );
	};

	// Init Setup Wizard
	$( () => $( '.us-wizard' ).usSetupWizard() );

} )( jQuery );
