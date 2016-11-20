// init
const present = require('present');
const colors = require('colors');
const fs = require('fs');

// creating array
const unsorted = createRandomArray(10001, 0, 1e7);
let stats = {};

//-----------------------------------
// comparing sort methods
console.log('Running sorts...');
Promise.all([
    sortArray(unsorted, errorTestSort, stats),
    sortArray(unsorted, selectionSort, stats),
    sortArray(unsorted, insertionSort, stats),
    sortArray(unsorted, countingSort, stats),
    sortArray(unsorted, classicMergeSort, stats),
    sortArray(unsorted, pureBucketSort, stats)
]).then((results) => {
    // running tests
    results.forEach(result => {
        let errorFound = false;
            let increm = undefined;
            result.sorted.forEach(val => {
                if(!errorFound) {
                    if (increm === undefined)
                        increm = val;
                    if (increm > val) {
                        console.log(`ERROR IN: ${result.method}`.red);
                        console.log(`${increm} should be smaller then ${val}`.red);
                        errorFound = true;
                    }
                    if (increm < val)
                        increm = val;
                }
            });
            if(!errorFound)
                console.log(`sort test passed: ${result.method}`.green);
    });
    return results;
}).then((results) => {
    // file output
    let outputtext = '';
    let prettyStats = JSON.stringify(stats, null, 2);
    outputtext += '--Unsorted--\n';
    unsorted.forEach(i => outputtext+= i + '\n');
    results.forEach(result => {
        outputtext += `\n\n--${result.method}--\n`;
        result.sorted.forEach(i => outputtext+= i + '\n');
    });
    outputtext += prettyStats;

    // file write
    fs.writeFile("./results.log",
        outputtext,
        (err) => {
            if(err) {
                return console.log(err);
            }
            console.log("results were successfully saved!".green);
        });

    // screen output
    console.log('final stats:', prettyStats)
}).catch((err)=>{
    // catching errors
    console.log(err.message);
});

//-----------------------------------
// array generation
function createRandomArray(length, min, max){
    let arr = [];
    for(let i = 0; i < length; i++){
        arr.push(min + ((Math.random()*(max-min)) | 0));
    }
    return arr;
}
//-----------------------------------
// sort function promise wrapper
function sortArray(arr, func, stats, min, max){
    let arrCopy = arr.slice();
    let t0 = present();
    return func(arrCopy, min, max)
        .then(({sorted, iterations}) => {
            let t1 = present();
            let localStats = {};
            localStats.initialArraySize = arr.length;

            localStats.elapsedTime = (t1 - t0)|0;
            localStats.iterations = iterations;
            localStats.sortedArraySize = sorted.length;
            stats[func.name] = localStats;

            return {method: func.name, sorted};
        });
}
//-----------------------------------
// actual sort functions
// error sort (for testing)
function errorTestSort(arr) {
    return new Promise((resolve, reject) => {
        let iterations = 0;
        let sorted = arr.slice();

        resolve({sorted, iterations});
    });
}

// selection sort
function selectionSort(arr){
    return new Promise((resolve, reject) => {
        let sorted = [];
        let iterations = 0;

        let unsortedElements = arr.slice();

        while(sorted.length < arr.length){
            let smallestValueIndex = 0;
            let smallestValue = undefined;
            unsortedElements.forEach((value, i) => {
                iterations++;
                if(smallestValue === undefined || value < smallestValue) {
                    smallestValue = value;
                    smallestValueIndex = i;
                }
            });
            let newElement = unsortedElements.splice(smallestValueIndex, 1);
            sorted.push(parseInt(newElement));
        }
        resolve({sorted, iterations});
    });
}

// insertion sort
function insertionSort(arr){
    return new Promise((resolve, reject) => {
        let sorted = [];
        let iterations = 0;

        arr.forEach((value) => {
            // check if the value is smaller then existing value
            // and then insert it as a replacement
            let inserted = false;
            for(let key in sorted){
                iterations++;
                if(value < sorted[key]){
                    sorted.splice(key, 0, value);
                    inserted = true;
                    break;
                }
            }

            // if value is larger then everything in the array
            // or it is the first one
            if(!inserted)
                sorted.push(value);
        });

        resolve({sorted, iterations});
    });
}

