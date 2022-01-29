/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

// The editor creator to use.
import DecoupledEditorBase from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import Notification from '@ckeditor/ckeditor5-ui/src/notification/notification';
import Font from '@ckeditor/ckeditor5-font/src/font';
import FontSize from '@ckeditor/ckeditor5-font/src/fontsize';
import FontFamily from '@ckeditor/ckeditor5-font/src/fontfamily';
import FontColor from '@ckeditor/ckeditor5-font/src/fontcolor';
import FontBackgroundColor from '@ckeditor/ckeditor5-font/src/fontbackgroundcolor';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import Indent from '@ckeditor/ckeditor5-indent/src/indent';
import IndentBlock from '@ckeditor/ckeditor5-indent/src/indentblock';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import ListStyle from '@ckeditor/ckeditor5-list/src/liststyle';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import TextTransformation from '@ckeditor/ckeditor5-typing/src/texttransformation';
import RemoveMarkings from './custom-plugins/remove-markings/remove-markings';
import { EditImageBasedAssetPlugin, PreviewImageBasedAssetPlugin } from './custom-plugins/asset-plugins/image-based-asset-plugin';
import { ImageWithMetadataPlugin } from './custom-plugins/asset-plugins/image-with-metadata/image-with-metadata';
import HTML5VideoPlugin, { VideoCaption } from './custom-plugins/asset-plugins/html5-video-asset/html5VideoPlugin';
import HTML5AudioPlugin, { AudioCaption } from './custom-plugins/asset-plugins/html5-audio-asset/html5AudioPlugin.js';
import { ClassifyPlugin } from './custom-plugins/generic-plugins/classify';
import ImageInterceptor from './custom-plugins/image-interceptor/imageinterceptor';
import LinkInterceptor from './custom-plugins/link-interceptor/linkinterceptor';
import Highlight from '@ckeditor/ckeditor5-highlight/src/highlight';
import Base64UploadAdapter from '@ckeditor/ckeditor5-upload/src/adapters/base64uploadadapter';
import DocumentLink from './custom-plugins/document-link/document-link';
import SpecialHandling from './custom-plugins/special-handling/special-handling';

export default class DecoupledEditor extends DecoupledEditorBase {}

// Plugins to include in the build.
DecoupledEditor.builtinPlugins = [
	Essentials,
	Base64UploadAdapter,
	Alignment,
	Notification,
	Font,
	FontSize,
	FontFamily,
	FontColor,
	FontBackgroundColor,
	Highlight,
	Autoformat,
	Bold,
	Italic,
	Strikethrough,
	Underline,
	BlockQuote,
	Heading,
	SpecialHandling,
	Image,
	ImageToolbar,
	ImageCaption,
	ImageStyle,
	ImageResize,
	Indent,
	IndentBlock,
	List,
	ListStyle,
	Paragraph,
	PasteFromOffice,
	Table,
	TableToolbar,
	TextTransformation,
	RemoveMarkings,
	ImageWithMetadataPlugin,
	EditImageBasedAssetPlugin,
	PreviewImageBasedAssetPlugin,
	HTML5VideoPlugin,
	VideoCaption,
	HTML5AudioPlugin,
	AudioCaption,
	ClassifyPlugin,
	ImageInterceptor,
	LinkInterceptor,
	DocumentLink
];

// Editor configuration.
DecoupledEditor.defaultConfig = {
	toolbar: {
		items: [
			'classify',
			'heading',
			'|',
			'fontfamily',
			'fontsize',
			'fontColor',
			'fontBackgroundColor',
			'highlight',
			'|',
			'bold',
			'italic',
			'underline',
			'strikethrough',
			'|',
			'removeMarkings',
			'imageWithMetadata',
			'html5Video',
			'html5Audio',
			'DocumentLink',
			'|',
			'alignment',
			'|',
			'numberedList',
			'bulletedList',
			'|',
			'outdent',
			'indent',
			'|',
			'blockquote',
			'insertTable',
			'|',
			'undo',
			'redo',
		]
	},
	image: {
		resizeUnit: 'px',
		toolbar: [
			'previewImageBasedAsset',
			'|',
			'imageStyle:alignLeft',
			'imageStyle:alignCenter',
			'imageStyle:full',
			'imageStyle:alignRight',
			'|',
			'editImageBasedAsset'
		]
	},
	table: {
		contentToolbar: [
			'tableColumn',
			'tableRow',
			'mergeTableCells'
		]
	},
	html5Video: {
		toolbar: [
			'previewHTML5Video',
			'|',
			'videoStyle:alignLeft',
			'videoStyle:alignCenter',
			'videoStyle:full',
			'videoStyle:alignRight',
			'|',
			'editHTML5Video'
		]
	},
	html5Audio: {
		toolbar: [
			'previewHTML5Audio',
			'|',
			'audioStyle:alignLeft',
			'audioStyle:alignCenter',
			'audioStyle:full',
			'audioStyle:alignRight',
			'|',
			'editHTML5Audio'
		]
	},
	// This value must be kept in sync with the language defined in webpack.config.js.
	language: 'en'.anchor,
};
