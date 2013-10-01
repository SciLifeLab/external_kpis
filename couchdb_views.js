/**
 * ================= Database: projects ========================================
 */
/*
 * Design: kpi_external
 * View: projects
 * Map function
 */

/*
 * kpi_external/projects
 * Map function
 */
 
function(doc) {

	var queued = "0000-00-00";
	var close = "0000-00-00";
    var day = 1000*60*60*24;

    var dayDiff = function (date1, date2) { 
                    var diff = Math.ceil((date2.getTime()-date1.getTime())/(day));
                    return diff;				
                }

	var production = (doc["details"]["type"] == "Production");
	if(production) {
        if (doc["details"]["queued"]) {       
            queued = doc["details"]["queued"];
        }
        if (doc["close_date"]) {
            close = doc["close_date"];
        }
        
        var bin = null;
        var today = new Date();
        var diff;
        //var unit = "week";
        var unit = "w";
        
        if(doc["details"]["queued"] && doc["close_date"]) {
            var qD = new Date(queued);
            var cD = new Date(close);
            diff = dayDiff(qD, cD);
            //diff = Math.ceil( (cD.getTime()-qD.getTime()) / day);
            //if(diff <= 4 * 7) {
            if(diff <= 6 * 7) {
                //bin = "0-4 weeks";
                bin = "0-6 " + unit;
            //} else if (diff <= 8 * 7) {
            //    bin = "4-8 weeks";
            } else if (diff <= 12 * 7) {
                //bin = "8-12 weeks";
                bin = "6-12 " + unit;
            } else if (diff <= 24 * 7) {
                bin = "12-24 " + unit;
            } else if (diff <= 52 * 7) {
                bin = "24-52 " + unit;
            }             
        }
		var KPI = Object();
        KPI["Queue date"] = queued;
        KPI["Close date"] = close;
        KPI["Total time"] = diff;
 		emit([ bin, doc["project_name"] ], KPI);
	}
}
/*
 * Design: kpi_external
 * View: projects
 * Reduce function
 */
function(keys, values, rereduce) {
  if (rereduce) {
    return sum(values);
  } else {
    return values.length;
  }
}

/*
 * Design: kpi_external
 * View: application_projects
 * Map function
 */
function(doc) {
  if(doc["source"] == "lims" && doc["details"]["type"] == "Production") {
	/* skip some bad apples */
	if(doc["application"] == null) { exit; }
	if(doc["application"].indexOf("bogus") != -1) { exit; }

	/* emit application & project id */
	emit(doc["application"], doc["project_id"]);
  }
}
/*
 * Design: kpi_external
 * View: application_projects
 * Reduce function
 */
_count

/*
 * Design: kpi_external
 * View: application_samples
 * Map function
 */
function(doc) {
  if(doc["source"] == "lims" && doc["details"]["type"] == "Production") {
	/* skip some bad apples */
	if(doc["application"] == null) { exit; }
	if(doc["application"].indexOf("bogus") != -1) { exit; }
  	
	no_of_samples = +doc["no_of_samples"] || 0
//  	emit([doc["open_date"], doc["application"]], no_of_samples);
  	emit(doc["application"], no_of_samples);
  }
}
/*
 * Design: kpi_external
 * View: application_samples
 * Reduce function
 */
_sum

/**
 * ================= Database: flowcells ========================================
 */

/**
 * Design: reads
 * View: per_lane
 */
function(doc) {
  var lanes = doc["illumina"]["run_summary"];
  for (l in lanes) {
    var reads = doc["illumina"]["run_summary"][l]["Clusters PF R1"];
    
    emit([doc["RunParameters"]["RunMode"], doc["RunInfo"]["Id"], l],reads);
  }
}