// counting sort
function countingSort(arr, min, max){
    return new Promise((resolve, reject) => {
        let sorted = [];
        let iterations = 0;

        let frequency = [];

        // step0 determine min and max
        if(typeof min !== 'number' || typeof max !== 'number'){
            min = 0;
            max = 0;
            for(let value of arr){
                if(value < min)
                    min = value;
                if(value > max)
                    max = value;
            }
            iterations++;
        }

        // step0-1 fill frequency array with 0s
        for(let i = min; i <= max; i++) {
            frequency[i] = 0;
            iterations++;
        }

        // step1 (frequency of values)
        for(let value of arr){
            frequency[value]++;
            iterations++;
        }

        //step2+step3
        for(let f = min; f <= max; f++){
            for(let i = 0; i < frequency[f]; i++){
                sorted.push(f);
                iterations++;
            }
        }

        resolve({sorted, iterations});
    });
}

// classical merge sort
// based on: http://www.stoimen.com/blog/2010/07/02/friday-algorithms-javascript-merge-sort/
function classicMergeSort(arr){
    return new Promise((resolve, reject) => {
        let sorted = [];
        let iterations = 0;

        let mergeSort = (arr) => {
            // simply returning the value
            // if array has less then 2 elements
            if (arr.length < 2)
                return arr;

            // slicing the array in the middle
            let middle = parseInt(arr.length / 2);
            let left   = arr.slice(0, middle);
            let right  = arr.slice(middle, arr.length);
            iterations++;
            return merge(mergeSort(left), mergeSort(right));
        };

        // merging two arrays & sorting their values
        let merge = (left, right) => {
            let result = [];

            while (left.length && right.length) {
                if (left[0] <= right[0]) {
                    result.push(left.shift());
                } else {
                    result.push(right.shift());
                }
                iterations++;
            }
            while (left.length){
                result.push(left.shift());
                iterations++;
            }
            while (right.length){
                result.push(right.shift());
                iterations++;
            }
            return result;
        };

        // entry point for recursion
        sorted = mergeSort(arr);
        resolve({sorted, iterations});
    });
}

// pure bucket sort
// based on: http://www.growingwiththeweb.com/2015/06/bucket-sort.html
function pureBucketSort(arr, min, max){
    return new Promise((resolve, reject) => {
        let sorted = [];
        let iterations = 0;

        let arrCopy = arr.slice();
        let bucketSize = 100;

        let bucketSort = (arr) => {
            if (arr.length === 0) {
                return arr;
            }
            let result = [];
            // step0 determine min and max
            if(typeof min !== 'number' || typeof max !== 'number'){
                min = 0;
                max = 0;
                for(let value of arr){
                    if(value < min)
                        min = value;
                    if(value > max)
                        max = value;
                }
                iterations++;
            }
            // step1 initialize buckets
            let bucketCount = Math.floor((max - min) / bucketSize) + 1;
            let buckets = new Array(bucketCount);
            for (let i = 0; i < buckets.length; i++) {
                buckets[i] = [];
                iterations++;
            }
            // step2 fill buckets
            for (let i = 0; i < arr.length; i++) {
                buckets[Math.floor((arr[i] - min) / bucketSize)].push(arr[i]);
                iterations++;
            }

            // step3 sort buckets
            arr.length = 0;
            for (let i = 0; i < buckets.length; i++) {
                //bucketSort(buckets[i]);
                // sort individual buckets with generic sort
                buckets[i].sort((a, b) => a - b);
                for (var j = 0; j < buckets[i].length; j++) {
                    arr.push(buckets[i][j]);
                    iterations++;
                }
            }
            return arr;
        };

        // entry point for recursion
        sorted = bucketSort(arrCopy);
        resolve({sorted, iterations});
    });
}
