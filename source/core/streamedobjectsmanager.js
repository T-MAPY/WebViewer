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

goog.provide('owg.StreamedObjectsManager');

goog.require('owg.MercatorQuadtree');
goog.require('owg.Geometry');

//------------------------------------------------------------------------------
/**
 * @constructor
 * @description ...
 * @author Martin Vlcek
 */
function StreamedObjectsManager(engine, geometrylayerlist)
{
    this.engine = engine;
    this.objects = {};
    this.objectsList = [];
    this.geometryLayer = null;
    this.quadtree = new MercatorQuadtree();
    this.loadingPaths = [];

    if (geometrylayerlist.length > 0)
    {
        this.geometryLayer = geometrylayerlist[0];
    }
    
    this.GetGeometries = function (geometries, paths)
    {
        geometries.splice(0, geometries.length);

        for (var i = 0; i < paths.length; i++)
        {
            if (this.objects[paths[i]] != undefined)
            {
                geometries.push(this.objects[paths[i]]);
            }
        }
    }


    this.GetPathsFromQuadCode = function (quadcode)
    {
        var coords = new Array(4);
        this.quadtree.QuadKeyToWGS84(quadcode, coords);

        var xMin = Math.floor((coords[1] - this.geometryLayer.objectsOrigin[0]) / this.geometryLayer.objectsStep);
        var xMax = Math.floor((coords[3] - this.geometryLayer.objectsOrigin[0]) / this.geometryLayer.objectsStep);
        var yMin = Math.floor((coords[2] - this.geometryLayer.objectsOrigin[1]) / this.geometryLayer.objectsStep);
        var yMax = Math.floor((coords[0] - this.geometryLayer.objectsOrigin[1]) / this.geometryLayer.objectsStep);

        if (xMin > xMax)
        {
            var tmp = xMin;
            xMin = xMax;
            xMax = tmp;
        }
        if (yMin > yMax)
        {
            var tmp = yMin;
            yMin = yMax;
            yMax = tmp;
        }

        var paths = [];

        for (var i = xMin; i < xMax; i++)
        {
            for (var j = yMin; j < yMax; j++)
            {
                if (!this.geometryLayer.haveAvailableTiles ||  this.geometryLayer.availableTiles.indexOf('{0}_{1}'.format(i, j)) != -1)
                {
                    var path = this.geometryLayer.servers[0] + '/{0}/{1}/{0}_{1}.json'.format(i, j);

                    paths.push(path);

                    if (this.objects[path] == undefined && !(path in this.loadingPaths))
                    {
                        this.loadingPaths.push(path);

                        var sFilename = path;
                        var geometryBlock = new Geometry(this.engine);
                        geometryBlock.quadcode = quadcode; // store quadcode in texture object
                        //geometryBlock.layer = layer;
                        geometryBlock.cbfReady = _somOnGeometryTileReady; // store the ready callback in mesh object
                        geometryBlock.cbfFailed = _somOnGeometryTileFailed; // store the failure callback in mesh object
                        geometryBlock.caller = this;
                        geometryBlock.Load(sFilename, _somOnGeometryTileReady, _somOnGeometryTileFailed);
                        g_activeRequests++;
                    }
                }
            }
        }

        return paths;
    }

    this.Render = function (paths)
    {
        for (var i = 0; i < paths.length; i++)
        {
            if (this.objects[paths[i]] != undefined)
            {
                this.objects[paths[i]].Render();
            }
        }
    }
}

function _somOnGeometryTileReady(geometry)
{
    var manager = geometry.caller;

    //terrainblock.geometries[layer] = geometry;
    manager.objects[geometry.jsonUrl] = geometry;
    manager.objectsList.push(geometry.jsonUrl);

    g_activeRequests--;
    manager.loadingPaths.splice(manager.loadingPaths.indexOf(geometry.jsonUrl, 1));

    //var coords = new Array(4);
    //manager.quadtree.QuadKeyToWGS84(geometry.quadcode, coords);
    //var offset = geometry.geometries[0].offset;
    //var gc = new GeoCoord(0, 0, 0);
    //gc.FromCartesian(offset[0], offset[1], offset[2]);
    //console.log(coords, [gc.GetLatitude(), gc.GetLongitude()], geometry.jsonUrl);
}
//------------------------------------------------------------------------------
function _somOnGeometryTileFailed()
{
    // currently don't do anything if geometry tile download/creation fails.

    g_activeRequests--;
}

