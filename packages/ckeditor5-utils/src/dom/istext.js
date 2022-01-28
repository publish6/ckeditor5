/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module utils/dom/istext
 */

/**
 * Checks if the object is a native DOM Text node.
 *
 * @param {*} obj
 * @returns {Boolean}
 */
export default function isText( obj ) {
	try {
		return Object.prototype.toString.call( obj ) == '[object Text]';
	} catch(err) {
		console.warn("isText() threw an exception, thanks CKEditor. Returning false");
		return false;
	}
	
}
