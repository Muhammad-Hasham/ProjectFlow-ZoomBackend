import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';
import prompt from 'prompt';
import qs from 'query-string'; 

dotenv.config();

const IS_PROD = process.env.NODE_ENV?.toLowerCase().trim() === 'production';
const ZOOM_OAUTH_ENDPOINT = 'https://zoom.us/oauth/token';

export async function getToken({ ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET }) {
  try {
    const request = await axios.post(
      ZOOM_OAUTH_ENDPOINT,
      qs.stringify({ grant_type: 'account_credentials', account_id: ZOOM_ACCOUNT_ID }), // Use qs object from query-string package
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
        }
      }
    );

    const response = await request.data;
    return response.access_token;

  } catch (e) {
    console.error(e?.message, e?.response?.data);
    throw new Error('Failed to retrieve Zoom access token');
  }
}

const generateEnvironment = () => {
  const credentials = ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'];
  const schema = { properties: {} };

  credentials.forEach(cred => schema.properties[cred] = { required: true, default: process.env[cred] });

  prompt.start();

  prompt.get(schema, async (err, input) => {
    const envCredentials = Object.keys(input).map((key) => `\n${key}=${input[key]}`).join('');

    if (IS_PROD || environmentSet()) {
      console.log('\nNOTE: Ensure the following values are configured in your target environment OR .env file:\n', envCredentials, '\n')
    } else {
      fs.writeFile('.env', envCredentials, writeError => {
        if (writeError) throw writeError

        console.log('\nEnvironment file created with the following Zoom Credentials:\n', envCredentials, '\n');
      });        
    }

    await getToken(input);
  })
};

(async () => {
  try {
    const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;

    const ZOOM_CREDENTIALS = { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET };

    const requiredCredentials = Object.keys(ZOOM_CREDENTIALS).every(el => !!ZOOM_CREDENTIALS[el]);

    if (!requiredCredentials) {
      generateEnvironment();
      return
    }

    await getToken(ZOOM_CREDENTIALS);

  } catch (err) {
    console.error(err)
  }
})();
