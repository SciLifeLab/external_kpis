// Lookup table for organisations
var organisationNames = {
    "GU": "Göteborgs universitet",
    "KI": "Karolinska institutet",
    "KTH": "Kungliga tekniska högskolan",
    "KS": "Karolinska universitetssjukh.",
    "LU": "Lunds universitet",
    "LiU": "Linköpings universitet",
    "Lnu": "Linnéuniversitetet i Kalmar",
    "NRM": "Naturhistoriska riksmuséet",
    "SH": "Södertörns högskola",
    "SLU-Alnarp": "Sv. lantbruksuniv. - Alnarp",
    "SLU-Uppsala": "Sv. lantbruksuniv. - Uppsala",
    "SLU-Umea": "Sv. lantbruksuniv. - Umeå",
    "SMI": "Smittskyddsinstitutet",
    "SU": "Stockholms universitet",
    "SVA": "Statens veterinärmed. anstalt",
    "UU": "Uppsala universitet",
    "UmU": "Umeå universitet",
}

// Lookup table for applications
// Maps our application names to categories agreed with Uppsala
//
// Does not catch the Epigenetics category (Methylation, Bishulphite, MedIP, RRBS, ...)
var applicationNames = {
    "Amplicon": "Target re-seq",
    "cDNA": "RNA-seq",
    "ChIP-seq": "",
    "Custom capture": "Target re-seq",
    "de novo": "de novo seq",
    "Exome capture": "Target re-seq",
    "Mate-pair": "de novo seq",
    "Metagenome": "Metagenomics",
    "miRNA-seq": "",
    "RNA-seq (mRNA)": "RNA-seq",
    "RNA-seq (RiboZero)": "RNA-seq",
    "RNA-seq (Ribominus)": "RNA-seq",
    "RNA-seq (total RNA)": "RNA-seq",
    "Special": "Other",
    "WG re-seq": "Whole genome re-seq",
    "WG re-seq (IGN)": "Whole genome re-seq (hum)",
    "Finished library": "",
}


/* **** Helper functions **** */

/**
 * Sort function for delivery time bins
 * @param {Object} a		Time bin object
 * @param {Object} b		Time bin object
 * @returns {Number} A negative number if a should be sorted before b, a positive number if vice versa, otherwise 0 
 */
function sortCats(a, b) {
    var order = [];
    order["0-6 w"] = 1;
    order["6-12 w"] = 2;
    order["12-24 w"] = 3;
    order["24-52 w"] = 4;
    order["Not closed"] = 5;
    return order[a.key] - order[b.key];
}


/**
 * Sort function for d3.pie to sort Finished library bin last
 * @param {Object} a		Application bin object
 * @param {Object} b		Application bin object
 * @returns {Number} A negative number if a should be sorted before b, a positive number if vice versa, otherwise 0 
 */
function sortFinLibLast(a, b) {
    // Strangely, the order of Objects in the array in the d3.pie object will not change, only the
    // location where the arc for Finished library will be drawn.
    // That's why there is another sort function (sortPieDataFinLibLast) below to then be able
    // to sort the transformed array of a d3.pie object so that the Finished library bin object
    // comes last when we feed that to the pie and legend drawing code (to get the colours to be the same)
    
    // 'Finished library' last
    if (a.key == "Finished library") {
        return 1;
    } else if (b.key == "Finished library") {
        return -1;
    }
    // 'Other' second to last
    if (a.key == "Other") {
        return 1;
    } else if (b.key == "Other") {
        return -1;
    }
    if (a.key.toLowerCase() < b.key.toLowerCase()) {
        return -1;
    } else if (a.key.toLowerCase() > b.key.toLowerCase()) {
        return 1;
    }
    return 0;
}

/**
 * Sort function for d3.pie-transformed data array to sort Finished library bin Object last
 * @param {Object} a		"d3.pie.arc" object
 * @param {Object} b		"d3.pie.arc"  object
 * @returns {Number} A negative number if a should be sorted before b, a positive number if vice versa, otherwise 0 
 */
function sortPieDataFinLibLast(a, b) {
    // See comment above in sortFinLibLast function

    // 'Finished library' last
    if (a.data.key == "Finished library") {
        return 1;
    } else if (b.data.key == "Finished library") {
        return -1;
    }
    // 'Other' second to last
    if (a.data.key == "Other") {
        return 1;
    } else if (b.data.key == "Other") {
        return -1;
    }
    if (a.data.key.toLowerCase() < b.data.key.toLowerCase()) {
        return -1;
    } else if (a.data.key.toLowerCase() > b.data.key.toLowerCase()) {
        return 1;
    }
    return 0;
}

/**
 * Sort function for layer objects to sort by platform.<br>
 * HiSeq before MiSeq - then on Queue date
 * @param {Object} a		Layer object
 * @param {Object} b		Layer object
 * @returns {Number} A negative number if a should be sorted before b, a positive number if vice versa, otherwise 0 
 */
function sortByPlatform (a, b) {
    aPf = "";
    bPf = "";
    for (var i = 0; i < a.length; i++) {
        if(a[i]["y"] != 0) { aPf = a[i]["x"]; aQ = a[i]["queueDate"]; }
        if(b[i]["y"] != 0) { bPf = b[i]["x"]; bQ = b[i]["queueDate"]; }
    }
    if(aPf < bPf) return -1;
    if(aPf > bPf) return 1;
    if(aQ < bQ ) return -1;
    if(aQ > bQ ) return 1;
    return 0;
}

/**
 * Sort function for layer objects to sort by application.<br>
 * DNA/RNA/SeqCap/Other - then on Queue date
 * @param {Object} a		Layer object
 * @param {Object} b		Layer object
 * @returns {Number} A negative number if a should be sorted before b, a positive number if vice versa, otherwise 0 
 */
