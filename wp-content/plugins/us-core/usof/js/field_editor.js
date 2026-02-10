/**
 * USOF Field: Editor
 */
! function( $, _undefined ) {

	const _window = window;

	if ( $ush.isUndefined( _window.$usof ) ) {
		return;
	}

	/**
	 * Adds <p> and <br> tags where appropriate for plain text or HTML input,
	 * mimicking WordPress’s wpautop behavior.
	 */
	function us_wpautop( text ) {
		var restoreLineBreak = false,
			restoreTagBr = false;

		const blockTags = 'table|thead|tfoot|caption|col|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre|form|map|area|blockquote|address|math|style|p|h[1-6]|hr|fieldset|legend|section|article|aside|hgroup|header|footer|nav|figure|figcaption|details|menu|summary';

		text = $ush.toString( text );
		text = text.replace( /\r\n|\r/g, "\n" );

		// Remove line breaks inside <object> tags
		if ( text.includes( '<object' ) ) {
			text = text.replace( /<object[\s\S]+?<\/object>/g, ( match ) => {
				return match.replace( /\n+/g, '' );
			} );
		}

		// Normalize spacing inside all tags
		text = text.replace( /<[^<>]+>/g, ( tag ) => {
			return tag.replace( /[\n\t ]+/g, ' ' );
		} );

		// Preserve <pre> and <script> blocks using placeholders
		if ( text.includes( '<pre' ) || text.includes( '<script' ) ) {
			restoreLineBreak = true;
			text = text.replace( /<(pre|script)[^>]*>[\s\S]*?<\/\1>/g, ( match ) => {
				return match.replace( /\n/g, '<wp-line-break>' );
			} );
		}

		// Trim spaces around <figcaption>
		if ( text.includes( '<figcaption' ) ) {
			text = text
				.replace( /\s*(<figcaption[^>]*>)/g, "$1" )
				.replace( /<\/figcaption>\s*/g, '</figcaption>' );
		}

		// Preserve [caption] shortcode formatting
		if ( text.includes( '[caption' ) ) {
			restoreTagBr = true;
			text = text.replace( /\[caption[\s\S]+?\[\/caption\]/g, ( match ) => {
				return match
					.replace( /<br([^>]*)>/g, "<wp-temp-br$1>" )
					.replace( /<[^<>]+>/g, ( tag ) => tag.replace( /[\n\t ]+/, ' ' ) )
					.replace( /\s*\n\s*/g, "<wp-temp-br />" );
			} );
		}

		// Autop algorithm: wrap blocks in <p> tags, preserving formatting
		text = ( text + "\n\n" )
			.replace( /<br \/>\s*<br \/>/gi, "\n\n" )
			.replace( new RegExp( `(<(?:${blockTags})(?: [^>]*)?>)`, "gi" ), "\n\n$1" )
			.replace( new RegExp( `(</(?:${blockTags})>)`, "gi" ), "$1\n\n" )
			.replace( /<hr( [^>]*)?>/gi, "<hr$1>\n\n" )
			.replace( /\s*<option/gi, "<option" )
			.replace( /<\/option>\s*/gi, "</option>" )
			.replace( /\n\s*\n+/g, "\n\n" )
			.replace( /([\s\S]+?)\n\n/g, "<p>$1</p>\n" )
			.replace( /<p>\s*?<\/p>/gi, "" )
			.replace( new RegExp( `<p>\\s*(</?(?:${blockTags})(?: [^>]*)?>)\\s*</p>`, "gi" ), "$1" )
			.replace( /<p>(<li.+?)<\/p>/gi, "$1" )
			.replace( /<p>\s*<blockquote([^>]*)>/gi, "<blockquote$1><p>" )
			.replace( /<\/blockquote>\s*<\/p>/gi, "</p></blockquote>" )
			.replace( new RegExp( `<p>\\s*(</?(?:${blockTags})(?: [^>]*)?>)`, "gi" ), "$1" )
			.replace( new RegExp( `(</?(?:${blockTags})(?: [^>]*)?>)\\s*</p>`, "gi" ), "$1" )
			.replace( /(<br[^>]*>)\s*\n/gi, "$1" )
			.replace( /\s*\n/g, "<br />\n" )
			.replace( new RegExp( `(</?(?:${blockTags})[^>]*>)\\s*<br />`, "gi" ), "$1" )
			.replace( /<br \/>(\s*<\/?(?:p|li|div|dl|dd|dt|th|pre|td|ul|ol)>)/gi, "$1" )
			.replace( /(?:<p>|<br ?\/?>)*\s*\[caption([^\[]+)\[\/caption\]\s*(?:<\/p>|<br ?\/?>)*/gi, "[caption$1[/caption]" )
			.replace( /(<(?:div|th|td|form|fieldset|dd)[^>]*>)(.*?)<\/p>/g, ( m, startTag, content ) => {
				return content.match( /<p( [^>]*)?>/ ) ? m : `${startTag}<p>${content}</p>`;
			});

		// Restore line break
		if ( restoreLineBreak ) {
			text = text.replace( /<wp-line-break>/g, "\n" );
		}
		if ( restoreTagBr ) {
			text = text.replace( /<wp-temp-br([^>]*)>/g, "<br$1>" );
		}

		// Clean up comment wrapper <p> tags
		return text.replace( /<p>(<!--(?:.*)-->)<\/p>/g, "$1" );
	}

	/**
	 * Removes unwanted <p> and <br> tags that WordPress automatically adds.
	 * Preserves structure and spacing for HTML and shortcodes like [caption].
	 */
	function us_wpnop( text/*, pre_wpautop*/ ) {
		var blockTags, preTags, restoreLineBreak, restoreTagBr, restoreCode;

		text = $ush.toString( text );

		// Use built-in WordPress editor function if available
		// if ( pre_wpautop ) {
		// 	return text.replace( /<p>(<!--(?:.*)-->)<\/p>/g, "$1" );
		// }

		if ( ! text ) {
			return '';
		}

		// HTML tags considered as block-level elements
		blockTags = 'blockquote|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|th|td|h[1-6]|fieldset|figure|div|p';
		preTags = blockTags + '|pre';

		// Flags and preserved content store
		restoreLineBreak = false;
		restoreTagBr = false;
		restoreCode = [];

		// Preserve <script> and <style> blocks
		// Temporarily remove script/style tags to avoid accidental processing
		if ( text.includes( '<script' ) || text.includes( '<style' ) ) {
			text = text.replace( /<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ( match ) => {
				restoreCode.push( match );
				return '<wp-preserve>';
			} );
		}

		// Handle <pre> tags specially
		// Convert newlines inside <pre> blocks to placeholders so they don't get wrapped in <p> tags
		if ( text.includes( '<pre' ) ) {
			restoreLineBreak = true;
			text = text.replace( /<pre[^>]*>[\s\S]+?<\/pre>/g, ( match ) => {
				return match
					.replace( /<br ?\/?>(\r\n|\n)?/g, '<wp-line-break>' )
					.replace( /<\/?p( [^>]*)?>(\r\n|\n)?/g, '<wp-line-break>' )
					.replace( /\r?\n/g, '<wp-line-break>' );
			});
		}

		// Preserve [caption] shortcodes
		if ( text.includes( '[caption' ) ) {
			restoreTagBr = true;
			text = text.replace( /\[caption[\s\S]+?\[\/caption\]/g, ( match ) => {
				return match
					.replace( /<br([^>]*)>/g, "<wp-temp-br$1>" )
					.replace( /[\r\n\t]+/, "" );
			});
		}

		// Normalize and restructure the HTML
		text = text

			// Replace empty <p> tags with a non-breaking space and two line breaks
			.replace( /<p>\s<\/p>/g, "&nbsp;\n\n" )

			// Add line breaks around block-level elements
			.replace( new RegExp( `\\s*</(${blockTags})>\\s*`, "g" ), "</$1>\n" )
			.replace( new RegExp( `\\s*<((?:${blockTags})(?: [^>]*)?)>`, "g" ), "\n<$1>" )

			// Temporarily protect <p attr> blocks
			.replace( /(<p [^>]+>.*?)<\/p>/g, "$1</p#>" )

			// Remove or reformat redundant <p> tags
			.replace( /<div( [^>]*)?>\s*<p>/gi, "<div$1>\n\n" )
			.replace( /\s*<p>/gi, "" )
			.replace( /\s*<\/p>\s*/gi, "\n\n" )
			.replace( /\n[\s\u00a0]+\n/g, "\n\n" )

			// Handle <br> tags more naturally
			.replace( /(\s*)<br ?\/?>\s*/gi, ( m, prefix ) => {
				return prefix && prefix.includes( "\n" ) ? "\n\n" : "\n";
			})

			// Additional cleanup for <div>, [caption], <li>, etc.
			.replace( /\s*<div/g, "\n<div" )
			.replace( /<\/div>\s*/g, "</div>\n" )
			.replace( /\s*\[caption([^\[]+)\[\/caption\]\s*/gi, "\n\n[caption$1[/caption]\n\n" )
			.replace( /caption\]\n\n+\[caption/g, "caption]\n\n[caption" )
			.replace( new RegExp( `\\s*<((?:${preTags})(?: [^>]*)?)\\s*>`, "g" ), "\n<$1>" )
			.replace( new RegExp( `\\s*</(${preTags})>\\s*`, "g" ), "</$1>\n" )
			.replace( /<((li|dt|dd)[^>]*)>/g, " \t<$1>" );

		// Handle specific tags like <option>, <hr>, <object>
		if ( text.includes( '<option' ) ) {
			text = text.replace( /\s*<option/g, "\n<option" ).replace( /\s*<\/select>/g, "\n</select>" );
		}

		if ( text.includes( '<hr' ) ) {
			text = text.replace( /\s*<hr( [^>]*)?>\s*/g, "\n\n<hr$1>\n\n" );
		}

		if ( text.includes( '<object' ) ) {
			text = text.replace( /<object[\s\S]+?<\/object>/g, ( match ) => {
				return match.replace( /[\r\n]+/g, "" );
			} );
		}

		// Restore previously transformed parts
		text = text
			.replace( /<\/p#>/g, "</p>\n" )
			.replace( /\s*(<p [^>]+>[\s\S]*?<\/p>)/g, "\n$1" )
			.replace( /^\s+/, "" )
			.replace( /[\s\u00a0]+$/, "" );

		// Restore <pre> content line breaks
		if ( restoreLineBreak ) {
			text = text.replace( /<wp-line-break>/g, "\n" );
		}

		// Restore tag <br>
		if ( restoreTagBr ) {
			text = text.replace( /<wp-temp-br([^>]*)>/g, "<br$1>" );
		}

		// Restore code in <script>/<style>
		if ( restoreCode.length ) {
			text = text.replace( /<wp-preserve>/g, () => restoreCode.shift() );
		}

		return text;
	}

	$usof.field[ 'editor' ] = {
		/**
		 * Initializes the object.
		 */
		init: function() {
			const self = this;

			// Elements
			self.$container = $( '.usof-editor', self.$row );

			// Delete template
			$( 'script.usof-editor-template', self.$container ).remove();

			// Private "Variables"
			self.origEditorId = self.$input.data( 'editor-id' ) || 'usof_editor';
			self.origEditorOpts = _window.tinyMCEPreInit.mceInit[ self.origEditorId ] || {};
			self.editorSettings = {};

			// Load editor settings
			var $settings = $( '.usof-editor-settings', self.$row );
			if ( $settings.attr( 'onclick' ) ) {
				self.editorSettings = $settings[0].onclick() || {};
			}
			$settings.remove();

			// Since there could be several instances of the field with same original ID, ...
			// ... adding random part to the ID
			self.editorId = self.origEditorId + $ush.uniqid();
			self.$input.attr( 'id', self.editorId );

			// Bondable events.
			self._events = {
				textareaOnChange: self.textareaOnChange.bind( self ),
				tinymceOnChange: self.tinymceOnChange.bind( self ),
			};

			// Events
			self.$container.on( ( self.isLiveBuilder() ? 'input' : 'change' ), 'textarea', self._events.textareaOnChange );

			self.createEditor();
		},

		/**
		 * Create TinyMCE v4.9.11 editor.
		 *
		 * @link https://www.tiny.cloud/docs/tinymce/latest/apis/tinymce.root
		 */
		createEditor: function() {
			const self = this;

			if ( ! _window.wp || ! _window.wp.editor ) {
				return;
			}

			const isLiveBuilder = self.isLiveBuilder();

			const theEditorSettings = {
				quicktags: true,
				tinymce: self.editorSettings.tinymce || {},
				mediaButtons: ! $ush.isUndefined( self.editorSettings.media_buttons )
					? self.editorSettings.media_buttons
					: true
			};
			const qtSettings = {
				id: self.editorId,
				buttons: "strong,em,link,block,del,ins,img,ul,ol,li,code,more,close",
			};
			const usedFields = [

				'content_css',
				'toolbar1',
				'toolbar2',
				'toolbar3',
				'toolbar4',
				'theme',
				'skin',
				'language',
				'formats',
				'relative_urls',
				'remove_script_host',
				'convert_urls',
				'browser_spellcheck',
				'fix_list_elements',
				'entities',
				'entity_encoding',
				'keep_styles',
				'resize',
				'menubar',
				'branding',
				'preview_styles',
				'end_container_on_empty_block',
				'wpeditimage_html5_captions',
				'wp_lang_attr',
				'wp_keep_scroll_position',
				'wp_shortcut_labels',
				'plugins',
				'wpautop',
				'indent',
				'tabfocus_elements',
				'textcolor_map',
				'textcolor_rows',
				'external_plugins',

			].concat( Object.keys( self.editorSettings.tinymce ) );

			// At initialization, add monitoring for content changes
			_window.tinymce.on( 'AddEditor', ( e ) => {

				const theEditor = e.editor;
				const tinymceOnChange = 'NodeChange ' + ( isLiveBuilder ? 'input' : 'change' );

				if ( theEditor.id !== self.editorId ) {
					return;
				}

				theEditor
					.off( tinymceOnChange )
					.on( tinymceOnChange, self._events.tinymceOnChange );

				// Correction for editors on the Live Builder page
				if ( isLiveBuilder ) {
					theEditor
						.on( 'keydown', self.trigger.bind( self, 'tinyMCE.Keydown' ) )
						.on( 'BeforeAddUndo', ( e ) => {
							// Return true if the link is being edited,
							// otherwise errors may occur in the editor
							return ! $ush.isUndefined( e.origEvent );
						} );
				}
			}, /* prepend */true );

			usedFields.forEach( ( key ) => {
				if ( ! $ush.isUndefined( self.origEditorOpts[ key ] ) ) {
					theEditorSettings.tinymce[ key ] = self.origEditorOpts[ key ];
				}
			} );

			// We will not execute the installer since it is mostly used by third-party plugins,
			// for example WPML, at the moment the standard functionality is enough for us.
			theEditorSettings.tinymce.setup = () => {};

			self.destroyEditor();

			_window.wp.editor.initialize( self.editorId, theEditorSettings );
			_window.quicktags( qtSettings );

			// Switch to Visual mode
			self.switchEditor( 'tinymce' );
		},

		/**
		 * Destroy TinyMCE Editor
		 */
		destroyEditor: function() {
			const self = this;
			$ush.toArray( _window.tinymce.editors ).map( ( tinymceInstance ) => {
				if ( $ush.toString( tinymceInstance.id ).indexOf( self.origEditorId ) === 0 ) {
					tinymceInstance.destroy();
				}
			} );
		},

		/**
		 * Switches the editor between Visual and Text mode.
		 *
		 * @param {String} mode The mode
		 */
		switchEditor: function( mode ) {
			const self = this;
			if ( $ush.toString( mode ).toLowerCase() === 'tinymce' ) {
				mode = 'tmce';
			} else {
				mode = 'html';
			}
			$( `#${self.editorId}-${mode}`, self.$container ).trigger( 'click' );
		},

		/**
		 * Field change event
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM
		 */
		textareaOnChange: function( e ) {
			this.trigger( 'change', e.currentTarget.value );
		},

		/**
		 * Content change handler in TinyMCE
		 *
		 * @event handler
		 * @param {Event} e TinyMCE
		 */
		tinymceOnChange: function( e ) {
			const self = this;

			var tinymceContent = _window.tinymce.get( self.editorId ).getContent();
			const currentValue = self.getValue();

			if ( self.origEditorOpts.wpautop ) {
				tinymceContent = us_wpnop( tinymceContent );
			}

			if ( currentValue.trim() === tinymceContent ) {
				return;
			}

			self.$input.val( tinymceContent );
			self.trigger( 'change', tinymceContent );
		},

		/**
		 * Get HTML content to preview in Live Builder.
		 *
		 * @return {String}
		 */
		getHtmlContent: function() {
			return us_wpautop( this.getValue() );
		},

		/**
		 * Set value.
		 *
		 * @param {String} value The value
		 * @param {Boolean} quiet The quiet mode
		 */
		setValue: function( value, quiet ) {
			const self = this;

			self.$input.val( value );

			// Set value to tinyMCE
			if ( _window.tinyMCE && self.editorId ) {
				const mceContent = _window.tinyMCE.get( self.editorId );
				const mceSetContent = () => {
					if ( self.origEditorOpts.wpautop ) {
						value = us_wpautop( value );
					}
					mceContent.setContent( value );
				};
				if ( mceContent.initialized ) {
					mceSetContent();
				} else {
					mceContent.on( 'init', mceSetContent );
				}
			}

			if ( quiet ) {
				self.trigger( 'change', value );
			}
		},

		/**
		 * Get value.
		 *
		 * @return {String} The value
		 */
		getValue: function() {
			return this.$input.val();
		},

	};
}( jQuery );
