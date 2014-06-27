function VectorMap(mapdiv,scope){
                var map,projObject,layer,infoPop;
                var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
                var googleProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
                var data={type:"FeatureCollection", features:[]};
                var citiesFt=[], cityCenterLayer,citiesLayer,markersLayer,cityMarker;
                var highlightCtrl,selectCtrl,selectCtrlwoBox,transfCtrl=null;
                var box_selection=false;
                var skipUpdate=false;
                var self=this;
                var geojson_format = new OpenLayers.Format.GeoJSON({internalProjection:googleProjection,externalProjection:fromProjection});
                
                var select = function(e,skipapply) {
                        if(!e.layer)
                            return;
                       
                    //var city=scope.SelectCityById(e.attributes.id,true);
                         if(infoPop)
                             map.removePopup(infoPop);
                         
                             /*if(!box_selection && e.geometry.bounds.centerLonLat){
                                infoPop=new OpenLayers.Popup.Anchored("city_detail",
                                e.geometry.bounds.centerLonLat,
                                new OpenLayers.Size(200,200),
                                "example popup",null,
                                true);
                                infoPop.panMapIfOutOfView=false;
                                //infoPop.keepInMap=true;
                                map.addPopup(infoPop);
                            }*/
                        
                       e.attributes.selected=true;
                       //e.layer.redraw();
                       if(!skipUpdate)
                       	Android.Select(e.attributes.id);
                    };
                    
                    
                   var unselect = function(e) {
                       if(!e.layer)
                            return;
                       e.attributes.selected=false;
                       if(infoPop)
                             map.removePopup(infoPop);
                       //scope.SelectCityById(e.attributes.id,false)
                       if(!skipUpdate)
                       	Android.Deselect(e.attributes.id);
                    };
                    
  
                function FindCityById(id){
                    if(!citiesFt)
                        return;
                    for(var i=0;i<citiesFt.length;i++){
                        if(citiesFt[i].attributes.id*1===id*1)
                            return citiesFt[i];
                    }
                    return false;
                }

                function resize() {
                    if( !angular.isUndefined(map) && angular.isFunction(map.updateSize))
                    map.updateSize();
                }
                
                this.getData=function(msa){
                    /*AddCities([]);
                    return;*/
                    $.get(msa).success(function(arr,text,response){
                    
                        data.features=[];
                        arr=JSON.parse(arr);
                        arr=arr.length?arr:arr.cities;
                        for(var i=0;i<arr.length;i++){
                            var feat={"type":"Feature","properties":{id:arr[i].gid,name:arr[i].name},geometry:arr[i].shape};
                            data.features.push(feat);
                        }
                        
                        console.log(data.features.length);
                        Android.Ltoast("Drawing Boundaries"); 
                        AddCities(data);
                    }).error(
                        function(){
                            Android.AreaNotLoaded();

                        }
                    )
                    
                }
                
               

                ApplyGeoJson=function(data,features,layer,style,name){

                        
                    if(citiesFt){
                        for(var i=0;i<citiesFt.length;i++)
                            citiesFt[i].destroy();
                    }
                 
                    citiesFt=[];
                    if(selectCtrl){
                        selectCtrlwoBox.deactivate();
                        selectCtrl.deactivate(); 
                        map.removeControl(selectCtrlwoBox);
                        map.removeControl(selectCtrl);
                        selectCtrlwoBox.destroy();
                        selectCtrl.destroy(); 
                        selectCtrlwoBox=selectCtrl=transfCtrl=null; 
                   }
                
                    if(citiesLayer){
                        map.removeLayer(citiesLayer);
                        citiesLayer.destroy();
                        citiesLayer=null;
                    }
                    
                    
                    
                    var myStyles = style;
                    citiesLayer = new OpenLayers.Layer.Vector(name,{
                            styleMap: myStyles,
                            rendererOptions:{zIndexig:true},
                            renderers:["Canvas","SVG","VML"]
                    });
                    citiesLayer.isBaseLayer=true;
                    map.addLayer(citiesLayer);
                    

                   selectCtrl = new OpenLayers.Control.SelectFeature(citiesLayer,{
                        clickout:false,
                        toggle:true,
                        multiple:true,
                        box:true,
                        onSelect: select,
                        onUnselect: unselect
                  });
                  
                  selectCtrlwoBox = new OpenLayers.Control.SelectFeature(citiesLayer,{
                        clickout:false,
                        toggle:true,
                        multiple:true,
                        onSelect: select,
                        onUnselect: unselect
                  });
                  
                  selectCtrl.events.register('boxselectionstart',selectCtrl,function(){
                        box_selection=true;
                        
                  })
                        
                  selectCtrl.events.register('boxselectionend',selectCtrl,function(){
                       box_selection=false;
 
                        
                  })
                    
                  map.addControl(selectCtrl);
                  map.addControl(selectCtrlwoBox);
                  selectCtrl.deactivate(); 
                  selectCtrlwoBox.activate(); 
                  
                  citiesFt=geojson_format.read(data);
                  map.zoomTo(0);
                  
                   citiesLayer.events.register('featuresadded',citiesLayer,function(){
                    citiesLayer.setZIndex( 2 ); 
                    var bounds=citiesLayer.getDataExtent();
                    var z=map.getZoomForExtent(bounds);
                     z-=0.1;
                     

                    map.zoomTo(z);
                        map.panTo(bounds.getCenterLonLat());
                        map.raiseLayer(citiesLayer,5);
                    //z=Math.floor(z);
                   
                    //map.zoomToExtent(bounds);
 /*                     for(var gidx in scope.msa.groups){
                        var g=scope.msa.groups[gidx];
                        if(!g.cities)
                            continue;
                        for(var cidx in g.cities){
                            var c=g.cities[cidx];
                            if(!c.selected || !c.ToggleSelect)
                                continue;
                            c.ToggleSelect(true);
                        }
                    }
                        $rootScope.$$childHead.status='';
                        $rootScope.$$childHead.$apply();*/
                        
                        setTimeout(function(){Android.ApplyUserSelection();});
                   });
                   if(citiesFt)
                       citiesLayer.addFeatures(citiesFt); 
              
              else
                  citiesFt=[];

                  
                 
            }
           
           
        AddCities=function(data){
            this.labelDeltaPixels = function (f) {
                var vert = f.geometry.getVertices();
                var startPoint = vert[0];
                var middlePoint = vert[Math.floor(vert.length/2)];
                var pixelStart = self.mapPanel.map.getPixelFromLonLat(new      OpenLayers.LonLat(startPoint.x, startPoint.y));
                var pixelMiddle = self.mapPanel.map.getPixelFromLonLat(new OpenLayers.LonLat(middlePoint.x, middlePoint.y));
                var deltaX = pixelMiddle.x - pixelStart.x;
                var deltaY = pixelStart.y - pixelMiddle.y;
                return {x: deltaX, y: deltaY};
            }
            
            var context = {
                getLableOffsetX: function(f) {
                var zoom = self.mapPanel.map.getZoom();
                if (zoom < self.centreLabelsZoom) {
                    return 0;
                }

                    if (f.geometry) {
                        if (!self.centrelineMiddleCoordsMap[zoom]) {
                         self.centrelineMiddleCoordsMap[zoom] = {};
                        }
                        if (!self.centrelineMiddleCoordsMap[zoom][f.id]) {
                            self.centrelineMiddleCoordsMap[zoom][f.id] =     self.labelDeltaPixels(f);
                        }
                        return self.centrelineMiddleCoordsMap[zoom][f.id].x+10;
                            return 0;
                    } else {
                        return 0;
                    }
                }
            }
            var template = {
                    fillColor:"#f60",
                   /* label:'${name}',
                    labelXOffset: 5,
                    labelAlign:'lm',
                    graphicZIndex:10,*/
                    fillOpacity:0.5

            };
            var style0 = new OpenLayers.Style(template, {context: context}); 
            var style=new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    fillColor:'#CCC',
                    strokeColor:"#FFFFFF",
                    
                    strokeWidth:"1.5"

                }),

                "select":style0
            }); 
            ApplyGeoJson(data,citiesFt,citiesLayer,style,'Cities');
        };
  
                
        function drawMap(){
            
            var mapOpt={
                projection: "EPSG:900913",
                displayProjection: googleProjection,
                minScale:50,
                maxScale:100000000000000,
                units: "m",
                fractionalZoom:true,
                allOverlays:true,
                controls:[

                ]
            };

            map = new OpenLayers.Map(mapdiv, mapOpt);

    }
    
    this.ToggleBoxSelection=function(state){
        if(state){
            selectCtrlwoBox.deactivate();
            selectCtrl.activate();
        }
        else{
            selectCtrl.deactivate();
            selectCtrlwoBox.activate();
            
        }
    }
    
   this.SelectCities=function(ids,all){
    console.log(ids);
     	var ctrl=selectCtrl.active?selectCtrl:selectCtrlwoBox;
     	skipUpdate=true;
     	ctrl.unselectAll();
    	var cities=ids.split(',');
    	
    	
    	if(!citiesFt)
              return;
        skipUpdate=true;     
        for(var i=0;i<citiesFt.length;i++){
            if(cities.indexOf(citiesFt[i].attributes.id.toString())>=0){
            
           //ctrl.select(citiesFt[i]);
            	var sfn=function(feat,last){
                var f=feat;
               
                
                var fn=function(){
                	
                	ctrl.select(f);
                }
                setTimeout(function(){
    			fn();
    		})
                
            }(citiesFt[i],i);
       	  }
                           
        }
        skipUpdate=false;
        Android.HideProgress();
    }
    
    drawMap();

}

