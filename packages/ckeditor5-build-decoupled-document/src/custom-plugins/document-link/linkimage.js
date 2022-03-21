/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module link/linkimage
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import DocumentLinkImageEditing from './linkimageediting';
import DocumentLinkImageUI from './linkimageui';

import '../theme/linkimage.css';

/**
 * The `LinkImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/linkimageediting~LinkImageEditing link image editing feature}
 * and {@link module:link/linkimageui~LinkImageUI link image UI feature}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class DocumentLinkImage extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ DocumentLinkImageEditing, DocumentLinkImageUI ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'LinkImage';
	}
}
