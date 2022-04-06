/* eslint-disable no-undef */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import AssetPluginHelper from '../asset-plugins/asset-plugin-helper';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
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
		return [Clipboard];
	}

	/**
	 * @inheritDoc
	 */
	async init() {
		const editor = this.editor;
		const iiConfig = editor.config.get("imageInterceptor");
		const imageCallback = AssetPluginHelper.getNested(iiConfig, 'callback');
		if (imageCallback == null) {
			console.error("editor.config.imageInterceptor.callback is not configured! Pasting/dropping images is not going to work!");
		}

		// Allow the UUID attribute on p tag. We're using the p tag because we get errors, or the attribute gets lost,
		// when we use other tags. Thanks CKEditor.
		const writer = new UpcastWriter(editor.editing.view.document);
		editor.model.schema.extend('paragraph', { allowAttributes: ['uuid', 'data-uuid'] });
		editor.conversion.attributeToAttribute({ model: 'data-uuid', view: 'data-uuid' });

		// On clipboard paste, we want to intercept the data transformation process
		// to find images that we accept. If we find any, we want to replace them with placeholder
		// images (and tag them with UUIDs so that consumers can find them later) and return them
		// in the callback so consumers can decide what to do with them
		editor.plugins.get('ClipboardPipeline').on('inputTransformation', async (evt, data) => {
			const selection = this.editor.model.document.selection.getFirstPosition().clone();

			// Get the HTML data from the paste, and look for images
			const doc = data.content;
			const images = findAllImageElements(doc, writer);
			const invalidImages = [];

			// If we have no images, but the paste actually contains a file, treat it as a file. This ALSO
			// covers drop events (i.e. drag/drop a file on top of the editor) because both paste and drop
			// invoke the "inputTransformation" event.
			if (images == null || images.length == 0) {
				console.warn(data);
				const files = AssetPluginHelper.getNested(data, "dataTransfer", "files");
				handleDataTransferFile(evt, data, files, imageCallback, selection);
			} else {
				// Otherwise, iterate over all of the <img> tags to see if we got any images.
				const promises = [];
				for (let i = 0; i < images.length; i++) {
					const image = images[i];
					const src = image.getAttribute('src');
					const uniqueID = uuid();

					// If the image has a src that we can convert to base64, then do that, and then replace the actual
					// image with a placeholder. It's up to the client to determine what's done with the images.
					// 
					// NOTE: we need to do all of the logic of removing/replacing <img> tags BEFORE we wait on any promises.
					// Otherwise, it's possible for the parsed <img> tags from the paste to reach the editor, which we don't want.
					// If they do, then it's possible that the press app could save images in a format that we don't support.
					console.log(src);
					if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/png;') 
						|| src.startsWith('data:image/jpeg;') || src.startsWith('data:image/jpg;')) {
						const placeholder = writer.createElement("p", { "data-uuid": uniqueID });
						const text = writer.createText(" "); // Need to add something so that the element doesn't simply get removed by ckeditor
						writer.appendChild(text, placeholder);
						writer.replace(image, placeholder); // replace immediately so that the <img> never ends up inside the content
						promises.push(handleInlineImage(image, uniqueID, writer));
					} else {
						writer.remove(image); // If we don't support the format, then remove it entirely
						invalidImages.push(images);
					}
				}

				// If we found images, invoke the callback
				const validImages = await (await Promise.all(promises)).filter(value => value != null);
				imageCallback({ type: "element", data: validImages, caretPosition: selection, invalidImages: invalidImages });
			}
		}, { priority: "normal" }); // set to normal so that it happens AFTER the word paste transformation plugin
	}
}

function handleInlineImage(image, uniqueID, writer) {
	const src = image.getAttribute('src');
	return new Promise((resolve, reject) => {
		getBase64FromImageUrl(src).then(base64Source => {
			writer.setAttribute('src', base64Source, image);
			resolve({ uuid: uniqueID, element: image });
		});
	});
}

function handleDataTransferFile(evt, data, files, imageCallback, selection) {
	if (files != null && files.length > 0) {
		let imageFiles = [];
		const invalidImages = [];
		for (let i = 0; i < files.length; i++) {
			let imageFile = files[i];
			if (imageFile.type == "image/png" || imageFile.type == "image/jpg" || imageFile.type == "image/jpeg") {
				imageFiles.push(imageFile);
			} else if (imageFile.type.startsWith("image/")) {
				// If it's an image, but a format we don't support, fail the entire thing.
				// TODO: Is there a better way to handle image formats we don't support other than dumping out?
				imageFiles = [];
				invalidImages.push(imageFile);
				break;
			}
		}
		imageCallback({ type: "file", data: imageFiles, caretPosition: selection, invalidImages: invalidImages });
	}
}

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function findAllImageElements(documentFragment, writer) {
	const range = writer.createRangeIn(documentFragment);

	const imageElementsMatcher = new ViewMatcher({
		name: 'img'
	});

	const imgs = [];
	for (const value of range) {
		if (imageElementsMatcher.match(value.item)) {
			imgs.push(value.item);
		}
	}

	return imgs;
}

function getBase64FromImageUrl(src) {
	// We need to use promises because we need to wait until the image has loaded.
	return new Promise((resolve, reject) => {
		// If the image is already base64 encoded, just use that.
		if (src.startsWith('data:image/png;') || src.startsWith('data:image/jpeg;') || src.startsWith('data:image/jpg;')) {
			resolve(src);
		} else {
			// otherwise, we need to load the image from the source, put it into a canvas, and export it as a png.
			// This is a clever hack to get base64-encoded data from an img "src" attribute
			var img = new Image();
			img.setAttribute('crossOrigin', 'anonymous'); // as long as the server allows it, this bypasses security issues
			img.src = src;
			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext("2d");
			img.onload = function () {
				canvas.width = this.width;
				canvas.height = this.height;
				ctx.drawImage(this, 0, 0);
				var dataURL = canvas.toDataURL("image/png");
				resolve(dataURL);
			};
		}
	});
}