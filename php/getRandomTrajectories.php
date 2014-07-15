<?php

/**
 * Prints JSON array of relative paths of random trajectory files of a given number
 * Accepts parameter of how many are needed, defaults to 1 if not given
 * 
 * Usage: 
 * - Get 5 file paths: getRandomTrajectory.php?5
 * - Get 1 file path: getRandomTrajectory.php
 */

function getRandomTrajectories($howMany) {
    $trajectoriesFolder = "sampleDataCleaned";
    $defaultResultSize = 1;

    $trajectoryFiles = array();
// read all files to $trajectoryFiles
    $folders = scandir("../" . $trajectoriesFolder);
    foreach ($folders as $folder) {
        if ($folder != "." && $folder != "..") {
            $files = scandir("../" . $trajectoriesFolder . "/" . $folder . "/Trajectory");
            foreach ($files as $file) {
                if ($file != "." && $file != ".." && strpos($file, ".plt") !== false) {
                    $trajectoryFiles[] = $trajectoriesFolder . "/" . $folder . "/Trajectory/" . $file;
                }
            }
        }
    }

// determine how many will be needed
    

    $result = array();

    for ($i = 0; $i < $howMany; $i++) {
        $result[] = $trajectoryFiles[rand(0, count($trajectoryFiles) - 1)];
    }
    return $result;
}
