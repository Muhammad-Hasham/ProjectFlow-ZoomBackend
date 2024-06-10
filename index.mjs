import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import requestPromise from 'request-promise';
import { getToken } from './s2s.mjs'; 

dotenv.config();

const app = express();
const port = 3444;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ 
    limit: "50mb",
    extended: true 
}));

app.post('/meeting', async (req, res) => {
    const email = req.body.email;

    try {
        const accessToken = await getToken({
            ZOOM_ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID,
            ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
            ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
        });

        const options = {
            method: 'POST',
            uri: `https://api.zoom.us/v2/users/${email}/meetings`,
            body: {
                topic: 'Meeting',
                type: 1,
                settings: {
                    host_video: true,
                    participant_video: true,
                },
            },
            auth: {
                bearer: accessToken,
            },
            headers: {
                "User-Agent": "Zoom-api-Jwt-Request",
                "content-type": "application/json",
            },
            json: true,
        };

        const response = await requestPromise(options);

        console.log('Zoom API Response:', response);

        if (response && response.join_url) {
            const dataRes = {
                join_url: response.join_url,
                id: response.id,
                start_url: response.start_url,
                password: response.password,
                created_at: response.created_at,
                duration: response.duration,
                start_time: response.start_time,
                timezone: response.timezone,
                host_id: response.host_id,
                host_email: response.host_email,
                topic: response.topic,
                agenda: response.agenda,
                settings: response.settings,
                meeting_number: response.meeting_number, 
            };
            res.status(200).json(dataRes);
        } else {
            throw new Error('Invalid response from Zoom API');
        }
    } catch (err) {
        console.log("API call failed, reason is: ", err);
        res.status(500).json({ error: 'Failed to create Zoom meeting' });
    }
});

app.get('/api', (req, res) => {
    res.json({
        message: 'Zoom API Backend'
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