function Map(mapdiv){
                var map,marker,markersLayer,projObject,infoPop;
                var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
                var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
                var markersSpotArr=[];
                var pulses={};
                var map_query="";
                var zoomControl=new OpenLayers.Control.Zoom();
                var miamiCenter;
                //var usProjection   = new OpenLayers.Projection("EPSG:U4M");
                var mapserver='http://demo-maps.aboutplace.co/heat';
                //var mapserver='http://geo.urban4m.com/heat';
                var strTFS,prtTFS=null;
                var stage=null;                
                var Stage1Bounds;
                var url='';
                var nLayer;
                var min_zoom=4,
                    max_zoom=10;

                 var placeMarker=function (ltln,icon,text,clase) {
                    var size = new OpenLayers.Size(60,65);
                    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
                    var tclase='pulse-marker';
                    if(clase && clase.length)
                        tclase+=" "+clase
                    var  marker_icon = new OpenLayers.Icon(icon||'http://www.openlayers.org/dev/img/marker.png', size, offset,null,text+'',tclase);
       
                    var marker=new OpenLayers.Marker(ltln,marker_icon,text);
                    markersLayer.addMarker(marker);
                    return marker;
                }
        
                function deleteMarker(marker) {
                    if(marker){
                        markersLayer.removeMarker(marker);
                        marker.destroy();
                        marker=null;
                    }
                }
                
                function AddSpot(lnlt,text,clase){
                    markersSpotArr.push(placeMarker(lnlt,"img/pointers/pointer_3_1.png",text,clase));
                }
                
                function resize() {
                    if( map && (typeof map).toString().toLowerCase() =="object")
                        map.updateSize();
                    
                    }
                
                this.drawMap=function(){
       

                var mapOpt={
                minZoomLevel: 11,
                    maxZoomlevel:14,
                    tilesize:OpenLayers.Size(256,256),
                    projection:"EPSG:4326",
                    fractionalZoom:true,
                    displayProjection: fromProjection,
                    units: "m",
                    controls:[
                        new OpenLayers.Control.Navigation({'zoomWheelEnabled':false}),
                        new OpenLayers.Control.Zoom(),
                        new OpenLayers.Control.MousePosition()
                    ]
                };


                map = new OpenLayers.Map(mapdiv, mapOpt);
                nLayer=new OpenLayers.Layer.OSM('U4M',[
                    mapserver+"/${z}/${x}/${y}.png?"+map_query                    
                    ],{
                        isBaseLayer:true,
                        tileOptions: {crossOriginKeyword: null},
                        transitionEffect: 'resize'
                    });
                     
                    map.addLayer(nLayer); 



                markersLayer=new OpenLayers.Layer.Markers( "Markers" );
                map.addLayer(markersLayer);
                map.raiseLayer(markersLayer,5);
            Stage1Bounds=new OpenLayers.Bounds(-125,24,-67,49).transform(
                    fromProjection,
                    map.getProjectionObject());
                    
           miamiCenter=new OpenLayers.LonLat(-80.26, 25.81).transform(
                    fromProjection,
                    map.getProjectionObject()
                )
                    
                    
                    map.events.register("zoomend",map,function(){
                        ApplyCluster();
                    });
                    
                        map.zoomToProxy = map.zoomTo;
    map.zoomTo =  function (zoom,xy){
        if(zoom<min_zoom)
            zoom=min_zoom;
        else if(zoom>max_zoom)
            zoom=max_zoom;
        map.zoomToProxy(zoom,xy); 
    };
     
    setTimeout(
            function(){
                resize(); 
                var zoom=map.getZoomForExtent(Stage1Bounds);
                
               map.zoomTo(Math.floor(zoom));
               var h1=Stage1Bounds.getCenterLonLat();
               map.setCenter(h1);
            });
}

    		function AlterZoom(scale,x,y){
			var zoom=map.getZoom()*scale;
			var p= new OpenLayers.Pixel(x,y);
			var lnlt=map.getLonLatFromPixel(p);
                        map.setCenter(lnlt,zoom);
		}
        
        
        function ApplyCluster(){
        if(!markersSpotArr.length)
            return;
         var clustersArr=[
                       [
                           {
                               idx:0,
                               marker:markersSpotArr[0]
                           }
                       ]
                   ];
                   $(".pulse-marker").removeClass (function (index, css) {
                            var arr=css.split(" ");
                            var clases='';
                            for(var i=0;i<arr.length;i++){
                                if(arr[i].match(/cluster/g))
                                    clases+=arr[i];
                            }
                        return clases;
                    });
                   
                   for(var i=1;i<markersSpotArr.length;i++){
                       var matched=false;
                       var point=markersLayer.getViewPortPxFromLonLat(markersSpotArr[i].lonlat);
                       for(var j=0;j<clustersArr.length;j++){
                           if(point.distanceTo(markersLayer.getViewPortPxFromLonLat(clustersArr[j][0].marker.lonlat))<60){
                               clustersArr[j].push({marker:markersSpotArr[i], idx:i});
                               matched=true;
                               break;
                           }
                       }
                       if(!matched){
                           clustersArr.push([
                                {
                                    idx:i,
                                    marker:markersSpotArr[i]
                                }
                            ])
                       }
                   }
                   
                   for(var k=0;k<clustersArr.length;k++){
                         var len=clustersArr[k].length;
                         var alpha=360/(len+2);
                         var beta=alpha/2;
                         var hip=20/Math.sin(beta);
                         var c=markersLayer.getViewPortPxFromLonLat(clustersArr[k][0].marker.lonlat);
                         
                         for(var l=0; l<len;l++){
                             var marker=clustersArr[k][l];
                            
                             if(len<5){
                                  $('.marker_'+marker.idx).addClass("cluster_"+len+"_"+l);
                                 marker.marker.icon.setUrl('img/pointers/pointer_'+len+'_'+l+'.png');
                             }
                             else{
                                  $('.marker_'+marker.idx).addClass("cluster_gt_4");
                                 marker.marker.icon.setUrl('img/pointers/big_cluster.png');
                                 var px={x:0,y:0};
                                 
                                 
                                 px.x=c.x+10+hip*Math.cos(l*alpha);
                                 px.y=c.y+40+hip*Math.sin(l*alpha);
                                 /*px.x-=20;
                                 px.y-=20;*/
                                 marker.marker.icon.moveTo(px);
                             }
                         }
                     }
    }
    
  
    this.SetStage=function(nStage){
        if(nStage===3){
            min_zoom=6;
            max_zoom=14;
            map.zoomTo(12);
        }
        else{ 
             for(var i=0;i< markersSpotArr.length;i++){
                    deleteMarker(markersSpotArr[i]);
            }
            $(".pulse-marker").off('click');
            if(nStage===1){
                min_zoom=4;
                max_zoom=10;
                var zoom=map.getZoomForExtent(Stage1Bounds);
               map.zoomTo(Math.round(zoom));
               var h1=Stage1Bounds.getCenterLonLat();
               map.setCenter(h1);
               for(var i=0;i<Geo.pulses.length;i++){
                   for(var j=0;j<Geo.pulses[i].children.length;j++)
                        AddSpot(new OpenLayers.LonLat(Geo.pulses[i].children[j].center.lon,Geo.pulses[i].children[j].center.lat).transform(fromProjection, map.getProjectionObject()),Geo.pulses[i].children[j].pulses[scope.lfs],"marker_"+markersSpotArr.length+" "+"area_"+Geo.pulses[i].children[j].gid);
               }
               
               $(".pulse-marker").on('click',function(event){
                   event.stopPropagation();
                    event.preventDefault();
                    var cname=$.trim(this.className);
                   var area=geo.GetRegionAreaById(null, +cname.split(' ')[2].split('_')[1]);
                   var idx=+cname.split(' ')[1].split('_')[1];
                    
                         
                   
               });
               
               $timeout(function(){
                  ApplyCluster();
                   
               });
                   
               
           }
        }
}
    
    this.SetLifeStyle=function(lfs){
       if(stage>1)
            return;
        $(".pulse-marker").off('click');
         for(var i=0;i< markersSpotArr.length;i++){
                    deleteMarker(markersSpotArr[i]);
        }
        markersSpotArr=[];
               for(var i=0;i<pulses.length;i++){
                   for(var j=0;j<pulses[i].children.length;j++)
                        AddSpot(new OpenLayers.LonLat(pulses[i].children[j].center.lon,pulses[i].children[j].center.lat).transform(fromProjection, map.getProjectionObject()),pulses[i].children[j].pulses[scope.lfs],"marker_"+markersSpotArr.length+" "+"area_"+pulses[i].children[j].gid);
               }
               
       $timeout(function(){
                  ApplyCluster();
                   
       });
       
               $(".pulse-marker").on('click',function(){
                   var area=GetRegionAreaById(null, +this.className.split(' ')[2].split('_')[1]);
                   var idx=+this.className.split(' ')[1].split('_')[1];
               });
    };
    
    this.SetPulses=function(lPulses){
        pulses=lPulses;
    }
    
    this.UpdateUrl=function(url){
        
        map_query=url
        if(stage===3){
            nLayer.url=[mapserver+"/${z}/${x}/${y}.png?"+map_query];
            nLayer.redraw();
        }
    }
    
    this.PresentPlaces=function(spots){
        $(".pulse-marker").off('click');
        for(var i=0;i< markersSpotArr.length;i++){
                    deleteMarker(markersSpotArr[i]);
        }
        markersSpotArr=[];
        for(var i=0;i<spots.length;i++){
            if(spots[i].center){
               AddSpot(new OpenLayers.LonLat(spots[i].center.lon,spots[i].center.lat).transform(fromProjection, map.getProjectionObject()),spots[i].pulse,"marker_"+i);
            }
        }
        
        
        
         $(".pulse-marker").on('click',function(event){
             event.stopPropagation();
             event.preventDefault();
             
             var cname=$.trim(this.className);
              var idx=+cname.split(' ')[1].split('_')[1];
              
               });
        
        
        
        
        
    }
    
}