function sortByApplication (a, b) {
    var map = {
        "DNA": 0,
        "RNA": 1,
        "SeqCap": 2,
        "Other": 3
    }
    
    var aAppl;
    var bAppl;
    for (var i = 0; i < a.length; i++) {
        if(a[i]["y"] != 0) { aAppl = map[a[i]["x"]]; aQ = a[i]["queueDate"]; aArr = a[i]["arrivalDate"]; aPid = a[i]["pid"];}
        if(b[i]["y"] != 0) { bAppl = map[b[i]["x"]]; bQ = b[i]["queueDate"]; bArr = b[i]["arrivalDate"]; bPid = b[i]["pid"];}
    }
    if(aAppl < bAppl) return -1;
    if(aAppl > bAppl) return 1;
    if(aQ < bQ ) return -1;
    if(aQ > bQ ) return 1;
    if(aArr < bArr ) return -1;
    if(aArr > bArr ) return 1;   
    if(aPid < bPid ) return -1;
    if(aPid > bPid ) return 1;   
    return 0;
}
/**
 * Calculates number of projects per domain (x value) in a layer object data set
 * @param {Array} dataset  Array of array of layer objects
 * @param {Array} domain    Array of domain names (x values)
 * @returns {Object}    An object with counts per domain
 */
function numProjects(dataset, domain) {
    var num_projects = {};
    for (var i = 0; i < domain.length; i++) {
        num_projects[domain[i]] = 0;
    }
    //console.log(num_projects);
    for(var i = 0; i < dataset.length; i++) {
        for (var j = 0; j < dataset[i].length; j++) {
            var obj = dataset[i][j];
            if(obj.y != 0) { num_projects[obj.x]++; }
        }
    }
    //console.log(num_projects);
    return num_projects;
}

/**
 * Calculates number of units (worksets or lanes) per domain (x value) in a layer object data set
 * @param {Array} dataset  Array of array of layer objects
 * @param {Array} domain    Array of domain names (x values)
 * @param {String} [unit="lanes"]    Name of unit. Specify "samples" to get number of worksets, otherwise number of lanes
 * @returns {Object}    An object with counts per domain. 
 */
function numUnits(dataset, domain, unit) {
    var num_u = {};
    for (var i = 0; i < domain.length; i++) {
        num_u[domain[i]] = 0;
    }
    //console.log(num_u);
    for(var i = 0; i < dataset.length; i++) {
        for (var j = 0; j < dataset[i].length; j++) {
            var obj = dataset[i][j];
            if(obj.y != 0) { num_u[obj.x] += obj.y; }
        }
    }
    for (c in num_u) {
        if (unit == "samples") { // convert samples to worksets
            if (num_u[c] != 0) {
                num_u[c] = Math.ceil(num_u[c]/96);
            }
        } else { // round off lane counts to one digit
            num_u[c] = parseFloat(num_u[c]).toFixed(1);
        }
        
    }
    //console.log(num_u);
    return num_u;
}

/**
 * Calculates the total y value for all stacked bars per domain (x value) in a layer object data set
 * @param {Array} dataset  Array of array of layer objects
 * @param {Array} domain    Array of domain names (x values)
 * @returns {Object}    An object with counts per domain
 */
function totalY(dataset, domain) {
    var tot = {};
    for (var i = 0; i < domain.length; i++) {
        tot[domain[i]] = 0;
    }
    //console.log(num_projects);
    for(var i = 0; i < dataset.length; i++) {
        for (var j = 0; j < dataset[i].length; j++) {
            var obj = dataset[i][j];
            tot[obj.x] += obj.y;
        }
    }
    //console.log(tot);
    return tot;
}

/**
 * Creates data set with project counts per time bin since a specified start date
 * @param {Object} json		A parsed json stream
 * @param {Date} startDate    A Date object to specify start of date range to include
 * @returns {Object}    An object with project counts per time bin
 */
function makeDeltimeDataset(json, startDate) {
    var data = [];
    var rows = json["rows"];
    //console.log(rows);
    var dformat = d3.time.format("%Y-%m-%d");
    var startDateStr;
    if (startDate) {
        startDateStr = dformat(startDate);
        //console.log("start date: " + startDateStr);
    }
    //console.log(rows);
    var nums = new Object;
    var total = 0;
    for (var i = 0; i < rows.length; i++) {
        var ka = rows[i]["key"];
        var bin = ka[0]; // bin name
        var v = rows[i]["value"];
        var qd = v["Queue date"];
        //console.log(bin + ", " + qd);
        if(bin == null) { continue; }
        //if(bin == null) {
        //    if(qd == "0000-00-00") { continue; }
        //    bin = "Not closed";
        //}
        if(startDateStr != undefined && qd < startDateStr) {
            //console.log("skipping");
            continue;
        } //skip if queue date is before startDate
        if(nums[bin]) {
            nums[bin]++;
        } else {
            nums[bin] = 1;
        }
        total++;
    }
    for(bin in nums) {
        data.push( {"key": bin, "value": nums[bin], "percent": Math.round(100 * nums[bin]/total) } );
    }
    
    return data.sort(sortCats);
}


/**
 * Creates data set with project counts per application since a specified start date
 * @param {Object} json		A parsed json stream
 * @param {Date} startDate    A Date object to specify start of date range to include
 * @returns {Object}    An object with project counts per application
 */
function makeApplProjDataset(json, startDate) {
    var data = [];
    var rows = json["rows"];
    //console.log(rows);
    var dformat = d3.time.format("%Y-%m-%d");
    var startDateStr;
    if (startDate) {
        startDateStr = dformat(startDate);
        //console.log("start date: " + startDateStr);
    }
    //console.log(rows);
    var nums = new Object;
    for (var i = 0; i < rows.length; i++) {
        var application = rows[i]["key"];
        // Check lookup table if it belongs to a category or should have a more verbose name
        if(applicationNames[application]) { application = applicationNames[application]; }
        var v = rows[i]["value"];
        var od = v[1];
        //console.log(bin + ", " + qd);
        if(startDateStr != undefined && od < startDateStr) {
            //console.log("skipping");
            continue;
        } //skip if queue date is before startDate
        if(nums[application]) {
            nums[application]++;
        } else {
            nums[application] = 1;
        }
    }
    for(application in nums) {
        data.push( {"key": application, "value": nums[application]} );
    }
    return data;
}

/**
 * Creates data set with sample counts per application since a specified start date
 * @param {Object} json		A parsed json stream
 * @param {Date} startDate    A Date object to specify start of date range to include
 * @param {boolean} includeFinishedLibrary    Whether Finished Library projects should be included or not
 * @returns {Object}    An object with sample counts per application
 */
