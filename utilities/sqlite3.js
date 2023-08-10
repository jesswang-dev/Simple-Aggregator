import sqlite3 from 'sqlite3';
import fs from 'fs';
import csv from 'csv-parser';

//Connect to the sqlite database
const db = new sqlite3.Database('./events.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the event database.');
});

//Create event TABLE with the schema
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


//Import csv file into the event table
 fs.createReadStream("./events.csv")
  .pipe(csv(['id', 'type', 'transaction', 'timestamp']))
  .on("data", function (row) {
    // console.log('row',row);
      db.run(
        `INSERT INTO event VALUES (?, ?, ?, ?)`,
        [row.id, row.type, row.transaction, row.timestamp],
        (err) => {
          if (err) return console.log(err.message);
        }
      );
      })
  .on('end', () => {
    console.log('CSV file successfully processed');

  }) 

//Test sql request
const sql = `SELECT * from event LIMIT 20`;
db.all(sql, [], (error, rows) => rows.forEach((row) => console.log(row)))

//Close the database
db.close((err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Close the database connection.');
});
