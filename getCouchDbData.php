<?php
    $viewStr = "";
    $designStr = "";
    $dbStr = "";
    
    //$group_levelStr = "group_level=2";
    if (isset($_GET['view'])) {
        $viewStr = addslashes($_GET['view']);
        //echo "viewstr: $viewStr<br>";
        if(strcmp($viewStr,'projects') != 0 && strcmp($viewStr, 'applications_projects') != 0 && strcmp($viewStr, 'applications_samples') != 0 && strcmp($viewStr, 'per_lane') != 0 && strcmp($viewStr, 'date_affiliation') != 0 && strcmp($viewStr, 'dates_and_load_per_sample') != 0) {
            $viewStr = "";
        }
        //echo "viewstr: $viewStr<br>";
    }
    if(isset($_GET['design'])) {
        $designStr = addslashes($_GET['design']);
        if(strcmp($designStr,'kpi_external') != 0 && strcmp($designStr, 'reads') != 0 && strcmp($designStr, 'genomics-dashboard') != 0) {
            $designStr = "";
        }
    }
    if(isset($_GET['db'])) {
        $dbStr = addslashes($_GET['db']);
        //echo $dbStr . "<br>";
        if(strcmp($dbStr,'projects') != 0 && strcmp($dbStr, 'flowcells') != 0) {
            $dbStr = "";
        }
    }
    if(isset($_GET['reduce'])) {
        $reduceStr = addslashes($_GET['reduce']);
        if(strcmp($reduceStr,'false') != 0) {
            $reduceStr = "";
        }
    }
    if(isset($_GET['group_level'])) {
        $levelStr = addslashes($_GET['group_level']);
    }
    

    
    // get user:password from file. File should contain one line on the form username:password
    $fhandle = fopen("user_cred.txt", 'r');
    $user_password = fgets($fhandle);
    $user_password = str_replace("\n", '', $user_password);// in case there is \n at the end of the line
    fclose($fhandle);
    
    // set up curl and call couchDb view

    $base_url = "http://$user_password@tools.scilifelab.se:5984";
    //$base_url = "http://localhost:5984";

    $url = "$base_url/$dbStr/_design/$designStr/_view/$viewStr";
    if(isset($reduceStr)) {
        $url .= "?reduce=$reduceStr";
    }
    if(isset($levelStr)) {
        $url .= "?group_level=$levelStr";
    }
    //echo "url: $url<br>";
    $ch = curl_init($url);
    
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch,  CURLOPT_RETURNTRANSFER, 1);
    
    $result = curl_exec($ch);
    curl_close($ch);
    echo $result;
?>