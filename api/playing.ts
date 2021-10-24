import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios'

export default (request: VercelRequest, response: VercelResponse) => {
  const { key, steamID } = request.query;
  axios.get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',{
    params:{
      key,
      steamids: steamID,
    }
  }).then((res)=>{
    response.json(res.data)
  })
};