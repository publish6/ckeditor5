
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import AssetPluginHelper from '../asset-plugins/asset-plugin-helper';

/**
 * A plugin that fires events from the editor when pastes occur that contain images. Useful for intercepting
 * images and doing further processing on them.
 * 
 * For example, by default
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
		
		const imageCallback = AssetPluginHelper.getNested( editor.config, 'imageInterceptor', 'callback' );
		if (imageCallback == null) {
			console.error("editor.config.imageInterceptor.callback is not configured! Pasting/dropping images is not going to work!");
		}

		editor.plugins.get( 'Clipboard' ).on( 'inputTransformation', ( evt, data ) => 
		{
			alert( data );
			console.log( data );
		}, { priority: 'low' });

		editor.editing.view.document.on( 'drop', ( evt, data ) => {
			const files = AssetPluginHelper.getNested(data, "dataTransfer", "files");
			if (files != null && files.length > 0) {
				const imageFiles = [];
				for (let i = 0; i < files.length; i++) {
					const imageFile = files[i];
					if (imageFile.type == "image/png" || imageFile.type == "image/jpg" || imageFile == "image/jpeg") {
						imageFiles.push(imageFile);
					}
				}
				if (imageFiles.length > 0) {
					evt.stop();
					data.preventDefault();
					imageCallback({type: "file", data: imageFiles });
				}
			}
			console.log( data );
		}, {priority: 'high'} );
	}
}
