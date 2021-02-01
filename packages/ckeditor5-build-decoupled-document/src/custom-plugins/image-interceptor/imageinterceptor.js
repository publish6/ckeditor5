/* eslint-disable no-undef */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import AssetPluginHelper from '../asset-plugins/asset-plugin-helper';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import DomConverter from '@ckeditor/ckeditor5-engine/src/view/domconverter';
import ViewDocument from '@ckeditor/ckeditor5-engine/src/view/document';
import ViewMatcher from '@ckeditor/ckeditor5-engine/src/view/matcher';

/**
 * A plugin that fires events from the editor when pastes occur that contain images. Useful for intercepting
 * images and doing further processing on them.
 * 
 * // TODO: it may be a better, alternative solution to look into "Custom File Upload Adapters" in CKEditor5.
 * The only reason I'm not pursuing this path is because we need to be able to allow the user to modify metadata
 * of the image (classification of image, etc) before it goes to the server.
 */
export default class ImageInterceptor extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageInterceptor';
	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ Clipboard ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const iiConfig = editor.config.get("imageInterceptor");
		const imageCallback = AssetPluginHelper.getNested( iiConfig, 'callback' );
		if (imageCallback == null) {
			console.error("editor.config.imageInterceptor.callback is not configured! Pasting/dropping images is not going to work!");
		}
		
		// Allow the UUID attribute on p tag. We're using the p tag because we get errors, or the attribute gets lost,
		// when we use other tags. Thanks CKEditor.
		const writer = new UpcastWriter(editor.editing.view.document);
		editor.model.schema.extend( 'paragraph', { allowAttributes: [ 'uuid', 'data-uuid' ] } );
		editor.conversion.attributeToAttribute( { model: 'data-uuid', view: 'data-uuid'} );

		// On clipboard paste, we want to intercept the data transformation process
		// to find images that we accept. If we find any, we want to replace them with placeholder
		// images (and tag them with UUIDs so that consumers can find them later) and return them
		// in the callback so consumers can decide what to do with them
		editor.plugins.get( 'Clipboard' ).on( 'inputTransformation', ( evt, data ) => {
			const selection = this.editor.model.document.selection.getFirstPosition().clone();

			// Get the HTML data from the paste, and look for images
			const doc = data.content;
			const images = findAllImageElements(doc, writer);
			const validImages = [];

			// At this point, we're assuming that because this plugin has priority:normal, images have already been
			// converetd into base64 by other plugins. Therefore, search for images in formats we accept. If we find
			// any, replace the image inline with a placeholder.
			for (let i = 0; i < images.length; i++) {
				const src = images[i].getAttribute('src');
				if (src.startsWith('data:image/png;') || src.startsWith('data:image/jpeg;') || src.startsWith('data:image/jpg;')) {
					const uniqueID = uuid();
					const placeholder = writer.createElement("p", { "data-uuid" : uniqueID});
					const text = writer.createText(" "); // Need to add something so that the element doesn't simply get removed by ckeditor
					writer.appendChild(text, placeholder);
					writer.replace(images[i], placeholder);
					validImages.push({uuid: uniqueID, element: images[i]});
				} else {
					writer.remove(images[i]); // If we don't support the format, then remove it entirely
				}
			}

			// If we found images, invoke the callback
			if (validImages.length > 0) {
				imageCallback({type: "element", data: validImages, caretPosition: selection});
			}
		}, {priority: "normal"});

		// We also want to intercept images when dropped (i.e. dragged).
		editor.editing.view.document.on( 'drop', ( evt, data ) => {
			// Get the fiels from the drop event and check if they're images.
			const selection = editor.editing.mapper.toModelPosition( data.dropRange.start );
			console.log(selection);
			const files = AssetPluginHelper.getNested(data, "dataTransfer", "files");
			if (files != null && files.length > 0) {
				const imageFiles = [];
				for (let i = 0; i < files.length; i++) {
					let imageFile = files[i];
					if (imageFile.type == "image/png" || imageFile.type == "image/jpg" || imageFile == "image/jpeg") {
						imageFiles.push(imageFile);
					} else if (imageFile.type.startsWith("image/")) {
						// If it's an image, but a format we don't support, fail the entire thing.
						// TODO: Is there a better way to handle image formats we don't support other than dumping out?
						alert("Images must be either in PNG or JPEG format!");
						imageFiles = [];
						evt.stop();
						data.preventDefault();
						break;
					}
				}

				// If we got at least one image, return the array of images and stop event propagation to prevent
				// CKEditor from inserting the image.
				if (imageFiles.length > 0) {
					evt.stop();
					data.preventDefault();
					imageCallback({type: "file", data: imageFiles, caretPosition: selection});
				}
			}
		}, {priority: 'high'} );
	}
}

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function findAllImageElements( documentFragment, writer ) {
	const range = writer.createRangeIn( documentFragment );

	const imageElementsMatcher = new ViewMatcher( {
		name: 'img'
	} );

	const imgs = [];
	for ( const value of range ) {
		if ( imageElementsMatcher.match( value.item ) ) {
			imgs.push( value.item );
		}
	}

	return imgs;
}