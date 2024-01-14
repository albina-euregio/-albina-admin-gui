import dayjs from "dayjs";
import { createConnection, insertObservation } from "./database";
import { augmentRegion } from "./regions";
import { Profile, toLawisProfile, toLawisProfileDetails } from "../src/app/observations/models/lawis.model";

const API = "https://lawis.at/lawis_api/v2_2/profile";
const WEB = "https://lawis.at/lawis_api/v2_2/files/profiles/snowprofile_{{id}}.pdf";

export async function fetchLawisProfiles() {
  const url = `${API.replace("v2_2", "public")}?${new URLSearchParams({
    startDate: dayjs().subtract(1, "week").toISOString(),
    endDate: dayjs().toISOString(),
  })}`;
  console.log("Fetching", url);
  const json: Profile[] = await (await fetch(url)).json();

  const connection = await createConnection();
  for (const profile of json) {
    let obs = toLawisProfile(profile, WEB);
    const details = await (await fetch(`${API}/${obs.$id}`)).json();
    obs = toLawisProfileDetails(obs, details);
    obs = augmentRegion(obs);
    await insertObservation(connection, obs);
  }
  connection.destroy();
}