function makeApplSampleDataset(json, startDate, includeFinishedLibrary) {
    var data = [];
    var rows = json["rows"];
    //console.log(rows);
    var dformat = d3.time.format("%Y-%m-%d");
    var startDateStr;
    if (startDate) {
        startDateStr = dformat(startDate);
        //console.log("start date: " + startDateStr);
    }
    //console.log(rows);
    var nums = new Object;
    for (var i = 0; i < rows.length; i++) {
        var application = rows[i]["key"];
        // Check lookup table if it belongs to a category or should have a more verbose name
        if(applicationNames[application]) { application = applicationNames[application]; }
        var v = rows[i]["value"];
        var od = v[1];
        var samples = v[0];
        //console.log(bin + ", " + qd);
        if(startDateStr != undefined && od < startDateStr) {
            //console.log("skipping");
            continue;
        } //skip if queue date is before startDate

        if (!includeFinishedLibrary && application == "Finished library") {
            samples = 0; // set to a value to get Finished libraries as a category for the legend
        }

        if(nums[application]) {
            nums[application] += samples;
        } else {
            nums[application] = samples;
        }
    }
    for(application in nums) {
        data.push( {"key": application, "value": nums[application]} );
    }
    return data;
}

/**
 * Creates data set with read(-pair) counts per lane since a specified start date and sequencing mode
 * @param {Object} json		A parsed json stream
 * @param {Date} startDate    A Date object to specify start of date range to include
 * @param {string} filter    The sequencing mode for which data should be extracted
 * @returns {Object}    An array of lane read(-pair) counts in millions
 */
function makeReadsDataset(json, startDate, filter) {
    var rows = json.rows;
    var values = [];
    var dformat = d3.time.format("%y%m%d");
    var startDateStr;
    if (startDate) {
        startDateStr = dformat(startDate);
        //console.log("start date: " + startDateStr);
    }
    for(var i = 0; i < rows.length; i++) {
        var mode = rows[i]["key"][0];
        var fc_id= rows[i]["key"][1];
        var date = fc_id.split("_")[0];
        
        if(startDateStr != undefined && date < startDateStr) {
            continue;
        }
        if(filter != undefined) {
            if (mode != filter) { continue; }
        }
        //console.log("mode: " + mode);
        var val = rows[i]["value"];
        if(val != null) { values.push(val/1e6); }
    }
    return values;
}

/**
 * Creates data set with number of projects per organisation since a specified start date
 * @param {Object} json		A parsed json stream
 * @param {Date} startDate    A Date object to specify start of date range to include
 * @returns {Array}    An array of organisation bin objects
 */
function makeAffiliationDataset(json, startDate) {
    var rows = json.rows;
    //console.log(rows);
    var nums = new Object;
    for (var i = 0; i < rows.length; i++) {
        var date;
        if(startDate != undefined) {
            date = new Date(rows[i]["key"][0]);
            if (date < startDate) { continue; }
        }
        var aff = rows[i]["key"][1];
        // Check lookup table if there is a longer name
        if(organisationNames[aff]) { aff = organisationNames[aff]; }
        if(nums[aff]) {
            nums[aff]++;
        } else {
            nums[aff] = 1;
        }
    }
    var data = [];
    for(a in nums) {
        if(a != "null") {
            data.push( {"key": a, "value": nums[a]} );
        }
    }
    data.sort(function (a,b) {
       return a.key > b.key?1:-1;
    });
    if(nums["null"]) { // Call this category Other, even if not really true
        data.push( {"key": "Other", "value": nums["null"]} );
    }
    //console.log(data);
    return data;
}

// Data set generators for queue viz
/**
 * Generates a dataset for Libprep queue lane load for stacked bar chart drawing
 * @param {Object} json		A parsed json stream object at sample level
 * @param {Date} cmpDate	A Date object to specify load date
 * @returns {Array} An array of arrays of "layer" objects 
 */
function generateQueueLaneLPStackDataset(json, cmpDate, ptype) {
    var dateFormat = d3.time.format("%Y-%m-%d");
    var cmpDateStr = dateFormat(cmpDate); // Turn cmp date into a string to compare to dates in data
    var dataArray = [];
    var rows = json["rows"];
    var pfBins = {};
    var projects = {};
    ptype = typeof ptype !== 'undefined' ? ptype : "Production"; //Default is production, unless something else is given
    // loop through each sample and add upp lane load per project
    for (var i = 0; i < rows.length; i++) {
        //console.log("looping through json array: 1");
        var k = rows[i]["key"];
        var pid = k[0];
        var type = k[1];
        var appl = k[2];
        if (type != ptype) { continue; } // only matching ptype projectsprojects  (Application or Production) will be returned.
        if (appl == "Finished library") { continue; } // need seq start date to be able to handle fin lib projects

        // Determine which platform
        var pf = k[3];
        var otherPf = "MiSeq";
        if (pf != "MiSeq") {
            pf = "HiSeq";
        } else {
            otherPf = "HiSeq";
        }
        
        var v = rows[i]["value"];

        // skip aborted projects
        var aborted_date = v["Aborted date"];
        if (aborted_date != "0000-00-00") {
            //console.log("Skipping " + keys[0]);
            continue;
        }
        // Skip aborted or finished *samples*
        if (v["Status"] == "Aborted" || v["Status"] == "Finished" ) {
            continue;
        }
        
        // skip closed projects
        var closeDate = v["Close date"];
        if(closeDate != "0000-00-00") { continue; }
        
        // skip samples already done, but where dates are missing in lims
        var libQCDate = v["QC library finished"];
        if (libQCDate != "0000-00-00") { continue; }
        var seqStartDate = v["Sequencing start"];
        if (seqStartDate != "0000-00-00") { continue; }
        var seqFinishedDate = v["All samples sequenced"];
        if (seqFinishedDate != "0000-00-00") { continue; }
        
        var queueDate = v["Queue date"];
        var prepStartDate = v["Lib prep start"];
        // this is for libprep projects
        if (queueDate != "0000-00-00" &&
            queueDate <= cmpDateStr &&
            prepStartDate == "0000-00-00") {
            //console.log(pf + ", " + pid + ", " + v["Lanes"]);

            // create bins for the platforms if they don't exist
            if(pfBins[pf] == undefined) {
                pfBins[pf] = {};
            }
            if(pfBins[otherPf] == undefined) {
                pfBins[otherPf] = {};
            }
            // initialize a value for the project if it doesn't exist in pfBins
            if(pfBins[pf][pid] == undefined) {
                pfBins[pf][pid] = 0;
            }
            if(pfBins[otherPf][pid] == undefined) {
                pfBins[otherPf][pid] = 0;
            }
            // add on lane load for this particular project
            pfBins[pf][pid] += v["Lanes"];

            if(projects[pid] == undefined) {
                projects[pid] = { queueDate: queueDate }
            }
        }
        
    }
    //console.log(pfBins);
    
    // put into "layer structure", sort & then add up y0's
    for (var projID in pfBins["HiSeq"]) {
        var hO = { x: "HiSeq", y: pfBins["HiSeq"][projID], pid: projID, queueDate: projects[projID]["queueDate"] };
        var mO = { x: "MiSeq", y: pfBins["MiSeq"][projID], pid: projID, queueDate: projects[projID]["queueDate"] };
        dataArray.push([hO, mO]);
    }
    dataArray.sort(sortByPlatform);
    
    var tot = { HiSeq: 0, MiSeq: 0};
    
    for (var i = 0; i < dataArray.length; i++) {
        for (var j = 0; j < dataArray[i].length; j++) {
            var pf = dataArray[i][j]["x"];
            dataArray[i][j]["y0"] = tot[pf];
            tot[pf] += dataArray[i][j]["y"];
        }
    }
    //console.log(dataArray);
    if (dataArray.length == 0 ) {
        dataArray = [
                        [
                            { x: "HiSeq", y: 0, y0: 0, pid: "Px", projName: "empty", queueDate: "0000-00-00"},
                            { x: "MiSeq", y: 0, y0: 0, pid: "Px", projName: "empty", queueDate: "0000-00-00"}
                        ]
                    ];
    }
    
    return dataArray;
}

