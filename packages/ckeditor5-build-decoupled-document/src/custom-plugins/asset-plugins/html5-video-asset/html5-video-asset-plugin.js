/**
 * Author: Alex Campbell
 * Date: 2020-07-03
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import addVideoIcon from './style/videoicon.svg'
import Command from '@ckeditor/ckeditor5-core/src/command';
import { AssetPluginHelper } from '../asset-plugin-helper';
import { getSelectedVideoWidget, viewFigureToModel, createVideoViewElement, toVideoWidget, modelToViewAttributeConverter, getViewVideoFromWidget } from './video-utils';
import Observer from '@ckeditor/ckeditor5-engine/src/view/observer/observer';
import './style/style.css';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import VideoToolbar from './video-toolbar';

export const VIDEO_PLUGIN_NAME = "html5Video";
export const ADD_VIDEO_HTML_COMMAND = "addNewHTML5Video";
export const EDIT_VIDEO_HTML_COMMAND = "editHTML5Video";
export const VIDEO_ALIGN_LEFT_STYLE = "alignLeft";
export const VIDEO_ALIGN_RIGHT_STYLE = "alignRight";
export const VIDEO_ALIGN_CENTER_STYLE = "alignCenter";

function getNested(obj, ...args) {
    return args.reduce((obj, level) => obj && obj[level], obj)
}

export class HTML5VideoPlugin extends Plugin {
	static get requires() {
		return [ VideoToolbar, Widget ];
	}

    init() {
        const editor = this.editor;
        this.toolbarButtonCallback = AssetPluginHelper.getToolbarButtonCallbackFromConfig(editor.config, this.pluginName);
        this.addVideoSchema(editor);
        this.editor.commands.add('addNewVideo', new AddNewVideo(this.editor));
        
        // Define the plugin
        editor.ui.componentFactory.add( VIDEO_PLUGIN_NAME, locale => {
            const view = new ButtonView( locale );

            view.set( {
                label: "Add HTML5 Video",
                icon: addVideoIcon,
                tooltip: true
            } );

            return view;
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
        editor.conversion.attributeToAttribute({
            model: {
                name: 'video',
                key: 'videoStyle',
                values: [VIDEO_ALIGN_CENTER_STYLE, VIDEO_ALIGN_LEFT_STYLE, VIDEO_ALIGN_RIGHT_STYLE]
            },
            view: videoStyleViewDef
        });
    }
}

class AddNewVideo extends Command {
    execute() {
        // Create an image model element, and assign it the metadata that was passed in. Note that ALL changes to the model
        // need to be made through the model.change((writer) => {...}) pattern
        this.editor.model.change( writer => {
            const newData = {
                src: 'file://///wsl$/Ubuntu/home/alex/test-movie.mp4',
                videoStyle: 'alignRight',
                disablePictureInPicture: 'disablePictureInPicture'
            };
            newData[AssetPluginHelper.getAssetIdPropertyName()] = 22;
            newData[AssetPluginHelper.getAssetTypePropertyName()] = 'video';
            const videoElement = writer.createElement( 'video', newData );
    
            // Insert the image in the current selection location.
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
			this.document.fire( 'imageLoaded', domEvent );
		}
	}
}