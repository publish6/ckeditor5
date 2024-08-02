/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

// The editor creator to use.
import { DecoupledEditor as DecoupledEditorBase } from '@ckeditor/ckeditor5-editor-decoupled';
import { EditorWatchdog } from '@ckeditor/ckeditor5-watchdog';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Alignment } from '@ckeditor/ckeditor5-alignment';
import { FontSize, FontFamily, FontColor, FontBackgroundColor } from '@ckeditor/ckeditor5-font';
import { UploadAdapter } from '@ckeditor/ckeditor5-adapter-ckfinder';
import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Bold, Italic, Strikethrough, Underline } from '@ckeditor/ckeditor5-basic-styles';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { CKBox } from '@ckeditor/ckeditor5-ckbox';
import { CKFinder } from '@ckeditor/ckeditor5-ckfinder';
import { EasyImage } from '@ckeditor/ckeditor5-easy-image';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { Image, ImageCaption, ImageResize, ImageStyle, ImageToolbar, ImageUpload, PictureEditing } from '@ckeditor/ckeditor5-image';
import { Indent, IndentBlock } from '@ckeditor/ckeditor5-indent';
import { Link } from '@ckeditor/ckeditor5-link';
import { List, ListProperties } from '@ckeditor/ckeditor5-list';
import { MediaEmbed } from '@ckeditor/ckeditor5-media-embed';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office';
import { Table, TableToolbar } from '@ckeditor/ckeditor5-table';
import { TextTransformation } from '@ckeditor/ckeditor5-typing';
import { CloudServices } from '@ckeditor/ckeditor5-cloud-services';
import { RealTimeCollaborativeEditing } from '@ckeditor/ckeditor5-real-time-collaboration';


// The following plugins enable real-time collaborative comments.
// You do not need to import them if you do not want this integration.
import { Comments } from '@ckeditor/ckeditor5-comments';
import { RealTimeCollaborativeComments } from '@ckeditor/ckeditor5-real-time-collaboration';
import Redact from './custom-plugins/redact/redact';

// The following plugins enable real-time collaborative track changes and are optional.
// They depend on the `Comments` and `RealTimeCollaborativeComments` from above, so make sure to include
// them in the editor plugins if you want to integrate the real-time collaborative track changes.
// You do not need to import them if you do not want this integration.
//import { RealTimeCollaborativeTrackChanges } from '@ckeditor/ckeditor5-real-time-collaboration';
//import { TrackChanges } from '@ckeditor/ckeditor5-track-changes';

// The following plugins enable revision history for real-time collaboration.
// You do not need to import them if you do not want this integration.
//import { RealTimeCollaborativeRevisionHistory } from '@ckeditor/ckeditor5-real-time-collaboration';
//import { RevisionHistory } from '@ckeditor/ckeditor5-revision-history';

// The following plugin enables the users presence list and is optional.
// You do not need to import it if you do not want to integrate the user list.
//import { PresenceList } from '@ckeditor/ckeditor5-real-time-collaboration';

export default class DecoupledEditor extends DecoupledEditorBase {
	public static override builtinPlugins = [
		Essentials,
		Alignment,
		FontSize,
		FontFamily,
		FontColor,
		FontBackgroundColor,
		UploadAdapter,
		Autoformat,
		Bold,
		Italic,
		Strikethrough,
		Underline,
		BlockQuote,
		CKBox,
		CKFinder,
		CloudServices,
		EasyImage,
		Heading,
		Image,
		ImageCaption,
		ImageResize,
		ImageStyle,
		ImageToolbar,
		ImageUpload,
		Indent,
		IndentBlock,
		Link,
		List,
		ListProperties,
		MediaEmbed,
		Paragraph,
		PasteFromOffice,
		PictureEditing,
		Table,
		TableToolbar,
		TextTransformation,
		//Comments,
		Redact
		//RealTimeCollaborativeEditing,
		//Comments, RealTimeCollaborativeComments,
		//TrackChanges, RealTimeCollaborativeTrackChanges,
		//RevisionHistory, RealTimeCollaborativeRevisionHistory,
		//PresenceList
	];

	public static override defaultConfig = {
		toolbar: {
			items: [
				'undo', 'redo',
				'|', 'heading',
				'|', 'fontfamily', 'fontsize', 'fontColor', 'fontBackgroundColor',
				'|', 'bold', 'italic', 'underline', 'strikethrough',
				'|', 'redact', 'link', 'uploadImage', 'insertTable', 'blockQuote', 'mediaEmbed',
				'|', 'alignment',
				'|', 'bulletedList', 'numberedList', 'outdent', 'indent'
			]
		},
		image: {
			resizeUnit: 'px' as const,
			toolbar: [
				'imageStyle:inline',
				'imageStyle:wrapText',
				'imageStyle:breakText',
				'|',
				'toggleImageCaption',
				'imageTextAlternative'
			]
		},
		table: {
			contentToolbar: [
				'tableColumn',
				'tableRow',
				'mergeTableCells'
			]
		},
		list: {
			properties: {
				styles: true,
				startIndex: true,
				reversed: true
			}
		},
		// This value must be kept in sync with the language defined in webpack.config.js.
		language: 'en'
	};
}
