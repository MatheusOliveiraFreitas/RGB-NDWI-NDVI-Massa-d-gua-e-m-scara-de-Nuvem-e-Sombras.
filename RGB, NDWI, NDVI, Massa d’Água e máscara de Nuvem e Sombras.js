// AUTOMATICALLY GENERATED: imported vars from saved link.
var CONVERT_TO_IMPORT = (
[{"type":"geometry","name":"geometry","record":{"geometries":[{"type":"Polygon","coordinates":[[[-60.292406586607264,-2.8529134702040744],[-60.292406586607264,-3.320524992806488],[-59.537096528013514,-3.320524992806488],[-59.537096528013514,-2.8529134702040744]]],"geodesic":false,"evenOdd":true}],"displayProperties":[{"type":"rectangle"}],"properties":{},"color":"#d63000","mode":"Geometry","shown":false,"locked":false}}])

// AUTOMATICALLY GENERATED: location from saved link.
Map.setCenter(300.0852484426895, -3.086769002868774, 10)

var gerar_imagem = function(data_i,data_f,geo,bitis_min,bitis_max) {
  
  var mask_landsat8 = function(image) {
    var qa = image.select('QA_PIXEL');
    var cloudBitMask = (1 << 3); // Cloud bit
    var shadowBitMask = (1 << 4); // Cloud shadow bit
  
    // Criar máscara baseando-se na ausência de nuvens e sombras de nuvens
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
                  .and(qa.bitwiseAnd(shadowBitMask).eq(0));
                 
    return image.updateMask(mask);
  };


  
  var cloud_freeL8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA")
  
                    .filterBounds(geometry)
                    .filterDate(data_i, data_f)
                    .filter(ee.Filter.lt('CLOUD_COVER', 30))
                    .map(mask_landsat8)
                    .select(['B2', 'B3', 'B4', 'B5','B6','B7']);
  var mediana = cloud_freeL8.median();
  
  var createCloudShadowMask = function(image) {
  var qa = image.select('QA_PIXEL');
  var cloudBitMask = (1 << 3); // Bit para nuvens
  var shadowBitMask = (1 << 4); // Bit para sombras de nuvens
 
  // Criar máscara para nuvens e sombras de nuvens
  var cloudMask = qa.bitwiseAnd(cloudBitMask).neq(0);
  var shadowMask = qa.bitwiseAnd(shadowBitMask).neq(0);
 
  // Combinar ambas as máscaras
  var combinedMask = cloudMask.or(shadowMask);
 
  // Atualizar a máscara na imagem
  return image.updateMask(combinedMask).addBands(combinedMask.rename('cloud_shadow_mask'));
};
 
  // Filtrar coleção de imagens Landsat 8
  var cloudFreeL8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA")
    .filterBounds(geometry)
    .filterDate(data_i, data_f)
  .filter(ee.Filter.lt('CLOUD_COVER', 30))
    .map(createCloudShadowMask);
   
  // Calcular a mediana da máscara de nuvens e sombras de nuvens
  var cloudShadowMedian = cloudFreeL8.select('cloud_shadow_mask').median();
   
  // Adicionar a camada de máscara ao mapa
  Map.centerObject(geo, 10); // Centralizar o mapa na área de interesse
  Map.addLayer(cloudShadowMedian, {min: 0.9, max: 1, palette: ['white', 'red']}, 'Máscara de Nuvens e Sombras')
  // para Criar NDVI
  var ndvi=mediana.expression(
    '(NIR - RED) / (NIR+RED)',{
      'NIR':mediana.select('B5'),
      'RED':mediana.select('B4')
    })
  
  // para Criar NDWI
  var ndwi=mediana.expression(
    '(GREEN-NIR) / (GREEN+NIR)',{
      'GREEN':mediana.select('B3'),
      'NIR':mediana.select('B5')
    })
  
  //Paleta de cores
  var ndviParams = {palette: ['blue','white' ,'green']}
  
  //Selecionar as bandas B4=vermelho//B3=Verde//B2=Azul
  
  var composicaoRGB = mediana.select(['B4', 'B3', 'B2']);

  
  // Adciona os mapas NDVI e NDWI com as paletas
  Map.addLayer(ndvi,{min: 0, max: 0.5, palette: ['red','yellow','green']}, 'NDVI'+'='+data_i+';'+data_f);
  Map.addLayer(ndwi,{min: -0.405, max: 0.8103, palette: ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#bd0026','#800026']}, 'NDWI'+'='+data_i+';'+data_f);
  Map.addLayer(composicaoRGB,{min:0,max:0.3},'RGB'+'='+data_i+';'+data_f)
  
  var ag=ndwi.select('B3').gt(0);
  var agua=ee.Image(2).mask(ag)
  Map.addLayer(agua,{min: bitis_min, max: bitis_max,palette:['blue']},'Massa d Agua'+'='+data_i+';'+data_f)
  
  Export.image.toDrive({
  image: agua,
  description:'Massa d Agua'+'='+data_i+';'+data_f,
  folder: 'oi',
  scale: 10,
  region: geo,
  crs:"EPSG:4326",
  maxPixels: 1e13
  })
  
  Export.image.toDrive({
  image: ndwi,
  description:'ndwi'+'='+data_i+';'+data_f,
  folder: 'oi',
  scale: 10,
  region: geo,
  crs:"EPSG:4326",
  maxPixels: 1e13
  })

  Export.image.toDrive({
  image: ndvi,
  description:'ndvi'+'='+data_i+';'+data_f,
  folder: 'oi',
  scale: 10,
  region: geo,
  crs:"EPSG:4326",
  maxPixels: 1e13
  })
  Export.image.toDrive({
  image: composicaoRGB,
  description:'RGB'+'='+data_i+';'+data_f,
  folder: 'oi',
  scale: 10,
  region: geo,
  crs:"EPSG:4326",
  maxPixels: 1e13
  })

};

//Chame a função e coloque data inicial, data final, a geometria, bitis_minimos e bitis maximos
gerar_imagem('2023-09-01','2023-11-30',geometry,-0.405,0.8103)

