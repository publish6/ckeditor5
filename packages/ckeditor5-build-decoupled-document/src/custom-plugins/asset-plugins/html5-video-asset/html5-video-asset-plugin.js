/**
 * Author: Alex Campbell
 * Date: 2020-07-03
 * Description: A plugin for add/editing/previewing HTML5 Video. 
 * 
 * Note: I largely copied the logic found in the CKEditor5 Image plugin, but tried to simplify it where I thought it was appropriate. 
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import editIcon from '../icons/editicon.svg'
import previewIcon from '../icons/previewicon.svg'
import addVideoIcon from './style/videoicon.svg'
import Command from '@ckeditor/ckeditor5-core/src/command';
import fullWidthIcon from '@ckeditor/ckeditor5-core/theme/icons/object-full-width.svg';
import leftIcon from '@ckeditor/ckeditor5-core/theme/icons/object-left.svg';
import centerIcon from '@ckeditor/ckeditor5-core/theme/icons/object-center.svg';
import rightIcon from '@ckeditor/ckeditor5-core/theme/icons/object-right.svg';
import { AssetPluginHelper } from '../asset-plugin-helper';
import { getSelectedVideoWidget, captionElementCreator, getCaptionFromVideo, matchVideoCaption, convertMapIteratorToMap, viewFigureToModel, createVideoViewElement, toVideoWidget, modelToViewAttributeConverter, isVideo, isVideoWidget } from './video-utils';
import Observer from '@ckeditor/ckeditor5-engine/src/view/observer/observer';
import './style/style.css';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import WidgetToolbarRepository from '@ckeditor/ckeditor5-widget/src/widgettoolbarrepository';

export const VIDEO_PLUGIN_NAME = "html5Video";
export const EDIT_VIDEO_PLUGIN_NAME = "editHTML5Video";
export const PREVIEW_VIDEO_PLUGIN_NAME = "previewHTML5Video";
export const ADD_VIDEO_HTML_COMMAND = "addNewHTML5Video";
export const EDIT_VIDEO_HTML_COMMAND = "editHTML5Video";
export const VIDEO_ALIGN_LEFT_STYLE = "alignLeft";
export const VIDEO_ALIGN_RIGHT_STYLE = "alignRight";
export const VIDEO_ALIGN_CENTER_STYLE = "alignCenter";
export const VIDEO_ALIGN_FULL_STYLE = "full";

export const VIDEO_STYLES = {};
VIDEO_STYLES[VIDEO_ALIGN_FULL_STYLE] = {
    name: 'full',
    title: 'Full size video',
    icon: fullWidthIcon,
    isDefault: true,
    className: 'image-style-full'
};
VIDEO_STYLES[VIDEO_ALIGN_LEFT_STYLE] = {
    name: 'alignLeft',
    title: 'Left-aligned video',
    icon: leftIcon,
    className: 'image-style-align-left'
};
VIDEO_STYLES[VIDEO_ALIGN_RIGHT_STYLE] = {
    name: 'alignRight',
    title: 'Right-aligned video',
    icon: rightIcon,
    className: 'image-style-align-right'
};
VIDEO_STYLES[VIDEO_ALIGN_CENTER_STYLE] = {
    name: 'alignCenter',
    title: 'Center-aligned video',
    icon: centerIcon,
    className: 'image-style-align-center'
};

export class HTML5VideoPlugin extends Plugin {
	static get requires() {
		return [ Widget ];
    }
    
    constructor(editor) {
        super(editor);
        this.pluginName = VIDEO_PLUGIN_NAME;
    }

    defaultPreviewButtonHandler(data) {
        const map = convertMapIteratorToMap(data);
        if (map["assettype"] == 'video') {
            window.open(map["src"], "_blank");
        }
    }

    init() {
        const editor = this.editor;
        this.addVideoSchema(editor);
        this.editor.commands.add('addNewVideo', new AddNewVideo(this.editor));
        this.toolbarButtonCallback = AssetPluginHelper.getToolbarButtonCallbackFromConfig(editor.config, this.pluginName);
        this.editButtonCallback = AssetPluginHelper.getEditButtonCallbackFromConfig(editor.config, this.pluginName);
        const userSuppliedPreviewCallback = AssetPluginHelper.getNested(editor.config, this.pluginName, "previewButtonCallback");
        if (userSuppliedPreviewCallback == null) {
            console.log("No Preview handler defined for HTML5Video plugin. Using default new-tab hander!");
            this.previewButtonCallback = this.defaultPreviewButtonHandler;
        } else {
            this.previewButtonCallback = userSuppliedPreviewCallback;
        }
        
        // Define the component for the "Add Video" button in the main toolbar
        AssetPluginHelper.createComponent(editor, VIDEO_PLUGIN_NAME, "Add HTML5 Video", addVideoIcon, () => {
            this.toolbarButtonCallback();
        });
        AssetPluginHelper.createComponent(editor, EDIT_VIDEO_PLUGIN_NAME, "Edit HTML5 Video", editIcon, () => {
            const t = editor.model.document.selection.getSelectedElement();
            this.editButtonCallback(t.getAttributes());
        });
        AssetPluginHelper.createComponent(editor, PREVIEW_VIDEO_PLUGIN_NAME, "Preview Asset", previewIcon, () => {
            const t = editor.model.document.selection.getSelectedElement();
            this.previewButtonCallback(t.getAttributes());
        });

        // Create components for adjusting the style of the video
        editor.commands.add( 'videoStyle', new VideoStyleCommand( editor, VIDEO_STYLES ) );
        for (const styleName in VIDEO_STYLES) {
            const style = VIDEO_STYLES[styleName];
            const componentName = `videoStyle:${ style.name }`;
            editor.ui.componentFactory.add( componentName, locale => {
                const command = editor.commands.get( 'videoStyle' );
                const view = new ButtonView( locale );
                view.set( {
                    label: style.title,
                    icon: style.icon,
                    tooltip: true,
                    isToggleable: true
                } );
    
                view.bind( 'isEnabled' ).to( command, 'isEnabled' );
                view.bind( 'isOn' ).to( command, 'value', value => value === style.name );
    
                this.listenTo( view, 'execute', () => {
                    editor.execute( 'videoStyle', { value: style.name } );
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

		widgetToolbarRepository.register( 'video', {
			ariaLabel: t( 'Video toolbar' ),
			items: editor.config.get( 'video.toolbar' ) || [],
			getRelatedElement: getSelectedVideoWidget
		} );
	}

    addVideoSchema(editor) {
        // Register new model elements to represent a video tag, 
        const allowedAttributes = ['height', 'class', 'src', 'type', 'width', 'videoStyle', 'assetid', 'assettype'];
        const schema = editor.model.schema;
        const t = editor.t;
        editor.editing.view.addObserver( VideoLoadObserver );
        schema.register("video", {
            isObject: true,
            isBlock: true,
            allowWhere: '$block',
            allowAttributes: allowedAttributes
        });


        const conversion = this.editor.conversion;
		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'video',
			view: ( modelElement, viewWriter ) => createVideoViewElement( viewWriter )
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'video',
			view: ( modelElement, viewWriter ) => toVideoWidget( createVideoViewElement( viewWriter ), viewWriter, t( 'video widget' ) )
        } );
        
        conversion.for( 'downcast' ).add( modelToViewAttributeConverter( 'src' ) );

        conversion.for( 'upcast' )
        .elementToElement( {
            view: {
                name: 'video',
                attributes: {
                    src: true
                }
            },
            model: ( viewImage, modelWriter ) => modelWriter.createElement( 'video', { src: viewImage.getAttribute( 'src' ) } )
        } )
        .add( viewFigureToModel() );

        const videoStyleViewDef = {};
        videoStyleViewDef[VIDEO_ALIGN_CENTER_STYLE] = {
            name: 'figure',
            key: 'class',
            value: ['image-style-align-center']
        }
        videoStyleViewDef[VIDEO_ALIGN_LEFT_STYLE] = {
            name: 'figure',
            key: 'class',
            value: [ 'image-style-align-left']
        }
        videoStyleViewDef[VIDEO_ALIGN_RIGHT_STYLE] = {
            name: 'figure',
            key: 'class',
            value: [ 'image-style-align-right']
        }
        videoStyleViewDef[VIDEO_ALIGN_FULL_STYLE] = {
            name: 'figure',
            key: 'class',
            value: [ 'image-style-full']
        }
        editor.conversion.attributeToAttribute({
            model: {
                name: 'video',
                key: 'videoStyle',
                values: [VIDEO_ALIGN_CENTER_STYLE, VIDEO_ALIGN_LEFT_STYLE, VIDEO_ALIGN_RIGHT_STYLE, VIDEO_ALIGN_FULL_STYLE]
            },
            view: videoStyleViewDef
        });
    }
}

class AddNewVideo extends Command {
    execute() {
        this.editor.model.change( writer => {
            const newData = {
                src: 'https://akilli.github.io/demo-browser/file/sample.ogv',
                videoStyle: VIDEO_ALIGN_FULL_STYLE,
                muted: "muted",
                disablePictureInPicture: 'disablePictureInPicture'
            };
            newData[AssetPluginHelper.getAssetIdPropertyName()] = 22;
            newData[AssetPluginHelper.getAssetTypePropertyName()] = 'video';
            const videoElement = writer.createElement( 'video', newData );
    
            this.editor.model.insertContent( videoElement, this.editor.model.document.selection );
        } );
    }
}

export class VideoLoadObserver extends Observer {

	observe( domRoot ) {
		this.listenTo( domRoot, 'load', ( event, domEvent ) => {
			const domElement = domEvent.target;

			if ( domElement.tagName == 'video' ) {
				this._fireEvents( domEvent );
			}
			// Use capture phase for better performance (#4504).
		}, { useCapture: true } );
	}

	_fireEvents( domEvent ) {
		if ( this.isEnabled ) {
			this.document.fire( 'layoutChanged' );
			this.document.fire( 'videoLoaded', domEvent );
		}
	}
}

export default class VideoStyleCommand extends Command  {
	constructor( editor, styles ) {
		super( editor );
        this.defaultStyle = false;
        this.styles = {};
        for (const s in styles) {
            this.styles[s] = styles[s];
        }
    }
    
	refresh() {
		const element = this.editor.model.document.selection.getSelectedElement();
		this.isEnabled = isVideo( element );

		if ( !element ) {
			this.value = false;
		} else if ( element.hasAttribute( 'videoStyle' ) ) {
			const attributeValue = element.getAttribute( 'videoStyle' );
			this.value = this.styles[ attributeValue ] ? attributeValue : false;
		} else {
			this.value = this.defaultStyle;
		}
	}

	execute( options ) {
		const styleName = options.value;
		const model = this.editor.model;
		const videoElement = model.document.selection.getSelectedElement();
		model.change( writer => {
			if ( this.styles[ styleName ].isDefault ) {
				writer.removeAttribute( 'videoStyle', videoElement );
			} else {
				writer.setAttribute( 'videoStyle', styleName, videoElement );
			}
		} );
	}
}

export class VideoCaption extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'VideoCaption';
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
			allowIn: 'video',
			allowContentOf: '$block',
			isLimit: true
		} );

		editor.model.document.registerPostFixer( writer => this._insertMissingModelCaptionElement( writer ) );

		// View to model converter for the data pipeline.
		editor.conversion.for( 'upcast' ).elementToElement( {
			view: matchVideoCaption,
			model: 'caption'
		} );

		// Model to view converter for the data pipeline.
		const createCaptionForData = writer => writer.createContainerElement( 'figcaption' );
		data.downcastDispatcher.on( 'insert:caption', captionModelToView( createCaptionForData, false ) );

		// Model to view converter for the editing pipeline.
		const createCaptionForEditing = captionElementCreator( view, t( 'Enter video caption' ) );
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

		if ( selectedElement && selectedElement.is( 'video' ) ) {
			const modelCaption = getCaptionFromVideo( selectedElement );
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

		const videosWithoutCaption = [];

		for ( const entry of changes ) {
			if ( entry.type == 'insert' && entry.name != '$text' ) {
				const item = entry.position.nodeAfter;

				if ( item.is( 'video' ) && !getCaptionFromVideo( item ) ) {
					videosWithoutCaption.push( item );
				}

				if ( !item.is( 'video' ) && item.childCount ) {
					for ( const nestedItem of model.createRangeIn( item ).getItems() ) {
						if ( nestedItem.is( 'video' ) && !getCaptionFromVideo( nestedItem ) ) {
							videosWithoutCaption.push( nestedItem );
						}
					}
				}
			}
		}

		for ( const video of videosWithoutCaption ) {
			writer.appendElement( 'caption', video );
		}

		return !!videosWithoutCaption.length;
	}
}

function captionModelToView( elementCreator, hide = true ) {
	return ( evt, data, conversionApi ) => {
		const captionElement = data.item;

		// Return if element shouldn't be present when empty.
		if ( !captionElement.childCount && !hide ) {
			return;
		}

		if ( isVideo( captionElement.parent ) ) {
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

	if ( caption && caption.parent && caption.parent.name == 'video' ) {
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