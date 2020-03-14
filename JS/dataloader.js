// LOAD INTO global celldata make flag .ready = true when done. 

/* 
this is csv file example downloaded from stat:
 
# Pedejas izmainas/Last updated 13.01.2020.
ID,Total
100mX3135Y2431,5
100mX3135Y2436,5
... ('000 lines) 
*/
	
	//var CSVFILENAME = 'https://www.csb.gov.lv/sites/default/files/tile/2019-06/Grid_LV_100_population_2019_PUBLIC.csv';
	//var CSVFILENAME = 'https://www.csb.gov.lv/sites/default/files/tile/2019-06/Grid_LV_1k_population_2019_PUBLIC.csv';
	
	var CSVFILENAME = '/Grid_LV_1k_population_2019_PUBLIC.csv';
    var celldata = []; // list of cell .x .y .v   (coordinates X Y and Value).   
	
    // DATA LOADER
    function loadDataFile(file) {
		info("loading from file " + file);
        //try{
            var xhr = new XMLHttpRequest();
            xhr.open('GET', file, true);
            xhr.overrideMimeType("text/plain");
            xhr.onload = function () {
                info("start loading file..." + file);
                var rows = xhr.responseText.split("\n");
				rows.forEach( (rowtxt) => {
					var row = rowtxt.split(',');
					var xpos = row[0].indexOf('X');
					var ypos = row[0].indexOf('Y');
					if (xpos<3 || ypos<xpos) return;
					celldata.push({
						x : parseFloat(row[0].substr(xpos+1, ypos - xpos -1)),
						y : parseFloat(row[0].substr(ypos+1)),
						v : parseFloat(row[1]),
					});
				});
				
				if (celldata.length < 1) 
					throw "no data!";
				
				//celldata.MINX = (celldata.reduce( (a, b) => (a.x < b.x) ? a.x : b.x )).x;
				
				celldata.MINX = Math.min(...celldata.map(o => o.x));
				celldata.MAXX = Math.max(...celldata.map(o => o.x));
				celldata.MINY = Math.min(...celldata.map(o => o.y));
				celldata.MAXY = Math.max(...celldata.map(o => o.y));
				celldata.MINV = Math.min(...celldata.map(o => o.v));
				celldata.MAXV = Math.max(...celldata.map(o => o.v));
				
				infot("finish loading " + file);
 				infot("finshed reading cells " + 
							"cnt= " + celldata.length.toString() + 
							"MINX " + celldata.MINX.toString() + 
							"MAXX " + celldata.MAXX.toString() + 
							"MINY " + celldata.MINY.toString() + 
							"MAXY " + celldata.MAXY.toString() + 
							"MINV " + celldata.MINV.toString() + 
							"MAXV " + celldata.MAXV.toString() );
				
				celldata.ready = true;
                info("data ready ..." + file);
            }
            xhr.send();
        //} catch (e) { 
        //    console.error("data read problem:"+file, e.stack); 
        //}
    }
    loadDataFile(CSVFILENAME);

