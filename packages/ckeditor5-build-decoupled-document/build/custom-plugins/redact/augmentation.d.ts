/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import type { Redact, HighlightCommand, HighlightConfig, HighlightEditing, HighlightUI } from './index';
declare module '@ckeditor/ckeditor5-core' {
    interface EditorConfig {
        /**
         * The configuration of the {@link module:highlight/highlight~Highlight} feature.
         *
         * Read more in {@link module:highlight/highlightconfig~HighlightConfig}.
         */
        redact?: HighlightConfig;
    }
    interface PluginsMap {
        [Redact.pluginName]: Redact;
        [HighlightEditing.pluginName]: HighlightEditing;
        [HighlightUI.pluginName]: HighlightUI;
    }
    interface CommandsMap {
        redact: HighlightCommand;
    }
}
