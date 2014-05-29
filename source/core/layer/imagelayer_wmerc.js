/*******************************************************************************
#      ____               __          __  _      _____ _       _               #
#     / __ \              \ \        / / | |    / ____| |     | |              #
#    | |  | |_ __   ___ _ __ \  /\  / /__| |__ | |  __| | ___ | |__   ___      #
#    | |  | | '_ \ / _ \ '_ \ \/  \/ / _ \ '_ \| | |_ | |/ _ \| '_ \ / _ \     #
#    | |__| | |_) |  __/ | | \  /\  /  __/ |_) | |__| | | (_) | |_) |  __/     #
#     \____/| .__/ \___|_| |_|\/  \/ \___|_.__/ \_____|_|\___/|_.__/ \___|     #
#           | |                                                                #
#           |_|                 _____ _____  _  __                             #
#                              / ____|  __ \| |/ /                             #
#                             | (___ | |  | | ' /                              #
#                              \___ \| |  | |  <                               #
#                              ____) | |__| | . \                              #
#                             |_____/|_____/|_|\_\                             #
#                                                                              #
#                              (c) 2010-2011 by                                #
#           University of Applied Sciences Northwestern Switzerland            #
#                     Institute of Geomatics Engineering                       #
#                           martin.christen@fhnw.ch                            #
********************************************************************************
*     Licensed under MIT License. Read the file LICENSE for more information   *
*******************************************************************************/

goog.provide('owg.WMERCImageLayer');

goog.require('owg.GlobeUtils');
goog.require('owg.ImageLayer');
goog.require('owg.MercatorQuadtree');
goog.require('owg.Texture');

//------------------------------------------------------------------------------
/**
 * @constructor
 * @description global webmercator image layer
 * @author Martin Vlcek
 */
function WMERCImageLayer()
{
    this.mask = null;
    this.quadtree = new MercatorQuadtree();
    this.transparency = 1.0;
    this.maxLod = 17;
    this.isHex = false;

    //---------------------------------------------------------------------------
    this.Ready = function ()
    {
        return true;
    }
    //---------------------------------------------------------------------------
    this.Failed = function ()
    {
        return false;
    }
    //---------------------------------------------------------------------------
    this.RequestTile = function (engine, quadcode, layer, cbfReady, cbfFailed, caller)
    {
        var res = {};
        this.quadtree.QuadKeyToTileCoord(quadcode, res);

        var sFileName;

        if (this.isHex)
        {
            sFileName = this.mask.format(res.lod,this.CreateHexValue(res.y),this.CreateHexValue(res.x));
        }
        else
        {
            sFileName = this.mask.format(res.lod, res.y, res.x);
        }
        var ImageTexture = new Texture(engine);
        ImageTexture.quadcode = quadcode;   // store quadcode in texture object
        ImageTexture.layer = layer;
        ImageTexture.cbfReady = cbfReady;   // store the ready callback in texture object
        ImageTexture.cbfFailed = cbfFailed; // store the failure callback in texture object
        ImageTexture.caller = caller;
        ImageTexture.loadTexture(sFileName, _cbWmercTileReady, _cbWmercTileFailed, true);
    };
    //---------------------------------------------------------------------------
    this.CreateHexValue = function (value)
    {
        var hexValue = value.toString(16);

        var result = "";
        for (var i = 0; i < 8 - hexValue.length; i++) {
            result += "0";
        }
        result += hexValue;

        return result;
    }
    //---------------------------------------------------------------------------

    this.GetMinLod = function ()
    {
        return 0;
    }

    //---------------------------------------------------------------------------
    this.GetMaxLod = function ()
    {
        return this.maxLod;
    }

    //---------------------------------------------------------------------------
    this.Contains = function (quadcode)
    {
        if (quadcode.length < 20)
        {
            return true;
        }
        return false;
    }
    //---------------------------------------------------------------------------

    this.Setup = function (mask, maxLod, isHex)
    {
        this.isHex = isHex;
        this.mask = mask;
        if (maxLod != undefined)
        {
            this.maxLod = maxLod;
        }
    }
}

WMERCImageLayer.prototype = new ImageLayer();

//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
/**
* @description internal callback function for tiles
* @ignore
*/
function _cbWmercTileReady(imgTex)
{
    imgTex.cbfReady(imgTex.quadcode, imgTex, imgTex.layer);
    imgTex.cbfReady = null;
    imgTex.cbfFailed = null;
    imgTex.quadcode = null;
    imgTex.caller = null;
    imgTex.layer = null;
}
//------------------------------------------------------------------------------
/**
 * @description internal callback function for tiles
 * @ignore
 */
function _cbWmercTileFailed(imgTex)
{
    imgTex.cbfFailed(imgTex.quadcode, imgTex.caller, imgTex.layer);
    imgTex.cbfReady = null;
    imgTex.cbfFailed = null;
    imgTex.quadcode = null;
    imgTex.caller = null;
    imgTex.layer = null;
}
//------------------------------------------------------------------------------