/**
 * Generates a dataset for Finished lib queue lane load for stacked bar chart drawing
 * @param {Object} json		A parsed json stream object at sample level
 * @param {Date} cmpDate	A Date object to specify load date
 * @returns {Array} An array of arrays of "layer" objects 
 */
function generateQueueLaneFLStackDataset(json, cmpDate, ptype) {
    var dateFormat = d3.time.format("%Y-%m-%d");
    var cmpDateStr = dateFormat(cmpDate); // Turn cmp date into a string to compare to dates in data

    // time limits in days to use for project bar colouring
    var timeLimit1 = 10; // to lable yellow
    var timeLimit2 = 20; // to lable red
    
    
    var dataArray = [];
    var rows = json["rows"];
    var pfBins = {};
    var projects = {};
    ptype = typeof ptype !== 'undefined' ? ptype : "Production"; //Default is production, unless something else is given
    // loop through each sample and add upp lane load per project
    for (var i = 0; i < rows.length; i++) {
        //console.log("looping through json array: 1");
        var k = rows[i]["key"];
        var pid = k[0];
        var type = k[1];
        var appl = k[2];
        if (type != ptype){ continue; } // only ptype are of interest - is this true?? 
        if (appl != "Finished library") { continue; } // skip fin lib projects

        // Determine which platform
        var pf = k[3];
        var otherPf = "MiSeq";
        if (pf != "MiSeq") {
            pf = "HiSeq";
        } else {
            otherPf = "HiSeq";
        }
        
        var v = rows[i]["value"];

        // skip aborted projects
        var aborted_date = v["Aborted date"];
        if (aborted_date != "0000-00-00") {
            //console.log("Skipping " + keys[0]);
            continue;
        }
        // Skip aborted or finished *samples*
        if (v["Status"] == "Aborted" || v["Status"] == "Finished" ) {
            continue;
        }
        // skip closed projects
        var closeDate = v["Close date"];
        if(closeDate != "0000-00-00") { continue; }

        // skip samples already done, but where dates are missing in lims
        var seqStartDate = v["Sequencing start"];
        if (seqStartDate != "0000-00-00") { continue; }
        var seqFinishedDate = v["All samples sequenced"];
        if (seqFinishedDate != "0000-00-00") { continue; }

        var queueDate = v["Queue date"];
        //var prepStartDate = v["Lib prep start"];
        var seqStartDate = v["Sequencing start"];
        // this is for libprep projects
        if (queueDate != "0000-00-00" &&
            queueDate <= cmpDateStr &&
            seqStartDate == "0000-00-00") {
            //console.log(pf + ", " + pid + ", " + v["Lanes"]);

            // create bins for the platforms if they don't exist
            if(pfBins[pf] == undefined) {
                pfBins[pf] = {};
            }
            if(pfBins[otherPf] == undefined) {
                pfBins[otherPf] = {};
            }
            // initialize a value for the project if it doesn't exist in pfBins
            if(pfBins[pf][pid] == undefined) {
                pfBins[pf][pid] = 0;
            }
            if(pfBins[otherPf][pid] == undefined) {
                pfBins[otherPf][pid] = 0;
            }
            // add on lane load for this particular project
            pfBins[pf][pid] += v["Lanes"];

            if(projects[pid] == undefined) {
                projects[pid] = { queueDate: queueDate}
            }
        }
        
    }
    //console.log(pfBins);
    
    // put into "layer structure", sort & then add up y0's
    for (var projID in pfBins["HiSeq"]) {
        var hO = { x: "HiSeq", y: pfBins["HiSeq"][projID], pid: projID, queueDate: projects[projID]["queueDate"], passedTimeLimit: projects[projID]["passedTimeLimit"] };
        var mO = { x: "MiSeq", y: pfBins["MiSeq"][projID], pid: projID, queueDate: projects[projID]["queueDate"], passedTimeLimit: projects[projID]["passedTimeLimit"] };
        dataArray.push([hO, mO]);
    }
    dataArray.sort(sortByPlatform);
    
    var tot = { HiSeq: 0, MiSeq: 0};
    
    for (var i = 0; i < dataArray.length; i++) {
        for (var j = 0; j < dataArray[i].length; j++) {
            var pf = dataArray[i][j]["x"];
            dataArray[i][j]["y0"] = tot[pf];
            tot[pf] += dataArray[i][j]["y"];
        }
    }
    //console.log(dataArray);
    if (dataArray.length == 0 ) {
        dataArray = [
                        [
                            { x: "HiSeq", y: 0, y0: 0, pid: "Px", projName: "empty", queueDate: "0000-00-00"},
                            { x: "MiSeq", y: 0, y0: 0, pid: "Px", projName: "empty", queueDate: "0000-00-00"}
                        ]
                    ];
    }
    
    return dataArray;
}

