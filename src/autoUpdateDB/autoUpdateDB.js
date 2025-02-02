import { google } from 'googleapis';
import fs from 'fs';
import stream from 'stream/promises';
import 'dotenv/config'
import format from 'pg-format';
import { pool } from '../config/db.js';
const SCOPE = ['https://www.googleapis.com/auth/drive'];


console.log("START");

async function authorize(){
    const jwtClient = new google.auth.JWT(
        process.env.client_email,
        null,
        process.env.private_key,
        SCOPE
    );

    await jwtClient.authorize();

    return jwtClient;
}



async function autoSave(authClient) {

    await pool.query("UPDATE table_status SET status = false WHERE name = 'events'")
    await pool.query("TRUNCATE events")
    await pool.query("ALTER SEQUENCE events_id_seq RESTART WITH 1")

    

    let drive = google.drive({version: 'v3', auth: authClient});
    let res = await drive.files.list({
      pageSize: 1,
      fields: 'nextPageToken, files(id, name)',
    });
    let file = res.data.files;
    
    if (file.length === 0) {
      console.log('No files found.');
      return;
    }

    let fileId = file[0].id;
    
    try {

        // get the file name
        const fileMetaData = await drive.files.get({
                fileId: fileId, 
                fields: 'name'
            },
        );

        // create stream writer with the file name from drive
        const fileStream = fs.createWriteStream(`./src/autoUpdateDB/CalendarJSON.json`)

        console.log('downloading: ' + fileMetaData.data.name);
        
        const file = await drive.files.get({
            fileId: fileId,
            alt: 'media',
        }, {
                responseType: "stream"
            }
        );

        // file.data.on('end', () => console.log('onCompleted'))

        await stream.pipeline(file.data, fileStream);

        console.log('donethe file download is completed');

        let fileBD = fs.readFileSync("./src/autoUpdateDB/CalendarJSON.json", { encoding: 'utf8' })
        let JN = JSON.parse(fileBD)

        let keysJN = Object.keys(JN)
        // console.log(keysJN[0]);

        // await pool.query(`INSERT INTO groups (name) VALUES ('${keysJN[0]}')`);

        let query = format('INSERT INTO groups (name) VALUES %L ON CONFLICT DO NOTHING', keysJN.map(el => [el]))
        
        await pool.query(query)

        
        for (let group of keysJN) {            
            for (let elem of JN[group]) { 

            // }

            // JN[group].forEach(elem => {
                
                if (elem[Object.keys(elem)[0]].title !== undefined) {
                    let el = elem[Object.keys(elem)[0]]

                    let dateArr = Object.keys(elem)[0].split(',')
                    dateArr = [dateArr[0].split('.'), dateArr[1].split('.')]
                    dateArr = [[dateArr[0][2], dateArr[0][1], dateArr[0][0]].join('.'), [dateArr[1][2], dateArr[1][1], dateArr[1][0]].join('.')]
                    
                    // console.log('--------------------------------');
                    // console.log(el);
                    
                    // console.log(new Date(dateArr[0]));
                    // console.log(new Date(dateArr[1]));
                    // console.log(el.title);
                    // console.log(el.location);
                    // console.log(el.dateTime);
                    
                    // console.log(`INSERT INTO events (group_name, start_date, finish_date, title, location, dateTime) VALUES ('${group}', ${new Date(dateArr[0])}, ${new Date(dateArr[1])}, '${el.title}', '${el.location}', '${el.dateTime.join('-')}')`);
                    // console.log('--------------------------------');
                    //                                                                                                                                                                      to_timestamp(${Date.now()} / 1000.0)
                    await pool.query(`INSERT INTO events (group_name, start_date, finish_date, title, location, date_time) VALUES ('${group}', to_timestamp(${+new Date(dateArr[0])} / 1000.0),  to_timestamp(${+new Date(dateArr[1])} / 1000.0), '${el.title}', '${el.location}', '${el.dateTime.join('-')}')`);
                    
                }
            };
        
        }


        console.log('data upload to the database is completed');

        
        await pool.query("UPDATE table_status SET status = true WHERE name = 'events'")
        await pool.query("TRUNCATE events2")
        await pool.query("ALTER SEQUENCE events2_id_seq RESTART WITH 1")
        await pool.query("INSERT INTO events2 SELECT * FROM events")

    } catch (err) {
        throw err
    }

}

export const autoUpdateDB = async () => {
    // authorize().then(autoSave)
    // setInterval(() => authorize().then(autoSave).catch(console.error), 300000);
}