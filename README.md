# Simple-Aggregator

## How to start
#### 1. Install the packages
In root directory, run the command below to install packages used in the project.
```bash
npm install
```
#### 2. Check the program in `index.js`
Run the command below to check the main functionality to answer the prompt and the result of a given example will show up in the console. More details below (MVP).
```bash
npm start
```
#### 3. Start the server
Run the command below to spin up the server at `localhost:3000`.
```bash
npm run dev
```

#### 4.Testing
Run the command below to execute unit tests for `createHourlyBucket` and `createHourlyCounts`.
```bash
npm run test
```

## Technical Details

With data in `events.csv`, to answer the prompt:

> How many events did customer X send in the one hour buckets between arbitrary timestamps A and B?

I broke problem down with following steps:

### 1. MVP (index.js)
   The problem can be scoped down to:

   > With the given userId, timestampA and timestampB, count the data rows that fits into one hour bucket. Here are three tasks to be completed for the MVP:
   >  1. create a function to produce 'buckets';
   >  2. find a process to read and filter data;
   >  3. create a function that evaluating which bucket each row belong.
   
   #### 1. Function `createHourlyBucket`
   Function `createHourlyBucket` takes two parameters `timeStampA` and `timeStampB` and return an array `buckets`, which contains strings of timestamp data represents buckets. Task 1 done!

   #### Error handling
   - Input datatype. TimeA and TimeB needs to be strings in timestamp format.
   - Input sequence. TimeA does not have to be prior to TimeB.

   #### Edge cases handling
   - The current solution are calculating the time difference and then converting the difference in hours to get the numbers of buckets. The way relies on `diffHours` having decimal to round up. For some cases that `diffHours` are integer, it will fail to include the last bucket.e.g. 4:30 pm - 7:30 pm.

```javascript
const diffHours = difference / (1000 * 60 * 60);
let bucketNum = Math.ceil(diffHours);

//solution:
if(Number.isInteger(diffHours)) {
   if (dateTimeA.getMinutes() === dateTimeB.getMinutes() || dateTimeA.getSeconds() === dateTimeB.getSeconds() || dateTimeA.getMilliseconds() === dateTimeB.getMilliseconds()) {
      bucketNum += 1;
   };
};
```

#### 2. Function `createHourlyCounts`
   Function `createHourlyCounts` work as heavy-lifting process to manipulate the data. With the `events.csv` file, it implements algorithm to:
   1. Select data (with parameters userId, timeStampA, timeStamp);
   2. Evaluate the data selected and comparing the value with buckets in `hourlyBuckets` (output of createHourlyCounts). 
   3. The function invoked inside data reading process (`fs.createReadStream`) to complete the task2, and task3!

   
#### Instruction to run the MVP
   #### 1. Run the command below and the result of a given example will show up in the console.
   ```bash
   npm start
   ```

   #### 2.Uncomment the part below locates in `index.js` to start the the process of `fs.createReadStream()`.

   ```javascript
   const results = [];
   fs.createReadStream('events.csv')
      .pipe(csv(['customer_id', 'event_type', 'transaction_id','timestamp']))
      .on('data', (data) => results.push(data))
      .on('end', () => {

    //the results variable lists all the rows from event.csv
    // console.log(`results`,results);

    const hourlyCount = createHourlyCounts(results, userId,  timeStampA, timeStampB, hourlyBuckets);
    
    //log the final result at the end of the process
    console.log(hourlyCount);

});
   ```

   #### 3. Check result with other values, change the value of the variables setup in the head of `index.js`. Also. `nodemon` has been set up with the command, just save current changes to see the new result in the console.
      
   ```javascript
      /**
      * The variable created here for running the program in this file, change the value to see diffrent result in the console.
      */
      const timeStampA = "2021-03-01T02:30:00.000Z";
      const timeStampB = "2021-03-01T04:50:00.000Z";
      const userId = "b4f9279a0196e40632e947dd1a88e857";

   ```

### 2. HTTP service with the database
   Reflecting on the MVP, it would be nicer to solve following points:
   1. Implementing the heavy-lifting data manipulation while reading the file is NOT a good practice - everytime requesting with different parameters, the whole .csv file is read again!
   2. Setting up a database and make a server call and request the base will make the logic in `createHourlyCounts` much ligher. All the if statements to select the data based on userId and timestamps will be completed with ONE single query!
   3. The nature of .csv file listed by rows resembles of the table structure of SQL. Choose a SQL database service to host the data.

