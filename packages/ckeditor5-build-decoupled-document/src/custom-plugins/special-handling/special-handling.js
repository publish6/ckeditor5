/**
 * Author: Alex Campbell
 * Date: 2020-07-03
 **/

 import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
 import AssetPluginHelper from '../asset-plugins/asset-plugin-helper';

 export const ASSET_ID_PROPERTY_NAME = AssetPluginHelper.getAssetIdPropertyName();
 export const ASSET_TYPE_PROPERTY_NAME = AssetPluginHelper.getAssetTypePropertyName();
 export const ASSET_SH_RH_CLASS = AssetPluginHelper.getClassForSpecialHandlingRH();
 export const ASSET_SH_RS_CLASS = AssetPluginHelper.getClassForSpecialHandlingRS();
 export const ASSET_SH_LD_CLASS = AssetPluginHelper.getClassForSpecialHandlingLD();
 export const ASSET_SH_EO_CLASS = AssetPluginHelper.getClassForSpecialHandlingEO();
 export const ASSET_SH_NONE_CLASS = AssetPluginHelper.getClassForSpecialHandlingNone();
 
 export default class SpecialHandling extends Plugin {
   constructor( editor, pluginName, displayLabel, svgIcon, assetType ) {
     super( editor );
     this.pluginName = pluginName;
     this.displayLabel = displayLabel;
     this.svgIcon = svgIcon;
     this.assetType = assetType;
   }

   init() {
      const editor = this.editor;

      editor.conversion.attributeToAttribute({
        model: {
          key: 'specialHandling',
          value: [AssetPluginHelper.getAbbrForSpecialHandlingRS()]
        },
        view: {
          key: 'class',
          value: [ASSET_SH_RS_CLASS]
        }
      });

      editor.conversion.attributeToAttribute({
        model: {
          key: 'specialHandling',
          value: AssetPluginHelper.getAbbrForSpecialHandlingRH()
        },
        view: {
          key: 'class',
          value: ASSET_SH_RH_CLASS
        }
      });

      editor.conversion.attributeToAttribute({
        model: {
          key: 'specialHandling',
          value: AssetPluginHelper.getAbbrForSpecialHandlingLD()
        },
        view: {
          key: 'class',
          value: ASSET_SH_LD_CLASS
        }
      });

      editor.conversion.attributeToAttribute({
        model: {
          key: 'specialHandling',
          value: AssetPluginHelper.getAbbrForSpecialHandlingEO()
        },
        view: {
          key: 'class',
          value: ASSET_SH_EO_CLASS
        }
      });

      editor.conversion.attributeToAttribute({
        model: {
          key: 'specialHandling',
          value: AssetPluginHelper.getAbbrForSpecialHandlingNone()
        },
        view: {
          key: 'class',
          value: ASSET_SH_NONE_CLASS
        }
      });
  }
}
 