/**
 * Generates a dataset for Libprep queue sample load for stacked bar chart drawing
 * @param {Object} json		A parsed json stream object at sample level
 * @param {Date} cmpDate	A Date object to specify load date
 * @returns {Array} An array of arrays of "layer" objects 
 */
function generateQueueSampleStackDataset(json, cmpDate, ptype) {

    var dateFormat = d3.time.format("%Y-%m-%d");
    var cmpDateStr = dateFormat(cmpDate); // Turn cmp date into a string to compare to dates in data
    
    // time limits in days to use for project bar colouring
    var timeLimit1 = 10; // to lable yellow
    var timeLimit2 = 20; // to lable red
    
    
    var dataArray = [];
    var rows = json["rows"];
    var applBins = {};
    var cat = ["DNA", "RNA", "SeqCap", "Other"];
    for (i = 0; i < cat.length; i++) {
        //console.log("adding " + cat[i]);
        applBins[cat[i]] = {};
    }
    //console.log(applBins);
    ptype = typeof ptype !== 'undefined' ? ptype : "Production"; //Default is production, unless something else is given
    
    // array to capture libprep start dates
    var libPrepStartDates = [];
    
    var projects = {};
    // loop through each sample and add upp lane load per project
    for (var i = 0; i < rows.length; i++) {
        var k = rows[i]["key"];
        //console.log(k)
        var pid = k[0];
        var type = k[1];
        var appl = k[2];
        var sampleID = k[4];
        if (type != ptype){ continue; } // only ptype projects of interest
        if (appl == "Finished library") { continue; } // fin lib projects not of interest
        if(appl == null) { appl = "Other";}
        //console.log(sampleID);
        var applCat = "";
        if (appl.indexOf("capture") != -1) {
            applCat = "SeqCap";
        } else if (appl == "Amplicon" ||
                   appl == "de novo" ||
                   appl == "Metagenome" ||
                   appl == "WG re-seq") {
            applCat = "DNA";
        } else if (appl == "RNA-seq (total RNA)") {
            applCat = "RNA";
        } else {
            applCat = "Other";
        }
        
        var v = rows[i]["value"];
        // skip aborted projects
        var aborted_date = v["Aborted date"];
        if (aborted_date != "0000-00-00") {
            //console.log("Skipping " + keys[0]);
            continue;
        }
        // Skip aborted or finished *samples*
        if (v["Status"] == "Aborted" || v["Status"] == "Finished" ) {
            continue;
        }
        // skip closed projects
        var closeDate = v["Close date"];
        if(closeDate != "0000-00-00") { continue; }
        
        
        // skip samples already done, but where dates are missing in lims
        var libQCDate = v["QC library finished"];
        if (libQCDate != "0000-00-00") { continue; }
        var seqStartDate = v["Sequencing start"];
        if (seqStartDate != "0000-00-00") { continue; }
        var seqFinishedDate = v["All samples sequenced"];
        if (seqFinishedDate != "0000-00-00") { continue; }

        var arrivalDate = v["Arrival date"];
        var queueDate = v["Queue date"];
        var prepStartDate = v["Lib prep start"];
        libPrepStartDates.push(prepStartDate);
        
        // this is for libprep projects
        if (queueDate != "0000-00-00" &&
            queueDate <= cmpDateStr &&
            prepStartDate == "0000-00-00") {
            //console.log("To add - app cat: " + applCat + ", pid: " + pid + ", sample: " + sampleID);
            // initialize a value for the project for all applications if it doesn't exist in applBins
            if(applBins[applCat][pid] == undefined) {
                for (var j = 0; j < cat.length; j++) {
                    applBins[cat[j]][pid] = 0;
                }
                
            }
            // add sample load for this particular project
            applBins[applCat][pid] += 1;

            if(projects[pid] == undefined) {
                projects[pid] = { queueDate: queueDate, arrivalDate: arrivalDate }
            }
            
        }
        
    }
    //console.log(pfBins);
    
    
    // put into "layer structure", sort & then add up y0's
    for (var projID in applBins["DNA"]) {
        var projArr = [];
        //for (c in cat) {
        for (i = 0; i < cat.length; i++) {
            var o = { x: cat[i], y: applBins[cat[i]][projID], pid: projID, queueDate: projects[projID]["queueDate"], arrivalDate: projects[projID]["arrivalDate"] };
            projArr.push(o);
        }
        dataArray.push(projArr);
    }
    // change to sort by application
    dataArray.sort(sortByApplication); // by application & queue date - arrival date - project ID


    var tot = { DNA: 0, RNA: 0, SeqCap: 0, Other: 0};
    
    for (var i = 0; i < dataArray.length; i++) {
        for (var j = 0; j < dataArray[i].length; j++) {
            var a = dataArray[i][j]["x"];
            dataArray[i][j]["y0"] = tot[a];
            tot[a] += dataArray[i][j]["y"];
        }
    }
    //console.log(dataArray);
        
    if (dataArray.length == 0 ) {
        dataArray = [
                        [
                            { x: "DNA", y: 0, y0: 0, pid: "Px", projName: "empty", queueDate: "0000-00-00"},
                            { x: "RNA", y: 0, y0: 0, pid: "Px", projName: "empty", queueDate: "0000-00-00"},
                            { x: "SeqCap", y: 0, y0: 0, pid: "Px", projName: "empty", queueDate: "0000-00-00"},
                            { x: "Other", y: 0, y0: 0, pid: "Px", projName: "empty", queueDate: "0000-00-00"}
                        ]
                    ];
    }
    return dataArray;
}


/**
 * Draws a "half" pie chart of delivery time bins
 * @param {Object} dataset  Parsed data
 */