#### Instruction to run the service
#### 1. Start the server at port 3000
To start the server run the command below and the server will spin up at localhost:3000.
```bash
npm run dev
```
#### 2. Database options in the project

#### SQLite
- <strong>SQLite</strong> - a SQL database engine. I imported `events.csv` into `events.db`. The source code of the process locates in `sqlite3.js`, which can be executed and rebuild `events.db` if necessary. For now, `events.db` has already created. 
***(It can be viewed in VSCode with extensions such as 'SQLite Viewer')***

- `events.db` contains one Table `event`, where it has four columns `(customer_id, event_type, transaction_id, event_times)`.
Here is the code snippet for creating the Table event in the `events.db`. 
As below, I defined 4 columns as TEXT type, it is because SQLite does not have an official datetime type. It stores datetime as TEXT.
```javascript
db.run(`CREATE TABLE IF NOT EXISTS event 
        (customer_id TEXT, 
         event_type TEXT, 
         transaction_id TEXT, 
         event_time TEXT)`, (err) => {
         if (err) {
            console.log('Error creating table', err);
         } else {
            console.log('Table created successfully');
      }
});
```

- To work with the databse, send requst to `localhost:3000/sqlite`, with Body in JSON format:
```json

   {
    "id": "b4f9279a0196e40632e947dd1a88e857",
    "from": "2021-03-01 03:00:08.000+00",
    "to": "2021-03-01 07:20:08.000+00"
   }
```


#### Serverless Service: NEON
- <strong>Neon</strong> - a serverless Postgres database. To connect with it, create a `.env` file and configure it with the credential. I created a new role for my database for the convinence for the viewer of my code base. Following is the teamplate of the `.env` file;
```bash
      PGHOST='<% ENDPOINT_ID %>.us-east-2.aws.neon.tech'
      PGDATABASE='neondb'
      PGUSER='<% USERNAME %>'
      PGPASSWORD='<% PASSWORD %>'
      ENDPOINT_ID='<% ENDPOINT_ID %>'
```

- The file with connection info with Neon locates in `utilities/db.js`. Once `.env` file been setup, refresh the server, if connected successfully, the version info will be logged in the console like below:
```json
{
   version: 'PostgreSQL 15.3 on x86_64-pc-linux-gnu, compiled by gcc (Debian 10.2.1-6) 10.2.1 20210110, 64-bit'
}
```
- The <strong>table</strong> we are going to use in the project called `events`. The service use postgreSQL, the datatype has been be defined like below. `TIMESTAMPTZ` refers to timestamp with the time zone.
```sql
CREATE TABLE event (customer_id VARCHAR(255), event_type VARCHAR(50), transaction_id VARCHAR(255), event_time TIMESTAMPTZ)
```
- To work with Neon service, send requst to `localhost:3000/serverless`, with Body in JSON format:
```json
   {
      "id": "b4f9279a0196e40632e947dd1a88e857",
      "from": "2021-03-01T03:00:00Z",
      "to": "2021-03-01T05:30:00Z"
   }
```

#### 3. The Server `server.js`
- For the route in server, I set up route`/serverless` to request data from Neon and `/sqlite` to request data from `events.db`

The connection between server and the database can be tested via <storng>Postman</strong>.

- Send request to `localhost:3000/route`, with `Body` in JSON.

- The JSON for the timestamp string has minor difference. Since as mentioned before SQLite stored TIMESTAMP in TEXT the `Body` sent with the HTTP request needs to be in the format with the Timezone Offset instead of the format in ISO-8601 provided by the prompt. However, the program conform the output with ISO-8601 format. In addition route `/serverless` can handle both the format.

- The result will display in postman's console like this:

![Alt text](/assets/postman.png "Postman example")

- Finally, for the `server.js` I built with `express.js` framework which enables utilizing the middlware function to design the service to makes the server code modularized. The controller `countHourly` has been used on both route.

## Next Step
1. Build a user interface to request and display the data
2. After I handled the edge case caused "buckets lacking" for time range such as between 04:30:00 and 05:30:00, a new issue came out that with timetamp at exact hours such as between 03:00:00 and 04:00:00, function `createHourlyBucket` will result in time buckets array as such: ["2021-03-01T03:00:00.000Z", "2021-03-01T04:00:00.000Z"] so the count will end up with 0 for the second bucket.

For the issue, I ended up with the current solution because of the accuracy to handle a variety of test cases. With use cases, for user request that timestampB is right on the hour. I will decide on do not display the result for the last bucket with value 0.

