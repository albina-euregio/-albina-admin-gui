import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { forkJoin, Observable, of } from "rxjs";
import { catchError, flatMap, last, map } from "rxjs/operators";
import * as Papa from "papaparse";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { GenericObservation } from "app/observations/models/generic-observation.model";
import { LatLng } from "leaflet";

interface MultimodelPointCsv {
  statnr: string;
  lat: string;
  lon: string;
  elev: string;
  name: string;
  code: string;
}

export interface ZamgFreshSnow {
  hour: number;
  values: number[];
  min: number;
  max: number;
}

export interface SnowpackPlots {
  plotTypes: string[];
  aspects: string[];
  stations: string[];
}

export interface AvalancheWarningServiceObservedProfiles {
  latitude: number;
  longitude: number;
  elevation: number;
  aspect: string;
  eventDate: Date;
  locationName: string;
  $externalURL: string;
}

@Injectable()
export class ModellingService {
  constructor(
    public http: HttpClient,
    public constantsService: ConstantsService,
    public regionsService: RegionsService
  ) {}

  private parseCSV(text: string) {
    return Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      comments: "#"
    });
  }

  get(type: "multimodel" | "observed_profile" | "alpsolut_profile"): Observable<GenericObservation[]> {
    if (type === "alpsolut_profile") {
      return this.getAlpsolutDashboardPoints();
    } else if (type === "observed_profile") {
      return this.getObservedProfiles();
    } else if (type === "multimodel") {
      return this.getZamgMultiModelPoints();
    }
  }

  private getZamgMultiModelPoints(): Observable<GenericObservation[]> {
    const urls = [
      "snowgridmultimodel_stationlist.txt",
      "snowgridmultimodel_modprog1400_HN.txt",
      "snowgridmultimodel_modprog910_HN.txt",
      "snowgridmultimodel_modprog990_HN.txt"
    ].map((file) => this.constantsService.zamgModelsUrl + file);
    return forkJoin(urls.map((url) => this.http.get(url, { responseType: "text" }))).pipe(
      map((responses) =>
        responses.map((r, index) => this.parseCSV(index === 0 ? r.toString().replace(/^#\s*/, "") : r.toString()))
      ),
      map(([points, hs1400, hn910, hn990]) =>
        points.data
          .map((row: MultimodelPointCsv): GenericObservation => {
            const id = row.statnr;
            const regionCode = row.code;
            const region = this.regionsService.getRegionForId(regionCode);
            const lat = parseFloat(row.lat);
            const lng = parseFloat(row.lon);

            const freshSnow: ZamgFreshSnow[] = [];
            try {
              [12, 24, 48, 72].map((hour) => {
                const values = [hs1400, hn910, hn990]
                  .map((csv) => {
                    const rowIndex = csv.data.findIndex((r) => r["-9999.0"] === `${hour}.0`);
                    return rowIndex >= 0 ? parseFloat(csv.data[rowIndex][`${id}.0`]) : undefined;
                  })
                  .filter((v) => isFinite(v));
                freshSnow.push({
                  hour,
                  values,
                  min: Math.min(...values),
                  max: Math.max(...values)
                });
              });
            } catch (e) {
              console.warn("Failed to build fresh snow", e);
            }

            return {
              $source: "multimodel",
              $data: row,
              $id: id,
              region: regionCode,
              locationName: region?.name,
              $externalURL: `${this.constantsService.zamgModelsUrl}snowgridmultimodel_${id}.png`,
              $extraDialogRows: [
                {
                  label: "ECMWF",
                  url: `${this.constantsService.zamgModelsUrl}eps_ecmwf/snowgrid_ECMWF_EPS_${id}_HS.png`
                },
                {
                  label: "CLAEF",
                  url: `${this.constantsService.zamgModelsUrl}eps_claef/snowgrid_C-LAEF_EPS_${id}_HS.png`
                }
              ],
              latitude: lat,
              longitude: lng
            } as GenericObservation;
          })
          .sort((p1, p2) => p1.region.localeCompare(p2.region))
      )
    );
  }

  /**
   * Returns a data structure for the snowpack visualizations.
   */
  getSnowpackPlots(): SnowpackPlots {
    const plotTypes = ["LWC_stratigraphy", "wet_snow_instability", "Sk38_stratigraphy", "stratigraphy"];
    const aspects = ["flat", "north", "south"];
    const stations = [
      "AKLE2",
      "AXLIZ1",
      "BJOE2",
      "GGAL2",
      "GJAM2",
      "INAC2",
      "ISEE2",
      "KAUN2",
      "MIOG2",
      "NGAN2",
      "PESE2",
      "RHAN2",
      "SDAW2",
      "SSON2",
      "TRAU2"
    ];
    return { plotTypes, aspects, stations };
  }

  getSnowpackMeteoPlots(): string[] {
    return [
      "AT-7_new_snow_plot_3day",
      "AT-7_new_snow_plot_7day",
      "AT-7_new_snow_plot_1month",
      "AT-7_new_snow_plot_season",
      "AT-7_new_snow_plot_forecast",
      "AT-7_wet_snow_plot_3day",
      "AT-7_wet_snow_plot_7day",
      "AT-7_wet_snow_plot_1month",
      "AT-7_wet_snow_plot_season",
      "AT-7_wet_snow_plot_forecast",
      "AT-7_HS_table_24h",
      "AT-7_HS_table_72h",
      "AT-7_HS_table_season",
      "AT-7_HS_table_forecast",
      "AT-7_TA_table_24h",
      "AT-7_TA_table_72h",
      "AT-7_TA_table_season"
    ];
  }

  /**
   * SNOWPACK modelled snow profiles
   * https://gitlab.com/avalanche-warning
   */
  getObservedProfiles(): Observable<GenericObservation[]> {
    const url = this.constantsService.observationApi.AvalancheWarningService;
    const regionsService = this.regionsService;
    return this.http.get<AvalancheWarningServiceObservedProfiles[]>(url).pipe(
      map((profiles) => profiles.map((profile) => toPoint(profile))),
      catchError((e) => {
        console.error("Failed to read observed_profiles from " + url, e);
        return [];
      })
    );

    function toPoint(profile: AvalancheWarningServiceObservedProfiles): GenericObservation {
      return {
        $source: "observed_profile",
        $id: profile.$externalURL,
        eventDate: new Date(profile.eventDate),
        locationName: profile.locationName,
        $externalURL: profile.$externalURL,
        region: regionsService.getRegionForLatLng(new LatLng(profile.latitude, profile.longitude))?.id,
        latitude: profile.latitude,
        longitude: profile.longitude
      } as GenericObservation;
    }
  }

  getAlpsolutDashboardPoints(): Observable<GenericObservation[]> {
    const dateStart = new Date();
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateStart.getDate());
    const params = {
      dateStart: dateStart.toISOString(),
      dateEnd: dateEnd.toISOString(),
      stage: "SNOWPACK",
      parameterCode: "HS_mod"
    };
    return this.http
      .get("https://admin.avalanche.report/dashboard.alpsolut.eu/", { observe: "response", responseType: "text" })
      .pipe(
        last(),
        flatMap((r) => {
          const apiKey = r.headers.get("X-API-KEY");
          const headers = { "X-API-KEY": apiKey };
          const url = "https://rest.alpsolut.eu/v1/geo/stations";
          return this.http
            .get<AlpsolutFeatureCollection>(url, { headers, params })
            .pipe(
              map((collection) =>
                collection.features
                  .flatMap((f) => [
                    ...f.properties.dataSets.map((d) =>
                      toPoint(f, d, apiKey, "cbc610ef-7b29-46c8-b070-333d339c2cd4", "stratigraphies + RTA")
                    ),
                    ...f.properties.dataSets.map((d) =>
                      toPoint(f, d, apiKey, "f3ecf8fb-3fd7-427c-99fd-582750be236d", "wind drift")
                    )
                  ])
                  .sort((p1, p2) => p1.region.localeCompare(p2.region))
              )
            );
        })
      );

    function toPoint(
      f: AlpsolutFeatureCollection["features"][0],
      d: DataSet,
      apiKey: string,
      configurationId: string,
      configurationLabel: string
    ): GenericObservation {
      const configuration = {
        apiKey,
        configurationId,
        uiSettings: {
          aliasSelectionMode: "none"
        },
        externalParams: {
          datesPresetKey: "forecast",
          aliasId: d.dataSetId
        },
        datesPresets: {
          forecastBackDays: 5,
          forecastFwdDays: 5,
          options: ["season", "1m", "1w", "forecast"]
        },
        useHeightHints: true
      };
      // URL hash params are interpreted by dashboard.alpsolut.eu
      const params = new URLSearchParams({ ViewerAppProps: JSON.stringify(configuration) });
      // URL search param is a trick to force reload iframe
      const search = new URLSearchParams({ configurationId, aliasId: String(d.dataSetId) });
      const url = `https://dashboard.alpsolut.eu/graphs/stable/viewer.html?${search}#${params}`;
      return {
        $source: "alpsolut_profile",
        $id: search.toString(),
        region: `${configurationLabel}: ${d.aspect}/${d.slopeAngle}° ${f.properties.code}`,
        aspect: !d.aspect || d.aspect === "MAIN" ? undefined : Aspect[d.aspect[0]],
        locationName: f.properties.name,
        $externalURL: url,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0]
      } as GenericObservation;
    }
  }
}

type AlpsolutFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, Properties>;

interface Properties {
  id: number;
  code: string;
  name: string;
  dataSets: DataSet[];
}

interface DataSet {
  dataSetId: number;
  stage: "SNOWPACK";
  aspect: Aspect;
  slopeAngle: number;
  slopeAzimuth: number;
}

enum Aspect {
  East = "EAST",
  Main = "MAIN",
  North = "NORTH",
  South = "SOUTH",
  West = "WEST"
}
