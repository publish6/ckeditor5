/**
 * Author: Alex Campbell
 * Date: 2020-07-03
 * A base class that defines variables and logic that applies to any asset plugin that is "image-based", or assets that are rendered as images
 * in HTML (images, image link to PDFs, HTML5 interactives, etc). At a minimum, this plugin will allow users to add image-based assets to the editor.
 * It will also allow users to click on an asset, which will bring up toolbar buttons to edit or preview the asset. The exact logic that occurs
 * when any of these buttons are clicked is defined by external applications (i.e. our "press" app). This is so that external applications can
 * use their own designs and code to define HOW the user interacts with the plugin (i.e. UI/UX, form validation, usage of frameworks like Angular, etc).
 * 
 * This plugin should NOT be instantiated directly. Instead, subclasses of this plugin should be created and used
 */

export const ASSET_ID_PROPERTY_NAME = "assetid";
export const ASSET_TYPE_PROPERTY_NAME = "assettype";
export const ASSET_SH_RH_CLASS = "asset-sh-rh";
export const ASSET_SH_RS_CLASS = "asset-sh-rs";
export const ASSET_SH_LD_CLASS = "asset-sh-ld";
export const ASSET_SH_EO_CLASS = "asset-sh-eo";

export class AssetPluginHelper {
    static getAssetIdPropertyName() {
        return ASSET_ID_PROPERTY_NAME;
    }

    static getAssetTypePropertyName() {
        return ASSET_TYPE_PROPERTY_NAME;
    }

    static getAssetSpecialHandlingRH() {
        return ASSET_SH_RH_CLASS;
    }

    static getAssetSpecialHandlingRS() {
        return ASSET_SH_RS_CLASS;
    }
    
    static getAssetSpecialHandlingLD() {
        return ASSET_SH_LD_CLASS;
    }

    static getAssetSpecialHandlingEO() {
        return ASSET_SH_EO_CLASS;
    }

    /**
     * Gets a value from an object using one or more attribute keys. Will return null if any key, at any nesting level, doesn't exist.
     * For example, given the object:
     * var testObj = foo:
     *   bar:
     *     icecream: 4
     *   butt:
     *     lego: 3
     * 
     * observe the results of the following function calls:
     * getNested(testObj, "foo") => {bar: {icecream: 4}, {butt: {lego: 4}}}
     * getNested(testObj, "foo", "bar") =>{icecream: 4}
     * getNested(testObj, "foo", "butt", "lego") => 3
     * getNested(testObj, "this", "property", "path doesnt exist") => null
     * 
     * This function is useful in avoiding tons of null checks when trying to retrieve a nested value from an object. For example, to get the 
     * value of "lego", we'd have to make null checks for testObj, butt, and lego.
     * 
     * @param {*} an object
     * @param  {...any} args 
     */
    static getNested(obj, ...args) {
        return args.reduce((obj, level) => obj && obj[level], obj)
    }

    static getToolbarButtonCallbackFromConfig(config, pluginName) {
        // Ensure that callbacks are defined for adding, editing, and previewing
        const editorConfig = config.get("asset");
        let toolbarButtonCallback = this.getNested(editorConfig, pluginName, "toolbarButtonCallback");
        if (toolbarButtonCallback == null) {
            console.error("editor.config.asset."+pluginName+" is not configured properly! This plugin likely won't work as expecteed!");
            toolbarButtonCallback = () => { alert("No toolbarButtonCallback function was defined!"); }
        } 
        return toolbarButtonCallback;
    }

    static getEditButtonCallbackFromConfig(config, pluginName) {
        // Ensure that callbacks are defined for adding, editing, and previewing
        const editorConfig = config.get("asset");
        let toolbarButtonCallback = this.getNested(editorConfig, pluginName, "editButtonCallback");
        if (toolbarButtonCallback == null) {
            console.error("editor.config.asset."+pluginName+" is not configured properly! This plugin likely won't work as expecteed!");
            toolbarButtonCallback = () => { alert("No editButtonCallback function was defined!"); }
        } 
        return toolbarButtonCallback;
    }

    static getPreviewButtonCallbackFromConfig(config, pluginName) {
        // Ensure that callbacks are defined for adding, editing, and previewing
        const editorConfig = config.get("asset");
        let toolbarButtonCallback = this.getNested(editorConfig, pluginName, "previewButtonCallback");
        if (toolbarButtonCallback == null) {
            console.error("editor.config.asset."+pluginName+" is not configured properly! This plugin likely won't work as expecteed!");
            toolbarButtonCallback = () => { alert("No previewButtonCallback function was defined!"); }
        } 
        return toolbarButtonCallback;
    }
}