/**
 * Author: Alex Campbell
 * Date: 2020-07-03
 * Description: A plugin for add/editing/previewing HTML5 Audio. 
 * 
 * TODO: this is blatent copy, paste, find, replace of the video asset. But for now, it works. If people actually use this thing, we'll change that
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import editIcon from '../icons/editicon.svg';
import previewIcon from '../icons/previewicon.svg';
import addAudioIcon from './style/audioicon.svg';
import Command from '@ckeditor/ckeditor5-core/src/command';
import fullWidthIcon from '@ckeditor/ckeditor5-core/theme/icons/object-full-width.svg';
import leftIcon from '@ckeditor/ckeditor5-core/theme/icons/object-left.svg';
import centerIcon from '@ckeditor/ckeditor5-core/theme/icons/object-center.svg';
import rightIcon from '@ckeditor/ckeditor5-core/theme/icons/object-right.svg';
import AssetPluginHelper from '../asset-plugin-helper';
import { getSelectedAudioWidget, captionElementCreator, getCaptionFromAudio, matchAudioCaption, convertMapIteratorToMap, viewFigureToModel, createAudioViewElement, toAudioWidget, modelToViewAttributeConverter, isAudio, isAudioWidget } from './audio-utils';
import Observer from '@ckeditor/ckeditor5-engine/src/view/observer/observer';
import './style/style.css';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import WidgetToolbarRepository from '@ckeditor/ckeditor5-widget/src/widgettoolbarrepository';

export const AUDIO_PLUGIN_NAME = "html5Audio";
export const EDIT_AUDIO_PLUGIN_NAME = "editHTML5Audio";
export const PREVIEW_AUDIO_PLUGIN_NAME = "previewHTML5Audio";
export const ADD_AUDIO_HTML_COMMAND = "addNewHTML5Audio";
export const EDIT_AUDIO_HTML_COMMAND = "editHTML5Audio";
export const AUDIO_ALIGN_LEFT_STYLE = "alignLeft";
export const AUDIO_ALIGN_RIGHT_STYLE = "alignRight";
export const AUDIO_ALIGN_CENTER_STYLE = "alignCenter";
export const AUDIO_ALIGN_FULL_STYLE = "full";
export const ASSET_SH_RH_CLASS = AssetPluginHelper.getClassForSpecialHandlingRH();
export const ASSET_SH_RS_CLASS = AssetPluginHelper.getClassForSpecialHandlingRS();
export const ASSET_SH_LD_CLASS = AssetPluginHelper.getClassForSpecialHandlingLD();
export const ASSET_SH_EO_CLASS = AssetPluginHelper.getClassForSpecialHandlingEO();
export const ASSET_SH_NONE_CLASS = AssetPluginHelper.getClassForSpecialHandlingNone();

// Define the styles available for audio. Each one contains the name, title, icon, and associate classname
export const AUDIO_STYLES = {};
AUDIO_STYLES[AUDIO_ALIGN_FULL_STYLE] = {
	name: 'full',
	title: 'Full size audio',
	icon: fullWidthIcon,
	isDefault: true,
	className: 'audio-style-full'
};
AUDIO_STYLES[AUDIO_ALIGN_LEFT_STYLE] = {
	name: 'alignLeft',
	title: 'Left-aligned audio',
	icon: leftIcon,
	className: 'audio-style-align-left'
};
AUDIO_STYLES[AUDIO_ALIGN_RIGHT_STYLE] = {
	name: 'alignRight',
	title: 'Right-aligned audio',
	icon: rightIcon,
	className: 'audio-style-align-right'
};
AUDIO_STYLES[AUDIO_ALIGN_CENTER_STYLE] = {
	name: 'alignCenter',
	title: 'Center-aligned audio',
	icon: centerIcon,
	className: 'audio-style-align-center'
};

export default class HTML5AudioPlugin extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	constructor(editor) {
		super(editor);
		this.pluginName = AUDIO_PLUGIN_NAME;
	}

	// If a preview button handler isn't defined, default to simply showing the source directly in a new tab
	defaultPreviewButtonHandler(data) {
		const map = convertMapIteratorToMap(data);
		if (map["assettype"] == 'audio') {
			window.open(map["src"], "_blank");
		}
	}

	init() {
		const editor = this.editor;

		// Get the toolbar button callback (fired when the button is clicked) and the edit button callback
		this.toolbarButtonCallback = AssetPluginHelper.getToolbarButtonCallbackFromConfig(editor.config, this.pluginName);
		this.editButtonCallback = AssetPluginHelper.getEditButtonCallbackFromConfig(editor.config, this.pluginName);

		// If the user didn't define a preview button callback, use the default one
		const userSuppliedPreviewCallback = AssetPluginHelper.getNested(editor.config, this.pluginName, "previewButtonCallback");
		if (userSuppliedPreviewCallback == null) {
			console.log("No Preview handler defined for HTML5Audio plugin. Using default new-tab hander!");
			this.previewButtonCallback = this.defaultPreviewButtonHandler;
		} else {
			this.previewButtonCallback = userSuppliedPreviewCallback;
		}

		// Registers a new element in the CKEditor schema that represents a audio.
		this.addAudioSchema(editor);

		// Add the command that external code can invoke to programmatically add or edit a audio to the editor
		this.editor.commands.add('addNewAudio', new AddNewAudio(this.editor));
		this.editor.commands.add('editAudio', new EditAudio(this.editor));
        
		// Define the components for Add, Edit, and Preview audioc components, which call their respective callback functions when executed
		AssetPluginHelper.createComponent(editor, AUDIO_PLUGIN_NAME, "Add HTML5 Audio", addAudioIcon, true, () => {
			// By JUST using model.document.selection, the vid gfets placed at 0,0 every time. not sure why, but I'm guessing that
			// angular callbacks somehow modify the selection? By passing in the position, we can get around this
			this.toolbarButtonCallback(this.editor.model.document.selection.getFirstPosition());
		});
		AssetPluginHelper.createComponent(editor, EDIT_AUDIO_PLUGIN_NAME, "Edit HTML5 Audio", editIcon, true, () => {
			const t = editor.model.document.selection.getSelectedElement();
			this.editButtonCallback(t, t.getAttributes());
		});
		AssetPluginHelper.createComponent(editor, PREVIEW_AUDIO_PLUGIN_NAME, "Preview Asset", previewIcon, false, () => {
			const t = editor.model.document.selection.getSelectedElement();
			this.previewButtonCallback(t.getAttributes());
		});

		// Create a component for each style
		editor.commands.add( 'audioStyle', new AudioStyleCommand( editor, AUDIO_STYLES ) );
		for (const styleName in AUDIO_STYLES) {
			const style = AUDIO_STYLES[styleName];
			const componentName = `audioStyle:${ style.name }`;
			editor.ui.componentFactory.add( componentName, locale => {
				const command = editor.commands.get( 'audioStyle' );
				const view = new ButtonView( locale );
				view.set( {
					label: style.title,
					icon: style.icon,
					tooltip: true,
					isToggleable: true
				} );
    
				// Bind the state of the button to the comnand. This makes it so that, when the user clicks the button,
				// the style is applied AND the button shows that it is enabled and active
				view.bind( 'isEnabled' ).to( command, 'isEnabled' );
				view.bind( 'isOn' ).to( command, 'value', value => value === style.name );
				this.listenTo( view, 'execute', () => {
					editor.execute( 'audioStyle', { value: style.name } );
					editor.editing.view.focus();
				} );
    
				return view;
			} );
		}
	}

	afterInit() {
		const editor = this.editor;
		const t = editor.t;
		const widgetToolbarRepository = editor.plugins.get( WidgetToolbarRepository );

		// Registers a widget toolbar for the audio. Used to show the style buttons, the edit button, and the preview button
		widgetToolbarRepository.register( 'audio', {
			ariaLabel: t( 'Audio toolbar' ),
			items: editor.config.get( AUDIO_PLUGIN_NAME + '.toolbar' ) || [],
			getRelatedElement: getSelectedAudioWidget
		} );
	}

	addAudioSchema(editor) {
		// Register a new audio model element. 
		const allowedAttributes = ['height', 'class', 'src', 'type', 'width', 'specialHandling', 'audioStyle', AssetPluginHelper.getAssetIdPropertyName(), AssetPluginHelper.getAssetTypePropertyName()];
		const schema = editor.model.schema;
		const t = editor.t;
		editor.editing.view.addObserver( AudioLoadObserver ); // TODO: not sure what this does yet.
		schema.register("audio", {
			isObject: true,
			isBlock: true,
			allowWhere: '$block',
			allowAttributes: allowedAttributes
		});
		editor.model.schema.extend( 'audio', { allowAttributes: 'specialHandling' } );

		// Define how the model element is converted to HTML
		const conversion = this.editor.conversion;
		conversion.for( 'downcast' ).add( modelToViewAttributeConverter( 'src' ) );

		// Define how the model element is converted to HTML specifically when loading from a datasource
		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'audio',
			view: ( modelElement, {writer} ) => createAudioViewElement( writer )
		} );

		// Define how the model element is converted to HTML specifically when editing the model element
		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'audio',
			view: ( modelElement, {writer} ) => toAudioWidget( createAudioViewElement( writer ), writer, t( 'audio widget' ) )
		} );

		// Define how the model element is converted FROM HTML to a model element
		conversion.for( 'upcast' )
			.elementToElement( {
				view: {
					name: 'audio',
					attributes: {
						src: true
					}
				},
				model: ( viewImage, {writer} ) => writer.createElement( 'audio', { src: viewImage.getAttribute( 'src' ) } )
			} )
			.add( viewFigureToModel() );

		// Define how the styles are converted to/from classes. Note that we're re-using the classes that CKEditor already uses for images
		const audioStyleViewDef = {};
		audioStyleViewDef[AUDIO_ALIGN_CENTER_STYLE] = {
			name: 'figure',
			key: 'class',
			value: ['audio-style-align-center']
		};
		audioStyleViewDef[AUDIO_ALIGN_LEFT_STYLE] = {
			name: 'figure',
			key: 'class',
			value: [ 'audio-style-align-left']
		};
		audioStyleViewDef[AUDIO_ALIGN_RIGHT_STYLE] = {
			name: 'figure',
			key: 'class',
			value: [ 'audio-style-align-right']
		};
		audioStyleViewDef[AUDIO_ALIGN_FULL_STYLE] = {
			name: 'figure',
			key: 'class',
			value: [ 'audio-style-full']
		};
		editor.conversion.attributeToAttribute({
			model: {
				name: 'audio',
				key: 'audioStyle',
				values: [AUDIO_ALIGN_CENTER_STYLE, AUDIO_ALIGN_LEFT_STYLE, AUDIO_ALIGN_RIGHT_STYLE, AUDIO_ALIGN_FULL_STYLE]
			},
			view: audioStyleViewDef
		});
	}
}

// A commnad that should be executed by external code to add a audio to the editor
class AddNewAudio extends Command {
	execute(caretPos, url, audioStyle, dbid, shClass) {
		this.editor.model.change( writer => {
			const newData = {
				src: url,
				audioStyle: audioStyle,
				specialHandling: shClass
			};
			newData[AssetPluginHelper.getAssetIdPropertyName()] = dbid;
			newData[AssetPluginHelper.getAssetTypePropertyName()] = 'audio';
			const audioElement = writer.createElement( 'audio', newData );
			caretPos = caretPos != null ? caretPos : this.editor.model.document.selection.getFirstPosition();
			this.editor.model.insertContent( audioElement, caretPos );
			writer.insertElement('caption', audioElement, 'end');
		} );
	}
}

class EditAudio extends Command {
	execute(element, url, assetID, assetSHClass) {
		this.editor.model.change( writer => {
			writer.setAttribute("src", url, element);
			writer.setAttribute( AssetPluginHelper.getAssetIdPropertyName(), assetID, element);
			writer.setAttribute("specialHandling", assetSHClass, element);
		} );
	}
}

// Not sure why this is needed yet
export class AudioLoadObserver extends Observer {
	observe( domRoot ) {
		this.listenTo( domRoot, 'load', ( event, domEvent ) => {
			const domElement = domEvent.target;

			if ( domElement.tagName == 'audio' ) {
				this._fireEvents( domEvent );
			}
			// Use capture phase for better performance (#4504).
		}, { useCapture: true } );
	}

	_fireEvents( domEvent ) {
		if ( this.isEnabled ) {
			this.document.fire( 'layoutChanged' );
			this.document.fire( 'audioLoaded', domEvent );
		}
	}
}

// A command for changing the style of the audio
export class AudioStyleCommand extends Command {
	constructor( editor, styles ) {
		super( editor );
		this.defaultStyle = false;

		// Create a style name to style mapping
		this.styles = {};
		for (const s in styles) {
			this.styles[s] = styles[s];
		}
	}
    
	// Required to implement. Sets the value and "enabled" attribute when the element is clicked on (IF it's clicked on)
	refresh() {
		const element = this.editor.model.document.selection.getSelectedElement();
		this.isEnabled = isAudio( element );

		if ( !element ) {
			this.value = false;
		} else if ( element.hasAttribute( 'audioStyle' ) ) {
			const attributeValue = element.getAttribute( 'audioStyle' );
			this.value = this.styles[ attributeValue ] ? attributeValue : false;
		} else {
			this.value = this.defaultStyle;
		}
	}

	execute( options ) {
		const styleName = options.value;
		const model = this.editor.model;
		const audioElement = model.document.selection.getSelectedElement();
		model.change( writer => {
			if ( this.styles[ styleName ].isDefault ) {
				writer.removeAttribute( 'audioStyle', audioElement );
			} else {
				writer.setAttribute( 'audioStyle', styleName, audioElement );
			}
		} );
	}
}

export class AudioCaption extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'AudioCaption';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const view = editor.editing.view;
		const schema = editor.model.schema;
		const data = editor.data;
		const editing = editor.editing;
		const t = editor.t;
        
		// Schema configuration.
		schema.extend( 'caption', {
			allowIn: 'audio',
			allowContentOf: '$block',
			isLimit: true
		} );

		editor.model.document.registerPostFixer( writer => this._insertMissingModelCaptionElement( writer ) );

		// View to model converter for the data pipeline.
		editor.conversion.for( 'upcast' ).elementToElement( {
			view: matchAudioCaption,
			model: 'caption'
		} );

		// Model to view converter for the data pipeline.
		const createCaptionForData = writer => writer.createContainerElement( 'figcaption' );
		data.downcastDispatcher.on( 'insert:caption', captionModelToView( createCaptionForData, false ) );

		// Model to view converter for the editing pipeline.
		const createCaptionForEditing = captionElementCreator( view, t( 'Enter audio caption' ) );
		editing.downcastDispatcher.on( 'insert:caption', captionModelToView( createCaptionForEditing ) );

		// Always show caption in view when something is inserted in model.
		editing.downcastDispatcher.on(
			'insert',
			this._fixCaptionVisibility( data => data.item ),
			{ priority: 'high' }
		);

		// Hide caption when everything is removed from it.
		editing.downcastDispatcher.on( 'remove', this._fixCaptionVisibility( data => data.position.parent ), { priority: 'high' } );

		// Update caption visibility on view in post fixer.
		view.document.registerPostFixer( writer => this._updateCaptionVisibility( writer ) );
	}

	_updateCaptionVisibility( viewWriter ) {
		const mapper = this.editor.editing.mapper;
		const lastCaption = this._lastSelectedCaption;
		let viewCaption;

		// If whole image is selected.
		const modelSelection = this.editor.model.document.selection;
		const selectedElement = modelSelection.getSelectedElement();

		if ( selectedElement && selectedElement.is( 'element', 'audio' ) ) {
			const modelCaption = getCaptionFromAudio( selectedElement );
			viewCaption = mapper.toViewElement( modelCaption );
		}

		// If selection is placed inside caption.
		const position = modelSelection.getFirstPosition();
		const modelCaption = getParentCaption( position.parent );

		if ( modelCaption ) {
			viewCaption = mapper.toViewElement( modelCaption );
		}

		// Is currently any caption selected?
		if ( viewCaption ) {
			// Was any caption selected before?
			if ( lastCaption ) {
				// Same caption as before?
				if ( lastCaption === viewCaption ) {
					return showCaption( viewCaption, viewWriter );
				} else {
					hideCaptionIfEmpty( lastCaption, viewWriter );
					this._lastSelectedCaption = viewCaption;

					return showCaption( viewCaption, viewWriter );
				}
			} else {
				this._lastSelectedCaption = viewCaption;
				return showCaption( viewCaption, viewWriter );
			}
		} else {
			// Was any caption selected before?
			if ( lastCaption ) {
				const viewModified = hideCaptionIfEmpty( lastCaption, viewWriter );
				this._lastSelectedCaption = null;

				return viewModified;
			} else {
				return false;
			}
		}
	}

	_fixCaptionVisibility( nodeFinder ) {
		return ( evt, data, conversionApi ) => {
			const node = nodeFinder( data );
			const modelCaption = getParentCaption( node );
			const mapper = this.editor.editing.mapper;
			const viewWriter = conversionApi.writer;

			if ( modelCaption ) {
				const viewCaption = mapper.toViewElement( modelCaption );

				if ( viewCaption ) {
					if ( modelCaption.childCount ) {
						viewWriter.removeClass( 'ck-hidden', viewCaption );
					} else {
						viewWriter.addClass( 'ck-hidden', viewCaption );
					}
				}
			}
		};
	}

	_insertMissingModelCaptionElement( writer ) {
		const model = this.editor.model;
		const changes = model.document.differ.getChanges();

		const audiosWithoutCaption = [];

		for ( const entry of changes ) {
			if ( entry.type == 'insert' && entry.name != '$text' ) {
				const item = entry.position.nodeAfter;

				if ( item.is( 'element', 'audio' ) && !getCaptionFromAudio( item ) ) {
					audiosWithoutCaption.push( item );
				}

				if ( !item.is( 'element', 'audio' ) && item.childCount ) {
					for ( const nestedItem of model.createRangeIn( item ).getItems() ) {
						if ( nestedItem.is( 'element', 'audio' ) && !getCaptionFromAudio( nestedItem ) ) {
							audiosWithoutCaption.push( nestedItem );
						}
					}
				}
			}
		}

		for ( const audio of audiosWithoutCaption ) {
			writer.appendElement( 'caption', audio );
		}

		return !!audiosWithoutCaption.length;
	}
}

function captionModelToView( elementCreator, hide = true ) {
	return ( evt, data, conversionApi ) => {
		const captionElement = data.item;

		// Return if element shouldn't be present when empty.
		if ( !captionElement.childCount && !hide ) {
			return;
		}

		if ( isAudio( captionElement.parent ) ) {
			if ( !conversionApi.consumable.consume( data.item, 'insert' ) ) {
				return;
			}

			const viewImage = conversionApi.mapper.toViewElement( data.range.start.parent );
			const viewCaption = elementCreator( conversionApi.writer );
			const viewWriter = conversionApi.writer;

			// Hide if empty.
			if ( !captionElement.childCount ) {
				viewWriter.addClass( 'ck-hidden', viewCaption );
			}

			insertViewCaptionAndBind( viewCaption, data.item, viewImage, conversionApi );
		}
	};
}

function insertViewCaptionAndBind( viewCaption, modelCaption, viewImage, conversionApi ) {
	const viewPosition = conversionApi.writer.createPositionAt( viewImage, 'end' );

	conversionApi.writer.insert( viewPosition, viewCaption );
	conversionApi.mapper.bindElements( modelCaption, viewCaption );
}

function getParentCaption( node ) {
	const ancestors = node.getAncestors( { includeSelf: true } );
	const caption = ancestors.find( ancestor => ancestor.name == 'caption' );

	if ( caption && caption.parent && caption.parent.name == 'audio' ) {
		return caption;
	}

	return null;
}

function hideCaptionIfEmpty( caption, viewWriter ) {
	if ( !caption.childCount && !caption.hasClass( 'ck-hidden' ) ) {
		viewWriter.addClass( 'ck-hidden', caption );
		return true;
	}

	return false;
}

function showCaption( caption, viewWriter ) {
	if ( caption.hasClass( 'ck-hidden' ) ) {
		viewWriter.removeClass( 'ck-hidden', caption );
		return true;
	}

	return false;
}