function drawDelTimes(dataset) {
    var w = 350;
    var h = 200;

    var outerRadius = w / 2;
    var innerRadius = w / 10;
    var startA = - Math.PI/2;
    var endA = Math.PI/2
    var arc = d3.svg.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);
    
    var pie = d3.layout.pie()
                .value(function(d) {
                    return d.value;
                })
                .sort(null)
                .startAngle(startA)
                .endAngle(endA)
                ;
    
    
    //Easy colors accessible via a 20-step ordinal scale
    //var color = d3.scale.category10();
    var color = d3.scale.category20();
    //var color = d3.scale.category20b();
    //var color = d3.scale.category20c();
    
    //Create SVG element
    var svg = d3.select("#delivery_times_plot")
                .append("svg")
                .attr("width", w)
                .attr("height", h);
    
    //Set up groups
    var arcs = svg.selectAll("g.arc")
                  .data(pie(dataset))
                  .enter()
                  .append("g")
                  .attr("class", "arc")
                  .attr("transform", "translate(" + outerRadius + "," + (outerRadius + 20) + ")");
    
    //Draw arc paths
    arcs.append("path")
        .attr("fill", function(d, i) {
            return color(i);
        })
        .attr("d", arc);
    
    //Labels
    arcs.filter(function(d) { return d.endAngle - d.startAngle > .15; }).append("text") //Skip labels for smaller arcs
        .attr("transform", function(d) {
            return "translate(" + arc.centroid(d) + ")";
        })
        .attr("text-anchor", "middle")
        .text(function(d) {
            return d.data.key;
        });

    // Add a magnitude value to the larger arcs, translated to the arc centroid.
    arcs.filter(function(d) { return d.endAngle - d.startAngle > .2; }).append("svg:text")
      .attr("dy", "1.1em")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { //set the label's origin to the center of the arc
        //we have to make sure to set these before calling arc.centroid
        d.outerRadius = outerRadius; // Set Outer Coordinate
        d.innerRadius = outerRadius/2; // Set Inner Coordinate
        return "translate(" + (arc.centroid(d)) + ")";
      })
      .style("fill", "White")
      .style("font", "bold 12px Arial")
      .text(function(d) { return "(" + d.data.value + " / " + d.data.percent + "%" + ")"; });
}

/**
 * Draws a pie chart of number of projects per application
 * @param {Object} dataset  Parsed data
 */
function drawApplProj(dataset) {
    var w = 300;
    var h = 300;
    padding = w - 250;
    
        
    var outerRadius = (w - padding) / 2;
    var innerRadius = 0;
    var labelr = outerRadius + 10;
    var startA = 0;
    var endA = Math.PI * 2;
    var arc = d3.svg.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);
    
    var pie = d3.layout.pie()
                .value(function(d) {
                    return d.value;
                })
                //.sort(null)
                .sort(sortFinLibLast) // Sort the indata so that Finished library will be last
                .startAngle(startA)
                .endAngle(endA)
                ;
    
    
    //Easy colors accessible via a 10-step ordinal scale
    //var color = d3.scale.category10();
    //var color = d3.scale.category20();
    //var color = d3.scale.category20b();
    var color = d3.scale.category20c();
    
    //Create SVG element
    var svg = d3.select("#application_projects")
                .append("svg")
                .attr("width", w)
                .attr("height", h);
    
    //Set up groups
    var arcs = svg.selectAll("g.arc")
                  .data(pie(dataset).sort(sortPieDataFinLibLast)) // Sort the data so that Finished library
                                                                  // will be last (see comment in sortFinLibLast
                                                                  // and sortPieDataFinLibLast functions)
                  .enter()
                  .append("g")
                  .attr("class", "arc")
                  .attr("transform", "translate(" + w/2 + "," + (outerRadius + 20) + ")")
                  ;
    
    //Draw arc paths
    arcs.append("path")
        .attr("fill", function(d, i) {
            return color(i);
        })
        .attr("d", arc);
    
    ////Labels

    arcs.filter(function(d) { return d.endAngle - d.startAngle > .2; }).append("svg:text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { //set the label's origin to the center of the arc
        //we have to make sure to set these before calling arc.centroid
        d.outerRadius = outerRadius; // Set Outer Coordinate
        d.innerRadius = outerRadius/2; // Set Inner Coordinate
        return "translate(" + (arc.centroid(d)) + ")";
      })
      .style("fill", "White")
      .style("font", "bold 12px Arial")
      .text(function(d) { return d.data.value; });

}

/**
 * Draws a pie chart of number of samples per application & a legend
 * @param {Object} dataset  Parsed data
 */
function drawApplSample(dataset) {
    var w = 450;
    var h = 300;
    padding = w - 250;
    
         
    var outerRadius = (w - padding) / 2;
    var innerRadius = 0;
    var labelr = outerRadius + 10;
    var startA = 0;
    var endA = Math.PI * 2;
    var arc = d3.svg.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);
    
    var pie = d3.layout.pie()
                .value(function(d) {
                    return d.value;
                })
                //.sort(null)
                .sort(sortFinLibLast) // Sort the indata so that Finished library will be last
                .startAngle(startA)
                .endAngle(endA)
                ;
        
    //Easy colors accessible via a 10-step ordinal scale
    //var color = d3.scale.category10();
    //var color = d3.scale.category20();
    //var color = d3.scale.category20b();
    var color = d3.scale.category20c();

    //Create SVG element
    var svg = d3.select("#application_samples")
                .append("svg")
                .attr("width", w)
                .attr("height", h);
    
    //Set up groups
    var arcs = svg.selectAll("g.arc")
                  .data(pie(dataset).sort(sortPieDataFinLibLast)) // Sort the data so that Finished library
                                                                  // will be last (see comment in sortFinLibLast
                                                                  // and sortPieDataFinLibLast functions)

                  .enter()
                  .append("g")
                  .attr("class", "arc")
                  .attr("transform", "translate(" + w/3 + "," + (outerRadius + 20) + ")")
                  ;
    
    //Draw arc paths
    arcs.append("path")
        .attr("fill", function(d, i) {
            return color(i);
        })
        .attr("d", arc);
    
    ////Labels

    arcs.filter(function(d) { return d.endAngle - d.startAngle > .2; }).append("svg:text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { //set the label's origin to the center of the arc
        //we have to make sure to set these before calling arc.centroid
        d.outerRadius = outerRadius; // Set Outer Coordinate
        d.innerRadius = outerRadius/3; // Set Inner Coordinate
        return "translate(" + (arc.centroid(d)) + ")";
      })
      .style("fill", "White")
      .style("font", "bold 12px Arial")
      .text(function(d) { return d.data.value; });

    //Legend
    var legendXOffset = 2*outerRadius + 30;
    
    var legend = svg.append("g")
      .attr("class", "legend")
      .attr("x", legendXOffset)
      .attr("y", 25)
      .attr("height", 100)
      .attr("width", 100);

    legend.selectAll('rect')
      .data(pie(dataset).sort(sortPieDataFinLibLast))
      .enter()
      .append("rect")
	  .attr("x", legendXOffset)
      .attr("y", function(d, i){ return i *  20;})
	  .attr("width", 10)
	  .attr("height", 10)
	  .style("fill", function(d, i) { 
        return color(i);
      })
      
    legend.selectAll('text')
      .data(pie(dataset).sort(sortPieDataFinLibLast))
      .enter()
      .append("text")
	  .attr("x", legendXOffset + 13)
      .attr("y", function(d, i){ return i *  20 + 9;})
      .attr("style", "fill: black")
	  .text(function(d) {
        var text = d.data.key;
        return text;
      });

}

