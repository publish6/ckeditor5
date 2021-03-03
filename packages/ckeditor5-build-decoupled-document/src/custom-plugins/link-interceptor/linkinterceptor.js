/* eslint-disable no-undef */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import AssetPluginHelper from '../asset-plugins/asset-plugin-helper';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import ViewMatcher from '@ckeditor/ckeditor5-engine/src/view/matcher';

/**
 * A plugin that removes links from the editor when pasted
 */
export default class LinkInterceptor extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'LinkInterceptor';
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
	init() {
		const editor = this.editor;
    const writer = new UpcastWriter(editor.editing.view.document);
    const clipboardPlugin = editor.plugins.get( 'Clipboard' );
    const editingView = editor.editing.view;

    editor.plugins.get('Clipboard').on('inputTransformation', ( evt, data ) => {
      const dataTransfer = data.dataTransfer;
      const content = data.content;
      if ( editor.isReadOnly ) {
         return;
      }

      // If we find anchor tags, insert their children and delete the tags
      const anchorTags = findAllLinks(content, writer);
      for (let i = 0; i < anchorTags.length; i++) {
        writer.rename("span", anchorTags[i]);
      }

      editingView.scrollToTheSelection();
    }, {priority: 'high'} );
  }
}

function findAllLinks(documentFragment, writer) {
	const range = writer.createRangeIn(documentFragment);

	const linkMatcher = new ViewMatcher({
		name: 'a'
	});

	const links = [];
	for (const value of range) {
		if (linkMatcher.match(value.item)) {
			links.push(value.item);
		}
	}
	return links;
}