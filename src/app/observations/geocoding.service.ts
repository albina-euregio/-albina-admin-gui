import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { TranslateService } from "@ngx-translate/core";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { Observable } from "rxjs";
import { FeatureCollection, Point } from "geojson";

@Injectable()
export class GeocodingService {
  private readonly osmNominatimApi = "https://nominatim.openstreetmap.org/search";
  private readonly osmNominatimCountries = "at,it";

  constructor(
    private http: HttpClient,
    private translateService: TranslateService,
  ) {}

  searchLocation(query: string, limit = 8): Observable<FeatureCollection<Point, GeocodingProperties>> {
    // https://nominatim.org/release-docs/develop/api/Search/
    const { osmNominatimApi, osmNominatimCountries } = this;
    const params: Record<string, string> = {
      "accept-language": this.translateService.currentLang,
      countrycodes: osmNominatimCountries,
      format: "geojson",
      limit: String(limit),
      q: query,
    };
    return this.http.get<FeatureCollection<Point, GeocodingProperties>>(osmNominatimApi, { params });
  }
}

export interface GeocodingProperties {
  place_id: number;
  osm_type: string;
  osm_id: number;
  display_name: string;
  place_rank: number;
  category: string;
  type: string;
  importance: number;
}