/**
 * Draws a histogram of number of read-pairs per lane
 * @param {Object} dataset  Parsed data
 * @param {String} divID  Id of DOM div to where plot should reside
 */
function drawReads(values, divID) {
    var margin = {top: 10, right: 30, bottom: 30, left: 10},
        width = 320 - margin.left - margin.right,
        height = 180 - margin.top - margin.bottom
        ;
    var formatCount = d3.format(",.0f");
    
    var max = d3.max(values);
    var min = d3.min(values);
    var domainRange = max - min;
    var domainPadding = domainRange / 10;
    //console.log("min - 10e6: " + (min - 10000000));
    
    var x = d3.scale.linear()
        .domain([(min - domainPadding), (max + domainPadding)])
        .range([0, width]);
    
    // Generate a histogram using fourteen uniformly-spaced bins.
    var data = d3.layout.histogram()
        .bins(x.ticks(14))
        (values);
    //console.log(data);
    
    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([height, 0]);
    
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    
    var svg = d3.select("#" + divID).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var bar = svg.selectAll(".bar")
        .data(data)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });
    
    var barWidth = (width - data.length) / (data.length + 2); // a bit ugly. divide the plot width (minus some space per bar)/with the number of bars + 1
    bar.append("rect")
        .attr("x", 1)
        .attr("width", barWidth)
        .attr("height", function(d) { return height - y(d.y); });
    
    bar.append("text")
        .attr("dy", ".75em")
        .attr("y", 6)
        .attr("x", (barWidth / 2) + 1)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatCount(d.y); });
    
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("text")
        .attr("y", height +  margin.bottom - 2)
        .attr("x", width)
        .attr("class", "axis_label")
        .text("read pairs (millions)");
    // x axis label
    svg.append("text")
        .attr("y", margin.top)
        .attr("x", margin.left + 20)
        .attr("text-anchor", "start")
        .attr("class", "axis_label")
        .text("# lanes");
            
}

/**
 * Draws a pie chart of number of projects per institutional affiliation & a legend
 * @param {Object} dataset  Parsed data
 * @param {String} divID  Id of DOM div to where plot should reside
 */
function drawAffiliationProj(dataset, divID) {
    var w = 450;
    var h = 380;
    padding = w - 250;
    
        
    var outerRadius = (w - padding) / 2;
    var innerRadius = 0;
    var labelr = outerRadius + 10;
    var startA = 0;
    var endA = Math.PI * 2;
    
    var arc = d3.svg.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);
    
    var pie = d3.layout.pie()
                .value(function(d) {
                    return d.value;
                })
                .sort(null)
                .startAngle(startA)
                .endAngle(endA)
                ;
    
    
    //Easy colors accessible via a x-step ordinal scale
    //var color = d3.scale.category10();
    //var color = d3.scale.category20();
    //var color = d3.scale.category20b();
    var color = d3.scale.category20c();
    
    //Create SVG element
    var svg = d3.select("#" + divID)
                .append("svg")
                .attr("width", w)
                .attr("height", h);
    
    //Set up groups
    var arcs = svg.selectAll("g.arc")
                  .data(pie(dataset))
                  .enter()
                  .append("g")
                  .attr("class", "arc")
                  .attr("transform", "translate(" + w/3.5 + "," + (outerRadius + 20) + ")")
                  ;
    
    //Draw arc paths
    arcs.append("path")
        .attr("fill", function(d, i) {
            return color(i);
        })
        .attr("d", arc);
    
    ////Labels

    arcs.filter(function(d) { return d.endAngle - d.startAngle > .15; }).append("svg:text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { //set the label's origin to the center of the arc
        //we have to make sure to set these before calling arc.centroid
        d.outerRadius = outerRadius; // Set Outer Coordinate
        d.innerRadius = outerRadius/2; // Set Inner Coordinate
        return "translate(" + (arc.centroid(d)) + ")";
      })
      .style("fill", "White")
      .style("font", "bold 12px Arial")
      .text(function(d) { return d.data.value; });

    //Legend
    var legendXOffset = 2*outerRadius + 20;
    
    var legend = svg.append("g")
      .attr("class", "legend")
      .attr("x", legendXOffset)
      .attr("y", 25)
      .attr("height", 100)
      .attr("width", 100);

    legend.selectAll('rect')
      .data(pie(dataset))
      .enter()
      .append("rect")
	  .attr("x", legendXOffset)
      .attr("y", function(d, i){ return i *  20;})
	  .attr("width", 10)
	  .attr("height", 10)
	  .style("fill", function(d, i) { 
        return color(i);
      })
      
    legend.selectAll('text')
      .data(pie(dataset))
      .enter()
      .append("text")
	  .attr("x", legendXOffset + 13)
      .attr("y", function(d, i){ return i *  20 + 9;})
      .attr("style", "fill: black")
	  .text(function(d) {
        var text = d.data.key;
        return text;
      });
}

/**
 * Code to draw a stacked barchart plot
 * @param {Array} dataset  Array of array of layer objects
 * @param {String} divID    Id of DOM div to where plot should reside
 * @param {Number} width    plot width
 * @param {Number} height   plot height
 * @param {String} [unit="lanes"] Unit of values. Used for bar legend 
 * @param {Boolean} showFirstInQueue=false If first in queue project should be indicated visually
 * @param {Number} maxY "Normal" max value for y-axis
 * @param {Boolean} showNumWS If number of worksets should be shown
 */
