import fs from 'fs';
import csv from 'csv-parser';

/**
 * The variable created here for running the program in this file, change the value to see diffrent result in the console.
 */
const timeStampA = "2021-03-01T02:30:00.000Z";
const timeStampB = "2021-03-01T04:50:00.000Z";
const userId = "b4f9279a0196e40632e947dd1a88e857";

/**
 * createHourlyBucket (timeA, timeB)
 * @param {*} timeA datetime string "2021-03-01T02:30:00Z"
 * @param {*} timeB datetime string "2021-03-01T04:50:00Z"
 * @returns array of datetime strings ["2021-03-01T02:00:00.000Z", "2021-03-01T03:00:00.000Z", "2021-03-01T04:00:00.000Z"]
 */

export const createHourlyBucket = (timeA, timeB) => {
    
    const buckets = [];
    let dateTimeA = new Date(timeA);
    let dateTimeB = new Date(timeB);

    /**
     * error handling: if the input is not a timestamp format, throw the error
     */

    if (isNaN(dateTimeA) || isNaN(dateTimeA)) {
        throw new Error("Please provide valid timestamps")
    }

    /**
     * calculate the difference between timestampA and timestampB to hours
     */
    
    let difference = dateTimeB - dateTimeA;
    // if timestamps are not consecutive, switch the order
    if (difference < 0) {
        dateTimeA = new Date(timeB);
        dateTimeB = new Date(timeA);
        difference = Math.abs(difference);
    }
   
    /*Handle edge case: time with different Hrs but same Mins, Secs or MilliSecs,
    the diffHours will not round up because rounding up depends
    on the decimals of the diffHours, e.g. 4:30 - 5:30 are supposed to in 2 buckets, if not hangle the situation here, only 1 buckets will return*/

    const diffHours = difference / (1000 * 60 * 60);
    let bucketNum = Math.ceil(diffHours);

    if(Number.isInteger(diffHours)) {
        if (dateTimeA.getMinutes() === dateTimeB.getMinutes() || dateTimeA.getSeconds() === dateTimeB.getSeconds() || dateTimeA.getMilliseconds() === dateTimeB.getMilliseconds()) {
        bucketNum += 1;
        }
    }
    
    /**
     * Iterate thru bucketNum and define buckets
     */
    let start = dateTimeA;

    // if start time is not on the Min, Sec and MilliSec, set it to be 0'
    if(start.getMinutes() !== 0 || start.getSeconds() !== 0 || start.getMilliseconds() !== 0) {
        start.setMinutes(0, 0, 0);
    }

    for(let i = 0; i < bucketNum; i++) {
        buckets.push(start.toJSON());
        start.setHours(start.getHours() + 1);
    }
    
    return buckets;
}

/**
 * run the function to produce the hourly buckets
 */
const hourlyBuckets = createHourlyBucket(timeStampA, timeStampB);
// console.log(`hourlyBuckets created:`,hourlyBuckets);


/**
 * 
 * @param {*} data - data read by row in fs.createReadStream process below
 * @param {*} userId 
 * @param {*} timeStampA 
 * @param {*} timeStampB 
 * @param {*} hourlyBuckets - result of function createHourlyBucket
 * @returns - an object that contains time bucket as key and its count number as value e.g: 
 * {
  '2021-03-01T02:00:00.000Z': 83,
  '2021-03-01T03:00:00.000Z': 1498,
  '2021-03-01T04:00:00.000Z': 336
}
 */

export const createHourlyCounts = (data, userId, timeStampA, timeStampB, hourlyBuckets) => {
    /**
     * Create the obj hourlyCount to store data, with the buckets as key and value starts at 0 
     */
    const hourlyCount = {};
    hourlyBuckets.forEach((bucket) => hourlyCount[bucket] = 0);

    /**
     * Iterate data and and filter them based on userId, and timeStampA and timeStampB
     * Count the data falls in the time bucket
     */
    for (const row of data) {
        //filter based on input userId;
        if(row['customer_id'] === userId) {
            const dateTime = new Date(row['timestamp']);
            //filter based on timeStamp range;
            if(dateTime >= new Date(timeStampA) && dateTime <= new Date(timeStampB)) {
                //if the hourlyBuckets that returned from the function above only has 1 bucket, count anyway
                if(hourlyBuckets.length === 1) {
                    let start = new Date(hourlyBuckets[0]);
                    let key = start.toJSON();
                    hourlyCount[key] += 1;
                } else {
                    //otherwise, iterate thru the hourlyBuckets and find the bucket
                    for(let i = 0; i < hourlyBuckets.length; i++) {
                        let start = new Date(hourlyBuckets[i]);
                        let end = new Date(hourlyBuckets[i+1]);
                        //when iterate at last item of hourlyBuckets, end will be invalid
                        //so the if condition down will be false anyway, need to count towards last bucket
                        if(i === hourlyBuckets.length - 1) {
                            let key = start.toJSON();
                            hourlyCount[key] += 1;
                        }

                        if(dateTime >= start && dateTime < end) {
                            let key = start.toJSON();
                            hourlyCount[key] += 1;
                            //break the loop once find the bucket;
                            break;
                        }
                    }
                } 
            }
        }
    }
    return hourlyCount;
}

/**
 * Process that read the .csv file and process data with createHourlyCounts inde
 * Uncommet the code below to log the result to the console in the end
 */

// const results = [];
// fs.createReadStream('events.csv')
//   .pipe(csv(['customer_id', 'event_type', 'transaction_id', 'timestamp']))
//   .on('data', (data) => results.push(data))
//   .on('end', () => {
//     //the results variable lists all the rows from event.csv
//     // console.log(`results`,results);

//     const hourlyCount = createHourlyCounts(results, userId, timeStampA, timeStampB, hourlyBuckets);
    
//     //log the final result at the end of the process
//     console.log(hourlyCount);

// });

