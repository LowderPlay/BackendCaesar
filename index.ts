import express, {Request} from 'express';
import bodyParser from 'body-parser';
import {Database} from "sqlite3";
import fs from 'fs';
import path from 'path';

const port = 3000;

const app = express();
app.use(bodyParser.json());

let db = new Database('./database.db', (err) => {
    if (err) console.error(err.message);

    console.log('Connected to the database.');
    db.exec(fs.readFileSync(path.join(path.resolve(), 'table.sql')).toString());
    app.listen(port, () => {
        return console.log(`Listening at http://localhost:${port}`);
    });
});

const dict = "abcdefghijklmnopqrstuvwxyz";
const dictUpper = dict.toUpperCase();

function caesar(text: string, rot: number): string {
    if (rot < 0) return caesar(text, rot + 26);
    let result = "";
    const len = dict.length;
    for (let i = 0; i < text.length; i++) {
        const lower = dict.indexOf(text.charAt(i));
        const upper = dictUpper.indexOf(text.charAt(i));
        if(lower !== -1) {
            const pos = (lower + rot) % len
            result += dict.charAt(pos)
        } else if(upper !== -1) {
            result += dictUpper.charAt((upper + rot) % len)
        } else {
            result += text.charAt(i);
        }
    }
    return result;
}

app.post('/encode', (req: Request<{}, {message: string}, {message: string, rot: number}>, res) => {
    if(typeof req.body.message !== 'string') return res.sendStatus(400);
    if(!Number.isInteger(req.body.rot)) return res.sendStatus(400);

    const message = caesar(req.body.message, req.body.rot);
    db.prepare(fs.readFileSync(path.join(path.resolve(), 'insert.sql')).toString()).run([req.body.rot]);
    return res.send({message});
});

app.get('/decode', (req: Request<{}, {message: string}, {}, {message: string, rot: string}>, res) => {
    if(typeof req.query.message !== 'string') return res.sendStatus(400);
    const rot = parseInt(req.query.rot);
    if(Number.isNaN(rot)) return res.sendStatus(400);

    const message = caesar(req.query.message, -rot);
    db.prepare(fs.readFileSync(path.join(path.resolve(), 'insert.sql')).toString()).run([rot]);
    return res.send({message});
});

app.get('/stats', (req, res) => {
    db.all(fs.readFileSync(path.join(path.resolve(), 'stats.sql')).toString(), (err, rows) => {
        if(err) return res.sendStatus(500);
        res.send(rows);
    })
});