function drawStackedBars (dataset, divID, width, height, unit, showFirstInQueue, maxY, showNumWS) {
    //console.log(dataset)
    var w = width,
        h = height,
        p = [30, 0, 30, 20], // t, r, b, l
        x = d3.scale.ordinal().rangeRoundBands([0, w - p[1] - p[3]]),
        y = d3.scale.linear().range([0, h - p[0] - p[2]]),
        parse = d3.time.format("%m/%Y").parse,
        format = d3.time.format("%b");
    

    
    if (unit == undefined) { unit = "lanes"}
    var fixedDigits = 1;
    if (unit == "samples") { fixedDigits = 0; }

    // Get a handle to the tooltip div
    var tooltipDiv = d3.select(".tooltip");
    // Resize slightly for lane and sample information (done in mouseover code below)
    // width
    var tooltipWidth = tooltipDiv.style("width");
        // remove last two letters: "px" & turn into an integer
    tooltipWidth = parseInt(tooltipWidth.substring(0, tooltipWidth.length - 2));
    var tooltipNewWidth = tooltipWidth + 5;
    // height
    var tooltipHeight = tooltipDiv.style("height");
        // remove last two letters: "px" & turn into an integer
    tooltipHeight = parseInt(tooltipHeight.substring(0, tooltipHeight.length - 2));
    var tooltipRowHeight = "13"; // 13px per row
    var tooltipNewHeight = tooltipHeight - tooltipRowHeight;
        
    var svg = d3.select("#" + divID).append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .append("svg:g")
        .attr("transform", "translate(" + p[3] + "," + (h - p[2]) + ")");
    
        
        // Compute the x-domain (by platform) and y-domain.
        x.domain(dataset[0].map(function(d) { return d.x; }));

        var yMultiples = 1; // multiples of the set maxY needed to fit the data. Used to set colours to indicate that scales differ from "normal"
        var dataYMax = d3.max(dataset[dataset.length - 1], function(d) { return d.y0 + d.y; }); // get the max of the data set
            // check if the max of the data set will fit the 'normal' maxY passed to the function
        var newMaxY = maxY;
        while (newMaxY < dataYMax ) { //if not, increase drawing maxY
            newMaxY += maxY;
            yMultiples++;
        }        
        y.domain([0, newMaxY]); // compute the y-domain using the maxY that will fit the data set

            //set colours for scales depending on how many multiples of maxY had to be used to fit the data set
        var loadCol = "#000";
        if (yMultiples == 2) {
            loadCol = "yellow";
        } else if (yMultiples > 2) {
            loadCol = "red";
        }
    
        // Add a group for each project.
        var project = svg.selectAll("g.project")
            .data(dataset)
            .enter().append("svg:g")
            .attr("class", "project")
            .style("fill", function(d, i) {
                var col = d3.rgb("#5B87FF");
                if(i%2 == 0) { col = col.brighter(); } // #82c0ff - spell out instead?                
                return col;

            }) 
            .style("stroke", function(d, i) {
                return "white";
            })
            ;
    
        // Add a rect for each date.
        var rect = project.selectAll("rect")
            .data(Object)
            .enter().append("svg:rect")
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return -y(d.y0) - y(d.y); })
            .attr("height", function(d) { return y(d.y); })
            .attr("width", x.rangeBand())
            .style("stroke-width", function(d, i) {
                if(d.y == 0) { return "0"; }
                return "1px";
            })
            .on("mouseover", function(d) {
                // Make tooltip div visible and fill with appropriate text
                tooltipDiv.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                tooltipDiv.html(parseFloat(d.y).toFixed(fixedDigits) + " " + unit)	
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px")
                    .style("height", (tooltipNewHeight + "px"))
                    .style("width", (tooltipNewWidth + "px"))
                    ;	    
            })
            .on("mouseout", function(d) { //Remove the tooltip
                // Make tooltip div invisible
                tooltipDiv.transition()		
                .duration(200)		
                .style("opacity", 0)
                .style("height", (tooltipHeight + "px"))
                .style("width", (tooltipWidth + "px"))
                ;
            })
            ;
        
        // Add a label per category.
        var label = svg.selectAll("text")
            .data(x.domain())
          .enter().append("svg:text")
            .attr("x", function(d) { return x(d) + x.rangeBand() / 2; })
            .attr("y", 6)
            .attr("text-anchor", "middle")
            .attr("dy", ".71em")
            .text(function(d) { return d; })
            ;
        
        
        var tmp = x.domain();
        var num_projects = numProjects(dataset, tmp);
        var num_units = numUnits(dataset, tmp, unit);
        var totals = totalY(dataset, tmp);
        
        var loadText = svg.selectAll("g.load_label")
            .data(x.domain())
            .enter().append("svg:text")
            .attr("class", ".load_label")
            .attr("x", function(d) { return x(d) + x.rangeBand() / 2; })
           .attr("y", function(d) { return -y(totals[d]) - 5; })
            .attr("text-anchor", "middle")
            .text(function(d) {
                if (num_projects[d] == 0) {
                    return "";
                }
                var t = num_projects[d] + " project";
                if (num_projects[d] != 1) {
                    t += "s";
                }
                return t;                
            })
            ;        
        if (unit == "samples" && showNumWS){
            var loadText2 = svg.selectAll("g.load_label")
                .data(x.domain())
                .enter().append("svg:text")
                .attr("class", ".load_label")
                .attr("x", function(d) { return x(d) + x.rangeBand() / 2; })
                .attr("y", function(d) { return -y(totals[d]) - 15; })
                .attr("text-anchor", "middle")
                .text(function(d) {
                    if (num_units[d] == 0) {
                        return "";
                    }
                    var t = num_units[d] + " workset";
                    if (num_units[d] != 1) {
                        t += "s";
                    }
                    return t;                
                })
                ;        
        }
        
        // Add y-axis rules.
        var rule = svg.selectAll("g.rule")
            .data(y.ticks(5))
          .enter().append("svg:g")
            .attr("class", "rule")
            .attr("transform", function(d) { return "translate(0," + -y(d) + ")"; });
        
        // horizontal lines. Add?
        rule.append("svg:line")
            .attr("x2", w - p[1] - p[3] + 10)
            .style("stroke", function(d) { return "#000"; })
            .style("stroke-opacity", function(d) { return d ? 0.1 : 0.6; }); // base line should be more visible
        
        rule.append("svg:text")
            .attr("text-anchor", "end")
            .attr("x", -p[3] + 18)
            .attr("dy", ".35em")
            .text(d3.format(",d"))
            .style("stroke", "#000")
            .style("stroke-width", 0.2)
            .style("fill", loadCol)
            ;
    
}

