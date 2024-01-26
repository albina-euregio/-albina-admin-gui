import dayjs from "dayjs";
import { LolaKronosApi, convertLoLaKronos } from "../src/app/observations/models/lola-kronos.model";

const API = "https://www.lola-kronos.info/api/dataexport/dataFromToken/";
const WEB = "https://www.lola-kronos.info/";

export async function* fetchLolaKronos() {
  const startDate = formatDate(dayjs().millisecond(0).subtract(1, "week"));
  const endDate = formatDate(dayjs().millisecond(0));
  const url = `${API}${startDate}/${endDate}`;
  const headers = { Authorization: process.env.ALBINA_LOLA_KRONOS_API_TOKEN };
  console.log("Fetching", url);
  const json: LolaKronosApi = await (await fetch(url, { headers })).json();

  for (let obs of convertLoLaKronos(json, WEB)) {
    yield obs;
  }
}

function formatDate(d: dayjs.Dayjs) {
  return encodeURIComponent(d.toISOString().replace(/\.\d\d\dZ/, "+00:00"));
}
