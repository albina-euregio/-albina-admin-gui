import { Component, Input } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Observation, EventType } from "./models/observation.model";
import { Feature, Point } from "geojson";
import { SelectItem } from "primeng/api";
import { GeocodingProperties, GeocodingService } from "./geocoding.service";
import { geocoders } from "leaflet-control-geocoder";

@Component({
  selector: "app-observation-editor",
  templateUrl: "observation-editor.component.html",
  styleUrls: ["observation-editor.component.scss"]
})
export class ObservationEditorComponent {
  constructor(private translate: TranslateService, private geocodingService: GeocodingService) {}

  @Input() observation: Observation;
  eventTypes: SelectItem[] = Object.values(EventType).map((value) => ({
    label: this.translate.instant(`observations.eventTypes.${value}`),
    value
  }));
  locationResults: Feature<Point, GeocodingProperties>[] = [];

  searchLocation($event: { originalEvent: Event; query: string }) {
    this.geocodingService.searchLocation($event.query).subscribe((collection) => (this.locationResults = collection.features));
  }

  selectLocation(feature: Feature<Point, GeocodingProperties>): void {
    setTimeout(() => {
      // display_name	"Zischgeles, Gemeinde Sankt Sigmund im Sellrain, Bezirk Innsbruck-Land, Tirol, Österreich" -> "Zischgeles"
      this.observation.locationName = feature.properties.display_name.replace(/,.*/, "");
      this.observation.latitude = feature.geometry.coordinates[1];
      this.observation.longitude = feature.geometry.coordinates[0];
    }, 0);
  }

  setEventDate(event) {
    const date = (this.observation.eventDate as string) || "T00:00";
    const time = date.split("T")[1];
    this.observation.eventDate = `${event.target.value}T${time}`;
  }

  setReportDate(event) {
    const date = (this.observation.reportDate as string) || "T00:00";
    const time = date.split("T")[1];
    this.observation.reportDate = `${event.target.value}T${time}`;
  }

  setEventTime(event) {
    const fullDate = (this.observation.eventDate as string) || "T00:00";
    const date = fullDate.split("T")[0];
    this.observation.eventDate = `${date}T${event.target.value}`;
  }

  setReportTime(event) {
    const fullDate = (this.observation.reportDate as string) || "T00:00";
    const date = fullDate.split("T")[0];
    this.observation.reportDate = `${date}T${event.target.value}`;
  }

  getDate(obj: string | Date) {
    const date = (obj as string) || "T00:00";
    return date?.split("T")[0];
  }

  getTime(obj: string | Date) {
    const date = (obj as string) || "T00:00";
    return date?.split("T")[1] || "00:00";
  }

  parseContent($event: { clipboardData: DataTransfer }): void {
    setTimeout(() => {
      const content = this.observation.content;
      if (!this.observation.authorName && /Einsatzcode/.test(content) && /beschickte Einsatzmittel/.test(content)) {
        this.observation.authorName = "Leitstelle Tirol";
      }
      if (!this.observation.locationName && /Einsatzort/.test(content)) {
        const match = content.match(/Einsatzort:.*\n\s+.*\s+(.*)/);
        if (match) {
          this.observation.locationName = match[1];
        }
      }
      if (!this.observation.latitude && !this.observation.longitude && /Koordinaten: WGS84/.test(content)) {
        const match = content.match(/Koordinaten: WGS84(.*)/);
        const latlng = match && match[1] ? geocoders.parseLatLng(match[1].trim()) : "";
        if (latlng) {
          this.observation.latitude = latlng.lat;
          this.observation.longitude = latlng.lng;
        }
      }
    });
  }
}
