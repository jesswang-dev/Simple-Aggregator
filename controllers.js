import sql from './utilities/db.js';
import sqlite3 from 'sqlite3';
import { createHourlyBucket } from './index.js';


const controllers = {};

//middleware that request data from database with request body
//access the data from req.body
controllers.requestData = async (req,res,next) => {
    const {id, from, to} = req.body;
    res.locals.time = [from, to];
    const userData = await sql`
    SELECT * from events 
    WHERE
    event_time BETWEEN ${ from } AND ${ to }
    AND
    customer_id = ${ id }
    `

    res.locals.data = userData;
    return next();
}

controllers.requestDataLocal = (req, res, next) => {
    const {id, from, to} = req.body;
    console.log(`req.body in requestDataLocal`, req.body);
    res.locals.time = [from, to];

    const sql = `SELECT * from event WHERE customer_id = ? AND event_time BETWEEN ? AND ?`
    
    /** 
    * Connect to the SQLite database
    */
    const db = new sqlite3.Database('./events.db', (err) => {
        if (err) {
        console.error(err.message);
        }
        console.log('Connected to the event database.');
    });

    // db.all(`SELECT * from event LIMIT 20`, [], (error, rows) => rows.forEach((row) => console.log(row)))

    const data = [];
    db.all(sql, [id, from, to], (error, rows) => {
        if (error) {
            throw error;
        }
        
        res.locals.data = rows;
        db.close()
        return next();
  });

}

//middlware that manipulate the data
controllers.countHourly = (req, res, next) => {
    const [from, to] = res.locals.time;

    //create the hourlyBuckets with function createHourlyBucket
    const hourlyBuckets = createHourlyBucket(from, to);

    // console.log(`hourlyBuckets`, hourlyBuckets);
    const data = res.locals.data;

    const hourlyCount = {};
    hourlyBuckets.forEach((bucket) => hourlyCount[bucket] = 0);


    //edge case: one bucket, the length of the data will be the count;
    if(hourlyBuckets.length === 1) {
        hourlyCount[hourlyBuckets[0]] = data.length;
    } else {

        //multiple buckets, iterate through the data, count the number fits in the bucket
        for(const row of data) {
            const datapoint = new Date(row['event_time']);
            // console.log(`important console.log`, new Date(hourlyBuckets[0]));
            for(let i = 0; i < hourlyBuckets.length; i++) {
                const start = new Date(hourlyBuckets[i]);
                const end = new Date(hourlyBuckets[i+1]);
                //edge case: end is invalid
                if(i === hourlyBuckets.length - 1) {
                    const key = start.toJSON();
                    hourlyCount[key] += 1;
                }

                if(datapoint >= start && datapoint < end) {
                    const key = start.toJSON();
                    hourlyCount[key] += 1;
                    break;
                }
            }

        }
    }
    res.locals.result = hourlyCount;
    return next();
}



export default controllers;