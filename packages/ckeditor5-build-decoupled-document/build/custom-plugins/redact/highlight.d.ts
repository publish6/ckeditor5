/**
 * The highlight plugin.
 *
 * For a detailed overview, check the {@glink features/highlight Highlight feature} documentation.
 *
 * This is a "glue" plugin which loads the {@link module:highlight/highlightediting~HighlightEditing} and
 * {@link module:highlight/highlightui~HighlightUI} plugins.
 *
 * @extends module:core/plugin~Plugin
 */
export default class Highlight {
    /**
     * @inheritDoc
     */
    static get requires(): (typeof HighlightEditing)[];
    /**
     * @inheritDoc
     */
    static get pluginName(): string;
}
/**
 * :highlight/highlight~HighlightOption
 */
export type module = {
    /**
     * The user-readable title of the option.
     */
    title: string;
    /**
     * The unique attribute value in the model.
     */
    model: string;
    /**
     * The CSS `var()` used for the highlighter. The color is used in the user interface to represent the highlighter.
     * There is a possibility to use the default color format like rgb, hex or hsl, but you need to care about the color of `<mark>`
     * by adding CSS classes definition.
     */
    color: string;
    /**
     * The CSS class used on the `<mark>` element in the view. It should match the `color` setting.
     */
    class: string;
    /**
     * The type of highlighter:
     *
     * * `'marker'` &ndash; Uses the `color` as the `background-color` style,
     * * `'pen'` &ndash; Uses the `color` as the font `color` style.
     */
    type: 'marker' | 'pen';
};
import HighlightEditing from "./highlightediting";
